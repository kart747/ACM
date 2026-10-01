import type { z } from 'zod';
import type { Artwork } from '@/lib/types';
import {
  PromptAResponseSchema,
  PromptBResponseSchema,
  AGREEMENT_RUNS,
  PromptCResponseSchema,
  PromptDResponseSchema,
  PromptHResponseSchema,
  type CreativeDna,
  type CreativeDnaRelationship,
  type PromptAResponse,
  type PromptBResponse,
  type SanityIssue,
} from '@/lib/creative-dna/schema';
import { contextFromArtworks, formatZodIssues, validateCreativeDna } from '@/lib/creative-dna/validate';
import { AGREEMENT_TEMPERATURE, formatAgreement, scoreAgreement, type AgreementResult, type RunOutcome } from './agreement';
import { hedgingKey, HedgingRejection, runHedgingLinter, type HedgingRequest } from '@/lib/hedging/document';
import { toGeminiSchema, type ContentPart, type ModelCall } from './client';
import { PROMPT_VERSIONS, promptA, promptB, promptC, promptD, promptH, type ArtworkRecord, type MotifRegion } from './prompts';

/**
 * The ingestion pipeline (spec §18, §21):
 *
 *   image + record + curated motif regions
 *     → Prompt A (elements) + Prompt B (techniques, tradition)
 *     → Prompt C for every human-approved relationship, AGREEMENT_RUNS independent runs each
 *     → Prompt D sanity check → apply its findings
 *     → hedging linter (rules, then Prompt H rewrites where needed)
 *     → validate_creative_dna → hedging linter again (texts the validator downgraded)
 *     → validate_creative_dna → accepted documents only
 *
 * Nothing here writes files; the CLI decides what to store.
 */

export class GenerationError extends Error {
  constructor(
    readonly stage: string,
    message: string,
  ) {
    super(`${stage}: ${message}`);
  }
}

/** Strip an optional ```json fence and parse. Throws with a readable message. */
export function parseModelJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const body = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(`response is not valid JSON (${(error as Error).message}): ${body.slice(0, 120)}`);
  }
}

/**
 * Call the model and accept only output that parses and matches `schema`.
 * On failure, retry once with the validation errors fed back (spec §35).
 */
export async function callValidated<S extends z.ZodType>(
  call: ModelCall,
  request: { label: string; system: string; parts: ContentPart[]; temperature?: number },
  schema: S,
  attempts = 2,
): Promise<z.infer<S>> {
  let feedback = '';
  let lastError = '';
  for (let i = 0; i < attempts; i++) {
    const parts = feedback ? [...request.parts, { text: feedback }] : request.parts;
    const text = await call({ ...request, parts, responseJsonSchema: toGeminiSchema(schema) });
    let raw: unknown;
    try {
      raw = parseModelJson(text);
    } catch (error) {
      lastError = (error as Error).message;
      feedback = `Your previous response could not be parsed: ${lastError}. Return valid JSON only.`;
      continue;
    }
    const parsed = schema.safeParse(raw);
    if (parsed.success) return parsed.data;
    lastError = formatZodIssues(parsed.error).join('; ');
    feedback = `Your previous response did not match the schema: ${lastError}. Return corrected JSON only.`;
  }
  throw new GenerationError(request.label, `invalid output after ${attempts} attempts — ${lastError}`);
}

/**
 * Send the identical Prompt C request `runs` times as separate, concurrent
 * calls with one attempt each, and score how many conclude `supported`.
 * See agreement.ts.
 */
export async function runAgreement(
  call: ModelCall,
  request: { label: string; system: string; parts: ContentPart[] },
  runs = AGREEMENT_RUNS,
): Promise<AgreementResult> {
  const settled = await Promise.allSettled(
    Array.from({ length: runs }, (_, i) =>
      callValidated(
        call,
        { ...request, label: `${request.label} (run ${i + 1}/${runs})`, temperature: AGREEMENT_TEMPERATURE },
        PromptCResponseSchema,
        1,
      ),
    ),
  );
  return scoreAgreement(
    settled.map((s): RunOutcome =>
      s.status === 'fulfilled'
        ? { ok: true, response: s.value }
        : { ok: false, error: (s.reason as Error)?.message ?? String(s.reason) },
    ),
  );
}

export function recordOf(a: Artwork): ArtworkRecord {
  return {
    id: a.id,
    metObjectId: a.metObjectId,
    title: a.title,
    metTitle: a.metTitle,
    artist: a.creator.name,
    artistBio: a.creator.metBio,
    date: a.date,
    medium: a.medium,
    dimensions: a.dimensions,
    credit: a.credit,
    accessionNumber: a.accessionNumber,
    metTags: a.metTags,
    metUrl: a.metUrl,
  };
}

