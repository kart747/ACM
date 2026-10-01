import type { CreativeDna, PromptHResponse, SourceType } from '@/lib/creative-dna/schema';
import { MAX_EXPLANATION_WORDS, overconfidentPhrase, type ValidationContext } from '@/lib/creative-dna/validate';
import { describeFindings, lintText, type LintField, type LintResult } from './rules';

/**
 * Hedging linter, document pass. Runs in the build-time pipeline after Prompt D,
 * before and after validation, and before a document is written to
 * src/data/generated/:
 *
 *   rule layer (rules.ts) on every generated text
 *     pass / flag   → kept (flags go to the report)
 *     downgrade     → provenance lowered to ai_inferred, then judged as an interpretation
 *     reject        → item removed; its curated version stays in use
 *     rewrite       → Gemini review (Prompt H) asked for a safer rewrite,
 *                     and the rewrite must pass the rule layer again
 *
 * Prompt D's `overconfident` errors also arrive here as rewrite requests
 * (spec §35: "Downgrade to ai_inferred and hedge") instead of being dropped.
 * Gemini never gets the last word: a rewrite that still fails the rules, or a
 * Gemini "reject", removes the item.
 */

type ItemList = 'elements' | 'techniques' | 'tradition' | 'relationships';

/** What Prompt H is asked to fix. `ref` is stable across validation, e.g. `elements[the-boats].meaning`. */
export interface HedgingRewriteItem {
  ref: string;
  field: LintField;
  source_type: SourceType;
  text: string;
  /** Why the text was sent back: rule findings and/or Prompt D's message. */
  problems: string[];
  /** Word limit the rewrite must respect, where the spec sets one. */
  max_words?: number;
}

export type HedgingRewriter = (items: HedgingRewriteItem[]) => Promise<PromptHResponse>;

/** An item Prompt D marked `overconfident`, addressed by `hedgingKey`. */
export interface HedgingRequest {
  key: string;
  reason: string;
}

export interface HedgingOutcome {
  ref: string;
  outcome: 'flagged' | 'downgraded' | 'rewritten' | 'rejected';
  detail: string;
}

export interface HedgingOptions {
  ctx: ValidationContext;
  /** Prompt H. Without it every rewrite request becomes a rejection. */
  rewrite?: HedgingRewriter;
  /** Items Prompt D flagged as overconfident. */
  requests?: HedgingRequest[];
  /** Report lines are appended here. */
  notes?: string[];
}

export interface HedgingResult {
  dna: CreativeDna;
  outcomes: HedgingOutcome[];
}

export class HedgingRejection extends Error {}

type Item = { source_type: SourceType } & Record<string, unknown>;

const FIELDS: Record<ItemList, LintField[]> = {
  elements: ['meaning'],
  techniques: ['description'],
  tradition: ['description'],
  relationships: ['explanation', 'evidence', 'caveat'],
};

/** The field the load-time validator (validate.ts `OVERCONFIDENT`) also checks for an ai_inferred item. */
const VALIDATOR_CHECKS: Record<ItemList, LintField[]> = {
  elements: ['meaning'],
  techniques: ['description'],
  tradition: [],
  relationships: ['explanation', 'caveat'],
};

/**
 * Stable address of an item, independent of its index (validation can remove
 * items between Prompt D and this pass).
 */
export function hedgingKey(list: ItemList, item: Record<string, unknown>): string {
  switch (list) {
    case 'elements':
      return `elements[${String(item.id)}]`;
    case 'techniques':
      return `techniques[${String(item.name)}]`;
    case 'tradition':
      return 'tradition';
    case 'relationships':
      return `relationships[${String(item.source_element_id ?? '?')}>${String(item.target_artwork_id)}/${String(item.target_element_id ?? '?')}]`;
  }
}

interface Target {
  list: ItemList;
  item: Item;
  key: string;
  recordText: string;
}

function targetsOf(dna: CreativeDna, ctx: ValidationContext): Target[] {
  const record = (id: string) => ctx.artworks.find((a) => a.id === id)?.metadataText ?? '';
  const self = record(dna.artwork.id);
  const t = (list: ItemList, item: Item, recordText = self): Target => ({ list, item, key: hedgingKey(list, item), recordText });
  return [
    ...dna.elements.map((e) => t('elements', e as Item)),
    ...dna.techniques.map((x) => t('techniques', x as Item)),
    t('tradition', dna.tradition as Item),
    // A comparison is about both artworks, so either record can back a date.
    ...dna.relationships.map((r) => t('relationships', r as Item, `${self} ${record(r.target_artwork_id)}`)),
  ];
}

/** Rule layer plus the stricter load-time validator, so nothing accepted here is rejected at load. */
function judge(target: Target, field: LintField, text: string, sourceType: SourceType): LintResult & { problems: string[] } {
  const result = lintText(text, { sourceType, field, recordText: target.recordText });
  const problems = describeFindings(result);
  const phrase =
    result.sourceType === 'ai_inferred' && VALIDATOR_CHECKS[target.list].includes(field) ? overconfidentPhrase(text) : null;
  if (phrase && (result.action === 'pass' || result.action === 'flag')) {
    problems.push(`"${phrase}" is refused by the load-time validator even when negated → rewrite`);
    return { ...result, action: 'rewrite', problems };
  }
  return { ...result, problems };
}

