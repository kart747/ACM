'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ElementData, RelationshipData, ArtworkData } from './types';

interface MotifDrawerProps {
  element: ElementData | null;
  relationships: RelationshipData[];
  loading?: boolean;
  allArtworks: ArtworkData[];
  onClose: () => void;
  onTravel: (relationship: RelationshipData) => void;
}

export function MotifDrawer({
  element,
  relationships,
  loading = false,
  allArtworks,
  onClose,
  onTravel,
}: MotifDrawerProps) {
  if (!element) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 bottom-0 h-[48dvh] lg:top-0 lg:h-auto w-full lg:w-[460px] z-50 bg-stone-950/95 backdrop-blur-2xl border-t lg:border-l border-white/10 rounded-t-2xl lg:rounded-none flex flex-col shadow-2xl shadow-black overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="shrink-0 p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-widest font-sans font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {element.type}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-sans text-stone-400">
                CreativeDNA Element
              </span>
            </div>
            <h3 className="text-2xl font-serif text-white font-medium">
              {element.label}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close artwork detail"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Provenance Badge */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <span className="text-xs text-stone-400 font-sans">Provenance</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium bg-white/5 text-stone-200 border border-white/10">
              {element.meaning.sourceType === 'externally_verified'
                ? 'Externally Sourced'
                : element.meaning.sourceType === 'artist_declared'
                  ? 'Artist Declared'
                  : 'AI Inferred · Unverified'}
            </span>
          </div>

          {/* Meaning & Symbolism */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-amber-400/90 font-sans font-semibold mb-2">
              Cultural Meaning & Symbolism
            </h4>
            <p className="text-sm text-stone-200 font-serif leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">
              {element.meaning.text}
            </p>
          </div>

          {/* Technique & Materials */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-amber-400/90 font-sans font-semibold mb-2">
              Technique & Materials
            </h4>
            <p className="text-xs text-stone-300 font-sans leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">
              {element.technique}
            </p>
          </div>

          {/* Artistic Tradition Lineage */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-amber-400/90 font-sans font-semibold mb-2">
              Tradition & Context
            </h4>
            <p className="text-xs text-stone-400 font-sans leading-relaxed">
              {element.tradition}
            </p>
          </div>

          {/* Connected Artworks section */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs uppercase tracking-wider text-amber-400 font-sans font-semibold">
                Visual Comparisons
              </h4>
              <span className="text-[11px] font-sans px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-medium">
                {loading ? 'Loading…' : `${relationships.length} comparison${relationships.length === 1 ? '' : 's'}`}
              </span>
            </div>

            {loading ? (
              <p role="status" className="text-sm text-stone-300 font-sans">
                Loading visual comparisons…
              </p>
            ) : relationships.length === 0 ? (
              <p className="text-xs text-stone-400 font-sans italic">
                No visual comparisons defined for this element.
              </p>
            ) : (
              <div className="space-y-3">
                {relationships.map((rel) => {
                  const targetArt = allArtworks.find((a) => a.id === rel.targetArtworkId);

                  return (
                    <div
                      key={rel.id}
                      className="p-4 rounded-xl bg-stone-900/80 border border-white/10 hover:border-amber-400/50 transition-all flex flex-col gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        {targetArt && (
                          <img
                            src={targetArt.image.startsWith('/') ? targetArt.image : `/${targetArt.image}`}
                            alt={targetArt.title}
                            className="w-12 h-12 rounded-lg object-cover border border-white/10"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-serif text-sm text-white truncate group-hover:text-amber-200 transition-colors">
                            {targetArt?.title || rel.targetArtworkId}
                          </h5>
                          <p className="text-[11px] text-stone-400 font-sans truncate">
                            {targetArt?.creator} ({targetArt?.year})
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-stone-300 font-serif line-clamp-2 leading-relaxed italic">
                        "{rel.narrative}"
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[11px] font-sans text-stone-300">
                          Visual comparison · not historical verification
                        </span>
                        <button
                          onClick={() => onTravel(rel)}
                          className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs font-sans font-semibold tracking-wide shadow-md transition-colors flex items-center gap-1"
                        >
                          <span>Travel</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
