import { describe, expect, it } from 'vitest';
import { curatedArtworks } from '@/data/artworks';
import { experienceReducer, initialState } from '@/lib/experience-state';
import {
  clientToNormalizedPoint,
  fractionInsideRect,
  maskBoundsToNormalizedRect,
  maskContainsPoint,
  maskSizeFor,
  maskStats,
  normalizedRectToPixelBox,
  normalizedToPixelPoint,
} from '@/lib/segmentation/geometry';
import { maskToRgba } from '@/lib/segmentation/mask-image';
import { chooseRegion, segmentMotif } from '@/lib/segmentation/region';
import { createSam2Backend, SAM2_MODEL_ID } from '@/lib/segmentation/sam2-backend';
import type { WorkerRequest, WorkerResponse } from '@/lib/segmentation/sam2-protocol';
import type {
  BackendStatus,
  BinaryMask,
  SegmentationBackend,
  SegmentationOutput,
  SegmentationRequest,
} from '@/lib/segmentation/types';
import type { Motif } from '@/lib/types';

const wave = curatedArtworks.find((a) => a.id === 'great-wave')!;
const boats = wave.motifs.find((m) => m.id === 'the-boats')!; // rect { x: 39, y: 81, w: 33, h: 16 }

/** A `width`×`height` mask with a filled box given in mask pixels (inclusive-exclusive). */
function boxMask(width: number, height: number, x0: number, y0: number, x1: number, y1: number): BinaryMask {
  const data = new Uint8Array(width * height);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) data[y * width + x] = 1;
  return { width, height, data };
}

/** Same box, given in normalized units, on a 200×100 mask. */
function normalizedBoxMask(x: number, y: number, w: number, h: number): BinaryMask {
  return boxMask(200, 100, Math.round(x * 2), Math.round(y), Math.round((x + w) * 2), Math.round(y + h));
}

describe('coordinate conversion', () => {
  const frame = { left: 100, top: 50, width: 800, height: 552.5 };

  it('maps a click inside the on-screen frame to 0-100 artwork coordinates', () => {
    expect(clientToNormalizedPoint(frame, 100, 50)).toEqual({ x: 0, y: 0 });
    expect(clientToNormalizedPoint(frame, 500, 326.25)).toEqual({ x: 50, y: 50 });
    expect(clientToNormalizedPoint(frame, 900, 602.5)).toEqual({ x: 100, y: 100 });
  });

  it('clamps clicks outside the frame and refuses an unlaid-out frame', () => {
    expect(clientToNormalizedPoint(frame, 0, 1000)).toEqual({ x: 0, y: 100 });
    expect(clientToNormalizedPoint({ left: 0, top: 0, width: 0, height: 10 }, 5, 5)).toBeNull();
  });

  it('maps normalized points and rects to image pixels', () => {
    const [px, py] = normalizedToPixelPoint({ x: 55, y: 88 }, 1600, 1105);
    expect(px).toBeCloseTo(880);
    expect(py).toBeCloseTo(972.4);
    const [x0, y0, x1, y1] = normalizedRectToPixelBox(boats.rect, 1600, 1105);
    expect([x0, x1]).toEqual([624, 1152]);
    expect(y0).toBeCloseTo(895.05);
    expect(y1).toBeCloseTo(1071.85);
  });

  it('clamps rects that spill past the image', () => {
    expect(normalizedRectToPixelBox({ x: -10, y: 90, w: 30, h: 20 }, 100, 100)).toEqual([0, 90, 20, 100]);
  });

  it('keeps the image aspect for masks and never upscales', () => {
    expect(maskSizeFor(1600, 1105, 512)).toEqual({ width: 512, height: 354 });
    expect(maskSizeFor(1105, 1600, 512)).toEqual({ width: 354, height: 512 });
    expect(maskSizeFor(300, 200, 512)).toEqual({ width: 300, height: 200 });
  });

  it('turns mask bounds into a normalized rect, padded and clamped', () => {
    const mask = boxMask(200, 100, 20, 10, 60, 30);
    const stats = maskStats(mask);
    expect(stats.bounds).toEqual({ x0: 20, y0: 10, x1: 59, y1: 29 });
    expect(stats.area).toBe(40 * 20);
    expect(stats.coverage).toBeCloseTo(0.04);
    expect(maskBoundsToNormalizedRect(stats.bounds!, 200, 100)).toEqual({ x: 10, y: 10, w: 20, h: 20 });
    expect(maskBoundsToNormalizedRect({ x0: 0, y0: 0, x1: 199, y1: 99 }, 200, 100, 2)).toEqual({ x: 0, y: 0, w: 100, h: 100 });
  });

  it('round-trips a click: screen → normalized → mask pixel', () => {
    const point = clientToNormalizedPoint(frame, 100 + 0.25 * 800, 50 + 0.5 * 552.5)!;
    const mask = boxMask(200, 100, 48, 48, 52, 52); // around (50, 50) in mask pixels = (25%, 50%)
    expect(maskContainsPoint(mask, point, 0)).toBe(true);
    expect(maskContainsPoint(mask, { x: 75, y: 50 }, 2)).toBe(false);
  });

  it('measures how much of a mask lies inside a rect', () => {
    const mask = boxMask(200, 100, 0, 0, 100, 100); // left half
    expect(fractionInsideRect(mask, { x: 0, y: 0, w: 25, h: 100 })).toBeCloseTo(0.5);
    expect(fractionInsideRect(boxMask(10, 10, 0, 0, 0, 0), { x: 0, y: 0, w: 100, h: 100 })).toBe(0);
  });
});

