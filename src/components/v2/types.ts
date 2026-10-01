export interface ArtworkData {
  id: string;
  title: string;
  creator: string;
  year: string;
  tradition: string;
  region: string;
  source: string;
  rights: string;
  image: string;
  description: string;
  artistStatement: string | null;
  sourceType: 'externally_verified' | 'artist_declared' | 'ai_inferred';
}

export interface ElementData {
  id: string;
  label: string;
  type: string;
  geometry: {
    type: 'polygon' | 'box';
    points: [number, number][];
  };
  meaning: {
    text: string;
    sourceType: 'externally_verified' | 'artist_declared' | 'ai_inferred';
  };
  technique: string;
  tradition: string;
}

export interface RelationshipData {
  id: string;
  sourceArtworkId: string;
  sourceElementId: string;
  targetArtworkId: string;
  targetElementId: string;
  relationshipType: 'shared_motif' | 'shared_technique' | 'shared_tradition' | 'artist_influence';
  evidence: { type: string; description: string }[];
  agreement: string;
  status: 'verified' | 'candidate';
  narrative: string;
}

export interface JourneyHop {
  artwork: ArtworkData;
  element?: ElementData;
  timestamp: string;
}
