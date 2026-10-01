/**
 * ARTSCAPE V2 — Corpus & CreativeDNA Data Layer
 * 
 * Provides structured artwork data, motif elements, and relationships
 * for both V2 and V1, following the CreativeDNA specification.
 */

export interface V2Artwork {
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

export interface V2Element {
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

export interface V2Relationship {
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

export const V2_ARTWORKS: V2Artwork[] = [
  {
    id: "art_001",
    title: "Peacock in the Royal Garden",
    creator: "Unknown Mughal Artist",
    year: "c. 1620",
    tradition: "Mughal Miniature Painting",
    region: "Northern India",
    source: "Metropolitan Museum of Art — Open Access",
    rights: "Public Domain",
    image: "assets/artworks/peacock_mughal.jpg",
    description: "A resplendent peacock stands in a lush royal garden with a pavilion in the background. The painting demonstrates the Mughal tradition of naturalistic animal portraiture combined with idealized garden settings.",
    artistStatement: null,
    sourceType: "externally_verified"
  },
  {
    id: "art_002",
    title: "Garden of Paradise",
    creator: "Unknown Persian Master",
    year: "c. 1550",
    tradition: "Persian Miniature Painting",
    region: "Persia (Iran)",
    source: "Art Institute of Chicago — Public Domain",
    rights: "Public Domain",
    image: "assets/artworks/persian_garden.jpg",
    description: "A lavish Persian garden scene with peacocks near a reflecting pool, courtly figures, and intricate geometric and floral borders. The composition reflects the Persian concept of pairidaeza — the walled garden as earthly paradise.",
    artistStatement: null,
    sourceType: "externally_verified"
  },
  {
    id: "art_003",
    title: "Crane and Cherry Blossoms",
    creator: "Unknown Japanese Artist",
    year: "c. 1830",
    tradition: "Ukiyo-e Woodblock Print",
    region: "Japan",
    source: "Metropolitan Museum of Art — Open Access",
    rights: "Public Domain",
    image: "assets/artworks/japanese_crane.jpg",
    description: "A graceful crane stands in shallow water beneath cherry blossom branches. The composition balances negative space with delicate linework, embodying the Japanese aesthetic of ma (間) — the beauty of emptiness.",
    artistStatement: null,
    sourceType: "externally_verified"
  },
  {
    id: "art_004",
    title: "Peacock Dance — Phad Scroll",
    creator: "Shrilal Joshi",
    year: "c. 1985",
    tradition: "Rajasthani Phad Painting",
    region: "Rajasthan, India",
    source: "Joshi Family Collection (with permission)",
    rights: "Used with artist family permission for hackathon",
    image: "assets/artworks/rajasthani_folk.jpg",
    description: "Three peacocks dance amid musicians and village women in this vibrant Phad scroll painting. The peacock here symbolizes monsoon joy and the arrival of rain — a deeply embedded motif in Rajasthani folk tradition.",
    artistStatement: "The peacock dances to call the rain. Every village knows this.",
    sourceType: "artist_declared"
  },
  {
    id: "art_005",
    title: "Dissolution of Form",
    creator: "Priya Menon",
    year: "2023",
    tradition: "Contemporary Indian Mixed Media",
    region: "Mumbai, India",
    source: "Artist's personal collection (with permission)",
    rights: "Used with artist permission for hackathon",
    image: "assets/artworks/contemporary.jpg",
    description: "A modern reinterpretation of the peacock motif through dripping watercolors and gold leaf. The work explores how traditional Indian motifs dissolve and reform in contemporary consciousness.",
    artistStatement: "I wanted to show that the peacock isn't trapped in history — it keeps evolving in how we see it.",
    sourceType: "artist_declared"
  }
];

export const V2_ELEMENTS: Record<string, V2Element[]> = {
  "art_001": [
    {
      id: "elem_001_01",
      label: "Peacock",
      type: "motif",
      geometry: {
        type: "polygon",
        points: [
          [0.30, 0.25], [0.75, 0.20], [0.85, 0.45],
          [0.80, 0.75], [0.55, 0.85], [0.30, 0.80],
          [0.22, 0.55]
        ]
      },
      meaning: {
        text: "The peacock is a central motif in Mughal art, symbolizing royalty, beauty, and the divine. In Indian tradition, the peacock is associated with Lord Krishna and the monsoon season.",
        sourceType: "externally_verified"
      },
      technique: "Mineral pigments with gold leaf on handmade paper",
      tradition: "The peacock in Mughal miniatures draws from both Hindu iconography and Persian garden traditions, reflecting the syncretic nature of Mughal court culture."
    },
    {
      id: "elem_001_02",
      label: "Flowering Tree",
      type: "motif",
      geometry: {
        type: "polygon",
        points: [
          [0.02, 0.15], [0.20, 0.10], [0.25, 0.50],
          [0.18, 0.85], [0.05, 0.80]
        ]
      },
      meaning: {
        text: "The flowering tree represents the garden of paradise (bagh), a recurring motif in Mughal art that connects Persian and Indian aesthetic traditions.",
        sourceType: "externally_verified"
      },
      technique: "Fine brushwork with layered washes",
      tradition: "Persian-influenced garden imagery adopted into Mughal visual language"
    },
    {
      id: "elem_001_03",
      label: "Pavilion",
      type: "architectural",
      geometry: {
        type: "polygon",
        points: [
          [0.55, 0.05], [0.85, 0.05], [0.88, 0.35],
          [0.52, 0.35]
        ]
      },
      meaning: {
        text: "The domed pavilion or chhatri is a hallmark of Mughal architecture, symbolizing shelter, contemplation, and the ruler's presence in the garden.",
        sourceType: "externally_verified"
      },
      technique: "Architectural rendering with perspective conventions of the Mughal school",
      tradition: "Mughal garden architecture"
    }
  ],
  "art_002": [
    {
      id: "elem_002_01",
      label: "Peacock Pair",
      type: "motif",
      geometry: {
        type: "polygon",
        points: [
          [0.15, 0.65], [0.50, 0.60], [0.80, 0.65],
          [0.82, 0.88], [0.15, 0.88]
        ]
      },
      meaning: {
        text: "Peacocks in Persian gardens symbolize paradise and immortality. Their presence at the reflecting pool connects to the Zoroastrian concept of the paradise garden.",
        sourceType: "externally_verified"
      },
      technique: "Gouache and gold on paper with lapis lazuli pigments",
      tradition: "The peacock motif traveled from ancient Persia through the Silk Road, influencing both Islamic and Hindu artistic traditions."
    },
    {
      id: "elem_002_02",
      label: "Geometric Border",
      type: "technique",
      geometry: {
        type: "polygon",
        points: [
          [0.0, 0.0], [1.0, 0.0], [1.0, 0.08],
          [0.92, 0.08], [0.92, 0.92], [1.0, 0.92],
          [1.0, 1.0], [0.0, 1.0], [0.0, 0.92],
          [0.08, 0.92], [0.08, 0.08], [0.0, 0.08]
        ]
      },
      meaning: {
        text: "The elaborate geometric and floral border patterns derive from Islamic arabesque traditions, representing the infinite nature of creation.",
        sourceType: "externally_verified"
      },
      technique: "Hashia (border) painting with geometric tessellation",
      tradition: "Islamic decorative arts"
    }
  ],
  "art_003": [
    {
      id: "elem_003_01",
      label: "Crane",
      type: "motif",
      geometry: {
        type: "polygon",
        points: [
          [0.25, 0.20], [0.55, 0.15], [0.60, 0.75],
          [0.45, 0.85], [0.30, 0.80], [0.20, 0.50]
        ]
      },
      meaning: {
        text: "The crane (tsuru) symbolizes longevity, fidelity, and good fortune in Japanese culture. It is one of the most revered bird motifs in East Asian art.",
        sourceType: "externally_verified"
      },
      technique: "Woodblock printing with hand-coloring (nishiki-e)",
      tradition: "The crane motif appears across East Asian art traditions, from Chinese silk paintings to Japanese screens."
    },
    {
      id: "elem_003_02",
      label: "Cherry Blossoms",
      type: "motif",
      geometry: {
        type: "polygon",
        points: [
          [0.15, 0.02], [0.80, 0.02], [0.75, 0.35],
          [0.20, 0.30]
        ]
      },
      meaning: {
        text: "Sakura (cherry blossoms) represent the transience and beauty of life — mono no aware. Their pairing with the crane creates a tension between impermanence and longevity.",
        sourceType: "externally_verified"
      },
      technique: "Delicate brushwork with bokashi (gradient) printing",
      tradition: "Central motif in Japanese visual culture since the Heian period"
    }
  ],
  "art_004": [
    {
      id: "elem_004_01",
      label: "Dancing Peacock",
      type: "motif",
      geometry: {
        type: "polygon",
        points: [
          [0.15, 0.30], [0.80, 0.25], [0.85, 0.90],
          [0.10, 0.90]
        ]
      },
      meaning: {
        text: "In Rajasthani folk tradition, the peacock's dance is a prayer for rain. The spread tail feathers mirror monsoon clouds, and the dance itself is believed to summon the rains.",
        sourceType: "artist_declared"
      },
      technique: "Natural pigments on cloth (phad), sequential narrative style",
      tradition: "Phad painting is a scroll painting tradition from Rajasthan, used by traveling storytellers (bhopas) to narrate folk epics."
    },
    {
      id: "elem_004_02",
      label: "Musicians",
      type: "figure",
      geometry: {
        type: "polygon",
        points: [
          [0.55, 0.10], [0.90, 0.10], [0.90, 0.40],
          [0.55, 0.40]
        ]
      },
      meaning: {
        text: "The musicians accompany the peacock's dance, creating a scene of communal celebration. Their presence grounds the peacock motif in lived human experience.",
        sourceType: "artist_declared"
      },
      technique: "Bold outlines filled with flat color areas",
      tradition: "Rajasthani folk narrative painting"
    }
  ],
  "art_005": [
    {
      id: "elem_005_01",
      label: "Abstract Peacock",
      type: "motif",
      geometry: {
        type: "polygon",
        points: [
          [0.10, 0.10], [0.85, 0.05], [0.92, 0.80],
          [0.15, 0.90]
        ]
      },
      meaning: {
        text: "The peacock form dissolves into abstract color fields, suggesting how traditional motifs persist in contemporary consciousness — recognizable yet transformed.",
        sourceType: "artist_declared"
      },
      technique: "Watercolor, ink, and gold leaf on canvas",
      tradition: "Contemporary reinterpretation of classical Indian motifs"
    },
    {
      id: "elem_005_02",
      label: "Gold Leaf Patterns",
      type: "technique",
      geometry: {
        type: "polygon",
        points: [
          [0.05, 0.02], [0.45, 0.02], [0.35, 0.45],
          [0.05, 0.40]
        ]
      },
      meaning: {
        text: "The gold leaf fragments reference the Mughal miniature tradition of gold embellishment, creating a dialogue between historical luxury and contemporary artistic expression.",
        sourceType: "artist_declared"
      },
      technique: "Hammered gold leaf applied over wet watercolor",
      tradition: "Gold leaf technique transmitted from Persian-Mughal miniature painting to contemporary practice"
    }
  ]
};

export const V2_RELATIONSHIPS: V2Relationship[] = [
  {
    id: "rel_001",
    sourceArtworkId: "art_001",
    sourceElementId: "elem_001_01",
    targetArtworkId: "art_002",
    targetElementId: "elem_002_01",
    relationshipType: "shared_motif",
    evidence: [
      { type: "visual_element_match", description: "Both artworks feature peacocks as central subjects" },
      { type: "shared_technique", description: "Both use mineral pigments and gold leaf on paper" },
      { type: "documented_tradition", description: "The peacock motif traveled along the Silk Road from Persian to Mughal artistic traditions" }
    ],
    agreement: "5/5",
    status: "verified",
    narrative: "The peacock motif connects Mughal and Persian miniature painting traditions. As the Mughal Empire drew heavily from Persian artistic conventions, the peacock became a shared symbol of paradise, royalty, and divine beauty across both traditions."
  },
  {
    id: "rel_002",
    sourceArtworkId: "art_001",
    sourceElementId: "elem_001_01",
    targetArtworkId: "art_004",
    targetElementId: "elem_004_01",
    relationshipType: "shared_motif",
    evidence: [
      { type: "visual_element_match", description: "The peacock motif is central to both compositions" },
      { type: "regional_relationship", description: "Both traditions originate in the Indian subcontinent" },
      { type: "documented_tradition", description: "The peacock carries distinct meanings in court vs. folk traditions" }
    ],
    agreement: "4/5",
    status: "verified",
    narrative: "The same peacock appears in both Mughal court painting and Rajasthani folk art — but with different meanings. In the Mughal tradition, it signifies royal beauty. In the Rajasthani folk tradition, it dances to bring rain. The motif travels between social classes, carrying different cultural weight."
  },
  {
    id: "rel_003",
    sourceArtworkId: "art_001",
    sourceElementId: "elem_001_01",
    targetArtworkId: "art_005",
    targetElementId: "elem_005_01",
    relationshipType: "shared_motif",
    evidence: [
      { type: "visual_element_match", description: "The peacock form is recognizable in both works" },
      { type: "shared_technique", description: "Both use gold leaf — traditional in Mughal painting, recontextualized in contemporary practice" },
      { type: "documented_tradition", description: "The contemporary work explicitly references the Mughal miniature tradition" }
    ],
    agreement: "4/5",
    status: "verified",
    narrative: "A 17th-century Mughal peacock meets its 21st-century descendant. The contemporary artist deliberately dissolves the classical form into abstract color, showing how traditional motifs persist — transformed but still recognizable — in modern Indian art."
  },
  {
    id: "rel_004",
    sourceArtworkId: "art_002",
    sourceElementId: "elem_002_01",
    targetArtworkId: "art_004",
    targetElementId: "elem_004_01",
    relationshipType: "shared_motif",
    evidence: [
      { type: "visual_element_match", description: "Peacock motif present in both" },
      { type: "documented_tradition", description: "Persian and Indian folk traditions share ancient cultural exchanges via trade routes" }
    ],
    agreement: "3/5",
    status: "candidate",
    narrative: "While both works feature peacocks, the artistic traditions diverge significantly. The Persian tradition emphasizes the garden paradise; the Rajasthani tradition ties the peacock to monsoon and rain. The relationship is plausible through Silk Road cultural exchange but less directly documented."
  },
  {
    id: "rel_005",
    sourceArtworkId: "art_003",
    sourceElementId: "elem_003_01",
    targetArtworkId: "art_001",
    targetElementId: "elem_001_01",
    relationshipType: "shared_tradition",
    evidence: [
      { type: "visual_element_match", description: "Both feature prominent bird motifs as central subjects" },
      { type: "shared_technique", description: "Both traditions value fine naturalistic detail in bird portraiture" }
    ],
    agreement: "3/5",
    status: "candidate",
    narrative: "The Japanese crane and Indian peacock are both sacred birds in their respective cultures, holding deep symbolic significance. While the artistic traditions developed independently, both represent the human impulse to elevate certain birds to spiritual and cultural symbols."
  },
  {
    id: "rel_006",
    sourceArtworkId: "art_004",
    sourceElementId: "elem_004_01",
    targetArtworkId: "art_005",
    targetElementId: "elem_005_01",
    relationshipType: "artist_influence",
    evidence: [
      { type: "visual_element_match", description: "The peacock motif evolves from folk to contemporary" },
      { type: "documented_tradition", description: "The contemporary artist has cited Rajasthani folk traditions as an inspiration" }
    ],
    agreement: "4/5",
    status: "verified",
    narrative: "The peacock travels from a Rajasthani folk scroll to a Mumbai gallery wall. The contemporary artist draws directly on folk art traditions but dissolves the form, showing how motifs transform across time and artistic context."
  }
];
