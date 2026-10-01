'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { featuredStart } from '@/data/artworks';
import { useExperience } from '@/lib/experience-state';
import type { Artwork } from '@/lib/types';

const ENTER_MS = 1100;
const ease = [0.65, 0, 0.35, 1] as const;

interface Handoff {
  x: number;
  y: number;
  scale: number;
}

/**
 * The opening screen (spec §14): the first artwork full screen, minimal UI,
 * and one action. On "Step Inside" the painting glides onto the stage's frame
 * underneath while everything else fades, so the experience assembles around
 * the same painting instead of cutting to a new page.
 */
export function StepInside() {
  const { artwork, dispatch } = useExperience();
  const reduceMotion = useReducedMotion();
  const fillRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [leaving, setLeaving] = useState<Handoff | 'fade' | null>(null);

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
  }, [ratio]);

  const stepInside = () => {
    if (leaving) return;
    const from = frameRef.current?.getBoundingClientRect();
    const to = document
      .querySelector<HTMLElement>(`[data-artwork-frame="${artwork.id}"]`)
      ?.getBoundingClientRect();

    // Centres from live rects; scale from the untransformed width, so a click
    // during the intro zoom still lands exactly on the stage frame.
    if (!reduceMotion && from && to && box.width > 0 && to.width > 0) {
      setLeaving({
        x: to.left + to.width / 2 - (from.left + from.width / 2),
        y: to.top + to.height / 2 - (from.top + from.height / 2),
        scale: to.width / box.width,
      });
      window.setTimeout(() => dispatch({ type: 'enter' }), ENTER_MS);
    } else {
      // Reduced motion, or no stage frame to land on: enter now and let the
      // exit crossfade reveal the stage.
      setLeaving('fade');
      dispatch({ type: 'enter' });
    }
  };

  const handoff = leaving && leaving !== 'fade' ? leaving : null;
  const seconds = ENTER_MS / 1000;

  return (
    <motion.section
      aria-label="Welcome to ARTSCAPE"
      className="fixed inset-0 z-[70] flex flex-col"
      style={{ pointerEvents: leaving ? 'none' : undefined }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
    >
      {/* Backdrop: the painting's own colour, blurred, so the frame never floats on flat black. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 overflow-hidden bg-[#050506]"
        animate={{ opacity: handoff ? 0 : 1 }}
        transition={{ duration: seconds * 0.8, ease: 'easeOut' }}
      >
        <div
          className="absolute -inset-10 scale-110 opacity-30 blur-3xl"
          style={{
            backgroundImage: `url(${artwork.image.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(5,5,6,0.85)_100%)]" />
      </motion.div>

      <Chrome leaving={Boolean(leaving)} className="relative flex shrink-0 items-baseline justify-between gap-6 px-4 py-4 md:px-8 md:py-5">
        <p className="ui-sans m-0 text-[13px] uppercase tracking-[0.28em] text-[#ece9e2]">Artscape</p>
        <p className="ui-sans m-0 hidden truncate text-right text-[11px] text-[#8a867d] sm:block">
          The Metropolitan Museum of Art · Open Access
        </p>
      </Chrome>

      <div ref={fillRef} className="relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-8">
        <motion.div
          ref={frameRef}
          className="relative"
          style={{ width: box.width, height: box.height }}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
          animate={
            handoff
              ? { opacity: 1, x: handoff.x, y: handoff.y, scale: handoff.scale }
              : { opacity: 1, x: 0, y: 0, scale: 1 }
          }
          transition={{ duration: handoff ? seconds : 1.2, ease: handoff ? ease : [0.22, 1, 0.36, 1] }}
        >
          <img
            src={artwork.image.src}
            alt={`${artwork.title} by ${artwork.creator.name}, ${artwork.date}`}
            width={artwork.image.width}
            height={artwork.image.height}
            className="block h-full w-full object-cover"
            style={{ boxShadow: '0 40px 120px -30px rgba(0,0,0,0.9)' }}
            draggable={false}
          />
          <Markers artwork={artwork} hidden={Boolean(leaving)} />
        </motion.div>
      </div>

      <Chrome leaving={Boolean(leaving)} className="relative flex shrink-0 flex-col items-center px-4 pb-8 pt-5 text-center md:pb-10 md:pt-6">
        <p className="ui-sans m-0 text-[11px] text-[#8a867d]">
          {artwork.creator.name} · {artwork.title}, {artwork.date}
        </p>
        <h2 className="mt-3 mb-0 max-w-[22ch] text-[clamp(22px,3.4vw,34px)] font-normal leading-[1.2] text-[#ece9e2] md:max-w-none">
          Step inside the relationships that make art meaningful
        </h2>
        <p className="ui-sans mt-2.5 mb-0 max-w-[46ch] text-[12.5px] leading-[1.6] text-[#9a968d]">
          Five human-made works. Choose a detail, and follow it into the next painting.
        </p>
        <button
          type="button"
          autoFocus
          onClick={stepInside}
          disabled={Boolean(leaving)}
          className="ui-sans group mt-6 flex items-center gap-4 border border-[#c9a227]/70 bg-[#c9a227]/10 px-7 py-3.5 text-[13px] uppercase tracking-[0.24em] text-[#ece9e2] transition-colors hover:border-[#c9a227] hover:bg-[#c9a227]/20"
        >
          Step Inside
          <span aria-hidden className="text-[#c9a227] transition-transform duration-300 group-hover:translate-x-1">
            &rarr;
          </span>
        </button>
      </Chrome>
    </motion.section>
  );
}

function Chrome({
  leaving,
  className,
  children,
}: {
  leaving: boolean;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: leaving ? 0.25 : 0.6, delay: leaving ? 0 : 0.35 }}
    >
      {children}
    </motion.div>
  );
}

/** Decorative preview of the details waiting inside; the real markers live on the stage. */
function Markers({ artwork, hidden }: { artwork: Artwork; hidden: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: hidden ? 0 : 1 }}
      transition={{ duration: hidden ? 0.2 : 0.6, delay: hidden ? 0 : 0.9 }}
    >
      {artwork.motifs.map((motif) => {
        const featured = artwork.id === featuredStart.artworkId && motif.id === featuredStart.motifId;
        return (
          <span
            key={motif.id}
            className="absolute flex h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={{ left: `${motif.rect.x + motif.rect.w / 2}%`, top: `${motif.rect.y + motif.rect.h / 2}%` }}
          >
            <span className="hotspot-pulse absolute h-[22px] w-[22px] rounded-full border-2 border-[#ece9e2]" />
            <span
              className={[
                'relative flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-[#ece9e2]',
                featured ? 'bg-[#c9a227]' : 'bg-[#0b0b0c]/70',
              ].join(' ')}
              style={{ boxShadow: '0 0 0 2px rgba(0,0,0,0.55), 0 2px 10px rgba(0,0,0,0.6)' }}
            >
              <span className={['block h-[7px] w-[7px] rounded-full', featured ? 'bg-[#0b0b0c]' : 'bg-[#c9a227]'].join(' ')} />
            </span>
          </span>
        );
      })}
    </motion.div>
  );
}
