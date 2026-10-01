import type { BinaryMask } from './types';

/**
 * RGBA pixels for a CSS `mask-image`: opaque where the mask is set. With
 * `invert`, opaque everywhere else, which is what the dimming layer needs.
 */
export function maskToRgba(mask: BinaryMask, { invert = false } = {}): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(mask.width * mask.height * 4);
  for (let i = 0; i < mask.data.length; i++) {
    const on = mask.data[i] ? !invert : invert;
    if (on) out[i * 4 + 3] = 255;
  }
  return out;
}

/** Browser only: encode a mask as a PNG data URL for `mask-image`. Null without a canvas. */
export function maskToDataUrl(mask: BinaryMask, options: { invert?: boolean } = {}): string | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = mask.width;
  canvas.height = mask.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.putImageData(new ImageData(maskToRgba(mask, options), mask.width, mask.height), 0, 0);
  return canvas.toDataURL('image/png');
}
