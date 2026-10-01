import type { V2Artwork, V2Element, V2Relationship } from '@/data/artworks-v2';

export type ArtworkData = V2Artwork;
export type ElementData = V2Element;
export type RelationshipData = V2Relationship;

export interface JourneyHop {
  artwork: ArtworkData;
  element?: ElementData;
  timestamp: string;
}
