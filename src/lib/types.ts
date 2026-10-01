export type Shape = 'rect' | 'ellipse';

/** Normalized to the image box: 0-100 on both axes, independent of pixel size. */
export interface NormalizedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Where a claim comes from (spec §9). The UI renders these as
 * ✓ Artist / ✓ Verified / ◇ AI interpretation.
 */
export type SourceType = 'artist_declared' | 'externally_verified' | 'ai_inferred';

export interface Claim {
  text: string;
  sourceType: SourceType;
  /** Human-readable source, e.g. "The Met collection record (object 36491)". */
  sourceDetail: string;
  /** 0-1. Shown for `ai_inferred` relationships; meaningless for the other two. */
  confidence?: number;
  /**
   * How many independent Gemini runs concluded the images support this
   * relationship. Measured at build time; present only on generated relationships.
   */
  agreement?: { agreeing: number; runs: number };
  /**
   * Where the text came from: the Gemini pipeline (validated CreativeDNA) or the
   * curated fallback in `src/data/artworks.ts`. Defaults to curated.
   */
  origin?: 'gemini' | 'curated';
}

/** Technique and tradition from CreativeDNA (spec §16), shown when generated. */
export interface NamedClaim extends Claim {
  name: string;
}

/** Spec §16 relationship types. */
export type RelationshipType =
  | 'shared_motif'
  | 'similar_technique'
  | 'same_tradition'
  | 'thematic_echo';

export interface MotifConnection {
  targetArtworkId: string;
  targetMotifId: string;
  relationshipType: RelationshipType;
  /** The interpretive claim that links the two details. */
  claim: Claim;
  /** What is actually observable in both images. Kept apart from the claim. */
  visualEvidence: string;
  /** What the pairing does not establish. */
  caveat: string;
  /** Checkable facts that support the pairing (dates, places, record fields). */
  context?: Claim[];
}

export type MotifKind = 'motif' | 'figure' | 'object' | 'inscription';

export interface Motif {
  id: string;
  label: string;
  kind: MotifKind;
  rect: NormalizedRect;
  shape: Shape;
  /** What the detail is. The first claim is the lead description. */
  observations: Claim[];
  /** Ordered by preference. Landing logic prefers a link that does not lead back. */
  connections: MotifConnection[];
}

export interface Creator {
  name: string;
  /** Verbatim `artistDisplayBio` from The Met record. */
  metBio: string;
  /** Short orientation to the person's work. Provenance shown in the UI. */
  summary: Claim;
}

export interface Artwork {
  id: string;
  metObjectId: number;
  /** Display title. The Met's full title is in `metTitle` when it differs. */
  title: string;
  metTitle: string;
  creator: Creator;
  date: string;
  medium: string;
  dimensions: string;
  credit: string;
  accessionNumber: string;
  /** Subject keywords assigned by The Met. */
  metTags: string[];
  metUrl: string;
  image: {
    src: string;
    width: number;
    height: number;
    /** Used for the ambient glow behind the spotlight. */
    glow: string;
  };
  motifs: Motif[];
  /** Which data backs this artwork's interpretations. Set by the collection loader. */
  dataSource?: 'gemini' | 'curated';
  /** Present only when validated Gemini output exists for this artwork. */
  creativeDna?: {
    model: string;
    generatedAt: string;
    techniques: NamedClaim[];
    tradition: NamedClaim;
  };
}
