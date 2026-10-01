import type { V2Artwork, V2Element, V2Relationship } from './artworks-v2';

const PHOTO_SOURCE = 'https://commons.wikimedia.org/wiki/File:Lord_Shree_Durga_Devi_slays_Mahishasura.jpg';
const SCULPTURE_SOURCE = 'https://www.metmuseum.org/art/collection/search/38418';
const PAINTING_SOURCE = 'https://www.metmuseum.org/art/collection/search/73169';
const GITA_GOVINDA_SOURCE = 'https://www.metmuseum.org/art/collection/search/65584';
const CC_BY_SA = 'https://creativecommons.org/licenses/by-sa/4.0';
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';

// The approved JPEGs already contain resizing and compression; these copies are unchanged.
export const CULTURAL_ARTWORKS: V2Artwork[] = [
  {
    id: 'art_011',
    title: 'Lord Shree Durga Devi slays Mahishasura',
    creator: 'Krishnamoorthy Sudhakar (photographer; performers and designers unidentified)',
    year: '2023 (photograph metadata)',
    medium: 'Digital photograph of a staged performance',
    tradition: 'Yakshagana (source identification)',
    region: 'India (uploader-stated); venue unverified',
    source: 'Wikimedia Commons — photograph by Krishnamoorthy Sudhakar; subject identification is uploader-stated',
    sourceUrl: PHOTO_SOURCE,
    sourceKind: 'photograph',
    rights: 'CC BY-SA 4.0 — attribution and share-alike required',
    image: '/artworks/yk-durga-slays-mahishasura.jpg',
    imageCredit: {
      title: 'Lord Shree Durga Devi slays Mahishasura.jpg',
      creator: 'Krishnamoorthy Sudhakar',
      sourceUrl: PHOTO_SOURCE,
      license: 'CC BY-SA 4.0',
      licenseUrl: CC_BY_SA,
      changes: 'Resized from 5875 × 3917 to 1400 × 933 and JPEG-reencoded; embedded camera metadata removed. No cropping or artistic filters.'
    },
    culturalClaims: [
      {
        text: 'The supplied Commons record credits the photograph “Lord Shree Durga Devi slays Mahishasura.jpg” to Krishnamoorthy Sudhakar under CC BY-SA 4.0. This is a photography credit, not a performer, costume-design, or production credit.',
        tier: 'verified',
        source: { label: 'Wikimedia Commons photograph and credit record', url: PHOTO_SOURCE }
      },
      {
        text: 'The source identifies the subject as Durga slaying Mahishasura in a Yakshagana scene. This identification is uploader-stated, not independently verified performance documentation.',
        tier: 'unverified',
        source: { label: 'Uploader-stated subject in the Commons source record', url: PHOTO_SOURCE }
      },
      {
        text: 'The venue, troupe, named performers, costume designers, and specific performance narrative (prasanga) remain unverified. Neither a banner in the image nor the subject title is sufficient to establish them.',
        tier: 'unverified',
        source: { label: 'Limitations of the supplied photograph record', url: PHOTO_SOURCE }
      },
      {
        text: 'The image license does not establish performer consent or community endorsement. Neither is inferred here; community review would be needed for claims of endorsement or appropriate ritual use.',
        tier: 'community_review',
        source: { label: 'Scope of the supplied image credit; no consent or endorsement documentation supplied', url: PHOTO_SOURCE }
      },
      {
        text: 'The regions and comparisons describe visible costume, pose, and composition only. They do not identify a ritual, assign a single community meaning, or establish a historical connection to the museum works.',
        tier: 'interpretation',
        source: { label: 'AI visual reading of the approved photograph' }
      }
    ],
    description: 'A crowned, garlanded figure stands at the left with a fan of arm-like costume forms behind the shoulders. A long staff crosses toward a second costumed figure bending at the right. Layered skirts, bright trim, flower garlands, striped posts, and a lettered backdrop frame the encounter. The uploader names Durga and Mahishasura; the photograph alone does not verify the production or the performers’ identities.',
    artistStatement: null,
    sourceType: 'ai_inferred'
  },
  {
    id: 'art_012',
    title: 'The Goddess Durga Slaying the Buffalo Demon (Mahisasura Mardini)',
    creator: 'Unknown artist (not named in the Met record)',
    year: '10th century',
    medium: 'Sandstone',
    tradition: 'Indian sandstone sculpture (Met attribution)',
    region: 'India (Rajasthan)',
    source: 'The Metropolitan Museum of Art — object 38418; accession 33.65.2; Gift of George D. Pratt, 1933',
    sourceUrl: SCULPTURE_SOURCE,
    sourceKind: 'museum',
    rights: 'Public Domain — The Metropolitan Museum of Art, Open Access (CC0)',
    image: '/artworks/met-38418-mahishasura-mardini-rajasthan.jpg',
    imageCredit: {
      title: 'The Goddess Durga Slaying the Buffalo Demon (Mahisasura Mardini)',
      creator: 'Unknown artist; image courtesy of The Metropolitan Museum of Art',
      sourceUrl: SCULPTURE_SOURCE,
      license: 'CC0',
      licenseUrl: CC0,
      changes: 'Resized to 1050 × 1400 and JPEG-reencoded; embedded camera metadata removed. No cropping or artistic filters.'
    },
    culturalClaims: [
      {
        text: 'The Met catalogs this work as The Goddess Durga Slaying the Buffalo Demon (Mahisasura Mardini), 10th century, India (Rajasthan), sandstone, accession 33.65.2. No artist is named in the supplied record.',
        tier: 'verified',
        source: { label: 'The Met, object 38418: supplied catalog metadata', url: SCULPTURE_SOURCE }
      },
      {
        text: 'The catalog credit is “Gift of George D. Pratt, 1933”; the supplied image record identifies The Met Open Access image as CC0.',
        tier: 'verified',
        source: { label: 'The Met object credit and Open Access image record', url: SCULPTURE_SOURCE }
      },
      {
        text: 'The selected shapes and comparisons are visual interpretations. The supplied catalog identifies the subject, but no particular textual source, performance lineage, or historical influence is established for this sculpture.',
        tier: 'interpretation',
        source: { label: 'AI visual reading, limited by the supplied Met record', url: SCULPTURE_SOURCE }
      }
    ],
    description: 'A many-armed central figure projects from a compact sandstone relief, with a circular carved surround behind the head. Bent limbs, held objects, smaller figures, and a buffalo fill the shallow field above a patterned base. Worn facial surfaces and deep recesses contrast with the rounded projecting forms. The Met identifies the subject as Durga slaying the buffalo demon; no specific text or performance tradition is inferred from this image.',
    artistStatement: null,
    sourceType: 'ai_inferred'
  },
  {
    id: 'art_013',
    title: 'Durga Confronts the Buffalo Demon Mahisha: Scene from the Devi Mahatmya',
    creator: 'Unknown artist (not named in the Met record)',
    year: 'ca. 1780',
    medium: 'Ink and opaque watercolor on paper',
    tradition: 'Guler painting (Met attribution)',
    region: 'India, Guler, Himachal Pradesh',
    source: 'The Metropolitan Museum of Art — object 73169; accession 2005.436.2; Gift of Cynthia Hazen Polsky, 2005',
    sourceUrl: PAINTING_SOURCE,
    sourceKind: 'museum',
    rights: 'Public Domain — The Metropolitan Museum of Art, Open Access (CC0)',
    image: '/artworks/met-73169-durga-mahisha-guler.jpg',
    imageCredit: {
      title: 'Durga Confronts the Buffalo Demon Mahisha: Scene from the Devi Mahatmya',
      creator: 'Unknown artist; image courtesy of The Metropolitan Museum of Art',
      sourceUrl: PAINTING_SOURCE,
      license: 'CC0',
      licenseUrl: CC0,
      changes: 'Resized to 1400 × 945 and JPEG-reencoded; embedded camera metadata removed. No cropping or artistic filters.'
    },
    culturalClaims: [
      {
        text: 'The Met catalogs this work as Durga Confronts the Buffalo Demon Mahisha: Scene from the Devi Mahatmya, ca. 1780, India, Guler, Himachal Pradesh, ink and opaque watercolor on paper, accession 2005.436.2. No artist is named in the supplied record.',
        tier: 'verified',
        source: { label: 'The Met, object 73169: supplied catalog metadata', url: PAINTING_SOURCE }
      },
      {
        text: 'The catalog credit is “Gift of Cynthia Hazen Polsky, 2005”; the supplied image record identifies The Met Open Access image as CC0. The Devi Mahatmya identification belongs to this work’s catalog title, not automatically to the sculpture or photographed production.',
        tier: 'verified',
        source: { label: 'The Met object title, credit, and Open Access image record', url: PAINTING_SOURCE }
      },
      {
        text: 'The line-led appearance, selected figures, and comparisons are visual interpretations. No inscription is transcribed here, and the image does not establish a common workshop, origin, or influence with the other works.',
        tier: 'interpretation',
        source: { label: 'AI visual reading of the approved Met image' }
      }
    ],
    description: 'A many-armed figure riding a lion occupies the left of a lightly colored, line-led scene. A much larger buffalo faces left from the right side, with raised tail, curved horns, and bent legs. Small figures lie or crouch near the lower edge; writing and dark cloud-like shapes appear above. Broad paper margins remain visible. The Met’s title identifies Durga, Mahisha, and a scene from the Devi Mahatmya.',
    artistStatement: null,
    sourceType: 'ai_inferred'
  }
];

