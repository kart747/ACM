import { z } from 'zod';

/**
 * CreativeDNA, as specified in Artscape.md §16.
 *
 * Every field the spec lists is here with the spec's name and shape. Five
 * fields on relationships are marked EXTENSION: the spec's relationship only
 * names a target artwork, but the Motif Travels journey needs to know which
 * element it leaves from and lands on, and §27 requires evidence for every
 * relationship, and `agreement` records the multi-run check. They are
 * optional in the schema so a spec-exact document still parses; the
 * validator requires them before a relationship reaches the UI.
 */

export const SOURCE_TYPES = ['artist_declared', 'externally_verified', 'ai_inferred'] as const;
export const RELATIONSHIP_TYPES = [
  'similar_technique',
  'shared_motif',
  'same_tradition',
  'thematic_echo',
] as const;
/** Prompt A (§17) identifies motifs, characters, techniques and materials. */
export const ELEMENT_TYPES = ['motif', 'character', 'object', 'inscription', 'technique', 'material'] as const;

export const SourceTypeSchema = z.enum(SOURCE_TYPES);
export const RelationshipTypeSchema = z.enum(RELATIONSHIP_TYPES);

/** Normalized 0–1 point (§16 `location`, §20 "coordinates between 0 and 1"). */
export const LocationSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const ElementSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(ELEMENT_TYPES),
  location: LocationSchema,
  meaning: z.string().min(1),
  source_type: SourceTypeSchema,
  source_detail: z.string().min(1),
});

export const TechniqueSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  source_type: SourceTypeSchema,
});

export const TraditionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  source_type: SourceTypeSchema,
});

/** Independent Prompt C runs per relationship (research report, "multi-run verification"). */
export const AGREEMENT_RUNS = 5;
/** A generated relationship is kept only when a majority of all runs agree it is supported. */
export const AGREEMENT_MIN_AGREEING = Math.floor(AGREEMENT_RUNS / 2) + 1;

/**
 * How many independent runs reached the same conclusion: that the images
 * support the curator-approved relationship. Measured, unlike `confidence`,
 * which is one run's self-assessment.
 */
export const AgreementSchema = z
  .object({
    /** Runs attempted. */
    runs: z.number().int().positive(),
    /** Valid runs that concluded `supported: true`. */
    agreeing: z.number().int().min(0),
    /** Runs that errored or returned output that failed parsing or schema validation. */
    failed: z.number().int().min(0),
  })
  .refine((a) => a.agreeing + a.failed <= a.runs, {
    message: 'agreeing + failed cannot exceed runs',
  });

export const RelationshipSchema = z.object({
  target_artwork_id: z.string().min(1),
  relationship_type: RelationshipTypeSchema,
  explanation: z.string().min(1),
  source_type: SourceTypeSchema,
  confidence: z.number().min(0).max(1),
  /** EXTENSION: element in this artwork the relationship leaves from. */
  source_element_id: z.string().min(1).optional(),
  /** EXTENSION: element in the target artwork it lands on. */
  target_element_id: z.string().min(1).optional(),
  /** EXTENSION (§27 "evidence"): what is observable in both images. */
  evidence: z.string().min(1).optional(),
  /** EXTENSION: what the pairing does not establish. */
  caveat: z.string().min(1).optional(),
  /** EXTENSION: multi-run agreement on the relationship conclusion. */
  agreement: AgreementSchema.optional(),
});

export const ArtworkRefSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  region_or_tradition: z.string().min(1),
  image_url: z.string().min(1),
});

/** Not part of §16: records how and when the document was produced. */
export const GenerationSchema = z.object({
  model: z.string().min(1),
  generated_at: z.string().min(1),
  prompt_versions: z.record(z.string(), z.string()),
  /** Items Prompt D or the validator removed or downgraded, for the report. */
  notes: z.array(z.string()),
});

export const StoryBeatSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  element_id: z.string().trim().min(1).max(80).nullable(),
  title: z.string().trim().min(1).max(100),
  short_text: z.string().trim().min(1).max(240),
  explanation: z.string().trim().min(1).max(800),
  duration: z.number().int().min(6).max(20),
  source_type: SourceTypeSchema,
  source_refs: z.array(z.string().trim().min(1).max(80)).min(1).max(12),
}).strict();

