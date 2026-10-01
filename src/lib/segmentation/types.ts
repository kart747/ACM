import type { NormalizedRect, Shape } from '../types';

/** A point on the artwork, normalized to the image box like `NormalizedRect` (0-100). */
export interface NormalizedPoint {
  x: number;
  y: number;
}

/**
 * What the viewer asked to segment: where they clicked, if they clicked
 * (keyboard, panel and landing after travel have no point), and the curated
 * region, which backends may use as a prompt and which masks are checked against.
 */
export interface SegmentationPrompt {
  point: NormalizedPoint | null;
  hint: NormalizedRect;
}

export interface SegmentationRequest {
  /** Absolute URL of the artwork image. */
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  prompt: SegmentationPrompt;
}

/** Row-major, one byte per pixel, 1 = inside the motif. */
export interface BinaryMask {
  width: number;
  height: number;
  data: Uint8Array;
}

export interface MaskCandidate {
  mask: BinaryMask;
  /** The model's own quality estimate (SAM: predicted IoU). Higher is better. */
  score: number;
}

export interface SegmentationOutput {
  candidates: MaskCandidate[];
  /** Model's belief that an object is present at all; negative means "no object". Optional. */
  objectScore?: number;
}

export type BackendStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

/**
 * Anything that turns a prompt into mask candidates. The app only talks to this
 * interface, so SAM 2 can be swapped for another model or a server endpoint.
 */
export interface SegmentationBackend {
  readonly id: string;
  /** Short human-readable model name, shown in the UI. */
  readonly label: string;
  status(): BackendStatus;
  /** Subscribe to status changes. Returns an unsubscribe function. */
  onStatus(listener: (status: BackendStatus) => void): () => void;
  segment(request: SegmentationRequest): Promise<SegmentationOutput>;
}

export type FallbackReason =
  | 'disabled'
  | 'unavailable'
  | 'error'
  | 'timeout'
  | 'no-object'
  | 'low-confidence'
  | 'empty-mask'
  | 'mask-too-small'
  | 'mask-too-large'
  | 'mask-outside-region'
  | 'misses-click';

/** The selected motif's region as the frontend renders it. */
export type MotifRegion =
  | {
      source: 'curated';
      rect: NormalizedRect;
      shape: Shape;
      reason: FallbackReason | null;
    }
  | {
      source: 'segmentation';
      /** Bounding box of the mask, padded. Drives the crop and the flight. */
      rect: NormalizedRect;
      mask: BinaryMask;
      backend: string;
      score: number;
    };
