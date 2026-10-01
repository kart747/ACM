import { ADDITIONAL_ARTWORKS, ADDITIONAL_ELEMENTS, ADDITIONAL_RELATIONSHIPS } from './artworks-v2-extension';
import type { CulturalClaim, ImageCredit } from '@/lib/artwork-sources';
import { CULTURAL_ARTWORKS, CULTURAL_ELEMENTS, CULTURAL_RELATIONSHIPS } from './artworks-v2-cultural';

/**
 * ARTSCAPE V2 — Corpus & CreativeDNA Data Layer
 *
 * Catalog metadata cites museum records or the credited photograph source.
 * Cultural claims retain their evidence tiers; visual readings are interpretations.
 */

export interface V2Artwork {
  id: string;
  title: string;
  creator: string;
  year: string;
  medium: string;
  tradition: string;
  region: string;
  source: string;
  sourceUrl: string;
  sourceKind?: 'museum' | 'photograph';
  imageCredit?: ImageCredit;
  culturalClaims?: CulturalClaim[];
  rights: string;
  image: string;
  description: string;
  artistStatement: string | null;
  // Describes the provenance of the visual description, not the catalog fields.
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
  culturalClaims?: CulturalClaim[];
  narrative: string;
}

export const V2_ARTWORKS: V2Artwork[] = [
  {
    id: "art_001",
    title: '"The Story of the Princess of the Blue Pavillion: The Youth of Rum Is Entertained in a Garden by a Fairy and her Maidens", Folio from a Khamsa (Quintet) of Amir Khusrau Dihlavi',
    creator: "Manohar (painting); Muhammad Husain Kashmiri (calligraphy); Amir Khusrau Dihlavi (author)",
    year: "1597–98",
    medium: "Ink, opaque watercolor, and gold on paper",
    tradition: "Indian illustrated manuscript painting",
    region: "Attributed to India",
    source: "The Metropolitan Museum of Art — collection API, object 446567; accession 13.228.33; painter identified in constituents, not artistDisplayName",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/446567",
    rights: "Public Domain",
    image: "assets/artworks/peacock_mughal.jpg",
    description: "A seated pair occupies a small pavilion amid winged attendants, with a palm to the left, text panels above, and figures and a horse below. The Met identifies this as a garden episode from Amir Khusrau Dihlavi's Khamsa, painted by Manohar with calligraphy by Muhammad Husain Kashmiri.",
    artistStatement: null,
    sourceType: "ai_inferred"
  },
  {
    id: "art_002",
    title: '"The Concourse of the Birds", Folio 11r from a Mantiq al-Tayr (Language of the Birds)',
    creator: "Habiballah of Sava (painting); Farid al-Din `Attar (author)",
    year: "ca. 1600",
    medium: "Ink, opaque watercolor, gold, and silver on paper",
    tradition: "Iranian illustrated manuscript painting",
    region: "Attributed to Iran, Isfahan",
    source: "The Metropolitan Museum of Art — collection API, object 451725; accession 63.210.11",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/451725",
    rights: "Public Domain",
    image: "assets/artworks/persian_garden.jpg",
    description: "Birds gather among rocks, a curving tree, and a winding watercourse inside a narrow painted field surrounded by a broad, gold-flecked blue margin. A peacock with a fanned tail stands beside the tree. This visual reading does not assign a single symbolic meaning to the birds or infer connections to the other works.",
    artistStatement: null,
    sourceType: "ai_inferred"
  },
  {
    id: "art_003",
    title: "A Peacock Perched on a Maple Tree",
    creator: "Utagawa Hiroshige",
    year: "ca. 1833",
    medium: "Woodblock print",
    tradition: "Japanese print; Edo period (1615–1868)",
    region: "Japan; production city not specified in the Met API record",
    source: "The Metropolitan Museum of Art — collection API, object 36741; accession JP269",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/36741",
    rights: "Public Domain",
    image: "assets/artworks/japanese_crane.jpg",
    description: "A peacock perches against a large maple trunk, with long eyespotted feathers descending through the narrow composition and red and blue-green leaves above and beside it. The Met identifies the work as a woodblock print by Utagawa Hiroshige, dated about 1833.",
    artistStatement: null,
    sourceType: "ai_inferred"
  },
  {
    id: "art_004",
    title: "Krishna Revels with the Gopis: Page from a Dispersed Gita Govinda (Song of the Cowherds)",
    creator: "Unknown artist (not named in the Met record)",
    year: "ca. 1630–40",
    medium: "Opaque watercolor and silver on paper",
    tradition: "Malwa painting",
    region: "India (Madhya Pradesh, Malwa)",
    source: "The Metropolitan Museum of Art — collection API, object 65584; accession 2003.165",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/65584",
    rights: "Public Domain",
    image: "assets/artworks/rajasthani_folk.jpg",
    description: "Against a red ground, a blue-skinned central figure embraces a companion between two other figures. Rounded tree crowns contain animals, including a small perched peacock in the rightmost crown. The Met identifies Krishna and the gopis in this Gita Govinda folio, painted in opaque watercolor and silver on paper.",
    artistStatement: null,
    sourceType: "ai_inferred"
  },
  {
    id: "art_005",
    title: "Peacocks",
    creator: "Melchior d' Hondecoeter",
    year: "1683",
    medium: "Oil on canvas",
    tradition: "Dutch painting",
    region: "Dutch artist; production place not specified in the Met API record",
    source: "The Metropolitan Museum of Art — collection API, object 436671; accession 27.250.1",
    sourceUrl: "https://www.metmuseum.org/art/collection/search/436671",
    rights: "Public Domain",
    image: "assets/artworks/contemporary.jpg",
    description: "A large peacock rests on a stone ledge, its patterned wing above a long eyespotted train. Another bird bends down at the right; other animals and cut fruit occupy the foreground. The Met catalogs this work by Melchior d' Hondecoeter as an oil painting on canvas, dated 1683. Its symbolism remains an interpretation rather than an established artist statement.",
    artistStatement: null,
    sourceType: "ai_inferred"
  },
  ...ADDITIONAL_ARTWORKS,
  ...CULTURAL_ARTWORKS
];

