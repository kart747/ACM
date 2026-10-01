import type { Motif } from '../types';
import {
  fractionInsideRect,
  maskBoundsToNormalizedRect,
  maskContainsPoint,
  maskStats,
} from './geometry';
import type {
  FallbackReason,
  MotifRegion,
  NormalizedPoint,
  SegmentationBackend,
  SegmentationOutput,
  SegmentationRequest,
} from './types';

/**
 * Sanity limits for a mask before it may replace the curated rectangle
 * (spec §41: bad coordinates → clamp / reject / fallback).
 */
export const MASK_LIMITS = {
  /** Below this model score (SAM: predicted IoU) the mask is not trusted. */
  minScore: 0.5,
  /** Smaller than this share of the image is treated as a stray speck. */
  minCoverage: 0.0005,
  /** Larger than this is background, not a detail. */
  maxCoverage: 0.5,
  /** At least this share of the mask must lie inside the curated region. */
  minInsideHint: 0.5,
  /** Padding around the mask's bounding box, in normalized units. */
  boundsPad: 1,
} as const;

export const SEGMENTATION_TIMEOUT_MS = 90_000;

export function curatedRegion(motif: Motif, reason: FallbackReason | null): MotifRegion {
  return { source: 'curated', rect: motif.rect, shape: motif.shape, reason };
}

/**
 * Picks the best-scoring candidate that passes the sanity checks, or explains
 * why none did. The reason reported is the one from the best-scoring candidate.
 */
export function chooseRegion(
  motif: Motif,
  output: SegmentationOutput,
  point: NormalizedPoint | null,
  backendLabel: string,
): MotifRegion {
  if (output.objectScore !== undefined && output.objectScore < 0) {
    return curatedRegion(motif, 'no-object');
  }

  const ranked = [...output.candidates].sort((a, b) => b.score - a.score);
  let firstReason: FallbackReason | null = null;

  for (const candidate of ranked) {
    const reason =
      candidate.score < MASK_LIMITS.minScore ? 'low-confidence' : rejectReason(candidate.mask, motif, point);
    if (reason) {
      firstReason ??= reason;
      continue;
    }
    const stats = maskStats(candidate.mask);
    return {
      source: 'segmentation',
      rect: maskBoundsToNormalizedRect(
        stats.bounds!,
        candidate.mask.width,
        candidate.mask.height,
        MASK_LIMITS.boundsPad,
      ),
      mask: candidate.mask,
      backend: backendLabel,
      score: candidate.score,
    };
  }

  return curatedRegion(motif, firstReason ?? 'empty-mask');
}

function rejectReason(
  mask: SegmentationOutput['candidates'][number]['mask'],
  motif: Motif,
  point: NormalizedPoint | null,
): FallbackReason | null {
  if (mask.width <= 0 || mask.height <= 0 || mask.data.length !== mask.width * mask.height) {
    return 'empty-mask';
  }
  const stats = maskStats(mask);
  if (!stats.bounds) return 'empty-mask';
  if (stats.coverage < MASK_LIMITS.minCoverage) return 'mask-too-small';
  if (stats.coverage > MASK_LIMITS.maxCoverage) return 'mask-too-large';
  if (fractionInsideRect(mask, motif.rect) < MASK_LIMITS.minInsideHint) return 'mask-outside-region';
  if (point && !maskContainsPoint(mask, point, 2)) return 'misses-click';
  return null;
}

/**
 * The whole click → mask → region step. Never rejects: any failure resolves to
 * the curated rectangle with a reason, so the caller can always render.
 */
export async function segmentMotif(
  backend: SegmentationBackend | null,
  motif: Motif,
  request: SegmentationRequest,
  timeoutMs = SEGMENTATION_TIMEOUT_MS,
): Promise<MotifRegion> {
  if (!backend) return curatedRegion(motif, 'disabled');
  if (backend.status() === 'unavailable') return curatedRegion(motif, 'unavailable');

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), timeoutMs);
  });

  try {
    const output = await Promise.race([backend.segment(request), timeout]);
    if (output === 'timeout') return curatedRegion(motif, 'timeout');
    return chooseRegion(motif, output, request.prompt.point, backend.label);
  } catch {
    return curatedRegion(motif, backend.status() === 'unavailable' ? 'unavailable' : 'error');
  } finally {
    clearTimeout(timer);
  }
}
