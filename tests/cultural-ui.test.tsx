// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Page from '@/app/page';
import { V2_ARTWORKS, V2_ELEMENTS, V2_RELATIONSHIPS } from '@/data/artworks-v2';
import { CULTURAL_LABELS } from '@/lib/artwork-sources';
import { CulturalEvidence } from '@/components/v2/CulturalEvidence';

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const photo = V2_ARTWORKS.find(artwork => artwork.id === 'art_011')!;
function openPhoto(container: HTMLElement) {
  fireEvent.click(screen.getByRole('button', { name: 'Gallery' }));
  fireEvent.click(screen.getByRole('button', { name: `Step inside ${photo.title}` }));
  const image = container.querySelector('[data-artwork-canvas] img') as HTMLImageElement;
  Object.defineProperties(image, { naturalWidth: { value: 1400 }, naturalHeight: { value: 933 } });
  fireEvent.load(image);
}

describe('cultural source presentation', () => {
  it('preserves all thirteen artworks and exposes photo attribution and a non-museum source link', () => {
    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Gallery' }));
    expect(screen.getAllByRole('button', { name: /^Explore/ })).toHaveLength(13);
    const card = screen.getByRole('button', { name: `Step inside ${photo.title}` }).parentElement!;
    const content = within(card);
    expect(content.getByText(photo.imageCredit!.creator, { exact: true })).toBeTruthy();
    expect(content.getByRole('link', { name: 'Photograph source ↗' }).getAttribute('href')).toBe(photo.sourceUrl);
    expect(content.queryByRole('link', { name: 'Museum record ↗' })).toBeNull();
    expect(content.getByRole('link', { name: 'CC BY-SA 4.0 ↗' }).getAttribute('href')).toBe(photo.imageCredit!.licenseUrl);
    expect(content.getByRole('img').className).toContain('object-contain');
    fireEvent.click(content.getByText('Cultural context & evidence'));
    expect(content.getByText('Needs community review')).toBeTruthy();
    expect(content.getAllByText('Unverified', { exact: true }).length).toBeGreaterThan(0);
  });

  it('keeps evidence tiers separate rather than converting all non-museum claims to AI inference', () => {
    const { container } = render(<CulturalEvidence claims={Object.entries(CULTURAL_LABELS).map(([tier]) => ({
      text: `Claim ${tier}`,
      tier: tier as keyof typeof CULTURAL_LABELS,
      source: { label: 'Record', url: 'https://example.org/record' },
    }))} />);
    fireEvent.click(screen.getByText('Cultural context & evidence'));
    expect(container.querySelector('details')?.open).toBe(true);
    for (const label of Object.values(CULTURAL_LABELS)) expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Record ↗' })).toHaveLength(5);
  });

  it('keeps photograph credits and source caveats available during detail exploration and travel', () => {
    const { container } = render(<Page />);
    openPhoto(container);
    const relationship = V2_RELATIONSHIPS.find(rel => rel.sourceArtworkId === photo.id)!;
    const element = V2_ELEMENTS[photo.id].find(item => item.id === relationship.sourceElementId)!;
    fireEvent.click(screen.getByRole('button', { name: `Select ${element.label}` }));
    const drawer = within(container.querySelector('aside')!);
    expect(drawer.getByRole('link', { name: 'Photograph source ↗' })).toBeTruthy();
    fireEvent.click(drawer.getAllByRole('button', { name: /^Travel/ })[0]);
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText(photo.imageCredit!.creator, { exact: true })).toBeTruthy();
    expect(dialog.getByRole('link', { name: 'Photograph source ↗' })).toBeTruthy();
    expect(dialog.getByRole('link', { name: 'CC BY-SA 4.0 ↗' })).toBeTruthy();
    fireEvent.click(dialog.getByRole('button', { name: /^Land in / }));
    expect(container.querySelector('[data-artwork-canvas]')?.getAttribute('data-artwork-canvas')).toBe(relationship.targetArtworkId);
    expect(within(container.querySelector('aside')!).getByRole('heading', {
      name: V2_ELEMENTS[relationship.targetArtworkId].find(item => item.id === relationship.targetElementId)!.label,
    })).toBeTruthy();
  });

  it('uses the local prepared photograph story when the endpoint is unavailable', async () => {
    const { container } = render(<Page />);
    openPhoto(container);
    fireEvent.click(screen.getByRole('button', { name: 'Start guided story' }));
    const panel = within(await screen.findByRole('complementary', { name: 'Guided story' }));
    await panel.findByText('Prepared story · no live AI required');
    expect(panel.getByRole('link', { name: 'Read the photograph source ↗' })).toBeTruthy();
    expect(panel.queryByRole('link', { name: /museum record/i })).toBeNull();
    expect(panel.getByRole('link', { name: 'CC BY-SA 4.0 ↗' })).toBeTruthy();
    fireEvent.click(panel.getByRole('button', { name: 'Next' }));
    expect(container.querySelector('[data-mask-for]')?.getAttribute('data-mask-for')).toBe(V2_ELEMENTS[photo.id][0].id);
    fireEvent.click(panel.getByRole('button', { name: 'Explore this detail' }));
    expect(screen.queryByRole('complementary', { name: 'Guided story' })).toBeNull();
    expect(within(container.querySelector('aside')!).getByRole('heading', { name: V2_ELEMENTS[photo.id][0].label })).toBeTruthy();
  });
});