// Coordinates include the full local image and its margins; these are curated detail regions, not segmentation masks.
export const V2_ELEMENTS: Record<string, V2Element[]> = {
  "art_001": [
    {
      id: "elem_001_01",
      label: "Seated pair in the pavilion",
      type: "figure",
      geometry: {
        type: "polygon",
        points: [
          [0.431, 0.520], [0.462, 0.509], [0.484, 0.523],
          [0.492, 0.546], [0.518, 0.548], [0.523, 0.512],
          [0.550, 0.502], [0.578, 0.517], [0.591, 0.557],
          [0.604, 0.612], [0.559, 0.624], [0.500, 0.614],
          [0.447, 0.622], [0.420, 0.604], [0.421, 0.559]
        ]
      },
      meaning: {
        text: "Two seated figures face one another beneath the pavilion roof. Their proximity provides a visual focus; the region does not identify a peacock or establish the figures' emotions.",
        sourceType: "ai_inferred"
      },
      technique: "Small outlined figures with contrasting areas of opaque color; a visual observation, not a pigment analysis.",
      tradition: "A figure grouping in the illustrated Khamsa folio; no shared symbolism with other works is assumed."
    },
    {
      id: "elem_001_02",
      label: "Palm beside the pavilion",
      type: "motif",
      geometry: {
        type: "polygon",
        points: [
          [0.174, 0.391], [0.205, 0.388], [0.208, 0.356],
          [0.229, 0.379], [0.257, 0.366], [0.250, 0.391],
          [0.284, 0.389], [0.263, 0.410], [0.273, 0.434],
          [0.246, 0.421], [0.235, 0.454], [0.231, 0.469],
          [0.219, 0.470], [0.217, 0.416], [0.181, 0.438],
          [0.194, 0.410], [0.169, 0.418]
        ]
      },
      meaning: {
        text: "A small palm-like tree stands to the left of the pavilion. Its radiating leaves contrast with the straight architecture; a paradise meaning cannot be established from appearance alone.",
        sourceType: "ai_inferred"
      },
      technique: "Thin trunk and pointed green leaf shapes visible against a darker ground.",
      tradition: "Plant detail within this garden scene, not evidence of a particular route of cultural transmission."
    },
    {
      id: "elem_001_03",
      label: "Pavilion roof",
      type: "architectural",
      geometry: {
        type: "polygon",
        points: [
          [0.458, 0.356], [0.523, 0.356], [0.553, 0.386],
          [0.650, 0.413], [0.684, 0.428], [0.655, 0.445],
          [0.572, 0.456], [0.481, 0.452], [0.404, 0.439],
          [0.381, 0.424], [0.427, 0.405]
        ]
      },
      meaning: {
        text: "The small green roof and projecting eaves cover the seated pair. This architectural detail helps locate the encounter without assigning it an unsupported royal or religious meaning.",
        sourceType: "ai_inferred"
      },
      technique: "Layered colored bands define the roof and eaves in the image.",
      tradition: "Architecture within the illustrated garden episode; the region is the roof, not the whole pavilion."
    }
  ],
  "art_002": [
    {
      id: "elem_002_01",
      label: "Peacock with fanned tail",
      type: "motif",
      geometry: {
        type: "polygon",
        points: [
          [0.513, 0.459], [0.533, 0.445], [0.560, 0.443],
          [0.584, 0.449], [0.600, 0.464], [0.596, 0.490],
          [0.573, 0.509], [0.568, 0.536], [0.581, 0.548],
          [0.548, 0.550], [0.535, 0.535], [0.537, 0.513],
          [0.518, 0.495], [0.507, 0.475]
        ]
      },
      meaning: {
        text: "A small peacock displays a rounded, patterned tail beside the tree. The highlighted bird is not a pair; its appearance alone does not verify a spiritual interpretation.",
        sourceType: "ai_inferred"
      },
      technique: "Repeated small colored marks describe the tail within the painted field.",
      tradition: "Bird detail in the Mantiq al-Tayr folio; the literary identification comes from the catalog, not the polygon."
    },
    {
      id: "elem_002_02",
      label: "Curving tree trunk",
      type: "motif",
      geometry: {
        type: "polygon",
        points: [
          [0.438, 0.271], [0.477, 0.273], [0.480, 0.310],
          [0.453, 0.344], [0.414, 0.374], [0.393, 0.407],
          [0.401, 0.448], [0.425, 0.491], [0.443, 0.531],
          [0.423, 0.551], [0.390, 0.541], [0.365, 0.497],
          [0.352, 0.452], [0.352, 0.409], [0.369, 0.366],
          [0.407, 0.326], [0.437, 0.305]
        ]
      },
      meaning: {
        text: "A pale, bending trunk rises beside the birds. The region follows the trunk rather than the large blue page margin; it is not a geometric-border annotation.",
        sourceType: "ai_inferred"
      },
      technique: "A light trunk with dark contour marks separates the tree from nearby rocks and foliage.",
      tradition: "Landscape detail in this manuscript image; no botanical species or symbolic meaning is assigned."
    }
  ],
  "art_003": [
    {
      id: "elem_003_01",
      label: "Peacock head and body",
      type: "motif",
      geometry: {
        type: "polygon",
        points: [
          [0.180, 0.302], [0.222, 0.274], [0.356, 0.250],
          [0.549, 0.243], [0.563, 0.231], [0.512, 0.216],
          [0.487, 0.224], [0.488, 0.208], [0.555, 0.195],
          [0.574, 0.185], [0.642, 0.182], [0.675, 0.203],
          [0.680, 0.222], [0.735, 0.234], [0.825, 0.232],
          [0.831, 0.252], [0.798, 0.280], [0.720, 0.307],
          [0.584, 0.326], [0.461, 0.355], [0.282, 0.388],
          [0.200, 0.372], [0.243, 0.342]
        ]
      },
      meaning: {
        text: "The blue head, curved neck, and patterned body belong to a peacock perched on the trunk. This region selects the upper bird, not the full length of its trailing feathers.",
        sourceType: "ai_inferred"
      },
      technique: "Dark outlines and repeated pale marks articulate the bird in the cataloged woodblock print; hand-coloring is not established.",
      tradition: "Peacock subject in an Edo-period Japanese print, not a crane or evidence of a shared tradition with the manuscript paintings."
    },
    {
      id: "elem_003_02",
      label: "Maple leaves at the upper edge",
      type: "motif",
      geometry: {
        type: "polygon",
        points: [
          [0.700, 0.012], [0.970, 0.012], [0.979, 0.044],
          [0.927, 0.035], [0.904, 0.070], [0.863, 0.053],
          [0.822, 0.094], [0.784, 0.068], [0.741, 0.109],
          [0.666, 0.145], [0.642, 0.119], [0.563, 0.110],
          [0.627, 0.083], [0.520, 0.087], [0.571, 0.061],
          [0.646, 0.044], [0.608, 0.037], [0.712, 0.026]
        ]
      },
      meaning: {
        text: "Pointed red and blue-green leaves enter from the upper edge. The catalog identifies the tree as maple; the image does not show the cherry blossoms previously described here.",
        sourceType: "ai_inferred"
      },
      technique: "Angular leaf silhouettes and contrasting printed colors; no specific printing effect or pigment is inferred.",
      tradition: "Botanical detail in Hiroshige's peacock-and-maple composition; a seasonal philosophy is not inferred from color alone."
    }
  ],
  "art_004": [
    {
      id: "elem_004_01",
      label: "Peacock in the rightmost tree",
      type: "motif",
      geometry: {
        type: "polygon",
        points: [
          [0.667, 0.422], [0.755, 0.403], [0.810, 0.393],
          [0.829, 0.384], [0.811, 0.365], [0.812, 0.355],
          [0.851, 0.352], [0.882, 0.362], [0.897, 0.380],
          [0.882, 0.397], [0.837, 0.415], [0.743, 0.434],
          [0.682, 0.435]
        ]
      },
      meaning: {
        text: "A small peacock sits within the rightmost rounded tree crown, its long dark tail extending left. The posture does not show a spread-tail dance and does not establish a rain ritual.",
        sourceType: "ai_inferred"
      },
      technique: "A compact outlined bird and repeated light tail marks against the patterned tree crown.",
      tradition: "Animal detail in the Malwa Gita Govinda folio, not an artist-declared statement about monsoons."
    },
    {
      id: "elem_004_02",
      label: "Central embracing figures",
      type: "figure",
      geometry: {
        type: "polygon",
        points: [
          [0.427, 0.505], [0.478, 0.509], [0.490, 0.533],
          [0.481, 0.545], [0.507, 0.553], [0.521, 0.531],
          [0.560, 0.520], [0.580, 0.529], [0.587, 0.554],
          [0.558, 0.574], [0.659, 0.537], [0.677, 0.548],
          [0.596, 0.590], [0.566, 0.624], [0.596, 0.688],
          [0.593, 0.773], [0.530, 0.778], [0.430, 0.775],
          [0.404, 0.737], [0.396, 0.639], [0.392, 0.566],
          [0.397, 0.541]
        ]
      },
      meaning: {
        text: "The central blue-skinned figure and a companion turn toward one another, with overlapping arms. The catalog identifies the scene as Krishna with the gopis; this region is not a group of musicians accompanying a dancing bird.",
        sourceType: "ai_inferred"
      },
      technique: "Strong contours and contrasting clothing distinguish the figures against the red ground.",
      tradition: "Central figure grouping in the cataloged Gita Govinda illustration; no artist testimony is available."
    }
  ],
  "art_005": [
    {
      id: "elem_005_01",
      label: "Peacock head and patterned wing",
      type: "motif",
      geometry: {
        type: "polygon",
        points: [
          [0.582, 0.127], [0.626, 0.120], [0.658, 0.141],
          [0.674, 0.181], [0.724, 0.221], [0.805, 0.236],
          [0.843, 0.264], [0.844, 0.301], [0.814, 0.357],
          [0.765, 0.401], [0.691, 0.446], [0.632, 0.457],
          [0.628, 0.416], [0.666, 0.374], [0.651, 0.334],
          [0.548, 0.339], [0.513, 0.310], [0.564, 0.270],
          [0.623, 0.242], [0.622, 0.199], [0.615, 0.155]
        ]
      },
      meaning: {
        text: "A blue neck rises above a large gold-and-dark patterned wing on the stone ledge. The gold-colored areas are depicted plumage, not evidence of applied gold leaf.",
        sourceType: "ai_inferred"
      },
      technique: "Contrasting light and dark feather shapes in a cataloged oil-on-canvas painting; the image does not identify a particular glaze recipe.",
      tradition: "Peacock detail in a Dutch painting of 1683, not a contemporary abstraction."
    },
    {
      id: "elem_005_02",
      label: "Eyespotted tail-feather detail",
      type: "motif",
      geometry: {
        type: "polygon",
        points: [
          [0.418, 0.469], [0.484, 0.463], [0.530, 0.479],
          [0.511, 0.525], [0.475, 0.580], [0.440, 0.635],
          [0.389, 0.665], [0.333, 0.651], [0.326, 0.616],
          [0.351, 0.558], [0.380, 0.508]
        ]
      },
      meaning: {
        text: "A selected section of the descending train contains repeated oval eyespots. The polygon covers a feather detail, not the whole peacock or a gold-leaf application.",
        sourceType: "ai_inferred"
      },
      technique: "Repeated dark centers and lighter surrounding rings give the painted feathers a layered appearance.",
      tradition: "A visible plumage pattern in this oil painting; a transmission from manuscript decoration is not established."
    }
  ],
  ...ADDITIONAL_ELEMENTS,
  ...CULTURAL_ELEMENTS
};

