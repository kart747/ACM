import { describe, expect, it } from 'vitest';
import { V2_ARTWORKS, V2_ELEMENTS } from '@/data/artworks-v2';
import { StorySchema, validateStory } from '@/lib/story/schema';
import { prepareStory } from '@/lib/story/prepared';

const artwork = V2_ARTWORKS[0];
const elements = V2_ELEMENTS[artwork.id];
function generated() {
  const story = prepareStory(artwork, elements);
  story.intro = 'Follow a few visible details across the scene.';
  for (const beat of story.beats) beat.explanation = beat.element_id ? 'Look at the outlines and nearby areas of color.' : 'Look across the whole image and choose a detail to explore.';
  return story;
}

describe('guided story validation', () => {
  it('prepares a deterministic, contextual offline guide for every artwork', () => {
    for (const item of V2_ARTWORKS) {
      const regions = V2_ELEMENTS[item.id];
      const story = prepareStory(item, regions);
      expect(story).toEqual(prepareStory(item, regions));
      expect(validateStory(story, item, regions, false)).toEqual(story);
      expect(story.beats[0].explanation).toBe(item.description);
      expect(story.beats.filter(beat => beat.element_id).map(beat => beat.explanation)).toEqual(regions.slice(0, 3).map(element => element.meaning.text));
      expect(story.beats.every(beat => beat.source_type === 'ai_inferred')).toBe(true);
    }
  });

  it('accepts a bounded story and rejects foreign contextual IDs and references', () => {
    expect(validateStory(generated(), artwork, elements)).not.toBeNull();
    const foreign = generated();
    foreign.beats[1].element_id = 'elem_002_01';
    foreign.beats[1].source_refs = ['elem_002_01'];
    expect(validateStory(foreign, artwork, elements)).toBeNull();
    const evidence = generated();
    evidence.beats[0].source_refs = ['https://invented.example'];
    expect(validateStory(evidence, artwork, elements)).toBeNull();
  });

  it('requires scene, actual details, a final invitation, and unique IDs', () => {
    const story = generated();
    story.beats[0].element_id = elements[0].id;
    expect(StorySchema.safeParse(story).success).toBe(false);
    const duplicate = generated();
    duplicate.beats[1].id = duplicate.beats[0].id;
    expect(StorySchema.safeParse(duplicate).success).toBe(false);
    const missingEvidence = generated();
    missingEvidence.beats[1].source_refs = ['museum_record'];
    expect(StorySchema.safeParse(missingEvidence).success).toBe(false);
    const noInvitation = generated();
    noInvitation.beats.at(-1)!.short_text = 'The end.';
    noInvitation.beats.at(-1)!.explanation = 'The scene is complete.';
    expect(validateStory(noInvitation, artwork, elements)).toBeNull();
  });

  it.each([5, 21, 8.5])('rejects duration %s', duration => {
    const story = generated();
    story.beats[0].duration = duration;
    expect(StorySchema.safeParse(story).success).toBe(false);
  });

  it('bounds text, number of beats, and extra fields', () => {
    expect(StorySchema.safeParse({ ...generated(), intro: 'a'.repeat(601) }).success).toBe(false);
    expect(StorySchema.safeParse({ ...generated(), beats: generated().beats.slice(0, 2) }).success).toBe(false);
    expect(StorySchema.safeParse({ ...generated(), prompt: 'override' }).success).toBe(false);
  });

  it.each(['artist_declared', 'externally_verified'] as const)('rejects model provenance %s', source_type => {
    const story = generated();
    story.beats[1].source_type = source_type;
    expect(validateStory(story, artwork, elements)).toBeNull();
  });

  it.each([
    'The peacock symbolizes immortality.',
    'The artist intended to express divine power.',
    'This painting was influenced by Japanese art.',
    'The artist said the bird means freedom.',
    'The museum has verified the spiritual meaning.',
    'This may be a garden; the bird symbolizes immortality.',
    'The artist may have declared that this means freedom.',
  ])('rejects unsupported prose: %s', text => {
    const story = generated();
    story.beats[1].explanation = text;
    expect(validateStory(story, artwork, elements)).toBeNull();
  });

  it('allows a locally hedged visual interpretation', () => {
    const story = generated();
    story.beats[1].explanation = 'The contrast may draw the eye toward the figures.';
    expect(validateStory(story, artwork, elements)).not.toBeNull();
  });
});
