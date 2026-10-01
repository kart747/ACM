import type { Artwork, NormalizedRect } from '@/lib/types';
import {
  AGREEMENT_MIN_AGREEING,
  AGREEMENT_RUNS,
  CreativeDnaSchema,
  type CreativeDna,
  type CreativeDnaElement,
  type RelationshipType,
} from './schema';

/**
 * `validate_creative_dna` (spec §20), plus the error handling of §35.
 *
 * Document-level problems (bad JSON shape, wrong artwork) reject the whole
 * document. Item-level problems drop only that item, so the curated version of
 * it stays in use. Provenance that cannot be backed by the supplied metadata is
 * downgraded to `ai_inferred` rather than kept.
 */

export interface ValidationContext {
  artworks: ContextArtwork[];
}

export interface ContextArtwork {
  id: string;
  title: string;
  artist: string;
  /** Every Met record field supplied to Gemini, lower-cased, for provenance checks. */
  metadataText: string;
  motifs: { id: string; rect: NormalizedRect }[];
  /** Human-approved relationships (spec §11): the only ones Gemini may explain. */
  approved: {
    sourceMotifId: string;
    targetArtworkId: string;
    targetMotifId: string;
    relationshipType: RelationshipType;
  }[];
}

export interface ValidationResult {
  ok: boolean;
  /** Present when `ok`: the cleaned document with rejected items removed. */
  dna?: CreativeDna;
  /** Why the document or an item was rejected. */
  errors: string[];
  /** Corrections applied (downgrades) that did not require rejection. */
  warnings: string[];
}

/** Explanations are one short sentence (spec §17 Prompt C). */
export const MAX_EXPLANATION_WORDS = 25;
/** How far a Gemini point may sit outside the curated rectangle (0–1 units). */
export const LOCATION_TOLERANCE = 0.05;

/** Phrases that turn an interpretation into an unsupported claim (spec §9, §40). */
const OVERCONFIDENT =
  /\b(definitely|certainly|undoubtedly|unquestionably|without (a )?doubt|proves?|proven|copied|borrowed (it )?from|(was|were) (directly )?(influenced|inspired) by|must have|clearly (intended|meant)|the artist (intended|meant|wanted)|true meaning)\b/i;

