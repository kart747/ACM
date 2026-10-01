import type { SourceType } from '@/lib/creative-dna/schema';

/**
 * Hedging linter, rule layer (spec §9, §17, §35, §40).
 *
 * Checks one piece of generated text against its provenance and decides what
 * the pipeline should do with it. It never rewrites text itself: wording that
 * can be fixed is sent to Gemini for a safer rewrite (see document.ts), and the
 * rewrite has to pass these same rules.
 *
 * Every sentence is classified as
 *   observation            "Both artworks contain circular forms."
 *   interpretation         "The circular forms may create a framing effect."
 *   unsupported_certainty  "The artist intentionally used the circle to symbolize…"
 *
 * and the text as a whole gets one action:
 *   pass     nothing to do
 *   flag     acceptable as written (e.g. hedged lineage); recorded in the report
 *   rewrite  hedgeable overstatement; ask Gemini for a safer rewrite
 *   reject   cannot be made safe by hedging (copying claims, invented history)
 * plus `downgraded` when verified or artist-declared text makes claims its
 * source cannot back, so it is re-checked as `ai_inferred` (§35).
 *
 * Build-time only: imported by the Gemini pipeline, never by the app.
 */

export const HEDGE_CATEGORIES = [
  'intent',
  'certainty',
  'influence',
  'copying',
  'causation',
  'historical',
  'symbolism',
  'factual',
] as const;
export type HedgeCategory = (typeof HEDGE_CATEGORIES)[number];

export type SentenceClass = 'observation' | 'interpretation' | 'unsupported_certainty';
export type LintAction = 'pass' | 'flag' | 'rewrite' | 'reject';
/** Which CreativeDNA field the text comes from. Relationship fields are stricter about influence. */
export type LintField = 'meaning' | 'description' | 'explanation' | 'evidence' | 'caveat';

export interface LintOptions {
  sourceType: SourceType;
  field: LintField;
  /** Lower-cased Met record text for every artwork the claim is about (see `contextFromArtworks`). */
  recordText: string;
}

export interface LintFinding {
  category: HedgeCategory;
  /** The matched wording. */
  phrase: string;
  sentence: string;
  hedged: boolean;
  negated: boolean;
  action: LintAction;
}

export interface LintResult {
  /** The provenance the text may keep: the input, or `ai_inferred` after a downgrade. */
  sourceType: SourceType;
  downgraded: boolean;
  action: LintAction;
  findings: LintFinding[];
  sentences: { text: string; classification: SentenceClass }[];
}

/* ------------------------------------------------------------------ */
/* Vocabulary                                                           */
/* ------------------------------------------------------------------ */

/** Cautious wording (spec §9: "This appears to draw from…"). */
const HEDGE =
  /\b(?:may|might|could|perhaps|possibly|probably|plausibly|likely|arguably|apparently|appears?|appearing|seems?|seemingly|suggests?|suggesting|suggestive|evokes?|evoking|recalls?|hints?|invites?|resembles?|echo(?:es)?|reads? as|one reading|as if|as though|can be (?:read|seen)|could be (?:read|seen))\b/i;

