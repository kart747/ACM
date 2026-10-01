import { AGREEMENT_MIN_AGREEING, AGREEMENT_RUNS, type Agreement, type PromptCResponse } from '@/lib/creative-dna/schema';

/**
 * Multi-run agreement for Prompt C (research report, "multi-run verification").
 *
 * The same request — same images, records, CreativeDNA context and
 * curator-approved relationship type — is sent AGREEMENT_RUNS times as
 * separate calls. No run sees another run's output, and a run gets no retry
 * with feedback: a run that errors or returns output that does not parse or
 * validate is a failed run. The conclusion voted on is `supported`: whether the
 * images support the stated relationship. Free text is not compared.
 *
 * This is build-time only (`runAgreement` in generate.ts); the app reads the
 * stored result.
 */

/** Sampling temperature for agreement runs, so independent runs can actually differ. */
export const AGREEMENT_TEMPERATURE = 1;

export type RunOutcome = { ok: true; response: PromptCResponse } | { ok: false; error: string };

export interface AgreementResult {
  agreement: Agreement;
  /** True when at least AGREEMENT_MIN_AGREEING of all runs concluded `supported`. */
  accepted: boolean;
  /** The first agreeing run, whose text is stored. Present when `accepted`. */
  representative?: PromptCResponse;
  /** Why runs failed, for the generation report. */
  errors: string[];
}

export function scoreAgreement(outcomes: RunOutcome[]): AgreementResult {
  const supporting = outcomes.flatMap((o) => (o.ok && o.response.supported ? [o.response] : []));
  const errors = outcomes.flatMap((o) => (o.ok ? [] : [o.error]));
  const agreement: Agreement = { runs: outcomes.length, agreeing: supporting.length, failed: errors.length };
  const accepted = outcomes.length === AGREEMENT_RUNS && supporting.length >= AGREEMENT_MIN_AGREEING;
  return { agreement, accepted, representative: accepted ? supporting[0] : undefined, errors };
}

export function formatAgreement(a: Agreement): string {
  return `${a.agreeing}/${a.runs} runs agree${a.failed ? `, ${a.failed} failed` : ''}`;
}
