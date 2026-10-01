import { maskSizeFor, normalizedRectToPixelBox, normalizedToPixelPoint } from './geometry';
import type { WorkerRequest, WorkerResponse } from './sam2-protocol';
import type {
  BackendStatus,
  SegmentationBackend,
  SegmentationOutput,
  SegmentationRequest,
} from './types';

/**
 * SAM 2.1 Hiera-Tiny, converted to ONNX for Transformers.js. Int8 weights are
 * ~61 MB in total (encoder 53 MB, decoder 9 MB), fetched from the Hugging Face
 * hub on first use and then served from the browser cache.
 */
export const SAM2_MODEL_ID = 'onnx-community/sam2.1-hiera-tiny-ONNX';
export const SAM2_DTYPE = 'int8';

/** Long edge of returned masks. Plenty for a spotlight over a ~1000px frame. */
export const MASK_MAX_EDGE = 512;

interface Pending {
  resolve: (output: SegmentationOutput) => void;
  reject: (error: Error) => void;
}

export function createSam2Backend(createWorker: () => Worker): SegmentationBackend {
  let worker: Worker | null = null;
  let status: BackendStatus = 'idle';
  let nextId = 1;
  const pending = new Map<number, Pending>();
  const listeners = new Set<(status: BackendStatus) => void>();

  const setStatus = (next: BackendStatus) => {
    if (status === next) return;
    status = next;
    listeners.forEach((listener) => listener(next));
  };

  const failAll = (error: Error) => {
    pending.forEach(({ reject }) => reject(error));
    pending.clear();
  };

  const ensureWorker = (): Worker => {
    if (worker) return worker;
    const created = createWorker();
    created.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (message.type === 'status') {
        setStatus(message.status);
        if (message.status === 'unavailable') failAll(new Error('Segmentation model failed to load'));
        return;
      }
      const job = pending.get(message.id);
      if (!job) return;
      pending.delete(message.id);
      if (message.type === 'error') {
        job.reject(new Error(message.message));
        return;
      }
      job.resolve({
        objectScore: message.objectScore,
        candidates: message.candidates.map((c) => ({
          score: c.score,
          mask: { width: message.width, height: message.height, data: c.data },
        })),
      });
    });
    created.addEventListener('error', () => {
      setStatus('unavailable');
      failAll(new Error('Segmentation worker crashed'));
    });
    worker = created;
    return created;
  };

  return {
    id: 'sam2',
    label: 'SAM 2.1',
    status: () => status,
    onStatus(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    segment(request: SegmentationRequest) {
      if (status === 'unavailable') return Promise.reject(new Error('Segmentation unavailable'));
      let target: Worker;
      try {
        target = ensureWorker();
      } catch (error) {
        setStatus('unavailable');
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
      if (status === 'idle') setStatus('loading');

      const { imageWidth, imageHeight, prompt } = request;
      const size = maskSizeFor(imageWidth, imageHeight, MASK_MAX_EDGE);
      const id = nextId++;
      const message: WorkerRequest = {
        type: 'segment',
        id,
        modelId: SAM2_MODEL_ID,
        dtype: SAM2_DTYPE,
        imageUrl: request.imageUrl,
        point: prompt.point ? normalizedToPixelPoint(prompt.point, imageWidth, imageHeight) : null,
        box: normalizedRectToPixelBox(prompt.hint, imageWidth, imageHeight),
        maskWidth: size.width,
        maskHeight: size.height,
      };

      return new Promise<SegmentationOutput>((resolve, reject) => {
        pending.set(id, { resolve, reject });
        target.postMessage(message);
      });
    },
  };
}
