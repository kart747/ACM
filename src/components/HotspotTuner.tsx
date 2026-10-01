'use client';

import { useExperience } from '@/lib/experience-state';
import { rectToPercentStyle } from '@/lib/rect';

/**
 * Development-only coordinate aid. Press `d` to toggle a grid and read out
 * each motif's normalized rect against the displayed artwork.
 */
export function HotspotTuner() {
  const { state, artwork, selectedMotif, dispatch } = useExperience();

  if (!state.showTuner) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30" aria-hidden>
      {/* 10% grid */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((v) => (
          <g key={v}>
            <line
              x1={`${v}%`}
              y1="0"
              x2={`${v}%`}
              y2="100%"
              stroke="rgba(201,162,39,0.16)"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1={`${v}%`}
              x2="100%"
              y2={`${v}%`}
              stroke="rgba(201,162,39,0.16)"
              strokeWidth="1"
            />
          </g>
        ))}
      </svg>

      {artwork.motifs.map((motif) => (
        <div
          key={motif.id}
          className="absolute border border-dashed border-[#c9a227]/70 bg-[#c9a227]/5"
          style={rectToPercentStyle(motif.rect)}
        >
          <span className="ui-sans pointer-events-auto absolute -top-[18px] left-0 whitespace-nowrap text-[10px] text-[#c9a227]">
            {motif.id} · {motif.rect.x},{motif.rect.y} · {motif.rect.w}×{motif.rect.h}
          </span>
          {selectedMotif?.id === motif.id && (
            <span className="ui-sans absolute bottom-0 right-0 translate-y-[130%] whitespace-nowrap text-[10px] text-[#6a675f]">
              {motif.label}
            </span>
          )}
        </div>
      ))}

      <div className="ui-sans absolute left-3 top-3 max-w-[280px] border border-[#26262a] bg-[#0b0b0c]/90 p-3 text-[10px] leading-relaxed text-[#9a968d]">
        <p className="m-0 text-[#ece9e2]">Tuner mode</p>
        <p className="mt-1 mb-0">
          Source image {artwork.image.width}×{artwork.image.height}px. Rects are
          percentages (0–100) of the displayed artwork box. Development only.
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'toggle-tuner' })}
          className="ui-sans pointer-events-auto mt-2 border border-[#3a3a3f] px-2 py-1 hover:border-[#c9a227]"
        >
          Close (d)
        </button>
      </div>
    </div>
  );
}
