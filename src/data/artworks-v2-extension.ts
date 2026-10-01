import type { V2Artwork, V2Element, V2Relationship } from './artworks-v2';

// Catalog fields and public-domain status checked against the five Met API records.
// Existing local images are reused; descriptions and comparisons are visual interpretations.
export const ADDITIONAL_ARTWORKS: V2Artwork[] = [
  {
    id: 'art_006',
    title: 'Under the Wave off Kanagawa (Kanagawa oki nami ura), also known as The Great Wave, from the series Thirty-six Views of Mount Fuji (Fugaku sanjūrokkei)',
    creator: 'Katsushika Hokusai',
    year: 'ca. 1830–32',
    medium: 'Woodblock print; ink and color on paper',
    tradition: 'Japanese woodblock print',
    region: 'Japan; production city not specified in the Met API record',
    source: 'The Metropolitan Museum of Art — collection API, object 36491; accession JP10',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/36491',
    rights: 'Public Domain',
    image: '/artworks/hokusai.jpg',
    description: 'A curling blue wave breaks into pale, hooked foam above three narrow boats. Small figures crouch along the hulls, while Mount Fuji appears low in the opening between the waves. A vertical title frame and adjacent writing occupy the upper left.',
    artistStatement: null,
    sourceType: 'ai_inferred'
  },
  {
    id: 'art_007',
    title: 'The Gulf Stream',
    creator: 'Winslow Homer',
    year: '1899; reworked by 1906',
    medium: 'Oil on canvas',
    tradition: 'American painting',
    region: 'American artist; production place not specified in the Met API record',
    source: 'The Metropolitan Museum of Art — collection API, object 11122; accession 06.1234',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/11122',
    rights: 'Public Domain',
    image: '/artworks/homer.jpg',
    description: 'A man reclines on the deck of a small boat with a broken mast, surrounded by dark, choppy water. Sharks cross the foreground, white foam breaks behind the boat, and a distant sailing ship and waterspout appear on opposite sides of the horizon.',
    artistStatement: null,
    sourceType: 'ai_inferred'
  },
  {
    id: 'art_008',
    title: 'The Adoration of the Magi',
    creator: 'Gerard David',
    year: 'ca. 1520',
    medium: 'Oil on wood',
    tradition: 'Netherlandish painting',
    region: 'Netherlandish artist; production place not specified in the Met API record',
    source: 'The Metropolitan Museum of Art — collection API, object 436104; accession 1982.60.17',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/436104',
    rights: 'Public Domain',
    image: '/artworks/david.jpg',
    description: 'Mary sits at the left holding the Christ Child as richly dressed visitors gather with vessels. A king in a green mantle stands at the right with a lidded gold-colored gift. Stone columns and an arch frame a distant landscape, and a small dog lowers its nose in the foreground.',
    artistStatement: null,
    sourceType: 'ai_inferred'
  },
  {
    id: 'art_009',
    title: 'Self-Portrait',
    creator: 'Rembrandt (Rembrandt van Rijn)',
    year: '1660',
    medium: 'Oil on canvas',
    tradition: 'Dutch painting',
    region: 'Dutch artist; production place not specified in the Met API record',
    source: 'The Metropolitan Museum of Art — collection API, object 437397; accession 14.40.618',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/437397',
    rights: 'Public Domain',
    image: '/artworks/rembrandt.jpg',
    description: 'Rembrandt faces outward beneath a broad dark cap, wearing a brown coat against a muted background. Light catches the forehead, nose, and cheek, with deeper shadows along the other side of the face. Dark lettering and a date appear near the right edge.',
    artistStatement: null,
    sourceType: 'ai_inferred'
  },
  {
    id: 'art_010',
    title: 'Young Woman with a Water Pitcher',
    creator: 'Johannes Vermeer',
    year: 'ca. 1662',
    medium: 'Oil on canvas',
    tradition: 'Dutch painting',
    region: 'Dutch artist; production place not specified in the Met API record',
    source: 'The Metropolitan Museum of Art — collection API, object 437881; accession 89.15.21',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/437881',
    rights: 'Public Domain',
    image: '/artworks/vermeer.jpg',
    description: 'A woman in a white headcloth stands between an open window and a carpet-covered table, one hand on the window frame and the other at a metal pitcher. A broad basin catches the light beneath the pitcher; a wall map and a blue-draped chair complete the interior.',
    artistStatement: null,
    sourceType: 'ai_inferred'
  }
];

