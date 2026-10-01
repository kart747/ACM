import { describe, expect, it } from 'vitest';
import { artworks } from '@/data/collection';
import {
  experienceReducer,
  initialState,
  type ExperienceAction,
  type ExperienceState,
} from '@/lib/experience-state';
import { buildJourneyPath, isJourneyComplete } from '@/lib/journey';

const run = (state: ExperienceState, ...actions: ExperienceAction[]) =>
  actions.reduce(experienceReducer, state);

/** One hop along the currently offered connection, as the travel stage performs it. */
const hop = (state: ExperienceState) =>
  run(state, { type: 'travel-start' }, { type: 'travel-phase', phase: 'flying' }, { type: 'travel-complete' });

const entered = () => run(initialState, { type: 'enter' }, { type: 'select-motif', motifId: 'the-boats' });

/** Hokusai → Homer → Gerard David → Vermeer → Rembrandt, the default forward route. */
function fullJourney() {
  let state = entered();
  for (let i = 0; i < 4; i++) state = hop(state);
  return state;
}

describe('Step Inside', () => {
  it('starts on the opening screen and ignores the experience until entered', () => {
    expect(initialState.entered).toBe(false);
    const state = run(initialState, { type: 'select-motif', motifId: 'the-boats' }, { type: 'travel-start' });
    expect(state).toBe(initialState);
    const inside = run(initialState, { type: 'enter' });
    expect(inside.entered).toBe(true);
    expect(run(inside, { type: 'select-motif', motifId: 'the-boats' }).selectedMotifId).toBe('the-boats');
  });
});

describe('Your path', () => {
  it('opens by itself on the hop that reaches the last unvisited work', () => {
    let state = entered();
    for (let i = 0; i < 3; i++) {
      state = hop(state);
      expect(state.showPath).toBe(false);
    }
    expect(isJourneyComplete(state.trail, artworks)).toBe(false);
    state = hop(state);
    expect(state.currentArtworkId).toBe('self-portrait');
    expect(isJourneyComplete(state.trail, artworks)).toBe(true);
    expect(state.showPath).toBe(true);
  });

  it('cannot be opened for a partial journey', () => {
    const partial = hop(hop(entered()));
    expect(run(partial, { type: 'open-path' }).showPath).toBe(false);
  });

  it('describes the route: creators, details followed and relationship types', () => {
    const path = buildJourneyPath(fullJourney().trail, artworks);
    expect(path.stops.map((s) => s.artwork.creator.name)).toEqual([
      'Katsushika Hokusai',
      'Winslow Homer',
      'Gerard David',
      'Johannes Vermeer',
      'Rembrandt van Rijn',
    ]);
    expect(path.legs.every((l) => l.continuous)).toBe(true);
    expect(path.legs[0]).toMatchObject({ relationshipType: 'shared_motif' });
    expect(path.legs[0].fromMotif.label).toBe('The Boats in the Trough');
    expect(path.legs[0].toMotif.label).toBe('The Sailor on the Drifting Boat');
    expect(path.legs.map((l) => l.relationshipType)).toEqual([
      'shared_motif',
      'thematic_echo',
      'similar_technique',
      'similar_technique',
    ]);
  });

  it('returns to a stop, keeps the trail, and does not reopen on later hops', () => {
    const done = fullJourney();
    const back = run(done, { type: 'visit', artworkId: 'gulf-stream', motifId: 'sailor-and-boat' });
    expect(back.showPath).toBe(false);
    expect(back.currentArtworkId).toBe('gulf-stream');
    expect(back.trail).toEqual(done.trail);

    const onward = hop(back);
    expect(onward.showPath).toBe(false);
    expect(run(onward, { type: 'open-path' }).showPath).toBe(true);
  });

  it('marks a leg that was not travelled, after returning through the trail', () => {
    // Hokusai → Homer → David, return to Homer's sharks, travel on to Hokusai.
    let state = hop(hop(entered()));
    state = run(state, { type: 'visit', artworkId: 'gulf-stream', motifId: 'sharks' });
    state = hop(state);
    const path = buildJourneyPath(state.trail, artworks);
    expect(path.stops.map((s) => s.artwork.id)).toEqual([
      'great-wave',
      'gulf-stream',
      'adoration-of-magi',
      'gulf-stream',
      'great-wave',
    ]);
    expect(path.legs.map((l) => l.continuous)).toEqual([true, true, false, true]);
    expect(path.stops[3].motif.id).toBe('sharks');
  });

  it('restart clears the journey and returns to the opening screen', () => {
    const state = run(fullJourney(), { type: 'toggle-tuner' }, { type: 'restart' });
    expect(state).toEqual({ ...initialState, showTuner: true });
  });
});
