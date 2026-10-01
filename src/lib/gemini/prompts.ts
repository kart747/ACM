/**
 * Gemini prompt templates, one per stage of spec §17:
 *
 *   A  Element extraction        (image + record + the curated motif regions)
 *   B  Technique & tradition     (image + record)
 *   C  Relationship explanation  (both CreativeDNAs + both images + the approved type)
 *   D  Sanity check              (the assembled CreativeDNA + record + image)
 *   H  Hedging review            (texts the hedging linter could not accept + records)
 *
 * Each template returns a system instruction and the text part of the request.
 * Images are attached by the caller. Bump a version when its wording changes;
 * versions are stored with every generated document.
 */

export const PROMPT_VERSIONS = {
  A: 'A-2026-09-30',
  B: 'B-2026-09-30',
  C: 'C-2026-09-30',
  D: 'D-2026-09-30',
  H: 'H-2026-09-30',
} as const;

/** Everything Gemini is told about an artwork. Only Met-record fields, never curated interpretation. */
export interface ArtworkRecord {
  id: string;
  metObjectId: number;
  title: string;
  metTitle: string;
  artist: string;
  artistBio: string;
  date: string;
  medium: string;
  dimensions: string;
  credit: string;
  accessionNumber: string;
  metTags: string[];
  metUrl: string;
}

export interface MotifRegion {
  id: string;
  label: string;
  /** Normalized 0–1 bounds of the region a human marked on the image. */
  box: { x0: number; y0: number; x1: number; y1: number };
}

export interface PromptParts {
  system: string;
  text: string;
}

const ROLE =
  'You support ARTSCAPE, a museum discovery interface for human-made artworks. You help people see and understand the work; you never speak for the artist and never invent history.';

/** Shared provenance rules (spec §9, §17, §40). */
const PROVENANCE_RULES = `PROVENANCE RULES — every statement you return carries a source_type:
- "externally_verified": ONLY for statements directly supported by the MUSEUM RECORD block you were given. Name the record field in source_detail, e.g. "The Met record: medium".
- "artist_declared": ONLY for statements quoted from an ARTIST STATEMENT block. No artist statement is supplied here, so never use "artist_declared".
- "ai_inferred": everything else — every visual description and every interpretation.

WRITING RULES
- Describe what is visible before interpreting it.
- Phrase interpretations cautiously: "appears to", "suggests", "may". Never "definitely", "certainly", "proves", "the artist intended", "was influenced by", "copied".
- Do not add facts about the artist, patron, date, place, sources, or history that are not in the MUSEUM RECORD.
- Coordinates are normalized to the image: x from 0 (left edge) to 1 (right edge), y from 0 (top) to 1 (bottom).
- Return JSON only, matching the requested schema. No markdown, no commentary.`;

export function recordBlock(r: ArtworkRecord): string {
  return `MUSEUM RECORD (The Metropolitan Museum of Art, object ${r.metObjectId}; externally verified)
- title: ${r.metTitle}
- artist: ${r.artist}
- artist bio: ${r.artistBio}
- date: ${r.date}
- medium: ${r.medium}
- dimensions: ${r.dimensions}
- credit line: ${r.credit}
- accession number: ${r.accessionNumber}
- subject tags: ${r.metTags.join(', ') || '(none)'}
- record URL: ${r.metUrl}`;
}

function regionLine(m: MotifRegion): string {
  const f = (n: number) => n.toFixed(3);
  return `- id "${m.id}", label "${m.label}", region x ${f(m.box.x0)}–${f(m.box.x1)}, y ${f(m.box.y0)}–${f(m.box.y1)}`;
}

/* ------------------------------------------------------------------ */
/* Prompt A — Element Extraction                                        */
/* ------------------------------------------------------------------ */

export function promptA(record: ArtworkRecord, motifs: MotifRegion[]): PromptParts {
  return {
    system: `${ROLE}\n\n${PROVENANCE_RULES}`,
    text: `TASK: Element extraction for one artwork. The attached image is "${record.title}" by ${record.artist}.

${recordBlock(record)}

A curator has marked these regions on the image. Each region is meant to contain one visual element:
${motifs.map(regionLine).join('\n')}

For EVERY region above, return exactly one element with:
- id: the region's id, unchanged.
- name: a short name for what you actually see there (2–6 words).
- type: one of "motif", "character", "object", "inscription", "technique", "material".
- location: the point {x, y} at the centre of that element as you see it in the image. It must lie inside the region.
- meaning: 1–2 sentences. First describe what is visibly there; then, if useful, one cautious interpretation. If the region does not clearly show the labelled element, say so plainly instead of describing it.
- source_type: "ai_inferred" for anything you see or interpret. Use "externally_verified" only for a statement taken directly from the MUSEUM RECORD.
- source_detail: for "ai_inferred", "Visual reading of the image"; for "externally_verified", the record field used.

Return {"elements": [...]} with one entry per region, in the order given.`,
  };
}

/* ------------------------------------------------------------------ */
/* Prompt B — Technique & Tradition                                     */
/* ------------------------------------------------------------------ */

export function promptB(record: ArtworkRecord): PromptParts {
  return {
    system: `${ROLE}\n\n${PROVENANCE_RULES}`,
    text: `TASK: Technique and tradition for one artwork. The attached image is "${record.title}" by ${record.artist}.

${recordBlock(record)}

Return:
- techniques: 1–3 entries. Each has name, description (1–2 sentences about how it shows in THIS image), and source_type.
  Mark a technique "externally_verified" only when the MUSEUM RECORD names it (for example the medium field). Stylistic approach or handling you observe is "ai_inferred".
- tradition: one entry with name, description (1–2 sentences), and source_type.
  Use "externally_verified" only for what the record states (for example the nationality or period in the artist bio). Any wider artistic lineage or regional tradition you suggest is "ai_inferred" and must be phrased cautiously ("appears to draw from…").

Return {"techniques": [...], "tradition": {...}}.`,
  };
}