// Polygons are visually inspected detail regions on the full approved images, including margins.
export const CULTURAL_ELEMENTS: Record<string, V2Element[]> = {
  art_011: [
    {
      id: 'elem_011_01',
      label: 'Crowned figure and radiating arm forms',
      type: 'figure',
      geometry: {
        type: 'polygon',
        points: [
          [0.322, 0.191], [0.354, 0.151], [0.401, 0.187],
          [0.419, 0.268], [0.446, 0.266], [0.486, 0.315],
          [0.514, 0.339], [0.551, 0.415], [0.499, 0.462],
          [0.480, 0.564], [0.314, 0.582], [0.269, 0.477],
          [0.230, 0.459], [0.172, 0.391], [0.108, 0.308],
          [0.123, 0.275], [0.214, 0.317], [0.247, 0.269],
          [0.273, 0.273], [0.301, 0.258], [0.331, 0.274]
        ]
      },
      meaning: {
        text: 'The crown, painted face, garlands, outstretched arms, and additional arm-like costume forms organize the upper figure. The uploader identifies Durga; the region does not identify the performer or costume maker.',
        sourceType: 'ai_inferred'
      },
      technique: 'Photographic detail of layered costume and bright trim against a dark backdrop; construction of the additional arm forms is not verified.',
      tradition: 'Uploader-stated Yakshagana subject; venue, troupe, and specific performance narrative (prasanga) remain unverified.'
    },
    {
      id: 'elem_011_02',
      label: 'Bent figure with banded skirt',
      type: 'figure',
      geometry: {
        type: 'polygon',
        points: [
          [0.579, 0.368], [0.653, 0.301], [0.722, 0.294],
          [0.750, 0.328], [0.732, 0.415], [0.759, 0.502],
          [0.813, 0.594], [0.797, 0.627], [0.757, 0.607],
          [0.759, 0.737], [0.802, 0.927], [0.778, 0.991],
          [0.495, 0.991], [0.497, 0.883], [0.524, 0.724],
          [0.538, 0.651], [0.476, 0.659], [0.479, 0.610],
          [0.529, 0.553], [0.546, 0.447]
        ]
      },
      meaning: {
        text: 'A costumed figure bends toward the staff, with the face largely hidden and pale bands crossing the dark skirt. The source title names Mahishasura, but neither the performer’s identity nor a buffalo costume is established by this region.',
        sourceType: 'ai_inferred'
      },
      technique: 'Alternating dark fabric, pale bands, and reflective trim articulate the photographed silhouette.',
      tradition: 'A figure in the uploader-identified scene, not evidence of a named troupe or design lineage.'
    },
    {
      id: 'elem_011_03',
      label: 'Hanging garlands and layered skirt',
      type: 'costume',
      geometry: {
        type: 'polygon',
        points: [
          [0.302, 0.533], [0.442, 0.537], [0.460, 0.665],
          [0.502, 0.814], [0.515, 0.901], [0.490, 0.997],
          [0.197, 0.997], [0.220, 0.906], [0.227, 0.838],
          [0.250, 0.724], [0.232, 0.679], [0.272, 0.599]
        ]
      },
      meaning: {
        text: 'Long red, white, and green garlands hang over stacked bands of patterned and reflective fabric. The visible colors do not establish a ritual meaning or the materials’ origin.',
        sourceType: 'ai_inferred'
      },
      technique: 'Photographed folds, flower-like clusters, and bright edging produce repeated horizontal and vertical rhythms.',
      tradition: 'Costume detail in an uploader-stated Yakshagana scene; designer attribution is unavailable.'
    }
  ],
  art_012: [
    {
      id: 'elem_012_01',
      label: 'Central figure and multiple carved arms',
      type: 'figure',
      geometry: {
        type: 'polygon',
        points: [
          [0.735, 0.240], [0.775, 0.301], [0.753, 0.404],
          [0.718, 0.477], [0.685, 0.516], [0.625, 0.506],
          [0.599, 0.471], [0.546, 0.502], [0.537, 0.621],
          [0.495, 0.640], [0.474, 0.581], [0.369, 0.549],
          [0.350, 0.503], [0.304, 0.499], [0.291, 0.426],
          [0.260, 0.407], [0.261, 0.365], [0.310, 0.343],
          [0.269, 0.300], [0.325, 0.275], [0.382, 0.285],
          [0.429, 0.334], [0.451, 0.321], [0.443, 0.256],
          [0.495, 0.243], [0.551, 0.285], [0.555, 0.336],
          [0.604, 0.362], [0.646, 0.285], [0.647, 0.251]
        ]
      },
      meaning: {
        text: 'Several bent arms and held forms surround the projecting torso; one bent leg extends down toward the animals. The Met identifies the central figure as Durga. The worn face does not support a precise expression reading.',
        sourceType: 'ai_inferred'
      },
      technique: 'Rounded sandstone forms project from deep recesses, making overlapping limbs legible through light and shadow.',
      tradition: 'Figure detail in the Met-attributed Rajasthan sculpture; no specific textual source is assigned.'
    },
    {
      id: 'elem_012_02',
      label: 'Circular carved surround behind the head',
      type: 'ornament',
      geometry: {
        type: 'polygon',
        points: [
          [0.398, 0.239], [0.412, 0.199], [0.452, 0.179],
          [0.500, 0.168], [0.552, 0.177], [0.596, 0.210],
          [0.616, 0.254], [0.616, 0.285], [0.594, 0.315],
          [0.561, 0.328], [0.553, 0.285], [0.533, 0.258],
          [0.497, 0.247], [0.464, 0.267], [0.441, 0.290],
          [0.411, 0.275]
        ]
      },
      meaning: {
        text: 'A circular surround with a beaded-looking outer edge and broad inner divisions frames the head. The polygon follows this ornament rather than identifying a crown or asserting a shared costume design.',
        sourceType: 'ai_inferred'
      },
      technique: 'Shallow incised and raised divisions articulate a rounded sandstone frame behind the more projecting head.',
      tradition: 'Carved framing detail in this museum object; resemblance alone does not establish shared origins.'
    },
    {
      id: 'elem_012_03',
      label: 'Buffalo across the lower relief',
      type: 'animal',
      geometry: {
        type: 'polygon',
        points: [
          [0.282, 0.603], [0.324, 0.580], [0.393, 0.594],
          [0.452, 0.612], [0.516, 0.630], [0.565, 0.684],
          [0.611, 0.695], [0.641, 0.719], [0.677, 0.716],
          [0.678, 0.741], [0.632, 0.773], [0.575, 0.786],
          [0.552, 0.736], [0.518, 0.710], [0.416, 0.700],
          [0.458, 0.728], [0.417, 0.750], [0.385, 0.732],
          [0.378, 0.701], [0.316, 0.677], [0.283, 0.764],
          [0.236, 0.769], [0.253, 0.697], [0.266, 0.646]
        ]
      },
      meaning: {
        text: 'A broad-bodied buffalo extends across the lower relief, with its head lowered at the right and legs compressed among nearby forms. The subject identification comes from the Met title, not from an inferred literary source.',
        sourceType: 'ai_inferred'
      },
      technique: 'A rounded body and deeply cut spaces beneath it distinguish the animal from the surrounding sandstone figures.',
      tradition: 'Animal detail in the cataloged buffalo-demon subject; no performance lineage is claimed.'
    }
  ],
  art_013: [
    {
      id: 'elem_013_01',
      label: 'Many-armed rider and held objects',
      type: 'figure',
      geometry: {
        type: 'polygon',
        points: [
          [0.102, 0.299], [0.156, 0.285], [0.160, 0.144],
          [0.173, 0.142], [0.170, 0.345], [0.188, 0.310],
          [0.179, 0.282], [0.217, 0.263], [0.220, 0.301],
          [0.225, 0.357], [0.265, 0.366], [0.287, 0.312],
          [0.322, 0.321], [0.329, 0.362], [0.356, 0.307],
          [0.383, 0.307], [0.388, 0.344], [0.375, 0.415],
          [0.399, 0.447], [0.383, 0.493], [0.340, 0.520],
          [0.314, 0.587], [0.323, 0.696], [0.297, 0.724],
          [0.242, 0.712], [0.223, 0.617], [0.187, 0.588],
          [0.140, 0.550], [0.128, 0.477], [0.143, 0.431],
          [0.120, 0.378]
        ]
      },
      meaning: {
        text: 'Multiple outlined arms fan outward from a small rider, with long and rounded objects held above and beside the body. The Met names Durga in this scene; the polygon does not identify every held object or transcribe nearby writing.',
        sourceType: 'ai_inferred'
      },
      technique: 'Fine contours, faint washes, and small reddish accents distinguish the figure on the light paper.',
      tradition: 'Figure in the Met-attributed Guler work; the Devi Mahatmya identification is specific to its catalog title.'
    },
    {
      id: 'elem_013_02',
      label: 'Large buffalo with raised tail',
      type: 'animal',
      geometry: {
        type: 'polygon',
        points: [
          [0.486, 0.402], [0.530, 0.387], [0.588, 0.370],
          [0.617, 0.335], [0.641, 0.348], [0.653, 0.383],
          [0.772, 0.395], [0.873, 0.366], [0.901, 0.352],
          [0.898, 0.305], [0.876, 0.233], [0.878, 0.169],
          [0.903, 0.133], [0.899, 0.197], [0.908, 0.292],
          [0.913, 0.366], [0.907, 0.494], [0.890, 0.586],
          [0.887, 0.663], [0.872, 0.734], [0.852, 0.785],
          [0.808, 0.788], [0.816, 0.736], [0.823, 0.663],
          [0.796, 0.628], [0.762, 0.643], [0.785, 0.674],
          [0.760, 0.696], [0.684, 0.680], [0.676, 0.634],
          [0.646, 0.636], [0.611, 0.730], [0.594, 0.766],
          [0.552, 0.769], [0.565, 0.716], [0.602, 0.659],
          [0.589, 0.601], [0.558, 0.542], [0.541, 0.497],
          [0.511, 0.498], [0.493, 0.468], [0.486, 0.446]
        ]
      },
      meaning: {
        text: 'A large buffalo faces the rider, its outlined horns and upturned tail interrupting the broad body silhouette. Bent legs suggest movement; the image does not establish a precise instant in a textual sequence beyond the cataloged confrontation.',
        sourceType: 'ai_inferred'
      },
      technique: 'Dark contour lines and gray washes give the animal greater tonal weight than the smaller figures.',
      tradition: 'Animal identified as Mahisha by this work’s Met title, not a claim about the photographed costume.'
    },
    {
      id: 'elem_013_03',
      label: 'Lion beneath the rider',
      type: 'animal',
      geometry: {
        type: 'polygon',
        points: [
          [0.348, 0.512], [0.373, 0.505], [0.400, 0.526],
          [0.410, 0.555], [0.418, 0.589], [0.397, 0.615],
          [0.389, 0.657], [0.407, 0.679], [0.432, 0.692],
          [0.432, 0.732], [0.400, 0.733], [0.429, 0.755],
          [0.419, 0.787], [0.374, 0.767], [0.335, 0.741],
          [0.299, 0.780], [0.296, 0.818], [0.262, 0.838],
          [0.239, 0.821], [0.246, 0.786], [0.197, 0.784],
          [0.215, 0.819], [0.189, 0.833], [0.156, 0.810],
          [0.143, 0.822], [0.104, 0.810], [0.096, 0.782],
          [0.111, 0.729], [0.127, 0.668], [0.151, 0.633],
          [0.200, 0.637], [0.249, 0.680], [0.289, 0.670],
          [0.309, 0.628], [0.320, 0.555]
        ]
      },
      meaning: {
        text: 'A lion with an open mouth, mane-like strokes, and extended forelegs occupies the lower left beneath the rider. Some contours overlap with the rider and nearby figures; the region is a detail selection rather than a segmentation mask.',
        sourceType: 'ai_inferred'
      },
      technique: 'Thin outlines and short repeated strokes describe the body, face, and mane with sparse color.',
      tradition: 'Visible animal mount in this Guler image; comparison does not establish a shared workshop or production history.'
    }
  ]
};