describe('mask → frontend format', () => {
  it('writes alpha only, inverted for the dimming layer', () => {
    const mask: BinaryMask = { width: 2, height: 1, data: Uint8Array.from([1, 0]) };
    expect(Array.from(maskToRgba(mask))).toEqual([0, 0, 0, 255, 0, 0, 0, 0]);
    expect(Array.from(maskToRgba(mask, { invert: true }))).toEqual([0, 0, 0, 0, 0, 0, 0, 255]);
  });
});

describe('choosing a region from mask candidates', () => {
  const inside = normalizedBoxMask(50, 83, 10, 10); // inside the boats rect
  const click = { x: 55, y: 88 };

  it('accepts the best-scoring valid mask and derives its crop from the mask', () => {
    const region = chooseRegion(
      boats,
      { candidates: [{ mask: inside, score: 0.8 }, { mask: normalizedBoxMask(45, 82, 5, 5), score: 0.6 }] },
      click,
      'SAM 2.1',
    );
    expect(region.source).toBe('segmentation');
    if (region.source !== 'segmentation') return;
    expect(region.score).toBe(0.8);
    expect(region.backend).toBe('SAM 2.1');
    expect(region.rect).toEqual({ x: 49, y: 82, w: 12, h: 12 });
  });

  it('skips a higher-scoring mask that covers the whole sea', () => {
    const sea = normalizedBoxMask(0, 20, 100, 80);
    const region = chooseRegion(boats, { candidates: [{ mask: sea, score: 0.9 }, { mask: inside, score: 0.6 }] }, click, 'x');
    expect(region.source).toBe('segmentation');
  });

  it.each([
    ['mask-too-large', normalizedBoxMask(0, 0, 100, 60), click],
    ['mask-too-small', boxMask(200, 100, 110, 88, 111, 89), { x: 55, y: 88 }],
    ['mask-outside-region', normalizedBoxMask(5, 5, 20, 20), null],
    ['misses-click', inside, { x: 42, y: 95 }],
    ['empty-mask', boxMask(200, 100, 0, 0, 0, 0), null],
  ] as const)('falls back to the curated rectangle: %s', (reason, mask, point) => {
    const region = chooseRegion(boats, { candidates: [{ mask, score: 1 }] }, point, 'x');
    expect(region).toEqual({ source: 'curated', rect: boats.rect, shape: boats.shape, reason });
  });

  it('does not trust a mask the model itself scores low', () => {
    const region = chooseRegion(boats, { candidates: [{ mask: inside, score: 0.38 }] }, click, 'x');
    expect(region).toMatchObject({ source: 'curated', reason: 'low-confidence' });
  });

  it('falls back when the model says there is no object', () => {
    const region = chooseRegion(boats, { candidates: [{ mask: inside, score: 1 }], objectScore: -3 }, click, 'x');
    expect(region).toMatchObject({ source: 'curated', reason: 'no-object' });
  });

  it('rejects a mask whose data does not match its size', () => {
    const broken: BinaryMask = { width: 10, height: 10, data: new Uint8Array(5) };
    expect(chooseRegion(boats, { candidates: [{ mask: broken, score: 1 }] }, null, 'x')).toMatchObject({
      reason: 'empty-mask',
    });
  });
});

