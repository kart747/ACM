// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Page from '@/app/page';
import { V2_ARTWORKS, V2_ELEMENTS, V2_RELATIONSHIPS } from '@/data/artworks-v2';

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ gemini: { configured: false, mode: 'curated' } }) }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function enterArtwork(container: HTMLElement, index: number) {
  fireEvent.click(screen.getByRole('button', { name: 'Gallery' }));
  fireEvent.click(screen.getAllByRole('button', { name: /^Explore/ })[index]);
  const image = container.querySelector('[data-artwork-canvas] img') as HTMLImageElement;
  Object.defineProperties(image, { naturalWidth: { value: 400 }, naturalHeight: { value: 600 } });
  fireEvent.load(image);
}

describe('V2 artwork and detail consistency', () => {
  it('switches artwork and detail data together even when the API is unavailable', () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    const { container } = render(<Page />);
    enterArtwork(container, 0);
    const first = V2_ELEMENTS[V2_ARTWORKS[0].id][0];
    fireEvent.click(screen.getByRole('button', { name: `Select ${first.label}` }));
    expect(container.querySelector('[data-mask-for]')?.getAttribute('data-mask-for')).toBe(first.id);
    fireEvent.click(screen.getByRole('button', { name: 'Close artwork detail' }));
    enterArtwork(container, 2);
    expect(container.querySelector('[data-mask-for]')).toBeNull();
    expect(screen.queryByRole('button', { name: `Select ${first.label}` })).toBeNull();
    for (const element of V2_ELEMENTS[V2_ARTWORKS[2].id]) {
      expect(screen.getByRole('button', { name: `Select ${element.label}` })).toBeTruthy();
    }
  });

  it('derives each detail’s comparisons without keeping the previous selection’s buttons', () => {
    const { container } = render(<Page />);
    enterArtwork(container, 0);
    for (const element of V2_ELEMENTS[V2_ARTWORKS[0].id]) {
      fireEvent.click(screen.getByRole('button', { name: `Select ${element.label}` }));
      const drawer = within(container.querySelector('aside')!);
      expect(drawer.getByRole('heading', { name: element.label })).toBeTruthy();
      expect(drawer.queryAllByRole('button', { name: /^Travel/ }).length).toBe(V2_RELATIONSHIPS.filter(rel => rel.sourceArtworkId === V2_ARTWORKS[0].id && rel.sourceElementId === element.id).length);
      expect(drawer.getByText('AI Inferred · Unverified')).toBeTruthy();
      fireEvent.click(drawer.getByRole('button', { name: 'Close artwork detail' }));
    }
  });

  it('lands on the corresponding target detail and preserves its selection', () => {
    const relationship = V2_RELATIONSHIPS[0];
    const { container } = render(<Page />);
    enterArtwork(container, V2_ARTWORKS.findIndex(art => art.id === relationship.sourceArtworkId));
    const element = V2_ELEMENTS[relationship.sourceArtworkId].find(element => element.id === relationship.sourceElementId)!;
    fireEvent.click(screen.getByRole('button', { name: `Select ${element.label}` }));
    fireEvent.click(within(container.querySelector('aside')!).getAllByRole('button', { name: /^Travel/ })[0]);
    fireEvent.click(screen.getByRole('button', { name: /^Land in / }));
    const target = V2_ELEMENTS[relationship.targetArtworkId].find(element => element.id === relationship.targetElementId)!;
    expect(container.querySelector('[data-artwork-canvas]')?.getAttribute('data-artwork-canvas')).toBe(relationship.targetArtworkId);
    expect(within(container.querySelector('aside')!).getByRole('heading', { name: target.label })).toBeTruthy();
  });

  it('only offers filters for traditions represented in the current collection', () => {
    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Gallery' }));
    for (const tradition of new Set(V2_ARTWORKS.map(art => art.tradition))) {
      fireEvent.click(screen.getByRole('button', { name: tradition }));
      expect(screen.getAllByRole('button', { name: /^Explore/ }).length).toBe(V2_ARTWORKS.filter(art => art.tradition === tradition).length);
    }
    expect(screen.queryByRole('button', { name: 'Contemporary' })).toBeNull();
  });
});
