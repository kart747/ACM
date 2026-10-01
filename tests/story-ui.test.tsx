// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { V2_ARTWORKS, V2_ELEMENTS } from '@/data/artworks-v2';
import { prepareStory } from '@/lib/story/prepared';
import { useGuidedStory } from '@/components/v2/useGuidedStory';
import { GuidedStoryPanel } from '@/components/v2/GuidedStoryPanel';

function fixture(id = 'art_003', source: 'prepared' | 'gemini' | 'cache' = 'prepared') {
  const artwork = V2_ARTWORKS.find(art => art.id === id)!;
  return { artworkId: id, story: prepareStory(artwork, V2_ELEMENTS[id]), source, model: source === 'prepared' ? null : 'gemini-3.8-flash' };
}
function Harness({ id = 'art_003', enabled = true }: { id?: string; enabled?: boolean }) {
  const artwork = V2_ARTWORKS.find(art => art.id === id)!;
  const tour = useGuidedStory(artwork, V2_ELEMENTS[id], enabled);
  return <>
    <button onClick={() => void tour.start()}>Start test story</button>
    <span data-testid="focus">{tour.focusedElement?.id ?? 'whole-artwork'}</span>
    <GuidedStoryPanel artwork={artwork} controller={tour} onExploreDetail={tour.stop} />
  </>;
}
async function start() {
  await act(async () => { fireEvent.click(screen.getByText('Start test story')); });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => fixture() }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('guided storytelling controls', () => {
  it('starts with a free GET and waits for the reader rather than automatically advancing', async () => {
    render(<Harness />);
    await start();
    expect(fetch).toHaveBeenCalledWith('/api/artworks/art_003/story', expect.objectContaining({ method: 'GET' }));
    expect(screen.getByText('Beat 1 of 4')).toBeTruthy();
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByText('Beat 1 of 4')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByTestId('focus').textContent).toBe('elem_003_01');
  });

  it('plays one timed beat, pauses, and resumes without extra model requests', async () => {
    render(<Harness />);
    await start();
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    act(() => vi.advanceTimersByTime(12000));
    expect(screen.getByText('Beat 2 of 4')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    act(() => vi.advanceTimersByTime(30000));
    expect(screen.getByText('Beat 2 of 4')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    act(() => vi.advanceTimersByTime(12000));
    expect(screen.getByText('Beat 3 of 4')).toBeTruthy();
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('supports previous, completion, and replay using the loaded story', async () => {
    render(<Harness />);
    await start();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByText('Beat 1 of 4')).toBeTruthy();
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByTestId('focus').textContent).toBe('whole-artwork');
    fireEvent.click(screen.getByRole('button', { name: 'Finish story' }));
    expect(screen.getByText('Story complete')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Replay story' }));
    expect(screen.getByText('Beat 1 of 4')).toBeTruthy();
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('only requests generation when explicitly asked', async () => {
    render(<Harness />);
    await start();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => fixture('art_003', 'gemini') } as Response);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Create a Gemini story' })); });
    expect(fetch).toHaveBeenLastCalledWith('/api/artworks/art_003/story', expect.objectContaining({ method: 'POST' }));
    expect(screen.getByText('Gemini 3.8 Flash · saved AI interpretation')).toBeTruthy();
  });

  it('uses an honestly labeled local guide when the server is unavailable', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    render(<Harness />);
    await start();
    expect(screen.getByText('Prepared story · no live AI required')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('available locally');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByTestId('focus').textContent).toBe('elem_003_01');
  });

  it('rejects a story for the wrong artwork or an unknown element', async () => {
    const invalid = fixture();
    invalid.story.beats[1].element_id = 'nonexistent-element';
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => invalid } as Response);
    render(<Harness />);
    await start();
    expect(screen.getByRole('status').textContent).toContain('available locally');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByTestId('focus').textContent).toBe('elem_003_01');
  });

  it('cancels a pending story when the artwork changes and ignores the late response', async () => {
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const { rerender } = render(<Harness />);
    await start();
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    rerender(<Harness id="art_005" />);
    expect(signal?.aborted).toBe(true);
    await act(async () => { finish({ ok: true, json: async () => fixture() } as Response); });
    expect(screen.queryByRole('complementary', { name: 'Guided story' })).toBeNull();
    expect(screen.getByTestId('focus').textContent).toBe('whole-artwork');
  });

  it('stops timers when the story is skipped', async () => {
    render(<Harness />);
    await start();
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip story and explore freely' }));
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.queryByRole('complementary', { name: 'Guided story' })).toBeNull();
    expect(screen.getByTestId('focus').textContent).toBe('whole-artwork');
  });
});
