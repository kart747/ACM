'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { StorySchema } from '@/lib/creative-dna/schema';
import { prepareStory } from '@/lib/story/prepared';
import type { ArtworkData, ElementData } from './types';

const responseSchema = z.object({
  artworkId: z.string(),
  story: StorySchema,
  source: z.enum(['gemini', 'cache', 'prepared']),
  model: z.literal('gemini-3.8-flash').nullable(),
  reason: z.string().optional(),
}).refine(value => value.source === 'prepared' ? value.model === null : value.model === 'gemini-3.8-flash');
export type GuidedStoryResponse = z.infer<typeof responseSchema>;

export function useGuidedStory(artwork: ArtworkData, elements: ElementData[], enabled: boolean) {
  const [response, setResponse] = useState<GuidedStoryResponse | null>(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [complete, setComplete] = useState(false);
  const request = useRef<AbortController | null>(null);
  const currentId = useRef(artwork.id);
  currentId.current = artwork.id;
  const currentResponse = response?.artworkId === artwork.id ? response : null;
  const beat = currentResponse?.story.beats[index] ?? null;

  const stop = useCallback(() => {
    request.current?.abort();
    setActive(false);
    setLoading(false);
    setPlaying(false);
    setComplete(false);
  }, []);
  const pause = useCallback(() => setPlaying(false), []);

  useEffect(() => {
    stop();
    setResponse(null);
    setIndex(0);
    return () => { request.current?.abort(); };
  }, [artwork.id, enabled, stop]);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (!active || !enabled || !playing || !beat || !currentResponse) return;
    const timer = window.setTimeout(() => {
      if (index < currentResponse.story.beats.length - 1) setIndex(previous => previous + 1);
      else { setPlaying(false); setComplete(true); }
    }, beat.duration * 1000);
    return () => window.clearTimeout(timer);
  }, [active, enabled, playing, beat, index, currentResponse]);

  const start = async (generate = false) => {
    if (!enabled) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const artworkId = artwork.id;
    setActive(true);
    setPlaying(false);
    setLoading(true);
    setComplete(false);
    const timeout = window.setTimeout(() => controller.abort('timeout'), 65000);
    try {
      const result = await fetch(`/api/artworks/${encodeURIComponent(artworkId)}/story`, {
        method: generate ? 'POST' : 'GET',
        signal: controller.signal,
      });
      if (!result.ok) throw new Error('Story unavailable');
      const data = responseSchema.parse(await result.json());
      if (data.artworkId !== artworkId || data.story.beats.some(item => item.element_id && !elements.some(element => element.id === item.element_id))) {
        throw new Error('Story does not match the artwork');
      }
      if (controller.signal.aborted || currentId.current !== artworkId) return;
      setResponse(data);
      setIndex(0);
      setPlaying(false);
    } catch {
      if ((!controller.signal.aborted || controller.signal.reason === 'timeout') && currentId.current === artworkId) {
        setResponse({ artworkId, story: prepareStory(artwork, elements), source: 'prepared', model: null, reason: 'connection_error' });
        setIndex(0);
      }
    } finally {
      window.clearTimeout(timeout);
      if ((!controller.signal.aborted || controller.signal.reason === 'timeout') && currentId.current === artworkId) setLoading(false);
    }
  };

  const next = () => {
    setPlaying(false);
    if (currentResponse && index < currentResponse.story.beats.length - 1) setIndex(previous => previous + 1);
    else setComplete(true);
  };
  const previous = () => { setPlaying(false); setComplete(false); setIndex(value => Math.max(0, value - 1)); };
  const replay = () => { setIndex(0); setComplete(false); setPlaying(false); };
  const togglePlayback = () => {
    if (complete) { setIndex(0); setComplete(false); }
    setPlaying(previous => !previous);
  };

  return {
    active: active && enabled,
    loading,
    response: currentResponse,
    beat,
    index,
    playing,
    complete,
    focusedElement: active && !loading && !complete && beat?.element_id ? elements.find(element => element.id === beat.element_id) ?? null : null,
    start,
    stop,
    pause,
    next,
    previous,
    replay,
    togglePlayback,
  };
}

export type GuidedStoryController = ReturnType<typeof useGuidedStory>;