export async function runHedgingLinter(input: CreativeDna, opts: HedgingOptions): Promise<HedgingResult> {
  const dna = structuredClone(input);
  const notes = opts.notes ?? [];
  const outcomes: HedgingOutcome[] = [];
  const drop = new Set<Item>();
  const note = (ref: string, outcome: HedgingOutcome['outcome'], detail: string) => {
    outcomes.push({ ref, outcome, detail });
    notes.push(`Hedging linter ${outcome} ${ref}: ${detail}`);
  };

  const pending: { target: Target; field: LintField; request: HedgingRewriteItem; mustChange: boolean }[] = [];
  const targets = targetsOf(dna, opts.ctx);

  // ---- rule layer ----
  for (const target of targets) {
    for (const field of FIELDS[target.list]) {
      const ref = `${target.key}.${field}`;
      const text = String(target.item[field] ?? '');
      if (!text) continue;
      const result = judge(target, field, text, target.item.source_type);

      if (result.downgraded) {
        note(ref, 'downgraded', `${target.item.source_type} → ai_inferred (${result.problems.join('; ')})`);
        target.item.source_type = 'ai_inferred';
      }
      if (result.action === 'reject') {
        drop.add(target.item);
        note(ref, 'rejected', `${result.problems.join('; ')}; curated text kept`);
      } else if (result.action === 'rewrite') {
        pending.push({ target, field, mustChange: false, request: requestFor(target, field, text, result.problems) });
      } else if (result.action === 'flag' && !result.downgraded) {
        note(ref, 'flagged', result.problems.join('; '));
      }
    }
  }

  // ---- Prompt D "overconfident" → rewrite of the item's main text ----
  for (const r of opts.requests ?? []) {
    const target = targets.find((t) => t.key === r.key);
    if (!target || drop.has(target.item)) continue;
    const field = FIELDS[target.list][0];
    const already = pending.find((p) => p.target === target && p.field === field);
    const problem = `Prompt D: ${r.reason}`;
    if (already) {
      already.request.problems.push(problem);
      already.mustChange = true;
    } else {
      pending.push({
        target,
        field,
        mustChange: true,
        request: requestFor(target, field, String(target.item[field]), [problem]),
      });
    }
  }

  // ---- Gemini review: safer rewrites, re-checked by the rules ----
  const live = pending.filter((p) => !drop.has(p.target.item));
  if (live.length > 0) {
    let response: PromptHResponse | null = null;
    if (opts.rewrite) {
      try {
        response = await opts.rewrite(live.map((p) => p.request));
      } catch (error) {
        notes.push(`Hedging linter: Prompt H failed (${(error as Error).message}); texts needing a rewrite are removed`);
      }
    }
    for (const p of live) {
      const { ref, text: original } = p.request;
      const answer = response?.rewrites.find((r) => r.ref === ref);
      const why = p.request.problems.join('; ');
      if (!answer || answer.action === 'reject' || !answer.text.trim()) {
        drop.add(p.target.item);
        note(ref, 'rejected', `${why}; ${answer ? `Gemini: ${answer.reason}` : 'no safer rewrite available'}; curated text kept`);
        continue;
      }
      const text = answer.text.trim();
      if (p.mustChange && text === original.trim()) {
        drop.add(p.target.item);
        note(ref, 'rejected', `${why}; rewrite left the text unchanged; curated text kept`);
        continue;
      }
      const recheck = judge(p.target, p.field, text, p.target.item.source_type);
      if (recheck.action === 'rewrite' || recheck.action === 'reject' || recheck.downgraded) {
        drop.add(p.target.item);
        note(ref, 'rejected', `${why}; rewrite still fails (${recheck.problems.join('; ')}); curated text kept`);
        continue;
      }
      p.target.item[p.field] = text;
      note(ref, 'rewritten', `${why} — "${original}" → "${text}"`);
    }
  }

  if (drop.has(dna.tradition as Item)) {
    throw new HedgingRejection('tradition rejected by the hedging linter');
  }
  dna.elements = dna.elements.filter((e) => !drop.has(e as Item));
  dna.techniques = dna.techniques.filter((t) => !drop.has(t as Item));
  dna.relationships = dna.relationships.filter((r) => !drop.has(r as Item));
  return { dna, outcomes };
}

function requestFor(target: Target, field: LintField, text: string, problems: string[]): HedgingRewriteItem {
  return {
    ref: `${target.key}.${field}`,
    field,
    source_type: target.item.source_type,
    text,
    problems: [...problems],
    ...(target.list === 'relationships' && field === 'explanation' ? { max_words: MAX_EXPLANATION_WORDS } : {}),
  };
}
