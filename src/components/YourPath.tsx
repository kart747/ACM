'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useExperience } from '@/lib/experience-state';
import { buildJourneyPath, type PathLeg, type PathStop } from '@/lib/journey';
import { RELATIONSHIP_LABEL } from './MotifPanel';

const eyebrow = 'm-0 text-[10px] uppercase tracking-[0.18em] text-[#6a675f]';

/**
 * End-of-journey card: the route actually travelled, stop by stop, with the
 * details followed and how each pair is related. Every stop is a way back.
 */
export function YourPath() {
  const { state, dispatch } = useExperience();
  const reduceMotion = useReducedMotion();
  const open = state.showPath && state.travelPhase === 'idle';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="your-path"
          className="ui-sans fixed inset-0 z-[60] flex items-center justify-center bg-[#050506]/75 px-4 py-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.35, delay: reduceMotion ? 0 : 0.45 }}
          onClick={(event) => {
            if (event.target === event.currentTarget) dispatch({ type: 'close-path' });
          }}
        >
          <motion.div
            initial={reduceMotion ? false : { y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 8, opacity: 0 }}
            transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[520px]"
          >
            <PathCard />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PathCard() {
  const { state, artworks, dispatch } = useExperience();
  const dialogRef = useRef<HTMLDivElement>(null);
  const path = buildJourneyPath(state.trail, artworks);
  const followed = path.legs.filter((leg) => leg.continuous).length;

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch({ type: 'close-path' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="your-path-title"
      tabIndex={-1}
      // Focus lands on the dialog itself for screen readers; the global focus ring would frame the whole card.
      style={{ outline: 'none' }}
      className="flex max-h-[calc(100dvh-32px)] flex-col border border-[#3a3a3f] bg-[#0b0b0c] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)]"
    >
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#1c1c1f] px-5 pb-4 pt-5 md:px-6">
        <div className="min-w-0">
          <p className="m-0 text-[10px] uppercase tracking-[0.2em] text-[#c9a227]">Journey complete</p>
          <h2 id="your-path-title" className="mt-1.5 mb-0 font-serif text-[22px] font-normal leading-snug text-[#ece9e2]">
            Your path
          </h2>
          <p className="mt-1 mb-0 text-[12px] text-[#8a867d]">
            {path.visitedArtworkIds.length} works · {followed} {followed === 1 ? 'relationship' : 'relationships'}{' '}
            followed
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'close-path' })}
          aria-label="Close your path"
          className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center text-[20px] leading-none text-[#6a675f] transition-colors hover:text-[#ece9e2]"
        >
          &times;
        </button>
      </div>

      <ol aria-label="Route travelled" className="m-0 min-h-0 flex-1 list-none overflow-y-auto px-5 py-4 md:px-6">
        {path.stops.map((stop, index) => (
          <li key={`${index}/${stop.artwork.id}`}>
            <Stop stop={stop} isLast={index === path.stops.length - 1} />
            {path.legs[index] && <Leg leg={path.legs[index]} />}
          </li>
        ))}
      </ol>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#26262a] bg-[#0e0e10] px-5 py-4 sm:flex-row sm:justify-between md:px-6">
        <button
          type="button"
          onClick={() => dispatch({ type: 'restart' })}
          className="px-1 py-2 text-left text-[12.5px] text-[#9a968d] underline underline-offset-4 transition-colors hover:text-[#ece9e2]"
        >
          Begin a new journey
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'close-path' })}
          className="flex items-center justify-between gap-6 border border-[#c9a227]/70 bg-[#c9a227]/10 px-4 py-2.5 text-[13px] text-[#ece9e2] transition-colors hover:border-[#c9a227] hover:bg-[#c9a227]/20"
        >
          Keep exploring
          <span aria-hidden className="text-[#c9a227]">
            &rarr;
          </span>
        </button>
      </div>
    </div>
  );
}

function Stop({ stop, isLast }: { stop: PathStop; isLast: boolean }) {
  const { dispatch } = useExperience();
  const { artwork, motif } = stop;

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'visit', artworkId: artwork.id, motifId: motif.id })}
      title={`Return to ${motif.label} in ${artwork.title}`}
      className="group flex w-full items-center gap-3.5 py-1.5 text-left"
    >
      <span
        aria-hidden
        className={[
          'block h-11 w-11 shrink-0 border transition-colors',
          isLast ? 'border-[#c9a227]' : 'border-[#3a3a3f] group-hover:border-[#9a968d]',
        ].join(' ')}
        style={{
          backgroundImage: `url(${artwork.image.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-serif text-[16px] text-[#ece9e2]">{artwork.creator.name}</span>
        <span className="mt-0.5 block truncate text-[11.5px] text-[#8a867d]">
          {artwork.title}, {artwork.date}
        </span>
      </span>
      <span className="shrink-0 text-[10.5px] uppercase tracking-[0.14em] text-[#55524b] transition-colors group-hover:text-[#c9a227] group-focus-visible:text-[#c9a227]">
        Return
      </span>
    </button>
  );
}

function Leg({ leg }: { leg: PathLeg }) {
  return (
    <div
      className={[
        'ml-[21px] border-l py-2 pl-[26px]',
        leg.continuous ? 'border-[#c9a227]/50' : 'border-dashed border-[#3a3a3f]',
      ].join(' ')}
    >
      {leg.continuous ? (
        <>
          {leg.relationshipType && (
            <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-[#c9a227]">
              {RELATIONSHIP_LABEL[leg.relationshipType]}
            </p>
          )}
          <p className="mt-1 mb-0 text-[12px] leading-[1.5] text-[#9a968d]">
            {leg.fromMotif.label} <span aria-label="to">→</span> {leg.toMotif.label}
          </p>
        </>
      ) : (
        <p className={eyebrow}>You picked up the journey here</p>
      )}
    </div>
  );
}
