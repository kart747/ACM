'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExperienceProvider, findArtwork, useExperience } from '@/lib/experience-state';
import { ArtworkStage } from '@/components/ArtworkStage';
import { CollectionRail } from '@/components/CollectionRail';
import { HotspotTuner } from '@/components/HotspotTuner';
import { MotifPanel } from '@/components/MotifPanel';
import { StepInside } from '@/components/StepInside';
import { TravelStage } from '@/components/TravelStage';
import { SegmentationProvider } from '@/lib/segmentation/context';
import { YourPath } from '@/components/YourPath';

const TUNER_ENABLED = process.env.NODE_ENV !== 'production';

export default function ClassicPage() {
  return (
    <ExperienceProvider>
      <SegmentationProvider>
        <Experience />
      </SegmentationProvider>
    </ExperienceProvider>
  );
}

function Experience() {
  const { state, artwork, dispatch } = useExperience();
  const stageRef = useRef<HTMLDivElement>(null);

  const travelling = state.travelPhase !== 'idle';

  // `d` toggles the coordinate tuner in development; Escape closes the panel.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (TUNER_ENABLED && (event.key === 'd' || event.key === 'D')) {
        dispatch({ type: 'toggle-tuner' });
      }
      // The path card handles its own Escape.
      if (event.key === 'Escape' && !travelling && !state.showPath) {
        dispatch({ type: 'clear-motif' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, travelling, state.showPath]);

  // The accent follows the artwork so the chrome never fights the painting.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--glow', artwork.image.glow);
    return () => {
      root.style.removeProperty('--glow');
    };
  }, [artwork.id, artwork.image.glow]);

  // The experience is laid out underneath the overlays from the start, so the
  // opening can hand its painting to the stage frame it measures.
  const covered = !state.entered || state.showPath;

  return (
    <>
      <main
        inert={covered}
        data-pre-entry={state.entered ? undefined : ''}
        className="flex h-dvh w-full flex-col overflow-hidden md:flex-row"
      >
        <div ref={stageRef} className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <Header />

          <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-3 md:px-8 md:pb-4">
            <ArtworkStage
              artwork={artwork}
              enabled={!travelling}
              onSelectMotif={(motifId, point) => dispatch({ type: 'select-motif', motifId, point })}
              onDeselectMotif={() => dispatch({ type: 'clear-motif' })}
            />
            {TUNER_ENABLED && <HotspotTuner />}
            <ArrivalBanner />
          </div>

          <CollectionRail
            enabled={!travelling}
            onSelectArtwork={(artworkId) => dispatch({ type: 'select-artwork', artworkId })}
          />

          <TravelStage stageRef={stageRef} />
        </div>

        <MotifPanel enabled={!travelling} onTravel={() => dispatch({ type: 'travel-start' })} />
      </main>
      <AnimatePresence>{!state.entered && <StepInside key="step-inside" />}</AnimatePresence>
      <YourPath />
    </>
  );
}

function Header() {
  const { artwork } = useExperience();

  return (
    <header className="ui-sans pointer-events-none relative z-20 flex shrink-0 items-baseline justify-between gap-6 px-4 py-3 md:px-8 md:py-4">
      <div className="min-w-0">
        <h1 className="m-0 text-[13px] uppercase tracking-[0.28em] text-[#ece9e2]">Artscape</h1>
        <p className="mt-1 mb-0 hidden text-[11px] text-[#6a675f] sm:block">
          Step inside the relationships that make art meaningful
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={artwork.id}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0 text-right"
        >
          <p className="m-0 truncate text-[13px] text-[#ece9e2]">{artwork.title}</p>
          <p className="mt-1 mb-0 truncate text-[11px] text-[#8a867d]">
            {artwork.creator.name}, {artwork.date}
          </p>
        </motion.div>
      </AnimatePresence>
    </header>
  );
}

/** After each journey, introduce the creator the viewer has just reached. */
function ArrivalBanner() {
  const { state } = useExperience();
  const [shownFor, setShownFor] = useState<number | null>(null);
  const count = state.trail.length;
  const last = state.trail[count - 1];

  useEffect(() => {
    if (count === 0) return;
    setShownFor(count);
    const timer = window.setTimeout(() => setShownFor(null), 3600);
    return () => window.clearTimeout(timer);
  }, [count]);

  const artwork = last ? findArtwork(last.toArtworkId) : null;
  const visible = shownFor === count && artwork && state.travelPhase === 'idle';

  return (
    <AnimatePresence>
      {visible && artwork && (
        <motion.div
          key={count}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          className="ui-sans pointer-events-none absolute inset-x-0 top-1 z-30 flex justify-center px-4 md:top-auto md:bottom-5"
        >
          <div className="border border-[#3a3a3f] bg-[#0b0b0c]/90 px-4 py-2 text-center backdrop-blur md:px-5 md:py-3">
            <p className="m-0 text-[10px] uppercase tracking-[0.2em] text-[#c9a227]">You have reached</p>
            <p className="mt-1 mb-0 text-[14px] text-[#ece9e2] md:mt-1.5 md:text-[16px]">{artwork.creator.name}</p>
            <p className="mt-0.5 mb-0 hidden text-[11.5px] text-[#8a867d] sm:block">{artwork.creator.metBio}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
