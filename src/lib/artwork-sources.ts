import type { V2Artwork } from '@/data/artworks-v2';

export type CulturalTier = 'verified' | 'documented' | 'unverified' | 'interpretation' | 'community_review';

export interface CulturalClaim {
  text: string;
  tier: CulturalTier;
  source: { label: string; url?: string };
}

export interface ImageCredit {
  title: string;
  creator: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  changes: string;
}

export const CULTURAL_LABELS: Record<CulturalTier, string> = {
  verified: 'Verified record',
  documented: 'Documented',
  unverified: 'Unverified',
  interpretation: 'Interpretation',
  community_review: 'Needs community review',
};

export function sourceRecordLabel(artwork: V2Artwork) {
  return artwork.sourceKind === 'photograph' ? 'Photograph source' : 'Museum record';
}

export function sourceRecordRef(artwork: V2Artwork) {
  return artwork.sourceKind === 'photograph' ? 'source_record' : 'museum_record';
}