function fakeBackend(
  segment: (request: SegmentationRequest) => Promise<SegmentationOutput>,
  status: BackendStatus = 'ready',
): SegmentationBackend {
  return { id: 'fake', label: 'Fake', status: () => status, onStatus: () => () => {}, segment };
}

const request: SegmentationRequest = {
  imageUrl: 'http://localhost/artworks/hokusai.jpg',
  imageWidth: 1600,
  imageHeight: 1105,
  prompt: { point: { x: 55, y: 88 }, hint: boats.rect },
};

describe('segmentMotif fallback behaviour', () => {
  const curated = (motif: Motif, reason: string) => ({ source: 'curated', rect: motif.rect, shape: motif.shape, reason });

  it('uses the curated rectangle when segmentation is disabled', async () => {
    expect(await segmentMotif(null, boats, request)).toEqual(curated(boats, 'disabled'));
  });

  it('does not call a backend that is already unavailable', async () => {
    let called = false;
    const backend = fakeBackend(async () => {
      called = true;
      return { candidates: [] };
    }, 'unavailable');
    expect(await segmentMotif(backend, boats, request)).toEqual(curated(boats, 'unavailable'));
    expect(called).toBe(false);
  });

  it('turns a thrown error into a curated fallback', async () => {
    const backend = fakeBackend(async () => {
      throw new Error('boom');
    });
    expect(await segmentMotif(backend, boats, request)).toEqual(curated(boats, 'error'));
  });

  it('gives up after the timeout', async () => {
    const backend = fakeBackend(() => new Promise(() => {}));
    expect(await segmentMotif(backend, boats, request, 20)).toEqual(curated(boats, 'timeout'));
  });

  it('returns the traced region when the backend succeeds', async () => {
    const backend = fakeBackend(async () => ({ candidates: [{ mask: normalizedBoxMask(50, 83, 10, 10), score: 0.5 }] }));
    const region = await segmentMotif(backend, boats, request);
    expect(region).toMatchObject({ source: 'segmentation', backend: 'Fake' });
  });
});

/** Stands in for the SAM 2 worker: records requests, replies on demand. */
class FakeWorker extends EventTarget {
  sent: WorkerRequest[] = [];
  postMessage(message: WorkerRequest) {
    this.sent.push(message);
  }
  reply(message: WorkerResponse) {
    this.dispatchEvent(Object.assign(new Event('message'), { data: message }));
  }
  terminate() {}
}