export const V2_RELATIONSHIPS: V2Relationship[] = [
  {
    id: "rel_001",
    sourceArtworkId: "art_001",
    sourceElementId: "elem_001_02",
    targetArtworkId: "art_002",
    targetElementId: "elem_002_02",
    relationshipType: "shared_motif",
    evidence: [
      { type: "visual_comparison", description: "The garden folio has a small palm beside the pavilion; the bird folio has a pale curving tree trunk beside the birds." },
      { type: "limitation", description: "The trees differ in form and scale. Their presence does not establish the same species, symbolism, workshop, or historical influence." }
    ],
    agreement: "",
    status: "candidate",
    narrative: "Start with the small palm at the left of the pavilion, then look at the bending trunk beside the bird assembly. Both place a tree next to the main activity, but the first is a compact garden detail and the second occupies much of its landscape. This is a comparison of visible plant motifs, not evidence of a shared paradise meaning or a documented exchange."
  },
  {
    id: "rel_002",
    sourceArtworkId: "art_001",
    sourceElementId: "elem_001_01",
    targetArtworkId: "art_004",
    targetElementId: "elem_004_02",
    relationshipType: "shared_motif",
    evidence: [
      { type: "visual_comparison", description: "The pavilion contains two seated figures facing one another; the Gita Govinda image places two closely grouped, embracing figures at its center." },
      { type: "limitation", description: "One pair is seated and the other upright. The Met identifies different literary subjects; the comparison does not equate their identities or meanings." }
    ],
    agreement: "",
    status: "candidate",
    narrative: "Follow the close grouping of two figures from the pavilion to the center of the red-ground scene. Facing bodies and nearby attendants help draw attention to each pair. Their poses and literary settings differ, so this visual resemblance is not a claim of a common story, shared emotional state, or direct influence."
  },
  {
    id: "rel_003",
    sourceArtworkId: "art_003",
    sourceElementId: "elem_003_01",
    targetArtworkId: "art_005",
    targetElementId: "elem_005_01",
    relationshipType: "shared_motif",
    evidence: [
      { type: "visual_comparison", description: "Both selected details show a peacock's blue head and neck beside a densely patterned wing or body; one bird rests on a tree and the other on a stone ledge." },
      { type: "limitation", description: "The Met catalogs a woodblock print and an oil painting. Similar subject matter does not demonstrate shared technique or contact between the artists." }
    ],
    agreement: "",
    status: "candidate",
    narrative: "Compare the small patterned marks on Hiroshige's perched bird with the broad patterned wing in Peacocks. Both make the bird recognizable through its head, neck, and plumage, while scale, setting, and medium differ. This comparison establishes neither a transmission route nor matching intentions."
  },
  {
    id: "rel_004",
    sourceArtworkId: "art_002",
    sourceElementId: "elem_002_01",
    targetArtworkId: "art_004",
    targetElementId: "elem_004_01",
    relationshipType: "shared_motif",
    evidence: [
      { type: "visual_comparison", description: "A peacock with a rounded fan appears beside the tree in the bird assembly; a small long-tailed peacock appears inside the rightmost tree crown in the Krishna scene." },
      { type: "limitation", description: "Their tail positions and roles in the compositions differ. Neither the visual comparison nor the catalog fields establish a shared spiritual interpretation." }
    ],
    agreement: "",
    status: "candidate",
    narrative: "Move from the fanned tail beside the curving tree to the slender dark tail inside the rounded tree crown. A peacock is visible in both, but one participates in a bird assembly and the other is a small detail above the human figures. The comparison is limited to the depicted bird, not a claim that the two literary traditions give it the same meaning."
  },
  {
    id: "rel_005",
    sourceArtworkId: "art_003",
    sourceElementId: "elem_003_01",
    targetArtworkId: "art_002",
    targetElementId: "elem_002_01",
    relationshipType: "shared_motif",
    evidence: [
      { type: "visual_comparison", description: "Hiroshige's print gives a peacock most of a narrow composition; the bird folio includes a much smaller peacock with a fanned tail beside a tree." },
      { type: "limitation", description: "The shared subject does not imply a common artistic tradition. The print's hanging train differs from the manuscript bird's displayed fan." }
    ],
    agreement: "",
    status: "candidate",
    narrative: "Look from the large perched peacock to the small fan-tailed bird among many other birds. Recognizable plumage lets the eye connect them even as their relative size and posture change. This is an exploratory subject comparison, not evidence that either artist knew the other work or intended the same symbolism."
  },
  {
    id: "rel_006",
    sourceArtworkId: "art_004",
    sourceElementId: "elem_004_01",
    targetArtworkId: "art_005",
    targetElementId: "elem_005_01",
    relationshipType: "shared_motif",
    evidence: [
      { type: "visual_comparison", description: "The small tree-crown peacock and the large ledge-perched peacock both have curved necks and elongated plumage, but occupy very different proportions of their images." },
      { type: "limitation", description: "The comparison does not establish how either artist observed the birds, a trade connection, or a shared symbolic purpose." }
    ],
    agreement: "",
    status: "candidate",
    narrative: "A bird that is easy to miss above Krishna becomes a dominant presence in Peacocks. Compare the small curved neck and narrow tail in the tree with the large blue neck, patterned wing, and descending train on the ledge. The contrast concerns visible scale and emphasis; it does not document cultural exchange or the artist's intention."
  },
  ...ADDITIONAL_RELATIONSHIPS,
  ...CULTURAL_RELATIONSHIPS
];
