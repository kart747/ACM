// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/data/generated', async () => {
  const { curatedArtworks } = await import('@/data/artworks');
  const { fixtureDna } = await import('./fixtures/gemini');
  return { generatedCreativeDna: curatedArtworks.map((a) => fixtureDna(a.id)) };
});

beforeAll(() => {
  class RO {
    constructor(private cb: ResizeObserverCallback) {}
    observe() {
      this.cb([], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = RO as unknown as typeof ResizeObserver;
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  // Give the stage a size so the artwork frame lays out.
  Element.prototype.getBoundingClientRect = function () {
    return { x: 0, y: 0, left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, toJSON() {} } as DOMRect;
  };
});

afterEach(cleanup);

async function renderPage({ enter = true } = {}) {
  const { default: Page } = await import('@/app/classic/page');
  const view = render(<Page />);
  if (enter) {
    fireEvent.click(screen.getByRole('button', { name: /Step Inside/ }));
    await waitFor(() => expect(document.querySelector('main')!.hasAttribute('data-pre-entry')).toBe(false), { timeout: 3000 });
  }
  return view;
}

describe('Step Inside', () => {
  it('opens on the artwork with one action, and hands over to the experience', async () => {
    await renderPage({ enter: false });
    const welcome = screen.getByRole('region', { name: 'Welcome to ARTSCAPE' });
    expect(within(welcome).getByAltText(/Under the Wave off Kanagawa by Katsushika Hokusai/)).toBeTruthy();
    const main = document.querySelector('main')!;
    expect(main.hasAttribute('inert')).toBe(true);
    expect(main.hasAttribute('data-pre-entry')).toBe(true);

    const button = within(welcome).getByRole('button', { name: /Step Inside/ });
    expect(document.activeElement).toBe(button);
    fireEvent.click(button);
    fireEvent.click(button); // a second press while leaving is ignored

    await waitFor(() => expect(main.hasAttribute('data-pre-entry')).toBe(false), { timeout: 3000 });
    expect(main.hasAttribute('inert')).toBe(false);
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Welcome to ARTSCAPE' })).toBeNull());
    expect(screen.getByRole('button', { name: /The Boats in the Trough.*Start the journey here/ })).toBeTruthy();
  });

  it('a reload starts again at the opening screen with no trail', async () => {
    const first = await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /The Boats in the Trough.*Start the journey here/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Explore this connection/ }));
    await waitFor(() => expect(screen.getByText('Where you have been')).toBeTruthy(), { timeout: 6000 });
    first.unmount();

    await renderPage({ enter: false });
    expect(screen.getByRole('region', { name: 'Welcome to ARTSCAPE' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Step Inside/ }));
    await waitFor(() => expect(document.querySelector('main')!.hasAttribute('data-pre-entry')).toBe(false), { timeout: 3000 });
    expect(screen.queryByText('Where you have been')).toBeNull();
  }, 15000);
});

describe('frontend rendering of generated data', () => {
  it('shows Gemini text, provenance and technique for a selected motif', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /The Boats in the Trough.*Start the journey here/ }));

    const panel = await screen.findByRole('complementary', { name: 'Motif detail' });
    expect(panel.dataset.source).toBe('gemini');
    expect(within(panel).getByText(/FIXTURE reading of The Boats in the Trough/)).toBeTruthy();
    expect(within(panel).getByText(/FIXTURE: great-wave|FIXTURE: the-boats and sailor-and-boat/)).toBeTruthy();
    expect(within(panel).getByText(/FIXTURE: both images show the named details/)).toBeTruthy();
    expect(within(panel).getByText('Technique & tradition')).toBeTruthy();

    // Measured multi-run agreement is shown, not Gemini's self-reported confidence.
    const badge = within(panel).getByRole('button', { name: /AI interpretation\s*· 5\/5 runs agree/ });
    expect(badge.dataset.origin).toBe('gemini');
    expect(badge.textContent).not.toMatch(/0\.72/);
    fireEvent.click(badge);
    expect(within(panel).getByText(/5 of 5 independent Gemini runs concluded the images support this/)).toBeTruthy();
    expect(within(panel).getByText(/Gemini’s own estimate .* not a measured probability/)).toBeTruthy();
    expect(within(panel).getByText(/approved by a human curator/)).toBeTruthy();
  });

  it('keeps the Met-record claims verified alongside generated text', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /^The Crest of the Wave\s*→?$/ }));
    const panel = await screen.findByRole('complementary', { name: 'Motif detail' });
    expect(within(panel).getByText('The print shows a great wave off Kanagawa.')).toBeTruthy();
    const verified = within(panel).getAllByRole('button', { name: /Verified/ })[0];
    expect(verified.dataset.origin).toBe('curated');
  });

  it('still offers Explore and completes the first hop of the journey', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /The Boats in the Trough.*Start the journey here/ }));
    const explore = await screen.findByRole('button', { name: /Explore this connection/ });
    expect(screen.getByText('The Sailor on the Drifting Boat')).toBeTruthy();
    fireEvent.click(explore);
    const header = screen.getByRole('banner');
    await waitFor(() => expect(within(header).getByText('The Gulf Stream')).toBeTruthy(), { timeout: 6000 });
    const panel = await screen.findByRole('complementary', { name: 'Motif detail' });
    await waitFor(() => expect(within(panel).getByRole('heading', { level: 2 }).textContent).toBe('The Sailor on the Drifting Boat'));
    // Forward link after arrival: David, not back to Hokusai.
    expect(within(panel).getByText('The Black King and His Gift')).toBeTruthy();
  }, 15000);
});
