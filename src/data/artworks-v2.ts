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
    year: "c. 1597–1620",
    tradition: "Mughal Miniature Painting",
    region: "Northern India",
    source: "Metropolitan Museum of Art — Open Access (Acc. 13.228.33)",
    rights: "Public Domain",
    image: "assets/artworks/peacock_mughal.jpg",
    description: "A resplendent folio created in the Mughal royal atelier (Akbar-Jahangir period), demonstrating the naturalistic bird portraiture and lush garden setting that synthesized Indian naturalism with Persian compositional lyricism.",
    artistStatement: null,
    sourceType: "externally_verified"
  },
  {
    id: "art_002",
    title: "The Concourse of the Birds",
    creator: "Habiballah of Sava",
    year: "c. 1600",
    tradition: "Persian Safavid Miniature Painting",
    region: "Isfahan, Persia (Iran)",
    source: "Metropolitan Museum of Art — Open Access (Acc. 63.210.11)",
    rights: "Public Domain",
    image: "assets/artworks/persian_garden.jpg",
    description: "A celebrated Persian miniature illustrating Attar's 12th-century Sufi masterpiece 'The Conference of the Birds' (Mantiq al-Tayr). An assembly of cosmic birds, including the radiant peacock and hoopoe, gather before their quest for the divine Simurgh.",
    artistStatement: null,
    sourceType: "externally_verified"
  },
  {
    id: "art_003",
    title: "Peacock Perched on a Maple Tree",
    creator: "Utagawa Hiroshige",
    year: "c. 1833",
    tradition: "Ukiyo-e Woodblock Print",
    region: "Edo (Tokyo), Japan",
    source: "Metropolitan Museum of Art — Open Access (Acc. JP121)",
    rights: "Public Domain",
    image: "assets/artworks/japanese_crane.jpg",
    description: "A vertical bird-and-flower (Kachō-ga) woodblock print showing a graceful peacock on autumnal maple boughs. Balances negative space with delicate bokashi color gradation, embodying the Japanese aesthetic of harmony with nature.",
    artistStatement: null,
    sourceType: "externally_verified"
  },
  {
    id: "art_004",
    title: "Krishna Revels with the Gopis",
    creator: "Master of the Malwa/Rajasthani School",
    year: "c. 1630–40",
    tradition: "Rajasthani / Malwa Rajput Painting",
    region: "Rajasthan / Malwa, India",
    source: "Metropolitan Museum of Art — Open Access (Acc. 2003.181)",
    rights: "Public Domain",
    image: "assets/artworks/rajasthani_folk.jpg",
    description: "A vibrant illustration from a dispersed Gita Govinda showing Krishna in blossoming groves populated by peacocks and cowherds. In Indian tradition, the peacock dances to welcome the life-giving monsoon rains and divine love.",
    artistStatement: null,
    sourceType: "externally_verified"
  },
  {
    id: "art_005",
    title: "Peacocks in an Italianate Garden",
    creator: "Melchior d'Hondecoeter",
    year: "1683",
    tradition: "Dutch Golden Age Painting",
    region: "Amsterdam, Netherlands",
    source: "Metropolitan Museum of Art — Open Access (Acc. 25.110.37)",
    rights: "Public Domain",
    image: "assets/artworks/contemporary.jpg",
    description: "Painted by the Dutch master Melchior d'Hondecoeter, this monumental canvas captures peacocks in a classical estate garden, reflecting how global trade introduced live Asian peacocks to European courts as symbols of regal wealth and wonder.",
    artistStatement: null,
    sourceType: "externally_verified"
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
      { type: "visual_element_match", description: "Both masterworks feature peacocks rendered with regal plumage as central subjects" },
      { type: "shared_technique", description: "Both utilize mineral pigments, gold leaf, and fine brushwork on prepared paper" },
      { type: "documented_tradition", description: "Multidirectional Silk Road dialogue: Safavid Persian court masters joined Emperor Humayun's atelier, sparking mutual synthesis" }
    ],
    agreement: "5/5",
    status: "verified",
    narrative: "This cross-cultural bridge reflects a rich, reciprocal Silk Road dialogue between Mughal India and Safavid Persia. In Attar's 12th-century Sufi poem, the peacock is an allegory of celestial origin and spiritual pride; in the Mughal court, Persian masters and Indian painters synthesized this symbolism with native Indian reverence for the living bird. Neither work originated the motif; both express contemporaneous, syncretic masteries of a shared sacred archetype."
  },
  {
    id: "rel_002",
    sourceArtworkId: "art_001",
    sourceElementId: "elem_001_01",
    targetArtworkId: "art_004",
    targetElementId: "elem_004_01",
    relationshipType: "shared_motif",
    evidence: [
      { type: "visual_element_match", description: "The peacock motif is vital to both 17th-century South Asian compositions" },
      { type: "regional_relationship", description: "Contemporaneous flourishing in 17th-century Northern and Central India" },
      { type: "documented_tradition", description: "Parallel divergence: imperial court naturalism (Mughal) versus devotional bhakti symbolism (Rajput/Malwa)" }
    ],
    agreement: "4/5",
    status: "verified",
    narrative: "Created during the same era in 17th-century India, these works showcase how the peacock resonated across parallel cultural spaces. In the Mughal imperial garden, the bird symbolizes sovereign majesty and aristocratic leisure. In the Rajput Malwa Gita Govinda, the peacock dances to welcome life-giving monsoon clouds and heralds divine love. The motif did not originate in either work, but coexisted contemporaneously across imperial and devotional traditions."
  },
  {
    id: "rel_003",
    sourceArtworkId: "art_001",
    sourceElementId: "elem_001_01",
    targetArtworkId: "art_005",
    targetElementId: "elem_005_01",
    relationshipType: "shared_motif",
    evidence: [
      { type: "visual_element_match", description: "Both depict magnificent peacocks in formal architectural garden settings" },
      { type: "shared_technique", description: "Mastery of naturalistic feather rendering and dramatic light" },
      { type: "documented_tradition", description: "Global maritime trade introduced living Asian peacocks to Dutch estate menageries in the 17th century" }
    ],
    agreement: "4/5",
    status: "verified",
    narrative: "A 17th-century Mughal miniature meets a 17th-century Dutch Golden Age canvas. Melchior d'Hondecoeter painted living peacocks brought to Amsterdam via Dutch East India maritime trade routes. While European elites displayed the birds as emblems of worldly prestige and trade power, Mughal courts had woven them into miniature art for centuries. This connection highlights how global trade interconnected visual cultures across continents without linear artistic derivation."
  },
  {
    id: "rel_004",
    sourceArtworkId: "art_002",
    sourceElementId: "elem_002_01",
    targetArtworkId: "art_004",
    targetElementId: "elem_004_01",
    relationshipType: "shared_motif",
    evidence: [
      { type: "visual_element_match", description: "Peacocks associated with sacred gardens and cosmic flora" },
      { type: "documented_tradition", description: "Polygenesis & shared Asian archetypes: Sufi allegorical flight in Persia and Bhakti devotional ecstasy in India" }
    ],
    agreement: "4/5",
    status: "verified",
    narrative: "Separated by language and religion, Safavid Persia and Rajput India simultaneously invested the peacock with deep spiritual power. In Persia, Habiballah of Sava painted the bird in the mystical assembly seeking the Simurgh. In Malwa, Indian painters depicted it in Krishna's verdant paradise. Both civilizations independently elevated the peacock to symbolize transcendent beauty and spiritual longing."
  },
  {
    id: "rel_005",
    sourceArtworkId: "art_003",
    sourceElementId: "elem_003_01",
    targetArtworkId: "art_001",
    targetElementId: "elem_001_01",
    relationshipType: "shared_tradition",
    evidence: [
      { type: "visual_element_match", description: "Prominent bird-and-tree compositions celebrating delicate avian plumage" },
      { type: "shared_technique", description: "Both traditions place supreme value on precise botanical and avian observational draughtsmanship" }
    ],
    agreement: "4/5",
    status: "verified",
    narrative: "Hiroshige's 19th-century Japanese woodblock and the 17th-century Mughal miniature demonstrate convergent artistic celebration of the peacock. Japan's bird-and-flower (Kachō-ga) prints and the Mughal garden (bagh) miniature tradition emerged independently from distinct cultural philosophies, yet both arrive at a remarkably harmonious balance between botanical precision and aesthetic grandeur."
  },
  {
    id: "rel_006",
    sourceArtworkId: "art_004",
    sourceElementId: "elem_004_01",
    targetArtworkId: "art_005",
    targetElementId: "elem_005_01",
    relationshipType: "shared_motif",
    evidence: [
      { type: "visual_element_match", description: "Both painted in the 17th century portraying peacocks in outdoor landscapes" },
      { type: "documented_tradition", description: "Contemporaneous hemispheric dialogue: Eastern devotional art versus Western observational naturalism" }
    ],
    agreement: "4/5",
    status: "verified",
    narrative: "Produced during the very same century on opposite sides of the globe, the Indian Malwa folio and the Dutch Golden Age canvas present two contemporaneous visions of the peacock. The Indian artist uses vibrant flat color fields and monsoon symbolism for devotional joy, while the Dutch master uses oil glazes and chiaroscuro for aristocratic status. They demonstrate that the motif lived actively across concurrent world civilizations."
  }
];