// Hand-drawn detail polygons use the full local image, including its margins, on a 0–1 grid.
// Classic motif rectangles in artworks.ts provided starting regions, refined by visual inspection.
export const ADDITIONAL_ELEMENTS: Record<string, V2Element[]> = {
  art_006: [
    {
      id: 'elem_006_01',
      label: 'Foreground boat and crouching crew',
      type: 'object',
      geometry: {
        type: 'polygon',
        points: [
          [0.402, 0.782], [0.433, 0.819], [0.475, 0.860],
          [0.535, 0.896], [0.589, 0.918], [0.657, 0.927],
          [0.713, 0.916], [0.769, 0.894], [0.824, 0.879],
          [0.879, 0.858], [0.834, 0.909], [0.778, 0.944],
          [0.709, 0.976], [0.539, 0.979], [0.495, 0.945],
          [0.456, 0.889], [0.421, 0.846]
        ]
      },
      meaning: {
        text: 'A long hull curves across the bottom of the print, with a line of small heads and bent bodies near its right end. The boat’s low profile emphasizes the height of the surrounding water.',
        sourceType: 'ai_inferred'
      },
      technique: 'Fine dark lines describe the hull and crew against broad blue and pale printed areas.',
      tradition: 'Boat detail in Hokusai’s Japanese woodblock print.'
    },
    {
      id: 'elem_006_02',
      label: 'Breaking crest and hooked foam',
      type: 'motif',
      geometry: {
        type: 'polygon',
        points: [
          [0.225, 0.294], [0.240, 0.253], [0.284, 0.226],
          [0.320, 0.230], [0.341, 0.196], [0.369, 0.184],
          [0.367, 0.156], [0.402, 0.144], [0.439, 0.164],
          [0.470, 0.185], [0.500, 0.206], [0.510, 0.271],
          [0.552, 0.281], [0.579, 0.320], [0.597, 0.373],
          [0.578, 0.381], [0.583, 0.432], [0.553, 0.470],
          [0.538, 0.426], [0.505, 0.438], [0.481, 0.414],
          [0.451, 0.420], [0.443, 0.380], [0.423, 0.358],
          [0.389, 0.321], [0.350, 0.341], [0.311, 0.361],
          [0.274, 0.385], [0.235, 0.367]
        ]
      },
      meaning: {
        text: 'Pale branching tips curl forward from the blue crest. Repeated hooks and scattered droplets make the upper wave appear to break apart above the boats.',
        sourceType: 'ai_inferred'
      },
      technique: 'Crisp blue contours separate pale foam shapes from the wave and unprinted-looking sky.',
      tradition: 'Wave detail in the cataloged Thirty-six Views of Mount Fuji series.'
    },
    {
      id: 'elem_006_03',
      label: 'Title cartouche and adjacent writing',
      type: 'inscription',
      geometry: {
        type: 'polygon',
        points: [
          [0.049, 0.095], [0.088, 0.098], [0.090, 0.204],
          [0.090, 0.315], [0.050, 0.314], [0.049, 0.349],
          [0.021, 0.350], [0.020, 0.205], [0.037, 0.190],
          [0.049, 0.193]
        ]
      },
      meaning: {
        text: 'Vertical characters sit inside a narrow outlined frame, with another column beside it. The writing forms a compact upright accent against the broad curves of the sea.',
        sourceType: 'ai_inferred'
      },
      technique: 'Small dark printed characters and thin framing lines contrast with the pale paper.',
      tradition: 'Inscription detail in a Japanese print; the title names the series and view.'
    }
  ],
  art_007: [
    {
      id: 'elem_007_01',
      label: 'Reclining man and damaged boat',
      type: 'figure',
      geometry: {
        type: 'polygon',
        points: [
          [0.284, 0.466], [0.316, 0.458], [0.351, 0.451],
          [0.351, 0.437], [0.370, 0.463], [0.407, 0.438],
          [0.468, 0.433], [0.506, 0.457], [0.552, 0.452],
          [0.588, 0.425], [0.595, 0.391], [0.612, 0.384],
          [0.627, 0.402], [0.622, 0.448], [0.628, 0.465],
          [0.670, 0.470], [0.684, 0.510], [0.675, 0.556],
          [0.636, 0.603], [0.624, 0.655], [0.578, 0.694],
          [0.543, 0.712], [0.495, 0.691], [0.457, 0.662],
          [0.357, 0.646], [0.330, 0.603], [0.315, 0.556],
          [0.306, 0.500]
        ]
      },
      meaning: {
        text: 'The man leans back on the open deck, his legs extending toward the broken mast and cabin. The tilted hull and surrounding waves make the boat the central point of attention.',
        sourceType: 'ai_inferred'
      },
      technique: 'Warm brown deck shapes and the figure’s lit torso stand out against dark blue-green water.',
      tradition: 'Figure and boat grouping in Homer’s American oil painting.'
    },
    {
      id: 'elem_007_02',
      label: 'Foaming wave behind the boat',
      type: 'motif',
      geometry: {
        type: 'polygon',
        points: [
          [0.318, 0.321], [0.334, 0.298], [0.367, 0.292],
          [0.386, 0.272], [0.423, 0.267], [0.447, 0.278],
          [0.457, 0.258], [0.478, 0.269], [0.487, 0.296],
          [0.523, 0.299], [0.547, 0.315], [0.511, 0.338],
          [0.477, 0.345], [0.451, 0.357], [0.417, 0.354],
          [0.389, 0.371], [0.348, 0.357], [0.327, 0.342]
        ]
      },
      meaning: {
        text: 'A pale crest breaks across a dark ridge behind the boat. Rounded patches of foam interrupt the long sloping bands of water.',
        sourceType: 'ai_inferred'
      },
      technique: 'Broken pale strokes and soft-edged patches of blue-green paint describe the foaming crest.',
      tradition: 'Sea detail in the cataloged oil-on-canvas painting.'
    }
  ],
  art_008: [
    {
      id: 'elem_008_01',
      label: 'Seated Virgin and Child',
      type: 'figure',
      geometry: {
        type: 'polygon',
        points: [
          [0.065, 0.449], [0.096, 0.438], [0.128, 0.450],
          [0.140, 0.478], [0.130, 0.525], [0.128, 0.549],
          [0.145, 0.548], [0.154, 0.573], [0.151, 0.598],
          [0.182, 0.624], [0.201, 0.641], [0.193, 0.661],
          [0.212, 0.717], [0.235, 0.776], [0.256, 0.829],
          [0.209, 0.851], [0.141, 0.864], [0.082, 0.874],
          [0.018, 0.856], [0.025, 0.752], [0.020, 0.662],
          [0.034, 0.573], [0.051, 0.509]
        ]
      },
      meaning: {
        text: 'The seated woman’s white veil and dark blue mantle surround the small child on her lap. Their overlapping bodies form a compact group at the left, turned toward the visitors.',
        sourceType: 'ai_inferred'
      },
      technique: 'Fine contours, shaded cloth folds, and pale skin distinguish the two figures.',
      tradition: 'Mary and the Christ Child in the Met’s cataloged Adoration subject.'
    },
    {
      id: 'elem_008_02',
      label: 'Lidded vessel held by the standing king',
      type: 'object',
      geometry: {
        type: 'polygon',
        points: [
          [0.769, 0.457], [0.777, 0.458], [0.777, 0.474],
          [0.788, 0.480], [0.794, 0.497], [0.791, 0.518],
          [0.781, 0.526], [0.784, 0.535], [0.761, 0.536],
          [0.758, 0.525], [0.752, 0.511], [0.755, 0.490],
          [0.764, 0.477]
        ]
      },
      meaning: {
        text: 'The king at the right holds a small gold-colored vessel against his green mantle. Bright rims and rounded decorations make its curved surface legible at a small scale.',
        sourceType: 'ai_inferred'
      },
      technique: 'Small pale highlights and darker recesses describe reflective metal in oil paint.',
      tradition: 'Gift-vessel detail within David’s Netherlandish religious panel.'
    },
    {
      id: 'elem_008_03',
      label: 'Diagonal stone beam above the visitors',
      type: 'architectural',
      geometry: {
        type: 'polygon',
        points: [
          [0.665, 0.174], [0.853, 0.069], [0.939, 0.014],
          [0.982, 0.013], [0.983, 0.093], [0.819, 0.175],
          [0.750, 0.209], [0.690, 0.242], [0.665, 0.231]
        ]
      },
      meaning: {
        text: 'A long stone beam crosses the upper right on a diagonal above the standing figures. Parallel bands and a carved-looking strip give the architecture depth and direction.',
        sourceType: 'ai_inferred'
      },
      technique: 'Straight receding edges, tonal bands, and small ornamental marks define the stonework.',
      tradition: 'Architectural framing within the cataloged Netherlandish panel.'
    }
  ],
  art_009: [
    {
      id: 'elem_009_01',
      label: 'Lit face beneath the dark cap',
      type: 'figure',
      geometry: {
        type: 'polygon',
        points: [
          [0.376, 0.285], [0.427, 0.254], [0.490, 0.258],
          [0.538, 0.280], [0.574, 0.319], [0.588, 0.367],
          [0.595, 0.418], [0.579, 0.466], [0.550, 0.510],
          [0.520, 0.545], [0.482, 0.558], [0.436, 0.547],
          [0.412, 0.510], [0.371, 0.481], [0.337, 0.449],
          [0.323, 0.414], [0.330, 0.376], [0.355, 0.346]
        ]
      },
      meaning: {
        text: 'Light picks out the forehead, nose, and cheek while the far cheek and eye sit in deeper shade. The face emerges from the darker cap, collar, and background.',
        sourceType: 'ai_inferred'
      },
      technique: 'Varied warm and pale strokes build facial planes against broad areas of brown shadow.',
      tradition: 'Face detail in Rembrandt’s cataloged self-portrait of 1660.'
    },
    {
      id: 'elem_009_02',
      label: 'Painted signature and date at the right edge',
      type: 'inscription',
      geometry: {
        type: 'polygon',
        points: [
          [0.875, 0.698], [0.915, 0.699], [0.970, 0.718],
          [0.974, 0.743], [0.964, 0.770], [0.929, 0.765],
          [0.931, 0.740], [0.896, 0.729], [0.871, 0.719]
        ]
      },
      meaning: {
        text: 'Dark slanting letters and numerals appear beside the shoulder near the right edge. Their small scale and low contrast reward a closer look at the painted surface.',
        sourceType: 'ai_inferred'
      },
      technique: 'Thin dark painted strokes sit over the lighter brown background.',
      tradition: 'Inscription detail in the Dutch portrait; the Met dates the painting to 1660.'
    }
  ],
  art_010: [
    {
      id: 'elem_010_01',
      label: 'Pitcher and broad metal basin',
      type: 'object',
      geometry: {
        type: 'polygon',
        points: [
          [0.586, 0.592], [0.609, 0.599], [0.643, 0.608],
          [0.674, 0.603], [0.688, 0.620], [0.683, 0.664],
          [0.675, 0.709], [0.738, 0.716], [0.796, 0.722],
          [0.791, 0.737], [0.766, 0.763], [0.709, 0.773],
          [0.627, 0.768], [0.548, 0.760], [0.509, 0.747],
          [0.503, 0.733], [0.472, 0.719], [0.506, 0.708],
          [0.607, 0.706], [0.605, 0.674], [0.605, 0.630]
        ]
      },
      meaning: {
        text: 'A tall pitcher rises from a wide shallow basin on the table. Pale reflections along the rims and darker vertical areas on the pitcher distinguish their curved metal surfaces.',
        sourceType: 'ai_inferred'
      },
      technique: 'Broad tonal reflections and small bright accents suggest metal catching the window light.',
      tradition: 'Household objects in Vermeer’s cataloged Dutch interior painting.'
    },
    {
      id: 'elem_010_02',
      label: 'White headcloth and lowered face',
      type: 'figure',
      geometry: {
        type: 'polygon',
        points: [
          [0.414, 0.251], [0.459, 0.228], [0.501, 0.211],
          [0.539, 0.212], [0.570, 0.244], [0.584, 0.284],
          [0.581, 0.330], [0.574, 0.350], [0.610, 0.380],
          [0.646, 0.419], [0.675, 0.465], [0.675, 0.489],
          [0.638, 0.508], [0.583, 0.524], [0.513, 0.526],
          [0.465, 0.520], [0.469, 0.458], [0.452, 0.413],
          [0.433, 0.462], [0.411, 0.512], [0.366, 0.499],
          [0.318, 0.465], [0.296, 0.439], [0.328, 0.410],
          [0.386, 0.369], [0.385, 0.333], [0.398, 0.285]
        ]
      },
      meaning: {
        text: 'A white head covering and broad collar frame the woman’s lowered face. Pale blue-grey folds alternate with bright cloth, making the head and shoulders stand out from the wall.',
        sourceType: 'ai_inferred'
      },
      technique: 'Soft tonal transitions model the face and folded cloth in the light from the left.',
      tradition: 'Figure detail in Young Woman with a Water Pitcher.'
    },
    {
      id: 'elem_010_03',
      label: 'Open leaded window',
      type: 'architectural',
      geometry: {
        type: 'polygon',
        points: [
          [0.019, 0.055], [0.084, 0.078], [0.133, 0.097],
          [0.132, 0.277], [0.130, 0.453], [0.129, 0.575],
          [0.134, 0.654], [0.074, 0.665], [0.021, 0.669],
          [0.020, 0.483], [0.022, 0.308]
        ]
      },
      meaning: {
        text: 'The open window forms a narrow upright panel at the left. Its dark frame and repeated angular divisions contrast with the softer folds of the nearby sleeve and headcloth.',
        sourceType: 'ai_inferred'
      },
      technique: 'Straight dark bars and muted panes establish a geometric structure at the edge of the room.',
      tradition: 'Architectural detail in the cataloged Dutch interior.'
    }
  ]
};

