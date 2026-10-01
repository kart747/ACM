'use client';

import type { ArtworkData } from './types';
import type { GuidedStoryController } from './useGuidedStory';

interface GuidedStoryPanelProps {
  artwork: ArtworkData;
  controller: GuidedStoryController;
  onExploreDetail: () => void;
}

export function GuidedStoryPanel({ artwork, controller: tour, onExploreDetail }: GuidedStoryPanelProps) {
  if (!tour.active) return null;
  const { beat, response } = tour;
  const total = response?.story.beats.length ?? 0;
  const prepared = response?.source === 'prepared';

  return (
    <aside aria-label="Guided story" className="fixed right-0 bottom-0 z-50 h-[48dvh] w-full rounded-t-2xl border-t border-white/15 bg-stone-950 lg:top-0 lg:h-auto lg:w-[460px] lg:rounded-none lg:border-l flex flex-col shadow-2xl">
      <header className="shrink-0 flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-amber-300">Guided story</p>
          <p className="mt-1 truncate text-xs text-stone-400" title={artwork.title}>{artwork.title}</p>
        </div>
        <button onClick={tour.stop} aria-label="Close guided story" className="rounded-full px-3 py-2 text-stone-200 hover:bg-white/10">✕</button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {tour.loading ? (
          <div role="status" className="space-y-3 text-sm text-stone-300">
            <p>Preparing your guided story…</p>
            <p className="text-xs text-stone-400">You can keep exploring or close this panel at any time.</p>
          </div>
        ) : response && beat ? (
          <>
            <p className="text-xs text-stone-400">{prepared ? 'Prepared story · no live AI required' : 'Gemini 3.8 Flash · saved AI interpretation'}</p>
            {response.reason && (
              <p role="status" className="mt-2 text-xs text-amber-200">
                {response.reason === 'connection_error'
                  ? 'The server story could not be loaded. This prepared guide is available locally.'
                  : response.reason === 'configuration_error'
                  ? 'Gemini is unavailable with the current provider configuration. The prepared story is still available.'
                  : response.reason === 'rate_limited'
                    ? 'Generation is temporarily limited. You can continue with the prepared story.'
                    : 'A Gemini story is unavailable. This is the prepared version, not a live model response.'}
              </p>
            )}
            {tour.complete ? (
              <div className="mt-5 space-y-4" aria-live="polite">
                <h3 className="font-serif text-2xl text-white">Story complete</h3>
                <p className="text-sm leading-relaxed text-stone-300">Choose a detail in the artwork to read more or follow a visual comparison into another work.</p>
                <button onClick={tour.replay} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white">Replay story</button>
              </div>
            ) : (
              <div className="mt-5" aria-live="polite" aria-atomic="true">
                <p className="text-xs text-amber-300">Beat {tour.index + 1} of {total}</p>
                <h3 className="mt-2 font-serif text-2xl text-white">{beat.title}</h3>
                {tour.index === 0 && <p className="mt-3 text-sm leading-relaxed text-stone-400">{response.story.intro}</p>}
                <p className="mt-4 text-base leading-relaxed text-stone-100">{beat.short_text}</p>
                <details key={beat.id} onToggle={event => { if (event.currentTarget.open) tour.pause(); }} className="mt-4 text-sm text-stone-300">
                  <summary className="cursor-pointer text-amber-300">More context</summary>
                  <p className="mt-3 leading-relaxed">{beat.explanation}</p>
                </details>
                {tour.focusedElement && (
                  <button onClick={onExploreDetail} className="mt-5 rounded-lg border border-amber-500/50 px-4 py-2 text-sm text-amber-200">Explore this detail</button>
                )}
              </div>
            )}
            <a href={artwork.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-block text-xs text-stone-400 underline">Read the museum record ↗</a>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">Visual interpretations are not artist statements or proof of historical influence.</p>
            {prepared && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <button onClick={() => void tour.start(true)} className="text-sm text-amber-300 underline">Create a Gemini story</button>
                <p className="mt-2 text-xs text-stone-400">Uses only gemini-3.8-flash. Accepted stories are saved for replay.</p>
              </div>
            )}
          </>
        ) : null}
      </div>
      <footer className="shrink-0 border-t border-white/10 px-5 py-3">
        {!tour.loading && beat && !tour.complete && (
          <div className="flex items-center justify-between gap-2">
            <button onClick={tour.previous} disabled={tour.index === 0} className="rounded-lg px-3 py-2 text-sm text-stone-200 hover:bg-white/10 disabled:opacity-30">Previous</button>
            <button onClick={tour.togglePlayback} aria-pressed={tour.playing} className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white">{tour.playing ? 'Pause' : 'Play'}</button>
            <button onClick={tour.next} className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-medium text-black">{tour.index === total - 1 ? 'Finish story' : 'Next'}</button>
          </div>
        )}
        <button onClick={tour.stop} className="mt-2 w-full py-1 text-xs text-stone-400 underline">{tour.complete ? 'Explore freely' : 'Skip story and explore freely'}</button>
      </footer>
    </aside>
  );
}
