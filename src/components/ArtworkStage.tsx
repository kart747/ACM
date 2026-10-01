'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useExperience } from '@/lib/experience-state';
import { rectToPercentStyle } from '@/lib/rect';
import { clientToNormalizedPoint } from '@/lib/segmentation/geometry';
import { useMotifRegion, type MaskImages, type RegionStatus } from '@/lib/segmentation/context';
import type { NormalizedPoint } from '@/lib/segmentation/types';
import type { Artwork, Motif } from '@/lib/types';

interface Props {
  artwork: Artwork;
  enabled: boolean;
  /** `point` is where on the artwork the viewer clicked; null for keyboard activation. */
  onSelectMotif: (motifId: string, point: NormalizedPoint | null) => void;
  onDeselectMotif: () => void;
}

/**
 * The frame is sized in JS rather than with `aspect-ratio`, because a box with
 * only absolutely positioned children has no intrinsic size and would collapse.
 * We measure the available space and derive a `contain`-style box, which keeps
 * every hotspot percentage honest against the visible artwork.
 */
export function ArtworkStage({ artwork, enabled, onSelectMotif, onDeselectMotif }: Props) {
  const { selectedMotif } = useExperience();
  const { status, masks, backendLabel } = useMotifRegion();
  const traced = status === 'traced' && masks !== null;
  const fillRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  const ratio = artwork.image.width / artwork.image.height;

  useLayoutEffect(() => {
    const el = fillRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const width = Math.min(rect.width, rect.height * ratio);
      setBox({ width, height: width / ratio });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ratio, artwork.id]);

  return (
    <div
      ref={fillRef}
      data-stage-fill
      className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
    >
      <div
        data-artwork-frame={artwork.id}
        data-measure-frame={artwork.id}
        className="relative"
        style={{
          width: box.width,
          height: box.height,
          boxShadow: '0 40px 120px -30px rgba(0,0,0,0.9)',
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <motion.img
            key={artwork.id}
            src={artwork.image.src}
            alt={`${artwork.title} by ${artwork.creator.name}, ${artwork.date}`}
            width={artwork.image.width}
            height={artwork.image.height}
            initial={{ opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>

        {/* Living Spotlight: the selected motif is isolated by dimming everything
            outside it, and the motif itself gains a lift and a ring. The curated
            rectangle shows at once; a segmentation mask, when accepted, fades in
            over it and takes its place. */}
        <AnimatePresence>
          {selectedMotif && (
            <motion.div
              key={selectedMotif.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="pointer-events-none absolute inset-0 z-[5]"
              aria-hidden
            >
              <motion.div
                className="absolute"
                data-spotlight="rect"
                initial={false}
                animate={{ opacity: traced ? 0 : 1 }}
                transition={{ duration: 0.45 }}
                style={{
                  ...rectToPercentStyle(selectedMotif.rect),
                  borderRadius: selectedMotif.shape === 'ellipse' ? '50%' : '2px',
                  boxShadow:
                    '0 0 0 9999px rgba(4,4,5,0.7), 0 0 60px 10px var(--glow)',
                  border: '1px solid rgba(236,233,226,0.4)',
                }}
              />
              {masks && <MaskSpotlight artwork={artwork} masks={masks} visible={traced} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clicking bare canvas closes the panel. Below the hotspots so they win. */}
        {selectedMotif && enabled && (
          <button
            type="button"
            aria-label="Close motif detail"
            onClick={onDeselectMotif}
            className="absolute inset-0 z-10 cursor-zoom-out"
          />
        )}

        <ul className="absolute inset-0 z-20 list-none m-0 p-0">
          {artwork.motifs.map((motif) => (
            <li
              key={motif.id}
              className="absolute"
              style={rectToPercentStyle(motif.rect)}
            >
              <HotspotButton
                motif={motif}
                artwork={artwork}
                isSelected={selectedMotif?.id === motif.id}
                isDimmed={Boolean(selectedMotif) && selectedMotif?.id !== motif.id}
                enabled={enabled}
                onSelect={(point) => onSelectMotif(motif.id, point)}
              />
            </li>
          ))}
        </ul>

        {selectedMotif && enabled && <RegionStatusNote status={status} backendLabel={backendLabel} />}
      </div>
    </div>
  );
}

const maskImageStyle = (url: string): React.CSSProperties => ({
  maskImage: `url(${url})`,
  WebkitMaskImage: `url(${url})`,
  maskSize: '100% 100%',
  WebkitMaskSize: '100% 100%',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
});

/**
 * The mask form of the spotlight. The frame has the image's aspect ratio, so a
 * mask stretched to the frame lines up with the artwork pixel for pixel.
 */
function MaskSpotlight({ artwork, masks, visible }: { artwork: Artwork; masks: MaskImages; visible: boolean }) {
  return (
    <motion.div
      className="absolute inset-0"
      data-spotlight="mask"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(4,4,5,0.7)', ...maskImageStyle(masks.cutout) }} />
      {/* The filter sits on a wrapper so the glow is drawn around the masked shape, not clipped by it. */}
      <div
        className="absolute inset-0"
        style={{ filter: 'drop-shadow(0 0 1px rgba(236,233,226,0.6)) drop-shadow(0 0 22px var(--glow))' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${artwork.image.src})`,
            backgroundSize: '100% 100%',
            ...maskImageStyle(masks.cover),
          }}
        />
      </div>
    </motion.div>
  );
}

const STATUS_TEXT: Partial<Record<RegionStatus, (label: string) => string>> = {
  'loading-model': (label) => `Loading ${label} to trace this detail…`,
  segmenting: () => 'Tracing the detail…',
  traced: (label) => `Outline traced by ${label}`,
  fallback: () => 'Showing the curated region',
};

/** A quiet line on the frame so the viewer knows whether they see a traced outline. */
function RegionStatusNote({ status, backendLabel }: { status: RegionStatus; backendLabel: string | null }) {
  const text = STATUS_TEXT[status]?.(backendLabel ?? 'the model');
  return (
    <div role="status" aria-live="polite" className="pointer-events-none absolute bottom-2 left-2 z-[6]">
      <AnimatePresence mode="wait">
        {text && (
          <motion.p
            key={status}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            data-region-status={status}
            className="ui-sans m-0 rounded-sm bg-[#0b0b0c]/80 px-2 py-1 text-[10.5px] tracking-[0.04em] text-[#9a968d]"
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function HotspotButton({
  motif,
  artwork,
  isSelected,
  isDimmed,
  enabled,
  onSelect,
}: {
  motif: Motif;
  artwork: Artwork;
  isSelected: boolean;
  isDimmed: boolean;
  enabled: boolean;
  onSelect: (point: NormalizedPoint | null) => void;
}) {
  // Labels sit above the mark unless the motif is near the top edge.
  const labelBelow = motif.rect.y + motif.rect.h / 2 < 14;
  // Near the side edges, anchor the label inward so it stays on the artwork.
  const centerX = motif.rect.x + motif.rect.w / 2;
  const labelAlign =
    centerX < 18 ? 'left-[calc(50%-18px)]' : centerX > 82 ? 'right-[calc(50%-18px)]' : 'left-1/2 -translate-x-1/2';

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        // `detail` is 0 for keyboard activation, which has no meaningful position.
        const frame = event.currentTarget.closest('[data-artwork-frame]');
        const point =
          event.detail > 0 && frame
            ? clientToNormalizedPoint(frame.getBoundingClientRect(), event.clientX, event.clientY)
            : null;
        onSelect(point);
      }}
      disabled={!enabled}
      aria-pressed={isSelected}
      aria-label={`${motif.label}, in ${artwork.title}`}
      data-motif-id={motif.id}
      className={[
        'group absolute inset-0 transition-opacity duration-300',
        isDimmed ? 'opacity-60 hover:opacity-100' : 'opacity-100',
        enabled ? 'cursor-pointer' : 'cursor-default',
      ].join(' ')}
    >
      {/* 44px target so the mark is usable on touch screens. */}
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      >
        {!isSelected && !isDimmed && (
          <span className="hotspot-pulse absolute h-[22px] w-[22px] rounded-full border-2 border-[#ece9e2]" />
        )}
        <span
          className={[
            'relative flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 transition-transform duration-300 group-hover:scale-110 group-focus-visible:scale-110',
            isSelected ? 'scale-110 border-[#ece9e2] bg-[#c9a227]' : 'border-[#ece9e2] bg-[#0b0b0c]/70',
          ].join(' ')}
          style={{ boxShadow: '0 0 0 2px rgba(0,0,0,0.55), 0 2px 10px rgba(0,0,0,0.6)' }}
        >
          <span
            className={[
              'block h-[7px] w-[7px] rounded-full',
              isSelected ? 'bg-[#0b0b0c]' : 'bg-[#c9a227]',
            ].join(' ')}
          />
        </span>
      </span>
      <span
        className={[
          'ui-sans pointer-events-none absolute top-1/2 z-10 whitespace-nowrap rounded-sm bg-[#0b0b0c]/85 px-2 py-1 text-[11px] tracking-[0.04em] text-[#ece9e2] transition-opacity duration-200',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
          labelAlign,
          labelBelow ? 'translate-y-[20px]' : '-translate-y-[calc(100%+20px)]',
        ].join(' ')}
      >
        {motif.label}
      </span>
    </button>
  );
}