export function contextFromArtworks(artworks: Artwork[]): ValidationContext {
  return {
    artworks: artworks.map((a) => ({
      id: a.id,
      title: a.title,
      artist: a.creator.name,
      metadataText: [
        a.title,
        a.metTitle,
        a.creator.name,
        a.creator.metBio,
        a.date,
        a.medium,
        a.dimensions,
        a.credit,
        a.metTags.join(' '),
      ]
        .join(' ')
        .toLowerCase(),
      motifs: a.motifs.map((m) => ({ id: m.id, rect: m.rect })),
      approved: a.motifs.flatMap((m) =>
        m.connections.map((c) => ({
          sourceMotifId: m.id,
          targetArtworkId: c.targetArtworkId,
          targetMotifId: c.targetMotifId,
          relationshipType: c.relationshipType,
        })),
      ),
    })),
  };
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function overconfidentPhrase(text: string): string | null {
  return text.match(OVERCONFIDENT)?.[0] ?? null;
}

/** True when a 0–1 point lies inside a 0–100 rect, allowing `LOCATION_TOLERANCE`. */
export function pointInRect(point: { x: number; y: number }, rect: NormalizedRect): boolean {
  const t = LOCATION_TOLERANCE;
  return (
    point.x >= rect.x / 100 - t &&
    point.x <= (rect.x + rect.w) / 100 + t &&
    point.y >= rect.y / 100 - t &&
    point.y <= (rect.y + rect.h) / 100 + t
  );
}

/** Verified only if the claim's key words appear in the supplied metadata. */
function supportedByMetadata(text: string, metadataText: string): boolean {
  const words = text
    .toLowerCase()
    .split(/[^a-zà-ž]+/)
    .filter((w) => w.length > 3);
  return words.length > 0 && words.some((w) => metadataText.includes(w));
}

export function formatZodIssues(error: { issues: { path: PropertyKey[]; message: string }[] }): string[] {
  return error.issues.map((i) => `${i.path.map(String).join('.') || '(root)'}: ${i.message}`);
}

export function validateCreativeDna(raw: unknown, ctx: ValidationContext): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const parsed = CreativeDnaSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: formatZodIssues(parsed.error).map((e) => `schema: ${e}`), warnings };
  }
  const dna = structuredClone(parsed.data);

  const self = ctx.artworks.find((a) => a.id === dna.artwork.id);
  if (!self) {
    return { ok: false, errors: [`artwork.id "${dna.artwork.id}" is not in the sourced artwork set`], warnings };
  }
  if (dna.artwork.title !== self.title) {
    errors.push(`artwork.title "${dna.artwork.title}" does not match the record ("${self.title}")`);
  }
  if (dna.artwork.artist !== self.artist) {
    errors.push(`artwork.artist "${dna.artwork.artist}" does not match the record ("${self.artist}")`);
  }
  if (errors.length > 0) return { ok: false, errors, warnings };

  // ---------- elements ----------
  const seen = new Set<string>();
  dna.elements = dna.elements.filter((el, i) => {
    const where = `elements[${i}] (${el.id})`;
    const motif = self.motifs.find((m) => m.id === el.id);
    if (!motif) return reject(`${where}: not one of the supplied motifs`);
    if (seen.has(el.id)) return reject(`${where}: duplicate element id`);
    seen.add(el.id);
    if (!pointInRect(el.location, motif.rect)) {
      return reject(
        `${where}: location (${el.location.x.toFixed(2)}, ${el.location.y.toFixed(2)}) is outside the motif rectangle`,
      );
    }
    downgradeProvenance(el, where, (e) => /\bmet\b/i.test(e.source_detail));
    if (el.source_type === 'ai_inferred') {
      const phrase = overconfidentPhrase(el.meaning);
      if (phrase) return reject(`${where}: overconfident wording "${phrase}" in an AI interpretation`);
    }
    return true;
  });

  // ---------- techniques and tradition ----------
  dna.techniques.forEach((t, i) =>
    downgradeProvenance(t, `techniques[${i}] (${t.name})`, (x) => supportedByMetadata(x.name, self.metadataText)),
  );
  downgradeProvenance(dna.tradition, 'tradition', (x) => supportedByMetadata(x.name, self.metadataText));
  dna.techniques = dna.techniques.filter((t, i) => {
    const phrase = t.source_type === 'ai_inferred' ? overconfidentPhrase(t.description) : null;
    return phrase ? reject(`techniques[${i}] (${t.name}): overconfident wording "${phrase}"`) : true;
  });

  // ---------- relationships ----------
  dna.relationships = dna.relationships.filter((rel, i) => {
    const where = `relationships[${i}] (${rel.source_element_id ?? '?'} → ${rel.target_artwork_id}/${rel.target_element_id ?? '?'})`;
    const target = ctx.artworks.find((a) => a.id === rel.target_artwork_id);
    if (!target) return reject(`${where}: target artwork is not in the sourced artwork set`);
    if (target.id === self.id) return reject(`${where}: a relationship must lead to another artwork`);
    if (!rel.source_element_id || !rel.target_element_id || !rel.evidence || !rel.caveat) {
      return reject(`${where}: missing source_element_id, target_element_id, evidence or caveat`);
    }
    if (!self.motifs.some((m) => m.id === rel.source_element_id)) {
      return reject(`${where}: source element is not a motif of ${self.id}`);
    }
    if (!target.motifs.some((m) => m.id === rel.target_element_id)) {
      return reject(`${where}: target element is not a motif of ${target.id}`);
    }
    const approved = self.approved.find(
      (a) =>
        a.sourceMotifId === rel.source_element_id &&
        a.targetArtworkId === rel.target_artwork_id &&
        a.targetMotifId === rel.target_element_id,
    );
    if (!approved) return reject(`${where}: not a human-approved relationship`);
    if (approved.relationshipType !== rel.relationship_type) {
      return reject(
        `${where}: type "${rel.relationship_type}" differs from the approved "${approved.relationshipType}"`,
      );
    }
    if (!rel.agreement) return reject(`${where}: missing multi-run agreement`);
    if (rel.agreement.runs !== AGREEMENT_RUNS) {
      return reject(`${where}: agreement from ${rel.agreement.runs} runs (expected ${AGREEMENT_RUNS})`);
    }
    if (rel.agreement.agreeing < AGREEMENT_MIN_AGREEING) {
      return reject(
        `${where}: only ${rel.agreement.agreeing}/${rel.agreement.runs} runs agree (need ${AGREEMENT_MIN_AGREEING})`,
      );
    }
    const words = wordCount(rel.explanation);
    if (words > MAX_EXPLANATION_WORDS) {
      return reject(`${where}: explanation has ${words} words (max ${MAX_EXPLANATION_WORDS})`);
    }
    if (rel.source_type !== 'ai_inferred') {
      warnings.push(`${where}: source_type "${rel.source_type}" downgraded to ai_inferred (a comparison is an interpretation)`);
      rel.source_type = 'ai_inferred';
    }
    const phrase = overconfidentPhrase(`${rel.explanation} ${rel.caveat}`);
    if (phrase) return reject(`${where}: overconfident wording "${phrase}"`);
    return true;
  });

  const dupes = new Set<string>();
  dna.relationships = dna.relationships.filter((rel) => {
    const key = `${rel.source_element_id}>${rel.target_artwork_id}/${rel.target_element_id}`;
    if (dupes.has(key)) return reject(`relationship ${key}: duplicate`);
    dupes.add(key);
    return true;
  });

  return { ok: true, dna, errors, warnings };

  function reject(message: string): false {
    errors.push(message);
    return false;
  }

  function downgradeProvenance<T extends { source_type: CreativeDnaElement['source_type'] }>(
    item: T,
    where: string,
    verifiedIsSupported: (item: T) => boolean,
  ) {
    if (item.source_type === 'artist_declared') {
      // No artist statements are supplied to Gemini, so nothing can be artist-declared.
      warnings.push(`${where}: artist_declared downgraded to ai_inferred (no artist statement was supplied)`);
      item.source_type = 'ai_inferred';
    } else if (item.source_type === 'externally_verified' && !verifiedIsSupported(item)) {
      warnings.push(`${where}: externally_verified downgraded to ai_inferred (not backed by the supplied record)`);
      item.source_type = 'ai_inferred';
    }
  }
}
