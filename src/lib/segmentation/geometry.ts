import type { NormalizedRect } from '../types';
import type { BinaryMask, NormalizedPoint } from './types';

/**
 * Coordinate systems used by segmentation:
 * - normalized: 0-100 on both axes of the artwork box (`NormalizedRect`, the app's system)
 * - image pixels: the source image's own pixels, what the model is prompted in
 * - mask pixels: the grid of a returned mask, which may be smaller than the image
 * The artwork frame keeps the image's aspect ratio, so all three map linearly.
 */

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** A pointer position inside the on-screen frame, as a normalized point. Clamped to the frame. */
export function clientToNormalizedPoint(
  frame: { left: number; top: number; width: number; height: number },
  clientX: number,
  clientY: number,
): NormalizedPoint | null {
  if (frame.width <= 0 || frame.height <= 0) return null;
  return {
    x: clamp(((clientX - frame.left) / frame.width) * 100, 0, 100),
    y: clamp(((clientY - frame.top) / frame.height) * 100, 0, 100),
  };
}

/** Normalized point → pixel coordinates in an image of the given size. */
export function normalizedToPixelPoint(
  point: NormalizedPoint,
  width: number,
  height: number,
): [number, number] {
  return [(clamp(point.x, 0, 100) / 100) * width, (clamp(point.y, 0, 100) / 100) * height];
}

/** Normalized rect → `[x0, y0, x1, y1]` pixel box, clamped to the image. */
export function normalizedRectToPixelBox(
  rect: NormalizedRect,
  width: number,
  height: number,
): [number, number, number, number] {
  const x0 = clamp(rect.x, 0, 100);
  const y0 = clamp(rect.y, 0, 100);
  const x1 = clamp(rect.x + rect.w, 0, 100);
  const y1 = clamp(rect.y + rect.h, 0, 100);
  return [(x0 / 100) * width, (y0 / 100) * height, (x1 / 100) * width, (y1 / 100) * height];
}

/** Largest mask size with the image's aspect ratio whose long edge is `maxEdge`. Never upscales. */
export function maskSizeFor(imageWidth: number, imageHeight: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(imageWidth, imageHeight));
  return {
    width: Math.max(1, Math.round(imageWidth * scale)),
    height: Math.max(1, Math.round(imageHeight * scale)),
  };
}

export interface MaskStats {
  /** Set pixels. */
  area: number;
  /** area / total pixels, 0-1. */
  coverage: number;
  /** Inclusive pixel bounds, or null for an empty mask. */
  bounds: { x0: number; y0: number; x1: number; y1: number } | null;
}

export function maskStats(mask: BinaryMask): MaskStats {
  const { width, height, data } = mask;
  let area = 0;
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      if (!data[row + x]) continue;
      area++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return {
    area,
    coverage: width * height > 0 ? area / (width * height) : 0,
    bounds: area > 0 ? { x0, y0, x1, y1 } : null,
  };
}

/**
 * Mask pixel bounds → normalized rect. Bounds are inclusive pixel indices, so
 * the right edge is `x1 + 1`. `pad` is in normalized units on every side.
 */
export function maskBoundsToNormalizedRect(
  bounds: { x0: number; y0: number; x1: number; y1: number },
  maskWidth: number,
  maskHeight: number,
  pad = 0,
): NormalizedRect {
  const left = clamp((bounds.x0 / maskWidth) * 100 - pad, 0, 100);
  const top = clamp((bounds.y0 / maskHeight) * 100 - pad, 0, 100);
  const right = clamp(((bounds.x1 + 1) / maskWidth) * 100 + pad, 0, 100);
  const bottom = clamp(((bounds.y1 + 1) / maskHeight) * 100 + pad, 0, 100);
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/** Fraction (0-1) of the mask's set pixels that fall inside a normalized rect. */
export function fractionInsideRect(mask: BinaryMask, rect: NormalizedRect): number {
  const { width, height, data } = mask;
  const [bx0, by0, bx1, by1] = normalizedRectToPixelBox(rect, width, height);
  let total = 0;
  let inside = 0;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    const cy = y + 0.5;
    for (let x = 0; x < width; x++) {
      if (!data[row + x]) continue;
      total++;
      const cx = x + 0.5;
      if (cx >= bx0 && cx <= bx1 && cy >= by0 && cy <= by1) inside++;
    }
  }
  return total === 0 ? 0 : inside / total;
}

/** Whether the mask covers a normalized point, allowing `radius` mask pixels of slack. */
export function maskContainsPoint(mask: BinaryMask, point: NormalizedPoint, radius = 1): boolean {
  const [px, py] = normalizedToPixelPoint(point, mask.width, mask.height);
  const cx = clamp(Math.floor(px), 0, mask.width - 1);
  const cy = clamp(Math.floor(py), 0, mask.height - 1);
  for (let y = Math.max(0, cy - radius); y <= Math.min(mask.height - 1, cy + radius); y++) {
    for (let x = Math.max(0, cx - radius); x <= Math.min(mask.width - 1, cx + radius); x++) {
      if (mask.data[y * mask.width + x]) return true;
    }
  }
  return false;
}
