'use client';

import { createContext, useContext, useMemo, useReducer } from 'react';
import type { Artwork, Motif, MotifConnection } from './types';
import type { NormalizedPoint } from './segmentation/types';
import { artworks } from '@/data/collection';
import { isJourneyComplete } from './journey';

export type TravelPhase = 'idle' | 'lifting' | 'flying' | 'landing';

export interface TravelStep {
  fromArtworkId: string;
  fromMotifId: string;
  toArtworkId: string;
  toMotifId: string;
}

export interface ExperienceState {
  /** False while the opening "Step Inside" screen is showing. */
  entered: boolean;
  currentArtworkId: string;
  selectedMotifId: string | null;
  /** Where on the artwork the viewer clicked to select it; null for keyboard, panel or travel. */
  selectionPoint: NormalizedPoint | null;
  /** Explicit choice among the selected motif's connections; null = default. */
  connectionIndex: number | null;
  /** Where the viewer came from when the current selection was reached by travel. */
  arrivedFromArtworkId: string | null;
  travelPhase: TravelPhase;
  /** Only set while a journey is in flight. */
  travel: { toArtworkId: string; toMotifId: string } | null;
  /** Completed journeys, oldest first. */
  trail: TravelStep[];
  /** The "Your path" card; opens by itself on the hop that completes the collection. */
  showPath: boolean;
  showTuner: boolean;
}

export type ExperienceAction =
  | { type: 'enter' }
  | { type: 'restart' }
  | { type: 'open-path' }
  | { type: 'close-path' }
  | { type: 'select-artwork'; artworkId: string }
  | { type: 'select-motif'; motifId: string; point?: NormalizedPoint | null }
  | { type: 'visit'; artworkId: string; motifId: string }
  | { type: 'choose-connection'; index: number }
  | { type: 'clear-motif' }
  | { type: 'travel-start' }
  | { type: 'travel-phase'; phase: TravelPhase }
  | { type: 'travel-complete' }
  | { type: 'travel-cancel' }
  | { type: 'toggle-tuner' };

export const initialState: ExperienceState = {
  entered: false,
  currentArtworkId: artworks[0].id,
  selectedMotifId: null,
  selectionPoint: null,
  connectionIndex: null,
  arrivedFromArtworkId: null,
  travelPhase: 'idle',
  travel: null,
  trail: [],
  showPath: false,
  showTuner: false,
};

export function findArtwork(id: string | null | undefined): Artwork | null {
  return artworks.find((a) => a.id === id) ?? null;
}

export function findMotif(artworkId: string | null | undefined, motifId: string | null | undefined) {
  return findArtwork(artworkId)?.motifs.find((m) => m.id === motifId) ?? null;
}

/**
 * The connection the panel offers. An explicit choice wins; otherwise, after
 * arriving by travel, prefer a link that moves forward instead of straight back.
 */
export function activeConnectionIndex(
  motif: Motif,
  connectionIndex: number | null,
  arrivedFromArtworkId: string | null,
): number {
  if (motif.connections.length === 0) return -1;
  if (connectionIndex !== null && motif.connections[connectionIndex]) return connectionIndex;
  if (arrivedFromArtworkId) {
    const forward = motif.connections.findIndex((c) => c.targetArtworkId !== arrivedFromArtworkId);
    if (forward !== -1) return forward;
  }
  return 0;
}

function samePoint(a: NormalizedPoint, b: NormalizedPoint | null) {
  return b !== null && a.x === b.x && a.y === b.y;
}

const idleSelection = {
  selectedMotifId: null,
  selectionPoint: null,
  connectionIndex: null,
  arrivedFromArtworkId: null,
} as const;

