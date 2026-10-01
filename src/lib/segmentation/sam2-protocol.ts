/** Messages between `sam2-backend.ts` (main thread) and `sam2.worker.ts`. Pixel coordinates. */

export interface WorkerRequest {
  type: 'segment';
  id: number;
  modelId: string;
  dtype: string;
  imageUrl: string;
  /** `[x, y]` in image pixels: the viewer's click, a positive point. Null without a click. */
  point: [number, number] | null;
  /** `[x0, y0, x1, y1]` in image pixels: the curated region, always sent as a box prompt. */
  box: [number, number, number, number];
  maskWidth: number;
  maskHeight: number;
}

export type WorkerResponse =
  | { type: 'status'; status: 'loading' | 'ready' | 'unavailable' }
  | {
      type: 'result';
      id: number;
      width: number;
      height: number;
      candidates: { score: number; data: Uint8Array }[];
      objectScore?: number;
    }
  | { type: 'error'; id: number; message: string };