export function regionsOf(a: Artwork): MotifRegion[] {
  return a.motifs.map((m) => ({
    id: m.id,
    label: m.label,
    box: { x0: m.rect.x / 100, y0: m.rect.y / 100, x1: (m.rect.x + m.rect.w) / 100, y1: (m.rect.y + m.rect.h) / 100 },
  }));
}

export interface ImageData {
  mimeType: string;
  /** base64 */
  data: string;
}

export interface PipelineOptions {
  call: ModelCall;
  model: string;
  /** The full curated collection: the closed artwork set and the approved relationships. */
  collection: Artwork[];
  /** Artwork ids to generate; defaults to all. */
  only?: string[];
  /**
   * Relationship ids (see `relationshipId`) to run Prompt C for; defaults to all
   * of the targets' relationships, `[]` runs none. Each still gets AGREEMENT_RUNS runs.
   */
  relationships?: string[];
  loadImage: (artwork: Artwork) => Promise<ImageData>;
  /** Previously accepted documents, used as context for relationships to artworks not in `only`. */
  existing?: CreativeDna[];
  log?: (line: string) => void;
  now?: () => Date;
}

export interface PipelineFailure {
  artworkId: string;
  stage: string;
  message: string;
}

export interface PipelineResult {
  accepted: CreativeDna[];
  failures: PipelineFailure[];
  /** Items the validator or Prompt D removed or downgraded, per artwork. */
  notes: Record<string, string[]>;
}

type ArtworkPartial = { record: ArtworkRecord; elements: PromptAResponse['elements'] } & PromptBResponse;

