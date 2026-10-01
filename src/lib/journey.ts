import type { Artwork, Motif, RelationshipType } from './types';

/** The subset of a trail step the path needs; matches `TravelStep` in experience-state. */
export interface PathStep {
  fromArtworkId: string;
  fromMotifId: string;
  toArtworkId: string;
  toMotifId: string;
}

export interface PathStop {
  artwork: Artwork;
  /** The detail the viewer stood on here: the landing detail, or the first departure. */
  motif: Motif;
}

export interface PathLeg {
  /** False when the viewer left the previous stop some other way (trail, collection rail). */
  continuous: boolean;
  fromMotif: Motif;
  toMotif: Motif;
  /** Looked up from the departure detail's connections; null if it no longer exists. */
  relationshipType: RelationshipType | null;
}

export interface JourneyPath {
  stops: PathStop[];
  /** `legs[i]` leads from `stops[i]` to `stops[i + 1]`. */
  legs: PathLeg[];
  visitedArtworkIds: string[];
}

function find(artworks: Artwork[], artworkId: string, motifId: string) {
  const artwork = artworks.find((a) => a.id === artworkId);
  const motif = artwork?.motifs.find((m) => m.id === motifId);
  return artwork && motif ? { artwork, motif } : null;
}

/**
 * The route actually travelled, in order. Where the viewer left through
 * something other than the detail they landed on, the departure point becomes
 * its own stop and the leg into it is marked as not continuous.
 */
export function buildJourneyPath(trail: PathStep[], artworks: Artwork[]): JourneyPath {
  const stops: PathStop[] = [];
  const legs: PathLeg[] = [];

  for (const step of trail) {
    const from = find(artworks, step.fromArtworkId, step.fromMotifId);
    const to = find(artworks, step.toArtworkId, step.toMotifId);
    if (!from || !to) continue;

    const last = stops[stops.length - 1];
    if (!last || last.artwork.id !== from.artwork.id) {
      if (last) {
        legs.push({ continuous: false, fromMotif: last.motif, toMotif: from.motif, relationshipType: null });
      }
      stops.push(from);
    }

    const connection = from.motif.connections.find(
      (c) => c.targetArtworkId === to.artwork.id && c.targetMotifId === to.motif.id,
    );
    legs.push({
      continuous: true,
      fromMotif: from.motif,
      toMotif: to.motif,
      relationshipType: connection?.relationshipType ?? null,
    });
    stops.push(to);
  }

  const visitedArtworkIds = [...new Set(stops.map((s) => s.artwork.id))];
  return { stops, legs, visitedArtworkIds };
}

/** A journey is complete once travel has reached every work in the collection. */
export function isJourneyComplete(trail: PathStep[], artworks: Artwork[]): boolean {
  if (trail.length === 0) return false;
  const visited = new Set(trail.flatMap((s) => [s.fromArtworkId, s.toArtworkId]));
  return artworks.every((a) => visited.has(a.id));
}
