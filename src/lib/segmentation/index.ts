import { createSam2Backend } from './sam2-backend';
import type { SegmentationBackend } from './types';

export type * from './types';
export { segmentMotif, curatedRegion, chooseRegion } from './region';
export { clientToNormalizedPoint } from './geometry';

/**
 * Which segmentation backend the app uses. `NEXT_PUBLIC_ARTSCAPE_SEGMENTATION`:
 * - `sam2` (default): SAM 2.1 in a Web Worker via Transformers.js
 * - `off`: never segment; every motif uses its curated rectangle
 * To add a backend, implement `SegmentationBackend` and select it here.
 */
const MODE = process.env.NEXT_PUBLIC_ARTSCAPE_SEGMENTATION ?? 'sam2';

let backend: SegmentationBackend | null | undefined;

export function getSegmentationBackend(): SegmentationBackend | null {
  if (backend !== undefined) return backend;
  if (MODE === 'off' || typeof window === 'undefined' || typeof Worker === 'undefined') {
    backend = null;
    return backend;
  }
  // Written inline so the bundler sees `new Worker(new URL(...))` and emits the worker chunk.
  backend = createSam2Backend(
    () => new Worker(new URL('./sam2.worker.ts', import.meta.url), { type: 'module' }),
  );
  return backend;
}
