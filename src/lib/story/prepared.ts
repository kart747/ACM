import type { V2Artwork, V2Element } from '@/data/artworks-v2';
import { StorySchema, type Story } from '@/lib/creative-dna/schema';

export function prepareStory(artwork: V2Artwork, elements: V2Element[]): Story {
  return StorySchema.parse({
    intro: `Take a closer look at ${artwork.title}. This prepared guide follows the catalog and curated visual observations.`,
    beats: [
      {
        id: 'scene', element_id: null, title: 'Begin with the whole scene',
        short_text: 'Let your eyes move across the image before focusing on a detail.',
        explanation: artwork.description,
        duration: 12, source_type: 'ai_inferred', source_refs: ['museum_record'],
      },
      ...elements.slice(0, 3).map((element, index) => ({
        id: `detail_${index + 1}`, element_id: element.id, title: element.label,
        short_text: `Look closely: ${element.label}.`, explanation: element.meaning.text,
        duration: 12, source_type: 'ai_inferred' as const, source_refs: [element.id],
      })),
      {
        id: 'invitation', element_id: null, title: 'Keep looking',
        short_text: 'Which detail would you like to explore next?',
        explanation: 'Return to the whole image, then choose a highlighted detail. These visual readings are interpretations, not statements of the artist’s intent.',
        duration: 10, source_type: 'ai_inferred', source_refs: elements.slice(0, 3).map(element => element.id),
      },
    ],
  });
}
