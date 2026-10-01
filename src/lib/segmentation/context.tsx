'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useExperience } from '../experience-state';
import { getSegmentationBackend } from './index';
import { maskToDataUrl } from './mask-image';
import { curatedRegion, segmentMotif } from './region';
import type { BackendStatus, FallbackReason, MotifRegion, NormalizedPoint } from './types';

/**
 * What the stage shows about segmentation for the current selection:
 * - `off`: no backend (disabled, or no Web Worker); curated rectangles, no status shown
 * - `loading-model` / `segmenting`: curated rectangle shown while the mask is computed
 * - `traced`: the mask drives the spotlight and the crop
 * - `fallback`: segmentation ran but its mask was rejected or it failed; curated rectangle
 */
export type RegionStatus = 'idle' | 'off' | 'loading-model' | 'segmenting' | 'traced' | 'fallback';

export interface MaskImages {
  /** Opaque on the motif. */
  cover: string;
  /** Opaque everywhere except the motif. */
  cutout: string;
}

export interface MotifRegionValue {
  status: RegionStatus;
  /** Region for the current selection; curated until a mask is accepted. */
  region: MotifRegion | null;
  masks: MaskImages | null;
  backendLabel: string | null;
}

interface Entry {
  key: string;
  region: MotifRegion;
  masks: MaskImages | null;
  pending: boolean;
}

/** Results worth reusing: accepted masks and deterministic rejections. Not transient failures. */
const TRANSIENT: FallbackReason[] = ['error', 'timeout', 'unavailable', 'disabled'];
const CACHE_SIZE = 24;
const cache = new Map<string, Entry>();

function remember(entry: Entry) {
  if (entry.region.source === 'curated' && TRANSIENT.includes(entry.region.reason!)) return;
  cache.set(entry.key, entry);
  while (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!);
}

function selectionKey(artworkId: string, motifId: string, point: NormalizedPoint | null) {
  return `${artworkId}/${motifId}/${point ? `${point.x.toFixed(2)},${point.y.toFixed(2)}` : 'box'}`;
}

function toEntry(key: string, region: MotifRegion): Entry {
  let masks: MaskImages | null = null;
  if (region.source === 'segmentation') {
    const cover = maskToDataUrl(region.mask);
    const cutout = maskToDataUrl(region.mask, { invert: true });
    if (cover && cutout) masks = { cover, cutout };
  }
  return { key, region, masks, pending: false };
}

const MotifRegionContext = createContext<MotifRegionValue>({
  status: 'idle',
  region: null,
  masks: null,
  backendLabel: null,
});

export function SegmentationProvider({ children }: { children: React.ReactNode }) {
  const { state, artwork, selectedMotif } = useExperience();
  const backend = useMemo(() => getSegmentationBackend(), []);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>(() => backend?.status() ?? 'unavailable');
  const [entry, setEntry] = useState<Entry | null>(null);

  useEffect(() => backend?.onStatus(setBackendStatus), [backend]);

  const point = state.selectionPoint;
  const key = selectedMotif ? selectionKey(artwork.id, selectedMotif.id, point) : null;

  useEffect(() => {
    if (!key || !selectedMotif) {
      setEntry(null);
      return;
    }
    const cached = cache.get(key);
    if (cached) {
      setEntry(cached);
      return;
    }

    let current = true;
    setEntry({ key, region: curatedRegion(selectedMotif, null), masks: null, pending: true });
    segmentMotif(backend, selectedMotif, {
      imageUrl: new URL(artwork.image.src, window.location.href).href,
      imageWidth: artwork.image.width,
      imageHeight: artwork.image.height,
      prompt: { point, hint: selectedMotif.rect },
    }).then((region) => {
      const next = toEntry(key, region);
      remember(next);
      // A newer selection may have started meanwhile; its result wins.
      if (current) setEntry(next);
    });
    return () => {
      current = false;
    };
    // `key` encodes artwork, motif and point, the only inputs that change the request.
  }, [key]);

  const value = useMemo<MotifRegionValue>(() => {
    const label = backend?.label ?? null;
    if (!key || !selectedMotif) return { status: 'idle', region: null, masks: null, backendLabel: label };
    // Until the effect catches up with a new selection, show the curated region.
    const live = entry && entry.key === key ? entry : null;
    const region = live?.region ?? curatedRegion(selectedMotif, null);
    const masks = live?.masks ?? null;

    let status: RegionStatus;
    if (!backend) status = 'off';
    else if (!live || live.pending) status = backendStatus === 'loading' ? 'loading-model' : 'segmenting';
    else if (region.source === 'segmentation' && masks) status = 'traced';
    else status = 'fallback';

    // A mask we could not turn into images cannot be drawn; keep the curated rectangle.
    const drawable: MotifRegion =
      region.source === 'segmentation' && !masks ? curatedRegion(selectedMotif, 'error') : region;
    return { status, region: drawable, masks, backendLabel: label };
  }, [backend, backendStatus, entry, key, selectedMotif]);

  return <MotifRegionContext.Provider value={value}>{children}</MotifRegionContext.Provider>;
}

export function useMotifRegion(): MotifRegionValue {
  return useContext(MotifRegionContext);
}
