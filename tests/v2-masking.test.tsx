// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImmersiveStage } from '@/components/v2/ImmersiveStage';
import { V2_ARTWORKS, V2_ELEMENTS } from '@/data/artworks-v2';

const artwork = V2_ARTWORKS[0];
const elements = V2_ELEMENTS[artwork.id];
const props = {
  artwork,
  elements,
  selectedElement: null,
  onSelectElement: vi.fn(),
  onClearElement: vi.fn(),
  onBackToGallery: vi.fn(),
  onAnalyzeGemini: vi.fn(),
};

function loadImage(width = 400, height = 800) {
  const image = screen.getByRole('img') as HTMLImageElement;
  Object.defineProperties(image, {
    naturalWidth: { configurable: true, value: width },
    naturalHeight: { configurable: true, value: height },
  });
  fireEvent.load(image);
}

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('V2 artwork masking', () => {
  it('uses the image aspect ratio and pixel coordinate system for the overlay', () => {
    const { container } = render(<ImmersiveStage {...props} />);
    expect(container.querySelector('[data-artwork-overlay]')).toBeNull();
    loadImage();
    const overlay = container.querySelector('[data-artwork-overlay]')!;
    expect(overlay.getAttribute('viewBox')).toBe('0 0 400 800');
    expect(overlay.querySelector('[data-element-id]')?.getAttribute('points')).toBe(
      elements[0].geometry.points.map(([x, y]) => `${x * 400},${y * 800}`).join(' '),
    );
  });

  it('keeps detail markers readable when a high-resolution image is scaled down', () => {
    const bounds = vi.spyOn(HTMLDivElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 300, width: 200, height: 300, toJSON: () => ({}),
    } as DOMRect);
    try {
      const { container } = render(<ImmersiveStage {...props} />);
      loadImage(1600, 1000);
      expect(container.querySelector('circle')?.getAttribute('r')).toBe('80');
      expect(container.querySelector('svg text')?.getAttribute('font-size')).toBe('88');
    } finally {
      bounds.mockRestore();
    }
  });

  it('dims only outside the selected region, not the underlying image', () => {
    const { container } = render(<ImmersiveStage {...props} selectedElement={elements[0]} />);
    loadImage();
    const shade = container.querySelector('[data-mask-for]')!;
    const mask = container.querySelector('mask')!;
    expect(shade.getAttribute('mask')).toBe(`url(#${mask.id})`);
    expect(mask.querySelector('rect')?.getAttribute('fill')).toBe('white');
    expect(mask.querySelector('polygon')?.getAttribute('fill')).toBe('black');
    expect((screen.getByRole('img') as HTMLElement).style.filter).toBe('');
    expect(shade.getAttribute('data-mask-for')).toBe(elements[0].id);
  });

  it('supports keyboard selection and Escape clearing', () => {
    render(<ImmersiveStage {...props} />);
    loadImage();
    const polygon = screen.getByRole('button', { name: `Select ${elements[0].label}` });
    fireEvent.keyDown(polygon, { key: 'Enter' });
    expect(props.onSelectElement).toHaveBeenCalledWith(elements[0]);
    fireEvent.keyDown(polygon, { key: 'Escape' });
    expect(props.onClearElement).toHaveBeenCalledOnce();
  });

  it('does not mask a different artwork using a stale selected element', () => {
    const { container } = render(<ImmersiveStage {...props} selectedElement={V2_ELEMENTS[V2_ARTWORKS[1].id][0]} />);
    loadImage();
    expect(container.querySelector('[data-mask-for]')).toBeNull();
  });

  it('disables region selection when the artwork fails to load', () => {
    const { container } = render(<ImmersiveStage {...props} />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('alert').textContent).toContain('could not load');
    expect(container.querySelector('[data-artwork-overlay]')).toBeNull();
    expect((screen.getByRole('button', { name: `1. ${elements[0].label}` }) as HTMLButtonElement).disabled).toBe(true);
  });
});
