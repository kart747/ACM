'use client';

import { useId, useState } from 'react';
import type { Claim, SourceType } from '@/lib/types';

export const PROVENANCE: Record<SourceType, { mark: string; label: string; className: string }> = {
  artist_declared: {
    mark: '✓',
    label: 'Artist',
    className: 'border-[#d9b25c]/60 text-[#e6c77f]',
  },
  externally_verified: {
    mark: '✓',
    label: 'Verified',
    className: 'border-[#7fae8a]/60 text-[#9fd0aa]',
  },
  ai_inferred: {
    mark: '◇',
    label: 'AI interpretation',
    className: 'border-dashed border-[#9a968d]/60 text-[#b9b4aa]',
  },
};

export function confidenceWord(confidence: number): string {
  if (confidence >= 0.75) return 'high';
  if (confidence >= 0.5) return 'moderate';
  return 'low';
}

/**
 * Compact provenance chip. Pressing it reveals where the claim comes from and,
 * for AI interpretations, how confident the interpretation is. When multi-run
 * agreement was measured, the chip shows that rather than the model's
 * self-reported confidence.
 */
export function ProvenanceBadge({ claim, showConfidence = false }: { claim: Claim; showConfidence?: boolean }) {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  const kind = PROVENANCE[claim.sourceType];
  const hasConfidence = claim.sourceType === 'ai_inferred' && typeof claim.confidence === 'number';
  const agreement = claim.sourceType === 'ai_inferred' ? claim.agreement : undefined;

  return (
    <span className="inline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={detailId}
        data-origin={claim.origin ?? 'curated'}
        className={[
          'ui-sans ml-1.5 inline-flex translate-y-[-1px] items-center gap-1 whitespace-nowrap rounded-full border px-2 py-[1px] align-middle text-[10.5px] leading-[16px] transition-colors hover:bg-white/5',
          kind.className,
        ].join(' ')}
      >
        <span aria-hidden>{kind.mark}</span>
        {kind.label}
        {showConfidence && agreement && (
          <span className="text-[#8a867d]">
            · {agreement.agreeing}/{agreement.runs} runs agree
          </span>
        )}
        {showConfidence && !agreement && hasConfidence && (
          <span className="text-[#8a867d]">· {claim.confidence!.toFixed(2)}</span>
        )}
      </button>
      {open && (
        <span
          id={detailId}
          className="ui-sans mt-2 block border-l border-[#3a3a3f] pl-3 text-[11.5px] leading-[1.55] text-[#8a867d]"
        >
          <span className="block uppercase tracking-[0.16em] text-[10px] text-[#6a675f]">Source</span>
          <span className="block">{claim.sourceDetail}</span>
          {agreement && (
            <span className="mt-1 block">
              {agreement.agreeing} of {agreement.runs} independent Gemini runs concluded the images support this
              relationship. A measure of consistency, not of truth.
            </span>
          )}
          {hasConfidence && (
            <span className="mt-1 block">
              Confidence {claim.confidence!.toFixed(2)} ({confidenceWord(claim.confidence!)}).{' '}
              {claim.origin === 'gemini'
                ? 'Gemini’s own estimate of how well the images support this, not a measured probability.'
                : 'A hand-assigned estimate, not a measured probability.'}{' '}
              An interpretation, not an established fact.
            </span>
          )}
        </span>
      )}
    </span>
  );
}

/** A sentence followed by its provenance chip. */
export function ClaimText({
  claim,
  className,
  showConfidence,
}: {
  claim: Claim;
  className?: string;
  showConfidence?: boolean;
}) {
  return (
    <p className={className}>
      {claim.text}
      <ProvenanceBadge claim={claim} showConfidence={showConfidence} />
    </p>
  );
}

export function ProvenanceLegend() {
  return (
    <ul className="ui-sans m-0 flex list-none flex-wrap gap-x-3 gap-y-1.5 p-0 text-[11px] text-[#6a675f]">
      {(Object.keys(PROVENANCE) as SourceType[]).map((type) => (
        <li key={type} className="flex items-center gap-1.5">
          <span
            className={[
              'inline-flex items-center gap-1 rounded-full border px-2 py-[1px] text-[10.5px]',
              PROVENANCE[type].className,
            ].join(' ')}
          >
            <span aria-hidden>{PROVENANCE[type].mark}</span>
            {PROVENANCE[type].label}
          </span>
          <span>
            {type === 'artist_declared'
              ? 'what the artist said'
              : type === 'externally_verified'
                ? 'museum record'
                : 'inferred, hedged'}
          </span>
        </li>
      ))}
    </ul>
  );
}
