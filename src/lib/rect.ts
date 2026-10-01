import type { Artwork, NormalizedRect } from './types';

/** Convert a normalized 0-100 rect to CSS percentage strings for absolute positioning. */
export function rectToPercentStyle(rect: NormalizedRect): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  return {
    left: `${rect.x}%`,
    top: `${rect.y}%`,
    width: `${rect.w}%`,
    height: `${rect.h}%`,
  };
}

/**
 * Background-image style that makes a box show exactly the motif region of a
 * full artwork. Used by the traveling crop and the "Travels to" thumbnail.
 *
 * `background-size` percentages are relative to the box, so scaling the image
 * to 100/w of the box width and 100/h of its height makes the motif fill it.
 * `background-position: p%` aligns the image's p% point with the box's p%
 * point, which puts the motif's left edge (x) on the box's left edge when
 * p = x / (100 - w).
 */
export function motifCropBackgroundStyle(
  artwork: Artwork,
  rect: NormalizedRect,
): { backgroundImage: string; backgroundSize: string; backgroundPosition: string } {
  const position = (start: number, size: number) =>
    size >= 100 ? 0 : (100 * start) / (100 - size);

  return {
    backgroundImage: `url(${artwork.image.src})`,
    backgroundSize: `${(100 * 100) / rect.w}% ${(100 * 100) / rect.h}%`,
    backgroundPosition: `${position(rect.x, rect.w)}% ${position(rect.y, rect.h)}%`,
  };
}

/** Width / height of the motif in image pixels. */
export function motifAspect(artwork: Artwork, rect: NormalizedRect): number {
  return (rect.w * artwork.image.width) / (rect.h * artwork.image.height);
}