export const StorySchema = z.object({
  intro: z.string().trim().min(1).max(600),
  beats: z.array(StoryBeatSchema).min(3).max(5),
}).strict().superRefine((story, ctx) => {
  const ids = new Set<string>();
  story.beats.forEach((beat, index) => {
    if (ids.has(beat.id)) ctx.addIssue({ code: 'custom', path: ['beats', index, 'id'], message: 'Beat IDs must be unique.' });
    ids.add(beat.id);
    const endpoint = index === 0 || index === story.beats.length - 1;
    if (endpoint !== (beat.element_id === null)) {
      ctx.addIssue({ code: 'custom', path: ['beats', index, 'element_id'], message: 'Scene and invitation have no element; detail beats require an element.' });
    }
    if (new Set(beat.source_refs).size !== beat.source_refs.length) {
      ctx.addIssue({ code: 'custom', path: ['beats', index, 'source_refs'], message: 'Evidence references must be unique.' });
    }
    if (beat.element_id && !beat.source_refs.includes(beat.element_id)) {
      ctx.addIssue({ code: 'custom', path: ['beats', index, 'source_refs'], message: 'Detail evidence must include its element.' });
    }
  });
});

export type StoryBeat = z.infer<typeof StoryBeatSchema>;
export type Story = z.infer<typeof StorySchema>;

export const CreativeDnaSchema = z.object({
  artwork: ArtworkRefSchema,
  elements: z.array(ElementSchema),
  techniques: z.array(TechniqueSchema),
  tradition: TraditionSchema,
  relationships: z.array(RelationshipSchema),
  generation: GenerationSchema.optional(),
  story: StorySchema.optional(),
}).superRefine((document, ctx) => {
  const elementIds = new Set(document.elements.map(element => element.id));
  document.story?.beats.forEach((beat, index) => {
    if (beat.element_id && !elementIds.has(beat.element_id)) {
      ctx.addIssue({ code: 'custom', path: ['story', 'beats', index, 'element_id'], message: 'Unknown story element.' });
    }
    if (beat.source_refs.some(ref => ref !== 'museum_record' && !elementIds.has(ref))) {
      ctx.addIssue({ code: 'custom', path: ['story', 'beats', index, 'source_refs'], message: 'Unknown story evidence.' });
    }
  });
});

export type SourceType = z.infer<typeof SourceTypeSchema>;
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;
export type CreativeDnaElement = z.infer<typeof ElementSchema>;
export type CreativeDnaTechnique = z.infer<typeof TechniqueSchema>;
export type CreativeDnaTradition = z.infer<typeof TraditionSchema>;
export type CreativeDnaRelationship = z.infer<typeof RelationshipSchema>;
export type Agreement = z.infer<typeof AgreementSchema>;
export type CreativeDna = z.infer<typeof CreativeDnaSchema>;

/* ---------- Per-prompt response shapes (what Gemini is asked to return) ---------- */

/** Prompt A: one entry per supplied motif. */
export const PromptAResponseSchema = z.object({
  elements: z.array(ElementSchema),
});

/** Prompt B. */
export const PromptBResponseSchema = z.object({
  techniques: z.array(TechniqueSchema),
  tradition: TraditionSchema,
});

/** Prompt C: the explanation of one human-approved relationship. */
export const PromptCResponseSchema = z.object({
  /** False when the model cannot see the stated relationship in the images. */
  supported: z.boolean(),
  explanation: z.string().min(1),
  evidence: z.string().min(1),
  caveat: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const SANITY_ISSUE_KINDS = [
  'coordinates',
  'missing_field',
  'unsupported_verified',
  'overconfident',
  'invented_fact',
  'invalid_relationship',
] as const;

/** Prompt D. `path` addresses an item, e.g. `elements[2]` or `relationships[0]`. */
export const PromptDResponseSchema = z.object({
  issues: z.array(
    z.object({
      path: z.string().min(1),
      kind: z.enum(SANITY_ISSUE_KINDS),
      severity: z.enum(['error', 'warning']),
      message: z.string().min(1),
    }),
  ),
});

/**
 * Prompt H (hedging review): safer rewrites for the texts the hedging linter
 * could not accept. `ref` echoes the request, e.g. `elements[the-boats].meaning`.
 */
export const PromptHResponseSchema = z.object({
  rewrites: z.array(
    z.object({
      ref: z.string().min(1),
      /** "reject" when no cautious version keeps anything worth saying. */
      action: z.enum(['rewrite', 'reject']),
      /** The rewritten text; empty when rejected. */
      text: z.string(),
      reason: z.string().min(1),
    }),
  ),
});

export type PromptAResponse = z.infer<typeof PromptAResponseSchema>;
export type PromptBResponse = z.infer<typeof PromptBResponseSchema>;
export type PromptCResponse = z.infer<typeof PromptCResponseSchema>;
export type PromptDResponse = z.infer<typeof PromptDResponseSchema>;
export type SanityIssue = PromptDResponse['issues'][number];
export type PromptHResponse = z.infer<typeof PromptHResponseSchema>;
