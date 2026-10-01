'use client';

import React from 'react';
import type { JourneyHop } from './types';
import { ImageCredit } from './ImageCredit';

interface JourneyTrailProps {
  hops: JourneyHop[];
  onSelectHop: (hop: JourneyHop) => void;
  onClearTrail: () => void;
}

export function JourneyTrail({ hops, onSelectHop, onClearTrail }: JourneyTrailProps) {
  if (hops.length <= 1) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-4xl w-[92vw] px-4 py-3 rounded-2xl bg-black/85 backdrop-blur-xl border border-amber-500/30 shadow-2xl flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0 text-amber-400 font-sans font-bold text-xs uppercase tracking-wider pr-2 border-r border-white/10">
          <span>🌿</span>
          <span>Your Path:</span>
        </div>

        {hops.map((hop, i) => (
          <React.Fragment key={`${hop.artwork.id}-${i}`}>
            {i > 0 && <span className="text-amber-500 text-xs shrink-0">──▶</span>}
            <div className="shrink-0 space-y-1">
              <button
                onClick={() => onSelectHop(hop)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-amber-400/20 hover:border-amber-400/50 border border-white/10 shrink-0 text-left transition-colors group"
              >
                <img
                  src={hop.artwork.image.startsWith('/') ? hop.artwork.image : `/${hop.artwork.image}`}
                  alt={hop.artwork.title}
                  className="w-5 h-5 rounded object-contain border border-white/20"
                />
                <span className="flex flex-col">
                  <span className="text-[11px] font-serif text-white group-hover:text-amber-200 truncate max-w-[130px]">
                    {hop.artwork.title}
                  </span>
                  <span className="text-[9px] font-sans text-stone-400">
                    {hop.artwork.year}
                  </span>
                </span>
              </button>
              <ImageCredit credit={hop.artwork.imageCredit} photograph={hop.artwork.sourceKind === 'photograph'} compact />
            </div>
          </React.Fragment>
        ))}
      </div>

      <button
        onClick={onClearTrail}
        className="shrink-0 text-[10px] text-stone-400 hover:text-white uppercase tracking-wider font-sans px-2 py-1 rounded hover:bg-white/5 transition-colors"
        title="Reset discovery trail"
      >
        Reset
      </button>
    </div>
  );
}