/** Travel is a fixed-length sequence; only the phase is time-driven, so a reducer stays sufficient. */
export function experienceReducer(
  state: ExperienceState,
  action: ExperienceAction,
): ExperienceState {
  if (!state.entered && action.type !== 'enter' && action.type !== 'toggle-tuner') return state;

  if (state.travelPhase !== 'idle') {
    // While in flight only the travel sequence itself may change state.
    const allowed = ['travel-phase', 'travel-complete', 'travel-cancel', 'toggle-tuner'];
    if (!allowed.includes(action.type)) return state;
  }

  switch (action.type) {
    case 'enter':
      return { ...state, entered: true };

    case 'restart':
      return { ...initialState, showTuner: state.showTuner };

    case 'open-path':
      return isJourneyComplete(state.trail, artworks) ? { ...state, showPath: true } : state;

    case 'close-path':
      return { ...state, showPath: false };

    case 'select-artwork':
      if (action.artworkId === state.currentArtworkId) return { ...state, ...idleSelection };
      return { ...state, ...idleSelection, currentArtworkId: action.artworkId };

    case 'select-motif': {
      if (!findMotif(state.currentArtworkId, action.motifId)) return state;
      const point = action.point ?? null;
      if (action.motifId === state.selectedMotifId) {
        // A new click on the already-selected motif re-aims segmentation only.
        if (!point || samePoint(point, state.selectionPoint)) return state;
        return { ...state, selectionPoint: point };
      }
      return { ...state, ...idleSelection, selectedMotifId: action.motifId, selectionPoint: point };
    }

    case 'visit': {
      if (!findMotif(action.artworkId, action.motifId)) return state;
      return {
        ...state,
        ...idleSelection,
        currentArtworkId: action.artworkId,
        selectedMotifId: action.motifId,
        showPath: false,
      };
    }

    case 'choose-connection':
      return { ...state, connectionIndex: action.index };

    case 'clear-motif':
      return { ...state, ...idleSelection };

    case 'travel-start': {
      const motif = findMotif(state.currentArtworkId, state.selectedMotifId);
      if (!motif) return state;
      const index = activeConnectionIndex(motif, state.connectionIndex, state.arrivedFromArtworkId);
      const connection: MotifConnection | undefined = motif.connections[index];
      if (!connection || !findMotif(connection.targetArtworkId, connection.targetMotifId)) {
        return state;
      }
      return {
        ...state,
        travelPhase: 'lifting',
        travel: { toArtworkId: connection.targetArtworkId, toMotifId: connection.targetMotifId },
      };
    }

    case 'travel-phase':
      return { ...state, travelPhase: action.phase };

    case 'travel-complete': {
      if (!state.travel) return { ...state, travelPhase: 'idle' };
      const step: TravelStep = {
        fromArtworkId: state.currentArtworkId,
        fromMotifId: state.selectedMotifId ?? '',
        toArtworkId: state.travel.toArtworkId,
        toMotifId: state.travel.toMotifId,
      };
      const trail = [...state.trail, step].slice(-12);
      const completedNow =
        isJourneyComplete(trail, artworks) && !isJourneyComplete(state.trail, artworks);
      return {
        ...state,
        currentArtworkId: step.toArtworkId,
        selectedMotifId: step.toMotifId,
        selectionPoint: null,
        connectionIndex: null,
        arrivedFromArtworkId: step.fromArtworkId,
        travelPhase: 'idle',
        travel: null,
        trail,
        showPath: state.showPath || completedNow,
      };
    }

    case 'travel-cancel':
      // The selection and its chosen connection survive, so Explore stays available.
      return { ...state, travelPhase: 'idle', travel: null };

    case 'toggle-tuner':
      return { ...state, showTuner: !state.showTuner };

    default:
      return state;
  }
}

export interface ExperienceContextValue {
  state: ExperienceState;
  artwork: Artwork;
  selectedMotif: Motif | null;
  /** Derived from the selected motif; never stored. */
  connection: MotifConnection | null;
  connectionIndex: number;
  artworks: Artwork[];
  dispatch: (action: ExperienceAction) => void;
}

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(experienceReducer, initialState);

  const value = useMemo<ExperienceContextValue>(() => {
    const artwork = findArtwork(state.currentArtworkId) ?? artworks[0];
    const selectedMotif = artwork.motifs.find((m) => m.id === state.selectedMotifId) ?? null;
    const connectionIndex = selectedMotif
      ? activeConnectionIndex(selectedMotif, state.connectionIndex, state.arrivedFromArtworkId)
      : -1;
    return {
      state,
      artwork,
      selectedMotif,
      connection: selectedMotif?.connections[connectionIndex] ?? null,
      connectionIndex,
      artworks,
      dispatch,
    };
  }, [state]);

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience(): ExperienceContextValue {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error('useExperience must be used inside ExperienceProvider');
  return ctx;
}