/** Negation before a risky phrase turns it into a caveat: "Nothing here shows that Homer knew this print." */
const NEGATION =
  /\b(?:not|no|never|nothing|none|neither|nor|cannot|without|lacks?|unclear|unknown|uncertain|unproven|whether|rather than|instead of|avoid)\b|n['’]t\b/i;

/** Words after "clearly" that make it an observation ("clearly visible"), not a claim of certainty. */
const VISIBLE =
  /^\s*(?:visible|seen|shown|legible|readable|marked|defined|separated|outlined|lit|drawn|painted|rendered|distinguishable|identifiable|in view)\b/i;

/** Wording that makes an unhedged sentence an interpretation rather than an observation. */
const INTERPRETIVE =
  /\b(?:effect|sense of|impression|feeling|mood|tension|drama|draws? the eye|leads? the eye|emphasi[sz]es?|contrast)\b/i;

/** Sentences that attribute themselves to the museum record. */
const RECORD_ATTRIBUTION = /\b(?:the met|museum|collection) record\b|\baccording to the (?:met|museum|record)\b|\bthe met (?:lists|records|gives|dates|tags)\b/i;

/** Something a copy or influence claim can be about: a person, a work, or a pronoun for either. */
const WORK =
  String.raw`(?:[A-Z][a-z]+|his|her|their|(?:the|this|that)\s+(?:\w+\s+)?(?:work|style|composition|design|print|painting|pose|figure|motif|image|picture|wave|scene)s?)`;

interface Rule {
  category: HedgeCategory;
  pattern: RegExp;
  /** Return false to ignore a match (false-positive guard). */
  accept?: (match: RegExpExecArray, sentence: string) => boolean;
}

const RULES: Rule[] = [
  // ---- intent: speaking for the artist ----
  {
    category: 'intent',
    pattern:
      /\b(?:[Tt]he (?:artist|painter|printmaker|designer)|[Hh]e|[Ss]he|[A-Z][a-z]+)\s+(?:(?:clearly|deliberately|consciously|surely|probably|likely|may have|might have|must have|could have)\s+)?(?:intended|meant|wanted|wished|sought|chose|decided|set out|tried|aimed)\b/g,
  },
  { category: 'intent', pattern: /\b(?:is|are|was|were)\s+(?:\w+\s+)?(?:created|made|painted|designed|intended|meant|conceived|printed)\s+(?:to|in order to|as a way to)\b/gi },
  { category: 'intent', pattern: /\b(?:intentional(?:ly)?|deliberate(?:ly)?|purposeful(?:ly)?|on purpose|consciously)\b/gi },
  { category: 'intent', pattern: /\b(?:the artist['’]?s|his|her|their) (?:intention|intent|purpose|aim|goal|message)\b/gi },
  { category: 'intent', pattern: /\bthe (?:artist|painter) (?:wants|asks|urges|forces) (?:us|the viewer|viewers)\b/gi },

  // ---- certainty ----
  {
    category: 'certainty',
    pattern:
      /\b(?:definitely|definitively|certainly|undoubtedly|unquestionably|indisputably|undeniably|obviously|surely|without (?:a |any )?doubt|beyond (?:any |all )?doubt|no doubt|there is no question|it is certain|must have(?: been)?)\b/gi,
  },
  { category: 'certainty', pattern: /\b(?:prov(?:e|es|ed|en|ing)|proof)\b/gi },
  { category: 'certainty', pattern: /\b(?:confirms?|demonstrates?|establish(?:es)?)\s+that\b/gi },
  {
    category: 'certainty',
    pattern: /\bclearly\b/gi,
    accept: (m, s) => !VISIBLE.test(s.slice(m.index + m[0].length)),
  },
  { category: 'certainty', pattern: /\b(?:the|its|his|her|their) (?:true|real|hidden|actual) (?:meaning|message|subject|significance)\b/gi },

  // ---- influence ----
  { category: 'influence', pattern: /\b(?:influenced|inspired)\s+by\b|\bunder the influence of\b|\binfluence (?:of|from|on)\b/gi },
  { category: 'influence', pattern: /\b(?:drew|draws|draw|drawing)\s+(?:directly\s+)?(?:from|upon)\b/gi },
  { category: 'influence', pattern: /\b(?:drew|draws|draw)\s+on\s+(?:the\s+)?(?:\w+\s+)?(?:tradition|conventions?|work|example|imagery|art|prints?|paintings?|sources?)\b/gi },
  {
    category: 'influence',
    pattern:
      /\b(?:indebted to|owes? (?:a (?:great )?debt|much|something) to|modell?ed (?:on|after)|derived from|learned from|took inspiration|(?:in|an|a) homage to|pays? homage)\b/gi,
  },
  { category: 'influence', pattern: new RegExp(String.raw`\b(?:knew|had seen|would have seen|was aware of|were aware of|studied)\s+(?:of\s+)?${WORK}`, 'g') },

  // ---- copying ----
  { category: 'copying', pattern: /\b(?:copied|copying|plagiari[sz](?:ed|es|ing|m)|stole|stolen|ripped off)\b/gi },
  { category: 'copying', pattern: /\b(?:lifted|borrowed)\s+(?:it |this |that |the \w+ |his \w+ |her \w+ )?from\b/gi },
  { category: 'copying', pattern: new RegExp(String.raw`\b(?:cop(?:y|ies)|imitat(?:ed|es|ing)|replicat(?:ed|es|ing))\s+${WORK}`, 'g') },

  // ---- causation about the artist or history ----
  {
    category: 'causation',
    pattern:
      /\b(?:caused|led (?:him|her|them|the artist|the painter) to|resulted in|as a result of|in response to|in reaction to|prompted (?:him|her|them|the artist)|because (?:he|she|they|the artist|the painter|of (?:his|her|their))|due to (?:his|her|their|the artist)|reflects (?:his|her|their) (?:own )?(?:experience|life|grief|faith|trip|travels|loss|beliefs|politics|views))\b/gi,
  },

  // ---- historical claims (checked against the record below) ----
  {
    category: 'historical',
    pattern:
      /\b(?:commissioned|was exhibited|were exhibited|first shown|was sold|was bought|(?:his|her|their|the) (?:patron|teacher|master|workshop|studio)|apprentice(?:d|ship)?|travell?ed to|visited|during (?:his|her|their) (?:stay|visit|trip|travels|time|years|lifetime|career|exile|illness)|after (?:his|her|their) (?:trip|visit|return|travels|death|marriage|illness)|late in (?:his|her|their) (?:life|career)|at (?:the|that) time|in (?:his|her|their) (?:youth|old age|final years|last years|later years)|contemporary audiences|was (?:well[- ])?received|critics (?:praised|attacked|called))\b/gi,
  },

  // ---- symbolism ----
  {
    category: 'symbolism',
    pattern:
      /\b(?:symboli[sz](?:es|ed|e|ing)|symbolic of|(?:a|the) symbol of|stands? for|signif(?:ies|y)|embod(?:ies|y)|allegor(?:y|ical|ically|i[sz]es)|(?:a )?metaphor for|personif(?:ies|y|ication of))\b/gi,
    // "stands for a moment" is posture, not symbolism.
    accept: (m, s) => !/^\s*(?:a (?:moment|while|time|second)|\d|hours|minutes|long)\b/i.test(s.slice(m.index + m[0].length)),
  },
  {
    category: 'symbolism',
    pattern:
      /\brepresents?\s+(?:the |a |an |his |her |their )?(?:idea|concept|notion|spirit|soul|fate|death|life|hope|faith|eternity|purity|innocence|power|struggle|triumph|mortality|divinity|divine|virtue|humility|prosperity|freedom|salvation|redemption|humanity|nation|america|japan)\b/gi,
  },

  // ---- unsupported statements of fact about the world ----
  {
    category: 'factual',
    pattern:
      /\b(?:most (?:famous|important|influential|celebrated|reproduced|iconic|recogni[sz]able|significant|admired)|best[- ]known|world[- ]famous|masterpiece|(?:the )?(?:first|only|earliest|greatest) (?:artist|painter|printmaker|work|painting|print|image|picture) (?:to|ever|of|in)|(?:scholars|historians|critics|experts) (?:agree|believe|say|consider|have (?:shown|argued|noted))|it is (?:well[- ])?known that|it is a fact that|as everyone knows|widely (?:regarded|considered|believed|recogni[sz]ed|acknowledged)|is (?:famous|renowned|celebrated|known) for)\b/gi,
  },
];

const YEAR = /\b(1[0-9]{3}|20[0-9]{2})s?\b/g;
const ORDINALS = [
  'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
  'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth',
  'eighteenth', 'nineteenth', 'twentieth',
];
const CENTURY = new RegExp(String.raw`\b(\d{1,2})(?:st|nd|rd|th)[- ]century\b|\b(${ORDINALS.join('|')})[- ]century\b`, 'gi');

/** Categories that cannot be true of an external record or artist statement unless it says so. */
const NOT_VERIFIABLE: HedgeCategory[] = ['intent', 'influence', 'copying', 'causation', 'historical', 'symbolism', 'factual'];
/** An artist may state their own intent and meaning (spec §9 "Artist Declared"). */
const ARTIST_MAY_STATE: HedgeCategory[] = ['intent', 'symbolism', 'causation'];

const SEVERITY: Record<LintAction, number> = { pass: 0, flag: 1, rewrite: 2, reject: 3 };

/* ------------------------------------------------------------------ */
/* Linting                                                              */
/* ------------------------------------------------------------------ */

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z“"‘'(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** The clause around `index`: the text between the nearest ; : — – or "but" boundaries. */
function clauseAround(sentence: string, index: number): { before: string; clause: string } {
  const boundary = /[;:—–]|,?\s+but\s+/g;
  let start = 0;
  let end = sentence.length;
  for (const m of sentence.matchAll(boundary)) {
    if (m.index! + m[0].length <= index) start = m.index! + m[0].length;
    else if (m.index! >= index) {
      end = m.index!;
      break;
    }
  }
  return { before: sentence.slice(start, index), clause: sentence.slice(start, end) };
}

function isNegated(before: string): boolean {
  // Only the last ten words before the phrase count, so a "not" earlier in a long clause is ignored.
  return NEGATION.test(before.split(/\s+/).slice(-10).join(' '));
}

function yearsIn(text: string): number[] {
  return [...text.matchAll(YEAR)].map((m) => Number(m[1]));
}

/** True when the record contains a year inside the named century. */
function centuryInRecord(match: RegExpMatchArray, recordText: string): boolean {
  const n = match[1] ? Number(match[1]) : ORDINALS.indexOf(match[2].toLowerCase()) + 1;
  return yearsIn(recordText).some((y) => y > (n - 1) * 100 && y <= n * 100);
}

/** Record-backed: attributed to the record, and every year it names is in the record. */
function recordBacked(sentence: string, recordText: string): boolean {
  return RECORD_ATTRIBUTION.test(sentence) && yearsIn(sentence).every((y) => recordText.includes(String(y)));
}

function actionFor(
  category: HedgeCategory,
  hedged: boolean,
  field: LintField,
): LintAction {
  const relationship = field === 'explanation' || field === 'evidence' || field === 'caveat';
  switch (category) {
    case 'copying':
      // An accusation of copying stays an accusation when hedged (spec §17 Prompt C).
      return 'reject';
    case 'historical':
      // Invented history is removed; speculative history can be reworded away.
      return hedged ? 'rewrite' : 'reject';
    case 'influence':
      // Hedged lineage is the spec's own model ("This appears to draw from…"), but
      // a relationship between two artworks must not claim influence at all.
      return hedged && !relationship ? 'flag' : 'rewrite';
    case 'intent':
    case 'certainty':
    case 'factual':
      // Hedging does not rescue these: "may have intended" still speaks for the artist.
      return 'rewrite';
    case 'causation':
      return hedged ? 'flag' : 'rewrite';
    case 'symbolism':
      // "may symbolize" is a cautious interpretation, which is what ARTSCAPE wants.
      return hedged ? 'pass' : 'rewrite';
  }
}

function findingsIn(sentence: string, opts: LintOptions): LintFinding[] {
  const findings: LintFinding[] = [];
  const seen = new Set<string>();
  const add = (category: HedgeCategory, phrase: string, index: number) => {
    const key = `${category}@${index}`;
    if (seen.has(key)) return;
    seen.add(key);
    const { before, clause } = clauseAround(sentence, index);
    const negated = isNegated(before);
    const hedged = HEDGE.test(clause);
    const action = negated ? 'pass' : actionFor(category, hedged, opts.field);
    findings.push({ category, phrase, sentence, hedged, negated, action });
  };

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    for (const m of sentence.matchAll(rule.pattern)) {
      if (rule.accept && !rule.accept(m as RegExpExecArray, sentence)) continue;
      if (rule.category === 'historical' && recordBacked(sentence, opts.recordText)) continue;
      add(rule.category, m[0], m.index!);
    }
  }

  // Dates the record does not contain are invented history.
  for (const m of sentence.matchAll(YEAR)) {
    if (!opts.recordText.includes(m[1])) add('historical', m[0], m.index!);
  }
  for (const m of sentence.matchAll(CENTURY)) {
    if (!centuryInRecord(m, opts.recordText)) add('historical', m[0], m.index!);
  }
  return findings;
}

function classify(sentence: string, findings: LintFinding[]): SentenceClass {
  if (findings.some((f) => SEVERITY[f.action] >= SEVERITY.rewrite)) return 'unsupported_certainty';
  if (HEDGE.test(sentence) || INTERPRETIVE.test(sentence) || findings.some((f) => !f.negated)) return 'interpretation';
  return 'observation';
}

function lintAs(text: string, opts: LintOptions): Omit<LintResult, 'downgraded'> {
  const sentences = splitSentences(text);
  const findings: LintFinding[] = [];
  const classified = sentences.map((s) => {
    const f = findingsIn(s, opts);
    findings.push(...f);
    return { text: s, classification: classify(s, f) };
  });
  const action = findings.reduce<LintAction>((worst, f) => (SEVERITY[f.action] > SEVERITY[worst] ? f.action : worst), 'pass');
  return { sourceType: opts.sourceType, action, findings, sentences: classified };
}

/**
 * Lint one generated text.
 *
 * `ai_inferred` text is held to the hedging rules directly. Verified and
 * artist-declared text may state facts plainly, but when it makes a claim its
 * source cannot back (intent, influence, history outside the record…) it is
 * downgraded to `ai_inferred` and re-checked as an interpretation. Provenance
 * is only ever lowered here, never raised.
 */
export function lintText(text: string, opts: LintOptions): LintResult {
  if (opts.sourceType === 'ai_inferred') return { ...lintAs(text, opts), downgraded: false };

  const asInterpretation = lintAs(text, { ...opts, sourceType: 'ai_inferred' });
  const allowed = opts.sourceType === 'artist_declared' ? ARTIST_MAY_STATE : [];
  const unbacked = asInterpretation.findings.filter(
    (f) => !f.negated && NOT_VERIFIABLE.includes(f.category) && !allowed.includes(f.category),
  );
  if (unbacked.length === 0) {
    // Facts from the record or the artist may be stated without hedging.
    return {
      sourceType: opts.sourceType,
      downgraded: false,
      action: 'pass',
      findings: asInterpretation.findings.map((f) => ({ ...f, action: 'pass' as const })),
      sentences: asInterpretation.sentences.map((s) => ({ ...s, classification: 'observation' as const })),
    };
  }
  const action = SEVERITY[asInterpretation.action] > SEVERITY.flag ? asInterpretation.action : 'flag';
  return { ...asInterpretation, sourceType: 'ai_inferred', downgraded: true, action };
}

/** One line per actionable finding, for the generation report and the rewrite request. */
export function describeFindings(result: LintResult): string[] {
  return result.findings
    .filter((f) => f.action !== 'pass')
    .map((f) => `${f.category} "${f.phrase}"${f.hedged ? ' (hedged)' : ''} → ${f.action}`);
}