export async function runPipeline(opts: PipelineOptions): Promise<PipelineResult> {
  const log = opts.log ?? (() => {});
  const now = opts.now ?? (() => new Date());
  const targets = opts.collection.filter((a) => !opts.only || opts.only.includes(a.id));
  const failures: PipelineFailure[] = [];
  const notes: Record<string, string[]> = {};
  const images = new Map<string, ImageData>();
  const image = async (a: Artwork) => {
    if (!images.has(a.id)) images.set(a.id, await opts.loadImage(a));
    return images.get(a.id)!;
  };
  const imagePart = async (a: Artwork): Promise<ContentPart> => ({ inlineData: await image(a) });

  // ---- A + B per artwork ----
  const partials = new Map<string, ArtworkPartial>();
  for (const artwork of targets) {
    const record = recordOf(artwork);
    try {
      log(`A  ${artwork.id}: element extraction`);
      const a = promptA(record, regionsOf(artwork));
      const elements = await callValidated(
        opts.call,
        { label: `A ${artwork.id}`, system: a.system, parts: [await imagePart(artwork), { text: a.text }] },
        PromptAResponseSchema,
      );
      log(`B  ${artwork.id}: technique & tradition`);
      const b = promptB(record);
      const tb = await callValidated(
        opts.call,
        { label: `B ${artwork.id}`, system: b.system, parts: [await imagePart(artwork), { text: b.text }] },
        PromptBResponseSchema,
      );
      partials.set(artwork.id, { record, elements: elements.elements, ...tb });
    } catch (error) {
      failures.push(failureOf(artwork.id, error));
    }
  }

  // Context for relationship targets: this run's partial DNA, else a stored document, else the record alone.
  const dnaFor = (a: Artwork): unknown => {
    const p = partials.get(a.id);
    if (p) return { elements: p.elements, techniques: p.techniques, tradition: p.tradition };
    const stored = opts.existing?.find((d) => d.artwork.id === a.id);
    if (stored) return { elements: stored.elements, techniques: stored.techniques, tradition: stored.tradition };
    return { elements: a.motifs.map((m) => ({ id: m.id, name: m.label })) };
  };

  // ---- C per human-approved relationship, with multi-run agreement ----
  const relationships = new Map<string, CreativeDnaRelationship[]>();
  for (const artwork of targets) {
    if (!partials.has(artwork.id)) continue;
    const list: CreativeDnaRelationship[] = [];
    for (const motif of artwork.motifs) {
      for (const c of motif.connections) {
        if (opts.relationships && !opts.relationships.includes(relationshipId(motif.id, c))) continue;
        const target = opts.collection.find((a) => a.id === c.targetArtworkId);
        const targetMotif = target?.motifs.find((m) => m.id === c.targetMotifId);
        const label = `C ${artwork.id}/${motif.id} → ${c.targetArtworkId}/${c.targetMotifId}`;
        if (!target || !targetMotif) {
          (notes[artwork.id] ??= []).push(`${label}: target not in the artwork set; skipped`);
          continue;
        }
        try {
          log(`${label} ×${AGREEMENT_RUNS}`);
          const p = promptC({
            relationshipType: c.relationshipType,
            source: { record: recordOf(artwork), dna: dnaFor(artwork), element: { id: motif.id, name: motif.label } },
            target: { record: recordOf(target), dna: dnaFor(target), element: { id: targetMotif.id, name: targetMotif.label } },
          });
          const result = await runAgreement(opts.call, {
            label,
            system: p.system,
            parts: [await imagePart(artwork), await imagePart(target), { text: p.text }],
          });
          const summary = formatAgreement(result.agreement);
          for (const e of result.errors) (notes[artwork.id] ??= []).push(`${label}: failed run — ${e}`);
          const r = result.representative;
          if (!result.accepted || !r) {
            (notes[artwork.id] ??= []).push(
              `${label}: Gemini could not see this relationship consistently (${summary}); curated text kept`,
            );
            continue;
          }
          list.push({
            target_artwork_id: target.id,
            relationship_type: c.relationshipType,
            explanation: r.explanation,
            source_type: 'ai_inferred',
            confidence: r.confidence,
            source_element_id: motif.id,
            target_element_id: targetMotif.id,
            evidence: r.evidence,
            caveat: r.caveat,
            agreement: result.agreement,
          });
        } catch (error) {
          (notes[artwork.id] ??= []).push(`${label}: ${(error as Error).message}; curated text kept`);
        }
      }
    }
    relationships.set(artwork.id, list);
  }

  // ---- assemble, D, validate ----
  const ctx = contextFromArtworks(opts.collection);
  const accepted: CreativeDna[] = [];
  for (const artwork of targets) {
    const partial = partials.get(artwork.id);
    if (!partial) continue;
    const artworkNotes = (notes[artwork.id] ??= []);

    let dna: CreativeDna = {
      artwork: {
        id: artwork.id,
        title: artwork.title,
        artist: artwork.creator.name,
        region_or_tradition: partial.tradition.name,
        image_url: artwork.image.src,
      },
      elements: partial.elements,
      techniques: partial.techniques,
      tradition: partial.tradition,
      relationships: relationships.get(artwork.id) ?? [],
    };

    const overconfident: HedgingRequest[] = [];
    try {
      log(`D  ${artwork.id}: sanity check`);
      const d = promptD(partial.record, dna);
      const review = await callValidated(
        opts.call,
        { label: `D ${artwork.id}`, system: d.system, parts: [await imagePart(artwork), { text: d.text }] },
        PromptDResponseSchema,
      );
      dna = applySanityIssues(dna, review.issues, artworkNotes, overconfident);
    } catch (error) {
      failures.push(failureOf(artwork.id, error));
      continue;
    }

    dna.generation = {
      model: opts.model,
      generated_at: now().toISOString(),
      prompt_versions: { ...PROMPT_VERSIONS },
      notes: artworkNotes,
    };

    // Hedging linter before validation, so overconfident wording is hedged rather than
    // simply dropped by the validator (spec §35), and again after it, for any text whose
    // provenance the validator lowered. The second pass is a no-op for clean documents.
    const involved = [artwork, ...dna.relationships.map((r) => opts.collection.find((a) => a.id === r.target_artwork_id))];
    const records = [...new Set(involved.filter((a): a is Artwork => !!a))].map(recordOf);
    const hedge = async (doc: CreativeDna, requests: HedgingRequest[] = []) =>
      (
        await runHedgingLinter(doc, {
          ctx,
          requests,
          notes: artworkNotes,
          rewrite: async (items) => {
            log(`H  ${artwork.id}: hedging review of ${items.length} text(s)`);
            const h = promptH(records, items);
            return callValidated(opts.call, { label: `H ${artwork.id}`, system: h.system, parts: [{ text: h.text }] }, PromptHResponseSchema);
          },
        })
      ).dna;

    let linted: CreativeDna;
    try {
      const validated = validateCreativeDna(await hedge(dna, overconfident), ctx);
      if (!validated.ok || !validated.dna) {
        failures.push({ artworkId: artwork.id, stage: 'validation', message: validated.errors.join('; ') });
        continue;
      }
      artworkNotes.push(...validated.errors.map((e) => `rejected ${e}`), ...validated.warnings);
      linted = await hedge(validated.dna);
    } catch (error) {
      if (!(error instanceof HedgingRejection)) throw error;
      failures.push({ artworkId: artwork.id, stage: 'hedging', message: error.message });
      continue;
    }

    const result = validateCreativeDna(linted, ctx);
    if (!result.ok || !result.dna) {
      failures.push({ artworkId: artwork.id, stage: 'validation', message: result.errors.join('; ') });
      continue;
    }
    artworkNotes.push(...result.errors.map((e) => `rejected ${e}`), ...result.warnings);
    result.dna.generation = { ...dna.generation, notes: artworkNotes };
    accepted.push(result.dna);
  }

  return { accepted, failures, notes };
}