export const CULTURAL_RELATIONSHIPS: V2Relationship[] = [
  {
    id: 'rel_024',
    sourceArtworkId: 'art_011',
    sourceElementId: 'elem_011_01',
    targetArtworkId: 'art_012',
    targetElementId: 'elem_012_01',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'Additional arm-like costume forms fan behind the photographed figure; multiple carved arms surround the sandstone torso.' },
      { type: 'limitation', description: 'The photo subject is uploader-stated; the sculpture subject is cataloged by the Met. Costume forms and stone limbs are not the same medium, and no influence, shared origin, or textual source for the sculpture is established.' }
    ],
    agreement: '',
    status: 'candidate',
    culturalClaims: [
      { text: 'Radiating arm forms are compared visually, not as evidence that the photographed production used this sculpture or its design.', tier: 'interpretation', source: { label: 'AI comparison of the approved photograph and sculpture image' } }
    ],
    narrative: 'Move from the bright arm forms around the crowned stage figure to the carved limbs surrounding the stone torso. Both expand a figure’s outline, but one is a photographed costume arrangement and the other a relief. Durga is uploader-identified in the photo and museum-identified in the sculpture; neither source establishes a historical connection between them.'
  },
  {
    id: 'rel_025',
    sourceArtworkId: 'art_012',
    sourceElementId: 'elem_012_01',
    targetArtworkId: 'art_011',
    targetElementId: 'elem_011_01',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'Bent stone arms encircle the relief’s central torso, while bright arm-like costume forms spread behind the photographed shoulders.' },
      { type: 'limitation', description: 'The Met identifies the sculpture’s subject; the photo identification is uploader-stated and its production unverified. No shared origin, historical influence, or textual source for the sculpture follows from the resemblance.' }
    ],
    agreement: '',
    status: 'candidate',
    culturalClaims: [
      { text: 'The change from carved volume to photographed costume is an interpretive comparison, not documentation of a performance lineage.', tier: 'interpretation', source: { label: 'AI comparison of the approved sculpture image and photograph' } }
    ],
    narrative: 'Follow the outward spread of the carved arms toward the fan of bright forms behind the photographed figure. Shadow separates the sandstone limbs; color and trim separate the costume forms. The sources identify the subjects with different levels of certainty, and the photo’s troupe, designers, and prasanga remain unverified.'
  },
  {
    id: 'rel_026',
    sourceArtworkId: 'art_012',
    sourceElementId: 'elem_012_03',
    targetArtworkId: 'art_013',
    targetElementId: 'elem_013_02',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'A buffalo lies low across the relief with its head at the right; the paper image gives a left-facing buffalo much of the right-hand field.' },
      { type: 'limitation', description: 'Both buffalo-demon identifications come from Met titles. Only the paper work’s supplied title names the Devi Mahatmya; no textual source for the sculpture or historical influence between the works is established.' }
    ],
    agreement: '',
    status: 'candidate',
    culturalClaims: [
      { text: 'Relative scale, facing direction, and medium provide a visual comparison; the two images are not treated as successive moments from one documented narrative sequence.', tier: 'interpretation', source: { label: 'AI comparison of the two approved Met images' } }
    ],
    narrative: 'Compare the compressed buffalo beneath the stone figure with the large buffalo facing the rider on paper. Their opposite orientations and different proportions change the balance of each scene. The catalog titles support a subject comparison, but the paper work’s named textual source is not transferred to the sculpture.'
  },
  {
    id: 'rel_027',
    sourceArtworkId: 'art_013',
    sourceElementId: 'elem_013_02',
    targetArtworkId: 'art_012',
    targetElementId: 'elem_012_03',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'The paper buffalo has a raised tail, dark contours, and a large open silhouette; the stone buffalo is packed into the lower relief beneath overlapping figures.' },
      { type: 'limitation', description: 'Met titles identify the subjects, not a common workshop or influence. The Devi Mahatmya attribution belongs to the paper work’s title and does not establish the sculpture’s textual source.' }
    ],
    agreement: '',
    status: 'candidate',
    culturalClaims: [
      { text: 'The contrast between outlined animal and carved volume is a visual interpretation, not evidence of shared origins or a single narrative sequence.', tier: 'interpretation', source: { label: 'AI comparison of the two approved Met images' } }
    ],
    narrative: 'Look from the buffalo’s broad outlined flank to the rounded body near the base of the relief. The paper scene leaves space around the animal, while the stone scene compresses it among other forms. This comparison follows the cataloged subjects without assigning the sculpture the paper work’s textual source.'
  },
  {
    id: 'rel_028',
    sourceArtworkId: 'art_011',
    sourceElementId: 'elem_011_01',
    targetArtworkId: 'art_013',
    targetElementId: 'elem_013_01',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'The photo’s upper figure has radiating arm-like forms and extended hands; the small rider on paper has multiple outlined arms and held objects.' },
      { type: 'limitation', description: 'The photo subject is uploader-stated and the specific performance narrative (prasanga) unverified. The Met names Durga and the Devi Mahatmya for the paper work only; neither source establishes influence or shared production origins.' }
    ],
    agreement: '',
    status: 'candidate',
    culturalClaims: [
      { text: 'The visual fan of arms is compared across media without identifying the photographed production as an enactment of this particular image or text.', tier: 'interpretation', source: { label: 'AI comparison of the approved photograph and Guler image' } }
    ],
    narrative: 'Compare the bright spread of costume forms with the fine lines radiating from the rider’s shoulders. The photograph relies on color and layered materials; the paper image separates arms through contours and pale washes. The Met’s textual identification applies to its own work, not to the photo’s unverified prasanga.'
  },
  {
    id: 'rel_029',
    sourceArtworkId: 'art_013',
    sourceElementId: 'elem_013_01',
    targetArtworkId: 'art_011',
    targetElementId: 'elem_011_01',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'Outlined arms and held objects spread around the rider on paper; the photograph shows a comparable spread of bright costume forms behind a crowned figure.' },
      { type: 'limitation', description: 'Durga and the Devi Mahatmya are named in the Met title; the photograph’s subject is uploader-stated, with venue, troupe, and prasanga unverified. This is not evidence of historical influence or shared origins.' }
    ],
    agreement: '',
    status: 'candidate',
    culturalClaims: [
      { text: 'A visual resemblance between drawn arms and costume forms does not verify the performance’s text, makers, or community endorsement.', tier: 'interpretation', source: { label: 'AI comparison of the approved Guler image and photograph' } }
    ],
    narrative: 'Follow the rider’s radiating arms toward the photographed arrangement around the crown and shoulders. The shared visual device is an expanded figure outline, not an established design transfer. The photo’s title supplies a subject identification but cannot verify a particular production or textual adaptation.'
  },
  {
    id: 'rel_030',
    sourceArtworkId: 'art_004',
    sourceElementId: 'elem_004_02',
    targetArtworkId: 'art_011',
    targetElementId: 'elem_011_01',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'The central pair on the red ground has overlapping, extended arms and contrasting garments; the crowned stage figure extends arms across brightly layered costume toward the figure at the right.' },
      { type: 'limitation', description: 'The Met identifies Krishna and the gopis in a Gita Govinda folio; the photograph’s Durga–Mahishasura subject is uploader-stated. An embrace and a staged confrontation are different actions, not a common story or historical link.' }
    ],
    agreement: '',
    status: 'candidate',
    culturalClaims: [
      { text: 'The folio’s cataloged subject differs from the uploader-stated photograph subject; only visible arm placement and costume contrast are compared.', tier: 'interpretation', source: { label: 'AI visual comparison; Met record for the existing Gita Govinda folio', url: GITA_GOVINDA_SOURCE } }
    ],
    narrative: 'Look from the overlapping arms of the central painted pair to the extended arms of the crowned stage figure. Contrasting garments help distinguish bodies in both details. The painted embrace and uploader-described confrontation do not share an established narrative, ritual purpose, or production history.'
  },
  {
    id: 'rel_031',
    sourceArtworkId: 'art_011',
    sourceElementId: 'elem_011_01',
    targetArtworkId: 'art_004',
    targetElementId: 'elem_004_02',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'Extended arms and bright costume layers emphasize the crowned stage figure; overlapping arms and contrasting clothing define the central pair in the red-ground folio.' },
      { type: 'limitation', description: 'The photo’s subject is uploader-stated and its production unverified; the Met identifies the folio as Krishna with the gopis. A formal resemblance does not equate the actions, subjects, traditions, or makers.' }
    ],
    agreement: '',
    status: 'candidate',
    culturalClaims: [
      { text: 'This crossing between photograph and painted folio is an exploratory comparison of pose and color, not evidence of influence or shared origins.', tier: 'interpretation', source: { label: 'AI visual comparison of the approved photo and existing folio image' } }
    ],
    narrative: 'Move from the photographed arms and garlands to the closely grouped painted figures. Color separates adjacent forms in both, but the actions and source identifications differ: the photo is uploader-described as Durga and Mahishasura, whereas the Met catalogs the folio as Krishna with the gopis. No historical link is proposed.'
  },
  {
    id: 'rel_032',
    sourceArtworkId: 'art_004',
    sourceElementId: 'elem_004_02',
    targetArtworkId: 'art_013',
    targetElementId: 'elem_013_01',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'Strong contours enclose solid color in the central embracing figures; fine overlapping lines and pale washes articulate the many-armed rider in the Guler image.' },
      { type: 'limitation', description: 'The Met catalogs opaque watercolor and silver on paper for the folio and ink and opaque watercolor on paper for the Guler work. Their catalog titles identify different subjects and texts; line comparison is not evidence of a shared workshop or influence.' }
    ],
    agreement: '',
    status: 'candidate',
    culturalClaims: [
      { text: 'Visible figure contours can be compared despite different cataloged subjects, dates, regions, and media; no common textual source or historical connection is inferred.', tier: 'interpretation', source: { label: 'AI visual comparison; Met record for the Guler work', url: PAINTING_SOURCE } }
    ],
    narrative: 'Compare the clear edges and filled garments of the embracing pair with the pale, overlapping outlines of the many-armed rider. Both details organize figures through contours, yet their handling of color differs. The Gita Govinda folio and cataloged Devi Mahatmya scene remain distinct works, not evidence of a common workshop or design lineage.'
  },
  {
    id: 'rel_033',
    sourceArtworkId: 'art_013',
    sourceElementId: 'elem_013_01',
    targetArtworkId: 'art_004',
    targetElementId: 'elem_004_02',
    relationshipType: 'shared_motif',
    evidence: [
      { type: 'visual_comparison', description: 'Fine lines and sparse color separate the rider’s multiple arms; firmer outlines and more saturated areas separate the embracing pair’s bodies and garments.' },
      { type: 'limitation', description: 'The Met records different media and identifies a Devi Mahatmya scene in Guler versus a Gita Govinda folio in Malwa. Visible contours do not establish common origins, matching meanings, or historical influence.' }
    ],
    agreement: '',
    status: 'candidate',
    culturalClaims: [
      { text: 'The comparison concerns the visible treatment of figure outlines, not a claim of shared technique, textual source, workshop, or transmission.', tier: 'interpretation', source: { label: 'AI visual comparison; Met record for the existing Gita Govinda folio', url: GITA_GOVINDA_SOURCE } }
    ],
    narrative: 'Follow the rider’s lightly drawn limbs toward the strongly colored central pair in the older folio. Outlines help distinguish adjacent bodies in both, but sparse washes and solid color create different effects. Their cataloged literary subjects differ, and this visual comparison does not establish an artistic or historical connection.'
  }
];
