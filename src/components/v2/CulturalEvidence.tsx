import { CULTURAL_LABELS, type CulturalClaim, type CulturalTier } from '@/lib/artwork-sources';

const TIER_LIMITS: Record<CulturalTier, string> = {
  verified: 'Verification applies to this claim only, not to every interpretation of the artwork.',
  documented: 'Documented in the cited source; this does not establish a universal cultural meaning.',
  unverified: 'This claim has not been verified and should not be treated as established fact.',
  interpretation: 'A reading offered for exploration, not an artist statement or proof of historical influence.',
  community_review: 'Requires review by relevant community members or practitioners; not a settled cultural attribution.',
};

interface CulturalEvidenceProps {
  claims?: CulturalClaim[];
  title?: string;
  onExpand?: () => void;
}

export function CulturalEvidence({ claims, title = 'Cultural context & evidence', onExpand }: CulturalEvidenceProps) {
  if (!claims?.length) return null;

  return (
    <details className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-stone-300" onToggle={event => { if (event.currentTarget.open) onExpand?.(); }}>
      <summary className="cursor-pointer text-amber-300 focus-visible:outline focus-visible:outline-amber-300">{title}</summary>
      <ul className="mt-3 space-y-4">
        {claims.map((claim, index) => (
          <li key={`${claim.tier}-${index}`} className="space-y-2 leading-relaxed">
            <span className="inline-block rounded border border-white/15 px-2 py-0.5 font-medium text-stone-100">{CULTURAL_LABELS[claim.tier]}</span>
            <p>{claim.text}</p>
            <p className="break-words">
              <span className="text-stone-400">Source: </span>
              {claim.source.url ? (
                <a href={claim.source.url} target="_blank" rel="noopener noreferrer" className="text-amber-300 underline hover:text-amber-200">{claim.source.label} ↗</a>
              ) : claim.source.label}
            </p>
            <p className="text-stone-400">Limits: {TIER_LIMITS[claim.tier]}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}
