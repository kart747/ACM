/// <reference lib="webworker" />
/**
 * SAM 2.1 inference, off the main thread so the spotlight and the travel
 * animation never stall on the model. Talks to `sam2-backend.ts` only.
 *
 * The expensive step is the image encoder (seconds on WASM); its embeddings are
 * cached per image, so every later click on the same artwork only runs the
 * small prompt decoder.
 */
import {
  AutoProcessor,
  RawImage,
  Sam2Model,
  env,
  type Processor,
  type Tensor,
} from '@huggingface/transformers';
import type { WorkerRequest, WorkerResponse } from './sam2-protocol';

declare const self: DedicatedWorkerGlobalScope;

env.allowLocalModels = false;

interface Encoded {
  embeddings: Record<string, Tensor>;
  originalSizes: [number, number][];
  reshapedSizes: [number, number][];
}

const EMBEDDING_CACHE_SIZE = 2;

let loading: Promise<{ model: Sam2Model; processor: Processor }> | null = null;
const encoded = new Map<string, Promise<Encoded>>();

function post(message: WorkerResponse, transfer: Transferable[] = []) {
  self.postMessage(message, transfer);
}

function load(modelId: string, dtype: string) {
  loading ??= (async () => {
    post({ type: 'status', status: 'loading' });
    const [model, processor] = await Promise.all([
      Sam2Model.from_pretrained(modelId, { dtype: dtype as 'int8', device: 'wasm' }),
      AutoProcessor.from_pretrained(modelId),
    ]);
    post({ type: 'status', status: 'ready' });
    return { model: model as Sam2Model, processor };
  })().catch((error) => {
    post({ type: 'status', status: 'unavailable' });
    throw error;
  });
  return loading;
}

function encode(imageUrl: string, model: Sam2Model, processor: Processor): Promise<Encoded> {
  const cached = encoded.get(imageUrl);
  if (cached) {
    // Refresh recency.
    encoded.delete(imageUrl);
    encoded.set(imageUrl, cached);
    return cached;
  }
  const job = (async () => {
    const image = await RawImage.fromURL(imageUrl);
    const inputs = await processor(image);
    const embeddings = await model.get_image_embeddings(inputs);
    return {
      embeddings,
      originalSizes: inputs.original_sizes,
      reshapedSizes: inputs.reshaped_input_sizes,
    };
  })();
  job.catch(() => encoded.delete(imageUrl));
  encoded.set(imageUrl, job);
  while (encoded.size > EMBEDDING_CACHE_SIZE) {
    encoded.delete(encoded.keys().next().value!);
  }
  return job;
}

async function segment(message: WorkerRequest) {
  const { model, processor } = await load(message.modelId, message.dtype);
  const image = await encode(message.imageUrl, model, processor);
  const imageProcessor = (processor as unknown as { image_processor: SamImageProcessorLike })
    .image_processor;

  // The box is always sent: on paintings a lone point is ambiguous (a click on
  // a boat can return a sliver of the wave beside it), while point + box keeps
  // the viewer's click as the positive prompt and gives the model the region.
  const prompt: Record<string, Tensor> = {
    input_boxes: imageProcessor.reshape_input_points(
      [[message.box]],
      image.originalSizes,
      image.reshapedSizes,
      true,
    ),
  };
  if (message.point) {
    prompt.input_points = imageProcessor.reshape_input_points(
      [[message.point]],
      image.originalSizes,
      image.reshapedSizes,
    );
  }

  const output = await model({ ...image.embeddings, ...prompt });

  // Masks come back at 256×256; resample straight to the requested mask size
  // instead of the full image, which keeps the transfer and later passes small.
  const [masks] = await imageProcessor.post_process_masks(
    output.pred_masks,
    [[message.maskHeight, message.maskWidth]],
    image.reshapedSizes,
  );

  const scores = Array.from(output.iou_scores.data as Float32Array);
  const pixels = message.maskWidth * message.maskHeight;
  const data = masks.data as Uint8Array;
  const candidates = scores.map((score, i) => ({
    score,
    data: data.slice(i * pixels, (i + 1) * pixels),
  }));
  const objectScore = output.object_score_logits
    ? (output.object_score_logits.data as Float32Array)[0]
    : undefined;

  post(
    {
      type: 'result',
      id: message.id,
      width: message.maskWidth,
      height: message.maskHeight,
      candidates,
      objectScore,
    },
    candidates.map((c) => c.data.buffer),
  );
}

interface SamImageProcessorLike {
  reshape_input_points(
    points: number[][][],
    originalSizes: [number, number][],
    reshapedSizes: [number, number][],
    isBoundingBox?: boolean,
  ): Tensor;
  post_process_masks(
    masks: Tensor,
    originalSizes: [number, number][],
    reshapedSizes: [number, number][],
  ): Promise<Tensor[]>;
}

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  segment(message).catch((error: unknown) => {
    post({
      type: 'error',
      id: message.id,
      message: error instanceof Error ? error.message : String(error),
    });
  });
});
