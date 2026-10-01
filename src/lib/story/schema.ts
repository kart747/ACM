import { StorySchema, type Story } from '@/lib/creative-dna/schema';
import type { V2Artwork, V2Element } from '@/data/artworks-v2';
import { lintText } from '@/lib/hedging/rules';
import { sourceRecordRef } from '@/lib/artwork-sources';

export { StorySchema, StoryBeatSchema } from '@/lib/creative-dna/schema';
export type { Story, StoryBeat } from '@/lib/creative-dna/schema';

export type StoryReason = 'not_configured' | 'generation_failed' | 'invalid_response' | 'rate_limited' | 'configuration_error';
export interface StoryResponse {
  artworkId: string;
  story: Story;
  source: 'gemini' | 'cache' | 'prepared';
  model: 'gemini-3.8-flash' | null;
  reason?: StoryReason;
  generatedAt?: string;
}

// Model-authored attribution is not independent evidence, even when hedged.
const INVENTED_ATTRIBUTION = /\b(?:artist|painter|printmaker|creator)\s+(?:(?:has|had|once|reportedly|explicitly|may have)\s+)*(?:said|stated|declared|wrote|explained|confirmed|told)\b|\baccording to (?:the )?(?:artist|painter|creator)\b|\bartist['’]s (?:statement|words|diary|letters?)\b|\b(?:artist[- ]declared|externally[- ]verified|independently[- ]verified)\b|\b(?:museum|scholars?|historians?|experts?)\s+(?:has\s+|have\s+)?(?:confirmed|verified|proved|established|agree)\b|\b(?:verified|confirmed|proven) by (?:the )?(?:museum|met|scholars?|historians?|experts?)\b/i;
const UNSUPPORTED_CLAIM = /\b(?:symboli[sz](?:es?|ed|ing)|represents?|signifies|stands? for|influenced by|inspired by|intended|wanted|meant to|deliberately)\b/i;
const CAUTION = /\b(?:may|might|could|perhaps|appears?|seems?|suggests?|not|no|cannot|without|rather than|doesn't|isn't)\b/i;

export function validateStory(value: unknown, artwork: V2Artwork, elements: V2Element[], generated = true): Story | null {
  const parsed = StorySchema.safeParse(value);
  if (!parsed.success) return null;
  const story = parsed.data;
  const ids = new Set(elements.map(element => element.id));
  for (const beat of story.beats) {
    if (beat.element_id && !ids.has(beat.element_id)) return null;
    if (beat.source_refs.some(ref => ref !== sourceRecordRef(artwork) && !ids.has(ref))) return null;
    if (generated && beat.source_type !== 'ai_inferred') return null;
  }
  const invitation = story.beats.at(-1)!;
  if (!/\b(?:look|notice|explore|return|linger|consider|choose|discover|find|follow|see|wonder|what|which|where|take|pause)\b/i.test(`${invitation.short_text} ${invitation.explanation}`)) return null;
  if (generated) {
    const recordText = [artwork.title, artwork.creator, artwork.year, artwork.medium, artwork.tradition, artwork.region].join(' ').toLowerCase();
    const texts = [story.intro, ...story.beats.flatMap(beat => [beat.title, beat.short_text, beat.explanation])];
    for (const text of texts) {
      if (INVENTED_ATTRIBUTION.test(text)) return null;
      // A hedge in a separate clause must not excuse an unsupported assertion.
      for (const clause of text.split(/[.!?;]|\bbut\b|\bhowever\b/i)) {
        if (UNSUPPORTED_CLAIM.test(clause) && !CAUTION.test(clause)) return null;
        const result = lintText(clause, { sourceType: 'ai_inferred', field: 'explanation', recordText });
        if (result.action === 'reject' || result.action === 'rewrite') return null;
      }
    }
  }
  return story;
}
