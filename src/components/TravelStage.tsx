'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useExperience } from '@/lib/experience-state';
import { motifCropBackgroundStyle } from '@/lib/rect';
import { useMotifRegion } from '@/lib/segmentation/context';
import type { Artwork, Motif, NormalizedRect } from '@/lib/types';

const LIFT_MS = 260;
const FLIGHT_MS = 1400;

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Flight {
  fromBox: Box;
  toBox: Box;
  fromArtwork: Artwork;
  toArtwork: Artwork;
  fromMotif: Motif;
  toMotif: Motif;
  /** The source crop: the traced region when segmentation succeeded, else the curated rect. */
  fromRect: NormalizedRect;
}

/**
 * Measures a region's on-screen pixel box inside a laid-out frame.
 * The source artwork is live; the destination is computed from the same stage
 * area, so the destination frame does not need to exist yet.
 */
function measureRect(frame: DOMRect, ratio: number, rect: NormalizedRect): Box {
  const width = Math.min(frame.width, frame.height * ratio);
  const height = width / ratio;
  const left = frame.left + (frame.width - width) / 2;
  const top = frame.top + (frame.height - height) / 2;
  return {
    left: left + (rect.x / 100) * width,
    top: top + (rect.y / 100) * height,
    width: (rect.w / 100) * width,
    height: (rect.h / 100) * height,
  };
}

