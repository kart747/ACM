'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ArtworkData } from './types';

interface GalleryViewProps {
  artworks: ArtworkData[];
  onSelectArtwork: (artwork: ArtworkData) => void;
}

export function GalleryView({ artworks, onSelectArtwork }: GalleryViewProps) {
  const [filter, setFilter] = useState<string>('all');

  const traditions = [...new Set(artworks.map((artwork) => artwork.tradition))];
  const activeFilter = traditions.includes(filter) ? filter : 'all';
  const filtered = activeFilter === 'all'
    ? artworks
    : artworks.filter((artwork) => artwork.tradition === activeFilter);

  return (
    <section id="gallery" className="max-w-7xl mx-auto px-6 py-16">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/10 pb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-400 font-sans font-semibold mb-2">
            The Corpus
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-white">
            Curated Masterpieces
          </h2>
          <p className="text-sm text-stone-400 mt-1 max-w-lg">
            {artworks.length} human-made artworks with sourced records, visual comparisons, and prepared stories that work without Gemini.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {['all', ...traditions].map((tag) => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans tracking-wide transition-all ${
                activeFilter === tag
                  ? 'bg-amber-400 text-black font-semibold shadow-md shadow-amber-400/20' 
                  : 'bg-white/5 hover:bg-white/10 text-stone-300 border border-white/5'
              }`}
            >
              {tag === 'all' ? 'All Traditions' : tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Artwork Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((artwork, idx) => (
          <motion.div
            key={artwork.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.08 }}
            className="group relative rounded-2xl bg-stone-900/60 border border-white/10 overflow-hidden hover:border-amber-400/50 transition-all duration-300 flex flex-col shadow-xl hover:shadow-2xl hover:shadow-amber-500/10"
          >
            {/* Image Container with Ambient Overlay */}
            <div 
              onClick={() => onSelectArtwork(artwork)}
              className="relative aspect-[4/3] overflow-hidden cursor-pointer bg-black/60"
            >
              <img
                src={artwork.image.startsWith('/') ? artwork.image : `/${artwork.image}`}
                alt={artwork.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

              {/* Provenance Badge Pill */}
              <div className="absolute top-3 left-3">
                {artwork.sourceType === 'externally_verified' ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-sans font-medium tracking-wide uppercase bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 backdrop-blur-md">
                    Externally sourced description
                  </span>
                ) : artwork.sourceType === 'artist_declared' ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-sans font-medium tracking-wide uppercase bg-amber-500/20 border border-amber-500/40 text-amber-300 backdrop-blur-md">
                    Artist-declared description
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-sans font-medium tracking-wide uppercase bg-violet-500/20 border border-violet-500/40 text-violet-200 backdrop-blur-md">
                    Description: AI interpretation
                  </span>
                )}
              </div>

              {/* Step Inside Hover Overlay Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                <span className="px-5 py-2.5 rounded-xl bg-amber-400 text-black font-sans font-semibold text-xs tracking-wider uppercase shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  Step Inside Canvas →
                </span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6 flex flex-col flex-1 justify-between bg-stone-950/60">
              <div>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-xs uppercase tracking-wider text-amber-400 font-sans font-medium">
                    {artwork.tradition}
                  </span>
                  <span className="text-xs text-stone-400 font-sans">
                    {artwork.year}
                  </span>
                </div>

                <h3 
                  onClick={() => onSelectArtwork(artwork)}
                  className="font-serif text-xl text-white group-hover:text-amber-200 transition-colors cursor-pointer mb-2"
                >
                  {artwork.title}
                </h3>

                <p className="text-xs text-stone-300 font-sans mb-3">
                  <span className="text-stone-400">Creator:</span> {artwork.creator} • {artwork.region}
                </p>

                <p className="text-xs text-stone-400 font-sans line-clamp-2 leading-relaxed">
                  {artwork.description}
                </p>
              </div>

              {/* Action Footer */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                {'sourceUrl' in artwork && typeof artwork.sourceUrl === 'string' && /^https?:\/\//i.test(artwork.sourceUrl) ? (
                  <a
                    href={artwork.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-amber-300 underline hover:text-amber-200 max-w-[200px]"
                    title={artwork.source}
                  >
                    Museum record ↗
                  </a>
                ) : (
                  <span className="text-[11px] text-stone-400 max-w-[200px]" title={artwork.source}>
                    {artwork.source}
                  </span>
                )}
                <button
                  onClick={() => onSelectArtwork(artwork)}
                  className="text-xs font-sans font-semibold text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1"
                >
                  <span>Explore</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
