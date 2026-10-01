'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ArtworkData, ElementData } from './types';

interface ImmersiveStageProps {
  artwork: ArtworkData;
  elements: ElementData[];
  selectedElement: ElementData | null;
  onSelectElement: (element: ElementData) => void;
  onBackToGallery: () => void;
  onAnalyzeGemini: () => void;
}

export function ImmersiveStage({
  artwork,
  elements,
  selectedElement,
  onSelectElement,
  onBackToGallery,
  onAnalyzeGemini,
}: ImmersiveStageProps) {
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

  const activeElement = selectedElement || elements.find(e => e.id === hoveredElementId);

  // Helper to convert normalized 0-1 points to SVG polygon points string (viewbox 0 0 1000 1000)
  const toSvgPoints = (points: [number, number][]) => {
    return points.map(([x, y]) => `${x * 1000},${y * 1000}`).join(' ');
  };

  return (
    <div className="relative min-h-[92vh] flex flex-col bg-stone-950 text-white overflow-hidden pt-20">
      {/* Top Header Bar */}
      <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-black/40 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToGallery}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-sans text-stone-300 transition-colors"
          >
            <span>←</span>
            <span>Back to Gallery</span>
          </button>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl text-white flex items-center gap-3">
              <span>{artwork.title}</span>
              <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {artwork.year}
              </span>
            </h2>
            <p className="text-xs text-stone-400 font-sans mt-0.5">
              {artwork.creator} • {artwork.tradition} ({artwork.region})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onAnalyzeGemini}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-sans font-medium transition-all shadow-lg shadow-amber-500/10"
          >
            <span>✨</span>
            <span>Run Gemini Analysis</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden select-none">
        {/* Frame container */}
        <div className="relative max-w-5xl max-h-[75vh] w-full rounded-2xl overflow-hidden shadow-2xl shadow-black border border-white/10 bg-black flex items-center justify-center">
          {/* Base Artwork Image */}
          <img
            src={artwork.image.startsWith('/') ? artwork.image : `/${artwork.image}`}
            alt={artwork.title}
            className="w-full h-full max-h-[75vh] object-contain transition-all duration-500"
            style={{
              filter: activeElement ? 'brightness(0.5) saturate(0.8)' : 'brightness(1) saturate(1)',
            }}
          />

          {/* Interactive SVG Overlay with viewbox 0 0 1000 1000 */}
          <svg
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-auto"
          >
            <defs>
              {/* Glowing filter */}
              <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Polygon paths for each element */}
            {elements.map((elem) => {
              const isSelected = selectedElement?.id === elem.id;
              const isHovered = hoveredElementId === elem.id;
              const isActive = isSelected || isHovered;

              return (
                <g key={elem.id}>
                  {/* Interactive Hotspot Polygon */}
                  <polygon
                    points={toSvgPoints(elem.geometry.points)}
                    onClick={() => onSelectElement(elem)}
                    onMouseEnter={() => setHoveredElementId(elem.id)}
                    onMouseLeave={() => setHoveredElementId(null)}
                    className="cursor-pointer transition-all duration-300"
                    fill={isActive ? 'rgba(201, 162, 39, 0.28)' : 'rgba(255, 255, 255, 0.03)'}
                    stroke={isActive ? '#fbbf24' : 'rgba(255, 255, 255, 0.4)'}
                    strokeWidth={isActive ? 4 : 1.5}
                    strokeDasharray={isActive ? 'none' : '4 4'}
                    filter={isActive ? 'url(#glow-gold)' : undefined}
                  />

                  {/* Pulsing center dot & label on hover/idle */}
                  {elem.geometry.points.length > 0 && (
                    <g
                      transform={`translate(${elem.geometry.points[0][0] * 1000}, ${elem.geometry.points[0][1] * 1000})`}
                      className="pointer-events-none"
                    >
                      <circle
                        r={isActive ? 8 : 5}
                        fill="#fbbf24"
                        className={isActive ? 'animate-pulse' : 'opacity-70'}
                      />
                      <text
                        x={12}
                        y={4}
                        fill="#ffffff"
                        fontSize={20}
                        fontWeight="600"
                        fontFamily="ui-sans-serif, system-ui"
                        className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                      >
                        {elem.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Ambient instruction hint banner */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/70 border border-white/10 backdrop-blur-md text-xs font-sans text-stone-300 pointer-events-none flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Click on highlighted motifs to inspect CreativeDNA and follow where they travel</span>
        </div>
      </div>
    </div>
  );
}