/**
 * Apply Prompt D's findings. Errors remove the item (its curated version is
 * used instead), except unsupported provenance, which is downgraded to
 * `ai_inferred` per spec §35. An error on the tradition rejects the document.
 *
 * When `overconfident` is given, `overconfident` errors are not removed here:
 * they are collected for the hedging linter, which asks for a hedged rewrite
 * (spec §35 "Downgrade to ai_inferred and hedge") and removes the item only if
 * no safe rewrite exists.
 */
export function applySanityIssues(
  dna: CreativeDna,
  issues: SanityIssue[],
  notes: string[],
  overconfident?: HedgingRequest[],
): CreativeDna {
  const next = structuredClone(dna);
  const drop = { elements: new Set<number>(), techniques: new Set<number>(), relationships: new Set<number>() };

  for (const issue of issues) {
    const line = `Prompt D ${issue.severity} ${issue.path} (${issue.kind}): ${issue.message}`;
    if (issue.severity === 'warning') {
      notes.push(line);
      continue;
    }
    const m = issue.path.match(/^(elements|techniques|relationships)\[(\d+)\]/);
    if (issue.path.startsWith('tradition')) {
      if (issue.kind === 'overconfident' && overconfident) {
        overconfident.push({ key: hedgingKey('tradition', next.tradition), reason: issue.message });
        notes.push(`${line} → sent to the hedging linter`);
      } else if (issue.kind === 'unsupported_verified') {
        next.tradition.source_type = 'ai_inferred';
        notes.push(`${line} → downgraded to ai_inferred`);
      } else {
        throw new GenerationError('D', `tradition rejected — ${issue.message}`);
      }
      continue;
    }
    if (!m) {
      notes.push(`${line} (path not recognised; ignored)`);
      continue;
    }
    const list = m[1] as keyof typeof drop;
    const index = Number(m[2]);
    const item = next[list][index] as { source_type: string } | undefined;
    if (!item) {
      notes.push(`${line} (no such item; ignored)`);
    } else if (issue.kind === 'unsupported_verified') {
      item.source_type = 'ai_inferred';
      notes.push(`${line} → downgraded to ai_inferred`);
    } else if (issue.kind === 'overconfident' && overconfident) {
      overconfident.push({ key: hedgingKey(list, item as Record<string, unknown>), reason: issue.message });
      notes.push(`${line} → sent to the hedging linter`);
    } else {
      drop[list].add(index);
      notes.push(`${line} → removed; curated text kept`);
    }
  }

  next.elements = next.elements.filter((_, i) => !drop.elements.has(i));
  next.techniques = next.techniques.filter((_, i) => !drop.techniques.has(i));
  next.relationships = next.relationships.filter((_, i) => !drop.relationships.has(i));
  return next;
}

/** "source-motif:target-artwork/target-motif", the id `--relationships=` takes. */
export function relationshipId(sourceMotifId: string, c: { targetArtworkId: string; targetMotifId: string }): string {
  return `${sourceMotifId}:${c.targetArtworkId}/${c.targetMotifId}`;
}

export interface RequestEstimate {
  artworks: string[];
  relationships: string[];
  /** Every call succeeds first time and the hedging linter needs no Prompt H. */
  min: number;
  /** Prompt H runs in both hedging passes. */
  typical: number;
  /** Every A/B/D/H call also uses its one schema-feedback retry. Excludes transport retries (5xx/429). */
  max: number;
}

/**
 * How many model requests `runPipeline` would make for these options, without
 * calling anything. Per artwork: A + B + D (+ up to 2 H); per relationship:
 * AGREEMENT_RUNS single-attempt C runs.
 */
export function estimateRequests(opts: Pick<PipelineOptions, 'collection' | 'only' | 'relationships'>): RequestEstimate {
  const targets = opts.collection.filter((a) => !opts.only || opts.only.includes(a.id));
  const relationships = targets.flatMap((a) =>
    a.motifs.flatMap((m) => m.connections.map((c) => relationshipId(m.id, c))),
  ).filter((id) => !opts.relationships || opts.relationships.includes(id));
  const n = targets.length;
  const c = relationships.length * AGREEMENT_RUNS;
  return {
    artworks: targets.map((a) => a.id),
    relationships,
    min: 3 * n + c,
    typical: 5 * n + c,
    max: 2 * 5 * n + c,
  };
}

function failureOf(artworkId: string, error: unknown): PipelineFailure {
  if (error instanceof GenerationError) return { artworkId, stage: error.stage, message: error.message };
  return { artworkId, stage: 'api', message: (error as Error)?.message ?? String(error) };
}