describe('SAM 2 worker backend', () => {
  it('sends pixel-space prompts and a reduced mask size', async () => {
    const worker = new FakeWorker();
    const backend = createSam2Backend(() => worker as unknown as Worker);
    expect(backend.status()).toBe('idle');

    const pending = backend.segment(request);
    expect(backend.status()).toBe('loading');
    const sent = worker.sent[0];
    expect(sent).toMatchObject({ type: 'segment', modelId: SAM2_MODEL_ID, maskWidth: 512, maskHeight: 354 });
    expect(sent.point![0]).toBeCloseTo(880);
    expect(sent.point![1]).toBeCloseTo(972.4);
    expect(sent.box[0]).toBe(624);

    worker.reply({ type: 'status', status: 'ready' });
    const data = new Uint8Array(512 * 354);
    worker.reply({ type: 'result', id: sent.id, width: 512, height: 354, candidates: [{ score: 0.7, data }], objectScore: 2 });
    const output = await pending;
    expect(backend.status()).toBe('ready');
    expect(output.objectScore).toBe(2);
    expect(output.candidates[0]).toEqual({ score: 0.7, mask: { width: 512, height: 354, data } });
  });

  it('prompts with the curated box when there is no click', () => {
    const worker = new FakeWorker();
    const backend = createSam2Backend(() => worker as unknown as Worker);
    void backend.segment({ ...request, prompt: { point: null, hint: { x: 0, y: 0, w: 50, h: 100 } } });
    expect(worker.sent[0].point).toBeNull();
    expect(worker.sent[0].box).toEqual([0, 0, 800, 1105]);
  });

  it('becomes unavailable and rejects pending work when the model fails to load', async () => {
    const worker = new FakeWorker();
    const backend = createSam2Backend(() => worker as unknown as Worker);
    const pending = backend.segment(request);
    worker.reply({ type: 'status', status: 'unavailable' });
    await expect(pending).rejects.toThrow(/failed to load/);
    expect(backend.status()).toBe('unavailable');
    await expect(backend.segment(request)).rejects.toThrow();
    expect(await segmentMotif(backend, boats, request)).toMatchObject({ source: 'curated', reason: 'unavailable' });
  });

  it('rejects one request on a worker error message without disabling the backend', async () => {
    const worker = new FakeWorker();
    const backend = createSam2Backend(() => worker as unknown as Worker);
    const pending = backend.segment(request);
    worker.reply({ type: 'error', id: worker.sent[0].id, message: 'image failed' });
    await expect(pending).rejects.toThrow('image failed');
    expect(backend.status()).not.toBe('unavailable');
  });

  it('is unavailable when a worker cannot be created', async () => {
    const backend = createSam2Backend(() => {
      throw new Error('no workers');
    });
    await expect(backend.segment(request)).rejects.toThrow('no workers');
    expect(backend.status()).toBe('unavailable');
  });
});

describe('selection point in the experience state', () => {
  const entered = experienceReducer(initialState, { type: 'enter' });
  const selected = experienceReducer(entered, { type: 'select-motif', motifId: 'the-boats', point: { x: 55, y: 88 } });

  it('stores the click with the selection', () => {
    expect(selected.selectionPoint).toEqual({ x: 55, y: 88 });
    expect(experienceReducer(entered, { type: 'select-motif', motifId: 'the-boats' }).selectionPoint).toBeNull();
  });

  it('re-aims on a new click on the same motif, keeping the chosen connection', () => {
    const chosen = experienceReducer(selected, { type: 'choose-connection', index: 0 });
    const reaimed = experienceReducer(chosen, { type: 'select-motif', motifId: 'the-boats', point: { x: 60, y: 90 } });
    expect(reaimed.selectionPoint).toEqual({ x: 60, y: 90 });
    expect(reaimed.connectionIndex).toBe(0);
    expect(experienceReducer(chosen, { type: 'select-motif', motifId: 'the-boats', point: { x: 55, y: 88 } })).toBe(chosen);
    expect(experienceReducer(chosen, { type: 'select-motif', motifId: 'the-boats' })).toBe(chosen);
  });

  it('clears the click when the selection is reached by travel or cleared', () => {
    const travelling = experienceReducer(selected, { type: 'travel-start' });
    expect(experienceReducer(travelling, { type: 'travel-complete' }).selectionPoint).toBeNull();
    expect(experienceReducer(selected, { type: 'clear-motif' }).selectionPoint).toBeNull();
  });
});
