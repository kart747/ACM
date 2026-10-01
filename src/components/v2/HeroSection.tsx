'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  onExplore: () => void;
}

export function HeroSection({ onExplore }: HeroSectionProps) {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 pt-24 pb-12 overflow-hidden">
      {/* Background ambient radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-amber-500/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-900/15 rounded-full blur-2xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl z-10 flex flex-col items-center"
      >
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs uppercase tracking-widest font-sans font-medium text-amber-300">
            ACM × MLH Hack Days 2026 • Art Beyond Boundaries
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-light tracking-tight leading-[1.05] text-white mb-6">
          <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-100">
            The Motif
          </span>{' '}
          Travels
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-stone-300 max-w-2xl font-light leading-relaxed mb-10">
          Explore artworks and compare selected motifs across the collection. Visual similarities invite closer looking; they do not establish historical influence or transmission.
        </p>

        {/* Call to action buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onExplore}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-sans font-semibold tracking-wide shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Explore the Collection →
          </button>
          <a
            href="#concept"
            className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/15 font-sans font-medium text-sm transition-all"
          >
            How CreativeDNA Works
          </a>
        </div>

        {/* Key Features row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left w-full border-t border-white/10 pt-10">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-amber-400 font-serif text-lg mb-1">01. Step Inside</div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Explore selected details in artwork reproductions with motif spotlights.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-amber-400 font-serif text-lg mb-1">02. Cross Boundaries</div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Compare motifs and compositions across the traditions represented in the current collection.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-amber-400 font-serif text-lg mb-1">03. Grounded Evidence</div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Consult linked source records and clearly labeled interpretations. Optional Gemini checks offer a single text-only assessment, not historical verification.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