export function TravelStage({ stageRef }: { stageRef: React.RefObject<HTMLDivElement | null> }) {
  const { state, artwork, selectedMotif, artworks, dispatch } = useExperience();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [swapped, setSwapped] = useState(false);
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const startedFor = useRef<Flight | null>(null);

  // Read at lift-off only. A mask arriving mid-lift must not restart the flight.
  const { region } = useMotifRegion();
  const regionRef = useRef(region);
  regionRef.current = region;

  const destinationArtwork = artworks.find((a) => a.id === state.travel?.toArtworkId) ?? null;
  const destinationMotifId = state.travel?.toMotifId ?? null;

  // Measure on the way into `lifting`. The card does not exist yet at this
  // point, so measurement and animation are deliberately separate effects.
  useEffect(() => {
    if (state.travelPhase !== 'lifting') return;
    if (!selectedMotif || !destinationArtwork || !destinationMotifId) return;

    const fill = stageRef.current?.querySelector<HTMLElement>('[data-stage-fill]');
    if (!fill) return;

    const toMotif = destinationArtwork.motifs.find((m) => m.id === destinationMotifId);
    if (!toMotif) return;

    const area = fill.getBoundingClientRect();
    if (area.width === 0 || area.height === 0) return;

    const fromRect = regionRef.current?.rect ?? selectedMotif.rect;
    const fromBox = measureRect(area, artwork.image.width / artwork.image.height, fromRect);
    const toBox = measureRect(
      area,
      destinationArtwork.image.width / destinationArtwork.image.height,
      toMotif.rect,
    );

    setFlight({
      fromBox,
      toBox,
      fromArtwork: artwork,
      toArtwork: destinationArtwork,
      fromMotif: selectedMotif,
      toMotif,
      fromRect,
    });
    setSwapped(false);
  }, [
    state.travelPhase,
    destinationMotifId,
    selectedMotif,
    artwork,
    destinationArtwork,
    stageRef,
  ]);

  // Run the sequence once the card is mounted. This effect is keyed only on
  // `flight`: the phase dispatches it performs must not restart or tear down
  // the timeline that is already in progress.
  useEffect(() => {
    if (!flight || startedFor.current === flight) return;
    const card = cardRef.current;
    if (!card) return;
    startedFor.current = flight;

    const lift = reduceMotion ? 0.12 : LIFT_MS / 1000;
    const flightSeconds = reduceMotion ? 0.32 : FLIGHT_MS / 1000;
    const timers: number[] = [];
    const running: { stop: () => void }[] = [];

    // Lift: the source motif pulls slightly toward the viewer before leaving.
    running.push(
      animate(
        card,
        { scale: reduceMotion ? 1 : 1.1, rotate: reduceMotion ? 0 : -1.5 },
        { duration: lift, ease: [0.4, 0, 0.2, 1] },
      ),
    );

    timers.push(
      window.setTimeout(() => {
        dispatch({ type: 'travel-phase', phase: 'flying' });

        // Flight: the crop crosses the viewport. At the midpoint the card
        // switches from the source artwork to the destination artwork, so the
        // motif appears to survive the change of painting.
        running.push(
          animate(
            card,
            {
              left: [flight.fromBox.left, flight.toBox.left],
              top: [flight.fromBox.top, flight.toBox.top],
              width: [flight.fromBox.width, flight.toBox.width],
              height: [flight.fromBox.height, flight.toBox.height],
              rotate: 0,
              scale: 1,
            },
            {
              duration: flightSeconds,
              ease: [0.65, 0, 0.35, 1],
            },
          ),
        );

        // The artwork swap is scheduled rather than driven from onUpdate, which
        // only reports animated values and not the animation's progress.
        timers.push(window.setTimeout(() => setSwapped(true), flightSeconds * 500));

        timers.push(
          window.setTimeout(() => {
            dispatch({ type: 'travel-phase', phase: 'landing' });
            dispatch({ type: 'travel-complete' });
            setFlight(null);
            setSwapped(false);
          }, flightSeconds * 1000),
        );
      }, lift * 1000),
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      running.forEach((a) => a.stop());
    };
  }, [flight, dispatch, reduceMotion]);

  // Settle back to idle state if a travel is cancelled mid-flight.
  useEffect(() => {
    if (state.travelPhase !== 'idle') return;
    setFlight(null);
    setSwapped(false);
    startedFor.current = null;
  }, [state.travelPhase]);

  // Cancel is wired to Escape: stop everything and settle back on the source.
  useEffect(() => {
    if (state.travelPhase === 'idle') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch({ type: 'travel-cancel' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.travelPhase, dispatch]);

  const shownArtwork = flight ? (swapped ? flight.toArtwork : flight.fromArtwork) : null;
  const shownMotif = flight ? (swapped ? flight.toMotif : flight.fromMotif) : null;
  const shownRect = flight ? (swapped ? flight.toMotif.rect : flight.fromRect) : null;
  const travelling = state.travelPhase !== 'idle';

  return (
    <>
      {/* Caption crossfade: the motif name travels with the crop. */}
      {travelling && shownMotif && shownArtwork && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute inset-x-0 bottom-20 z-40 px-6 text-center md:bottom-24"
        >
          <p className="ui-sans m-0 text-[10px] uppercase tracking-[0.2em] text-[#6a675f]">
            {shownArtwork.title}
          </p>
          <p className="mt-2 mb-0 text-[15px] text-[#ece9e2]">
            <AnimatePresence mode="wait">
              <motion.span
                key={shownMotif.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
                className="inline-block"
              >
                {shownMotif.label}
              </motion.span>
            </AnimatePresence>
          </p>
        </motion.div>
      )}

      {/* The flying crop, in viewport pixels. */}
      {flight && (
        <div
          ref={cardRef}
          id="travel-card"
          aria-hidden
          className="pointer-events-none fixed z-50 overflow-hidden"
          style={{
            left: flight.fromBox.left,
            top: flight.fromBox.top,
            width: flight.fromBox.width,
            height: flight.fromBox.height,
            backgroundRepeat: 'no-repeat',
            ...(shownArtwork && shownRect ? motifCropBackgroundStyle(shownArtwork, shownRect) : {}),
            boxShadow:
              '0 30px 90px -20px rgba(0,0,0,0.95), 0 0 0 1px rgba(236,233,226,0.3)',
          }}
        />
      )}
    </>
  );
}