// rel_001–rel_006 belong to the base corpus; extension IDs begin at rel_010.
// Comparisons concern visible forms, not historical influence or shared symbolic meanings.
export const ADDITIONAL_RELATIONSHIPS: V2Relationship[] = [
  {
    id: 'rel_010',
    sourceArtworkId: 'art_001',
    sourceElementId: 'elem_001_01',
    targetArtworkId: 'art_008',
    targetElementId: 'elem_008_01',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'The pavilion contains two seated figures close together; David groups a seated woman and a child on her lap at the left of the panel.' },
      { type: 'limitation', description: 'The first group has two adults, while the second has an adult and child; their cataloged stories differ.' }
    ],
    agreement: '',
    status: 'candidate',
    narrative: 'Compare how two nearby bodies form a compact focus within a larger gathering. The pavilion gives its seated pair an architectural enclosure; David brings the mother and child together through overlapping bodies and blue drapery. Their grouping is the visual connection.'
  },
  {
    id: 'rel_011',
    sourceArtworkId: 'art_001',
    sourceElementId: 'elem_001_03',
    targetArtworkId: 'art_008',
    targetElementId: 'elem_008_03',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'Layered straight bands form the pavilion’s projecting roof; long parallel bands define David’s diagonal stone beam above the visitors.' },
      { type: 'limitation', description: 'These are different architectural forms and materials, compared for their visible placement and edges.' }
    ],
    agreement: '',
    status: 'candidate',
    narrative: 'Follow the bands above the seated pair, then the diagonal beam above David’s standing visitors. Both details establish an overhead structure using straight edges and stacked strips, but the small colored roof and the large shaded stonework organize space differently.'
  },
  {
    id: 'rel_012',
    sourceArtworkId: 'art_003',
    sourceElementId: 'elem_003_01',
    targetArtworkId: 'art_006',
    targetElementId: 'elem_006_02',
    relationshipType: 'shared_technique',
    evidence: [
      { type: 'visual_comparison', description: 'Hiroshige’s bird has clear dark contours and repeated pale body marks; Hokusai’s crest uses blue contours around repeated pale foam shapes.' },
      { type: 'catalog_metadata', description: 'The Met identifies objects 36741 and 36491 as woodblock prints.' },
      { type: 'limitation', description: 'A shared medium and visible outline treatment do not identify the same blocks, pigments, or workshop.' }
    ],
    agreement: '',
    status: 'candidate',
    narrative: 'Move from the outlined plumage to the outlined foam. Both prints make small pale shapes readable against darker blue areas. The bird’s compact patterned body and the wave’s branching crest put this contrast to very different uses.'
  },
  {
    id: 'rel_013',
    sourceArtworkId: 'art_006',
    sourceElementId: 'elem_006_02',
    targetArtworkId: 'art_003',
    targetElementId: 'elem_003_01',
    relationshipType: 'shared_technique',
    evidence: [
      { type: 'visual_comparison', description: 'Pale foam enclosed by blue contours in Hokusai’s wave can be compared with the pale marks and dark contours of Hiroshige’s peacock body.' },
      { type: 'catalog_metadata', description: 'Both works are cataloged by the Met as woodblock prints, objects 36491 and 36741.' },
      { type: 'limitation', description: 'The comparison concerns printed contrast and contour, not the subject’s meaning or an artist-to-artist exchange.' }
    ],
    agreement: '',
    status: 'candidate',
    narrative: 'From the breaking wave, look for another use of small light shapes inside a dark outlined form. Hiroshige’s peacock supplies a quieter, more tightly patterned example. The visible connection is a graphic treatment in two prints.'
  },
  {
    id: 'rel_014',
    sourceArtworkId: 'art_006',
    sourceElementId: 'elem_006_01',
    targetArtworkId: 'art_007',
    targetElementId: 'elem_007_01',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'A narrow boat with crouching figures sits low between Hokusai’s waves; Homer places a reclining man in a damaged boat amid choppy water.' },
      { type: 'limitation', description: 'The crew size, boat construction, viewpoint, and medium differ.' }
    ],
    agreement: '',
    status: 'candidate',
    narrative: 'Look along the low hull and clustered heads in the foreground boat, then across Homer’s open deck toward the reclining man. In both images, people occupy a small vessel surrounded by much larger areas of water. One compresses a crew into a thin line; the other gives a single figure more space.'
  },
  {
    id: 'rel_015',
    sourceArtworkId: 'art_007',
    sourceElementId: 'elem_007_02',
    targetArtworkId: 'art_006',
    targetElementId: 'elem_006_02',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'A pale breaking crest rises behind Homer’s boat; Hokusai’s much larger crest splits into pale hooked foam above his boats.' },
      { type: 'limitation', description: 'Homer’s broken painted patches and Hokusai’s crisp printed outlines use different media and scales.' }
    ],
    agreement: '',
    status: 'candidate',
    narrative: 'Follow the white foam behind Homer’s boat to the pale tips of Hokusai’s wave. Both lighten the crest against darker water. Homer spreads the foam in rounded, broken patches, while Hokusai gives it sharply branching contours.'
  },
  {
    id: 'rel_016',
    sourceArtworkId: 'art_006',
    sourceElementId: 'elem_006_03',
    targetArtworkId: 'art_009',
    targetElementId: 'elem_009_02',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'Hokusai places vertical writing near the upper-left edge; Rembrandt places small dark letters and date numerals near the right edge.' },
      { type: 'limitation', description: 'A framed title with adjacent writing and a painted signature have different functions; this comparison does not translate the characters.' }
    ],
    agreement: '',
    status: 'candidate',
    narrative: 'Shift attention from the main subject to writing near the image edge. The print presents an upright framed block; the portrait uses low-contrast slanting strokes. Both invite a second kind of looking, from depicted forms to marks that can be read.'
  },
  {
    id: 'rel_017',
    sourceArtworkId: 'art_009',
    sourceElementId: 'elem_009_02',
    targetArtworkId: 'art_006',
    targetElementId: 'elem_006_03',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'Small dark lettering sits beside Rembrandt’s shoulder; dark characters occupy a frame and adjacent column at the edge of Hokusai’s print.' },
      { type: 'limitation', description: 'The link concerns visible writing, with distinct scripts, orientation, and catalog functions.' }
    ],
    agreement: '',
    status: 'candidate',
    narrative: 'The faint writing beside the portrait’s shoulder leads to the more prominent vertical writing beside the wave. Compare how scale and contrast let an inscription sit alongside a picture without becoming its main subject.'
  },
  {
    id: 'rel_018',
    sourceArtworkId: 'art_009',
    sourceElementId: 'elem_009_01',
    targetArtworkId: 'art_010',
    targetElementId: 'elem_010_02',
    relationshipType: 'shared_technique',
    evidence: [
      { type: 'visual_comparison', description: 'Light picks out Rembrandt’s forehead, nose, and cheek; Vermeer models the lowered face and surrounding white folds with light from the window side.' },
      { type: 'limitation', description: 'Rembrandt’s light source is outside the image, while Vermeer includes a window. The observed tonal modeling does not establish identical working methods.' }
    ],
    agreement: '',
    status: 'candidate',
    narrative: 'Compare the transitions from light to shadow around each face. Rembrandt surrounds warm facial planes with a dark cap and collar; Vermeer surrounds a quieter, lowered face with pale cloth. Each oil painting uses tonal differences to give the head volume.'
  },
  {
    id: 'rel_019',
    sourceArtworkId: 'art_010',
    sourceElementId: 'elem_010_02',
    targetArtworkId: 'art_008',
    targetElementId: 'elem_008_01',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'Vermeer’s woman wears a white head covering and lowers her face; David’s seated Mary wears a white veil above a dark blue mantle and looks toward the child.' },
      { type: 'limitation', description: 'Similar clothing colors and lowered heads accompany different figures, actions, and settings.' }
    ],
    agreement: '',
    status: 'candidate',
    narrative: 'Follow the white cloth around the face from the room to the Adoration scene. In both, it makes the lowered head easy to find above darker clothing. The visual rhyme is in the framing of a face, while one figure stands at a table and the other supports a child.'
  },
  {
    id: 'rel_020',
    sourceArtworkId: 'art_008',
    sourceElementId: 'elem_008_02',
    targetArtworkId: 'art_010',
    targetElementId: 'elem_010_01',
    relationshipType: 'shared_technique',
    evidence: [
      { type: 'visual_comparison', description: 'Small bright rims articulate the king’s lidded vessel; broader reflections describe Vermeer’s pitcher and basin.' },
      { type: 'catalog_metadata', description: 'The Met catalogs David’s object 436104 as oil on wood and Vermeer’s object 437881 as oil on canvas.' },
      { type: 'limitation', description: 'The gift vessel and household objects have different uses; their precise metal composition is not established by appearance.' }
    ],
    agreement: '',
    status: 'candidate',
    narrative: 'Look at the tiny bright accents on the king’s vessel, then the longer reflections along the pitcher and basin. Each painter makes a curved surface appear reflective through contrasts of light and dark. David’s compact ornament and Vermeer’s broad household shapes offer different scales for this comparison.'
  },
  {
    id: 'rel_021',
    sourceArtworkId: 'art_010',
    sourceElementId: 'elem_010_03',
    targetArtworkId: 'art_001',
    targetElementId: 'elem_001_03',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'Dark straight bars organize Vermeer’s window; layered straight bands organize the pavilion roof above the seated pair.' },
      { type: 'limitation', description: 'A window and a roof are different building parts; the comparison is restricted to visible geometric framing.' }
    ],
    agreement: '',
    status: 'candidate',
    narrative: 'From the window’s angular divisions, return to the pavilion’s layered roof. Straight architectural edges provide a contrast to nearby bodies and drapery in both images, whether placed at the side of the scene or above its central pair.'
  },
  {
    id: 'rel_022',
    sourceArtworkId: 'art_005',
    sourceElementId: 'elem_005_01',
    targetArtworkId: 'art_009',
    targetElementId: 'elem_009_01',
    relationshipType: 'shared_technique',
    evidence: [
      { type: 'visual_comparison', description: 'Light and dark feather patches articulate the peacock’s rounded wing; contrasting illuminated and shaded planes give Rembrandt’s face volume.' },
      { type: 'catalog_metadata', description: 'The Met catalogs objects 436671 and 437397 as oil on canvas.' },
      { type: 'limitation', description: 'Plumage patterns and skin are different surfaces. The comparison concerns visible tonal contrast rather than a particular paint recipe.' }
    ],
    agreement: '',
    status: 'candidate',
    narrative: 'Compare a rounded patterned wing with a modeled face. The bird’s many small feather contrasts and the portrait’s broader facial shadows both separate lighter surfaces from darker surroundings. This is an exploratory comparison of how two oil paintings make forms readable.'
  },
  {
    id: 'rel_023',
    sourceArtworkId: 'art_010',
    sourceElementId: 'elem_010_02',
    targetArtworkId: 'art_009',
    targetElementId: 'elem_009_01',
    relationshipType: 'shared_technique',
    evidence: [
      { type: 'visual_comparison', description: 'Vermeer’s lowered face has soft transitions between light and shade inside the white headcloth; Rembrandt’s outward-facing head has brighter warm planes against deep surrounding shadows.' },
      { type: 'limitation', description: 'The faces have different orientations and contrasts; the shared tonal modeling does not establish a common studio or light source.' }
    ],
    agreement: '',
    status: 'candidate',
    narrative: 'Move from the softly shaded face inside the white cloth to the more strongly lit face beneath the dark cap. Both gain volume through changes in tone, while the contrasting surrounds make each head stand out in a different way.'
  }
];