/* ------------------------------------------------------------------ */
/* Prompt C — Relationship Explanation                                  */
/* ------------------------------------------------------------------ */

export interface RelationshipInput {
  relationshipType: string;
  source: { record: ArtworkRecord; dna: unknown; element: { id: string; name: string } };
  target: { record: ArtworkRecord; dna: unknown; element: { id: string; name: string } };
}

export function promptC(input: RelationshipInput): PromptParts {
  const { source, target } = input;
  return {
    system: `${ROLE}\n\n${PROVENANCE_RULES}`,
    text: `TASK: Explain one relationship between two artworks. The first attached image is Artwork A, the second is Artwork B.

A human curator approved this relationship. You explain it; you do not choose it.
- relationship type: ${input.relationshipType}
- from Artwork A element "${source.element.id}" (${source.element.name})
- to Artwork B element "${target.element.id}" (${target.element.name})

ARTWORK A — "${source.record.title}" by ${source.record.artist}
${recordBlock(source.record)}
CreativeDNA of A:
${JSON.stringify(source.dna)}

ARTWORK B — "${target.record.title}" by ${target.record.artist}
${recordBlock(target.record)}
CreativeDNA of B:
${JSON.stringify(target.dna)}

Return:
- supported: false if you cannot see this relationship in the two images; true otherwise.
- explanation: ONE sentence, at most 25 words, that makes a viewer want to look at Artwork B. Cautious wording; no invented facts; no claims of influence or copying.
- evidence: 1–2 sentences naming only what is visible in both images.
- caveat: 1 sentence on what this pairing does NOT establish.
- confidence: your own 0–1 estimate of how well the images support the stated relationship. It is a self-assessment, not a probability.`,
  };
}

/* ------------------------------------------------------------------ */
/* Prompt D — Sanity Check                                              */
/* ------------------------------------------------------------------ */

export function promptD(record: ArtworkRecord, dna: unknown): PromptParts {
  return {
    system: `${ROLE}\n\nYou are the reviewer. Be strict and specific. Return JSON only.`,
    text: `TASK: Review this CreativeDNA document for "${record.title}" by ${record.artist} against the attached image and the museum record.

${recordBlock(record)}

CreativeDNA:
${JSON.stringify(dna, null, 2)}

Check each item and report problems:
- coordinates: an element's location is not on the element it names.
- missing_field: a field is empty or meaningless.
- unsupported_verified: "externally_verified" is used for something the MUSEUM RECORD does not state, or "artist_declared" is used at all.
- overconfident: an "ai_inferred" statement is phrased as certain fact or claims intent, influence or copying.
- invented_fact: a statement adds history, biography, dates, patrons or sources that are not in the record.
- invalid_relationship: a relationship's explanation or evidence does not match what is visible.

Use path "elements[i]", "techniques[i]", "tradition" or "relationships[i]" (0-based, as in the document).
severity "error" means the item must not be shown as written; "warning" means it is acceptable but could be better.
Return {"issues": [...]}, or {"issues": []} if nothing is wrong.`,
  };
}

/* ------------------------------------------------------------------ */
/* Prompt H — Hedging review                                            */
/* ------------------------------------------------------------------ */

export interface HedgingReviewItem {
  ref: string;
  field: string;
  source_type: string;
  text: string;
  problems: string[];
  max_words?: number;
}

/**
 * Asks for safer rewrites of texts the hedging linter flagged. No image: the
 * rewrite may only remove or soften claims, never add visual detail. The
 * rewrite is checked by the same rules again before it is accepted.
 */
export function promptH(records: ArtworkRecord[], items: HedgingReviewItem[]): PromptParts {
  return {
    system: `${ROLE}

You are the hedging reviewer. ARTSCAPE separates three kinds of sentence:
- OBSERVATION: what is visible. "Both artworks contain circular forms." Keep these unchanged.
- INTERPRETATION: a cautious reading. "The circular forms may create a framing effect." This is the goal.
- UNSUPPORTED CERTAINTY: "The artist intentionally used the circle to symbolize…" This must go.

REWRITE RULES
- Change only what the listed problems name. Keep every observation and every supportable idea.
- Turn claims about the artist's intent, purpose or state of mind into claims about what the viewer sees or the effect the image may have.
- Remove claims of influence, copying, borrowing or knowledge of another work entirely; do not hedge them ("may have copied" is still a copying claim).
- Remove certainty words (definitely, certainly, clearly, proves, must have, true meaning); use "appears", "may", "suggests".
- Remove dates, biography, patrons, events and appeals to authority ("scholars agree", "most famous") that are not in the MUSEUM RECORD.
- Do not add new facts or new visual detail.
- Respect max_words when given.
- If nothing worth saying survives, return action "reject" with empty text.
- Return JSON only.`,
    text: `TASK: Rewrite each item below so it is no more certain than the evidence allows.

${records.map(recordBlock).join('\n\n')}

ITEMS:
${JSON.stringify(items, null, 2)}

Return {"rewrites": [...]} with exactly one entry per item: ref (unchanged), action ("rewrite" or "reject"), text (the full rewritten text, or "" when rejected), reason (one short sentence).`,
  };
}
