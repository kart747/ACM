'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import type { ArtworkData, ElementData } from './types';
import { CulturalEvidence } from './CulturalEvidence';
import { ImageCredit } from './ImageCredit';
import { SourceRecord } from './SourceRecord';

interface ImmersiveStageProps {
  artwork: ArtworkData;
  elements: ElementData[];
  selectedElement: ElementData | null;
  onSelectElement: (element: ElementData) => void;
  onClearElement: () => void;
  onBackToGallery: () => void;
  onAnalyzeGemini: () => void;
  onStartStory?: () => void;
  storyActive?: boolean;
  focusedElement?: ElementData | null;
}

export function ImmersiveStage(props: ImmersiveStageProps) {
  const { artwork, onBackToGallery, onAnalyzeGemini } = props;
  const [imageReady, setImageReady] = useState(false);
  const hasPanel = props.selectedElement || props.storyActive;

  return (
    <div className={`min-h-[92vh] bg-stone-950 text-white pt-20 ${hasPanel ? 'pb-[56dvh] lg:pb-28 lg:pr-[460px]' : 'pb-28'}`}>
      <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-black/40">
        <div className="flex min-w-0 flex-col sm:flex-row items-start gap-4">
          <button onClick={onBackToGallery} className="shrink-0 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-stone-300 hover:bg-white/10">
            ← Back to Gallery
          </button>
          <div className="min-w-0">
            <h2 className="font-serif text-xl sm:text-2xl text-white">{artwork.title}</h2>
            <p className="mt-1 text-xs text-stone-400">{artwork.creator} · {artwork.year}</p>
            <p className="mt-1 text-xs text-stone-400">{artwork.tradition} · {artwork.region}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {props.onStartStory && <button onClick={props.onStartStory} disabled={!imageReady || props.storyActive} aria-label="Start guided story" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-medium text-black disabled:opacity-40">Step inside · guided story</button>}
          <button onClick={onAnalyzeGemini} className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs hover:bg-amber-500/25">
            Run Gemini Analysis
          </button>
        </div>
      </div>

      <ArtworkCanvas key={`${artwork.id}:${artwork.image}`} {...props} onImageStatusChange={setImageReady} />

      {artwork.imageCredit && (
        <div className="mx-auto max-w-3xl px-6 pb-4">
          <ImageCredit credit={artwork.imageCredit} photograph={artwork.sourceKind === 'photograph'} />
        </div>
      )}
      <div className="mx-auto max-w-3xl px-6">
        <CulturalEvidence key={artwork.id} claims={artwork.culturalClaims} />
      </div>
      <details className="mx-auto max-w-3xl px-6 py-4 text-sm text-stone-300">
        <summary className="cursor-pointer text-amber-300">About this artwork and its source</summary>
        <p className="mt-3 text-xs text-stone-400">{artwork.sourceType === 'ai_inferred' ? 'AI-assisted visual description · unverified interpretation' : artwork.sourceType === 'artist_declared' ? 'Artist-declared description' : 'Externally sourced description'}</p>
        <p className="mt-2 leading-relaxed">{artwork.description}</p>
        <p className="mt-3 text-xs text-stone-400">Catalog medium: {artwork.medium}</p>
        <p className="mt-2 text-xs text-stone-400">{artwork.rights}</p>
        <p className="mt-2 text-xs text-stone-400">{artwork.source}</p>
        <div className="mt-2"><SourceRecord artwork={artwork} /></div>
      </details>
    </div>
  );
}

function ArtworkCanvas({ artwork, elements, selectedElement, focusedElement, storyActive, onSelectElement, onClearElement, onImageStatusChange }: ImmersiveStageProps & { onImageStatusChange: (ready: boolean) => void }) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const maskId = useId().replace(/:/g, '');
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => setCanvasWidth(canvas.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);
  const markerScale = size && canvasWidth > 0 ? size.width / canvasWidth : 1;
  useEffect(() => {
    if (selectedElement && window.matchMedia?.('(max-width: 1023px)').matches) {
      canvasRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, [selectedElement?.id]);
  const activeElement = elements.find(e => e.id === selectedElement?.id)
    ?? elements.find(e => e.id === focusedElement?.id)
    ?? (storyActive ? undefined : elements.find(e => e.id === hoveredId));
  const points = (element: ElementData) => element.geometry.points.map(([x, y]) => `${x * (size?.width ?? 1)},${y * (size?.height ?? 1)}`).join(' ');

  return (
    <section aria-label={`Details in ${artwork.title}`} className="px-4 py-6 md:px-8">
      <div className="flex justify-center">
        <div
          ref={canvasRef}
          data-artwork-canvas={artwork.id}
          className={`relative max-w-5xl scroll-mt-24 overflow-hidden rounded-lg bg-black shadow-2xl ${selectedElement || storyActive ? 'w-[min(100%,var(--small-canvas))] lg:w-[min(100%,var(--large-canvas))]' : 'w-[min(100%,var(--large-canvas))]'}`}
          style={{
            '--large-canvas': size ? `${68 * size.width / size.height}dvh` : '100%',
            '--small-canvas': size ? `${34 * size.width / size.height}dvh` : '100%',
          } as CSSProperties}
        >
          <img
            src={artwork.image.startsWith('/') ? artwork.image : `/${artwork.image}`}
            alt={`${artwork.title} by ${artwork.creator}`}
            className="block h-auto w-full"
            onLoad={event => {
              const image = event.currentTarget;
              setSize({ width: image.naturalWidth, height: image.naturalHeight });
              setFailed(false);
              onImageStatusChange(true);
            }}
            onError={() => { setFailed(true); setSize(null); onImageStatusChange(false); }}
          />
          {size && !failed && (
            <svg
              data-artwork-overlay={artwork.id}
              viewBox={`0 0 ${size.width} ${size.height}`}
              className="absolute inset-0 h-full w-full"
              onClick={onClearElement}
              onMouseLeave={() => setHoveredId(null)}
              aria-label="Artwork detail regions"
            >
              {activeElement && (
                <>
                  <defs>
                    <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={size.width} height={size.height}>
                      <rect width={size.width} height={size.height} fill="white" />
                      <polygon points={points(activeElement)} fill="black" />
                    </mask>
                  </defs>
                  <rect data-mask-for={activeElement.id} width={size.width} height={size.height} fill="black" opacity="0.62" mask={`url(#${maskId})`} pointerEvents="none" />
                </>
              )}
              {elements.map((element, index) => {
                const active = activeElement?.id === element.id;
                const [x, y] = element.geometry.points[0];
                return (
                  <g key={element.id}>
                    <polygon
                      data-element-id={element.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select ${element.label}`}
                      aria-pressed={selectedElement?.id === element.id}
                      points={points(element)}
                      fill="transparent"
                      stroke={active ? '#fbbf24' : 'rgba(255,255,255,0.7)'}
                      strokeWidth={active ? 2 : 1}
                      strokeDasharray={active ? undefined : '4 4'}
                      vectorEffect="non-scaling-stroke"
                      className="cursor-pointer outline-none focus:stroke-amber-300"
                      onClick={event => { event.stopPropagation(); onSelectElement(element); }}
                      onMouseEnter={() => setHoveredId(element.id)}
                      onFocus={() => setHoveredId(element.id)}
                      onBlur={() => setHoveredId(null)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelectElement(element);
                        }
                        if (event.key === 'Escape') { setHoveredId(null); onClearElement(); }
                      }}
                    >
                      <title>{element.label}</title>
                    </polygon>
                    <g pointerEvents="none" aria-hidden="true" transform={`translate(${Math.max(12 * markerScale, Math.min(size.width - 12 * markerScale, x * size.width))},${Math.max(12 * markerScale, Math.min(size.height - 12 * markerScale, y * size.height))})`}>
                      <circle r={10 * markerScale} fill={active ? '#fbbf24' : '#292524'} stroke="#fbbf24" vectorEffect="non-scaling-stroke" />
                      <text textAnchor="middle" dominantBaseline="central" fill={active ? '#000' : '#fff'} fontSize={11 * markerScale}>{index + 1}</text>
                    </g>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>
      {failed && <p role="alert" className="mt-4 text-center text-sm text-amber-200">The artwork image could not load. Return to the gallery and try again.</p>}
      <p className="mt-4 text-center text-xs text-stone-400">Select a region or a detail below. These are hand-drawn guides, not exact object cutouts.</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2" aria-label="Choose an artwork detail">
        {elements.map((element, index) => (
          <button key={element.id} disabled={!size || failed} aria-pressed={selectedElement?.id === element.id} onClick={() => onSelectElement(element)} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-stone-200 hover:border-amber-400 aria-pressed:border-amber-400 aria-pressed:text-amber-300 disabled:opacity-40">
            {index + 1}. {element.label}
          </button>
        ))}
        {selectedElement && <button onClick={() => { setHoveredId(null); onClearElement(); }} className="px-3 py-2 text-xs text-amber-300 underline">Clear selection</button>}
      </div>
    </section>
  );
}
