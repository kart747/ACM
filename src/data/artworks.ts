import type { Artwork, Claim } from '@/lib/types';

/**
 * Collection: five public-domain paintings and prints from The Metropolitan
 * Museum of Art. Every local image was checked pixel-for-pixel against the
 * Met's primary image for the object id recorded here.
 *
 * Provenance rules for this file:
 * - `externally_verified` only for facts present in The Met collection record
 *   (title, artist bio, date, medium, dimensions, credit line, subject tags).
 * - Everything else — visual descriptions beyond the record, creator
 *   summaries, and every relationship — is `ai_inferred`, phrased cautiously,
 *   and carries a confidence. Nothing here is artist-declared.
 *
 * Motif rectangles are 0-100 on both axes and were placed against a 5% grid
 * drawn over each local image. Press `d` in development to overlay them.
 */

const metRecord = (id: number, field: string) =>
  `The Met collection record, object ${id} (${field})`;

const DRAFTED =
  'Interpretation drafted for ARTSCAPE by an AI model from the image; not yet checked against a published source';

function verified(text: string, sourceDetail: string): Claim {
  return { text, sourceType: 'externally_verified', sourceDetail };
}

function inferred(text: string, confidence: number, sourceDetail = DRAFTED): Claim {
  return { text, sourceType: 'ai_inferred', sourceDetail, confidence };
}

export const curatedArtworks: Artwork[] = [
  {
    id: 'great-wave',
    metObjectId: 36491,
    title: 'Under the Wave off Kanagawa',
    metTitle:
      'Under the Wave off Kanagawa (Kanagawa oki nami ura), also known as The Great Wave, from the series Thirty-six Views of Mount Fuji (Fugaku sanjūrokkei)',
    creator: {
      name: 'Katsushika Hokusai',
      metBio: 'Japanese, Tokyo (Edo) 1760–1849 Tokyo (Edo)',
      summary: inferred(
        'A painter and print designer who worked in Edo, present-day Tokyo, across a very long career. This print belongs to his series of views of Mount Fuji.',
        0.9,
      ),
    },
    date: 'ca. 1830–32',
    medium: 'Woodblock print; ink and color on paper',
    dimensions: '9 5/8 x 14 1/16 in. (24.4 x 35.7 cm)',
    credit: 'Rogers Fund, 1914',
    accessionNumber: 'JP10',
    metTags: ['Waves'],
    metUrl: 'https://www.metmuseum.org/art/collection/search/36491',
    image: { src: '/artworks/hokusai.jpg', width: 1600, height: 1105, glow: '#8fb4dc' },
    motifs: [
      {
        id: 'the-boats',
        label: 'The Boats in the Trough',
        kind: 'motif',
        rect: { x: 39, y: 81, w: 33, h: 16 },
        shape: 'rect',
        observations: [
          inferred(
            'A long, narrow boat rides low in the trough below the wave, its rowers bent forward in a row along the hull. Two more boats appear at the left and right.',
            0.9,
          ),
        ],
        connections: [
          {
            targetArtworkId: 'gulf-stream',
            targetMotifId: 'sailor-and-boat',
            relationshipType: 'shared_motif',
            claim: inferred(
              'Both works appear to turn on the same situation: people in a small boat with no control over the water around them.',
              0.8,
            ),
            visualEvidence:
              'Hokusai’s rowers crouch low in a narrow hull between two walls of water. Homer’s sailor lies on the deck of a small boat with no standing mast, the sea rising on every side.',
            caveat:
              'This is a shared subject, not a line of influence. Nothing here shows that Homer knew this print.',
            context: [
              verified('Homer’s painting is tagged “Boats”, “Seas” and “Waves” by The Met.', metRecord(11122, 'subject tags')),
            ],
          },
        ],
      },
      {
        id: 'wave-crest',
        label: 'The Crest of the Wave',
        kind: 'motif',
        rect: { x: 22, y: 14, w: 38, h: 32 },
        shape: 'ellipse',
        observations: [
          verified('The print shows a great wave off Kanagawa.', metRecord(36491, 'title; subject tag “Waves”')),
          inferred(
            'At its crest the foam breaks into hooked, claw-like fingers that curl forward over the boats below.',
            0.9,
          ),
        ],
        connections: [
          {
            targetArtworkId: 'gulf-stream',
            targetMotifId: 'waterspout',
            relationshipType: 'thematic_echo',
            claim: inferred(
              'Each picture seems to give the sea one towering shape that rises above the people in it.',
              0.6,
            ),
            visualEvidence:
              'Hokusai’s crest fills the upper left of the sheet and bends over the boats. Homer’s waterspout is a thin grey column on the far right horizon, well away from the boat.',
            caveat:
              'The scale is very different: Hokusai’s wave dominates the picture, while Homer’s waterspout is small and distant.',
          },
        ],
      },
      {
        id: 'mount-fuji',
        label: 'Mount Fuji',
        kind: 'motif',
        rect: { x: 55, y: 66, w: 13, h: 10 },
        shape: 'ellipse',
        observations: [
          verified(
            'The print comes from the series Thirty-six Views of Mount Fuji.',
            metRecord(36491, 'title'),
          ),
          inferred(
            'The snow-capped cone sits small and low on the horizon, framed by the hollow of the wave.',
            0.9,
          ),
        ],
        connections: [
          {
            targetArtworkId: 'gulf-stream',
            targetMotifId: 'distant-ship',
            relationshipType: 'thematic_echo',
            claim: inferred(
              'Both pictures seem to place one small, calm shape on the far horizon, beyond the danger in the foreground.',
              0.55,
            ),
            visualEvidence:
              'Fuji is a small white cone at the horizon between the waves. In Homer, a sailing ship is a faint grey silhouette on the horizon at the left.',
            caveat:
              'Fuji is the subject of the whole series; Homer’s ship is a minor detail. The echo is in placement, not importance.',
          },
        ],
      },
      {
        id: 'title-cartouche',
        label: 'Title Cartouche and Inscription',
        kind: 'inscription',
        rect: { x: 1.5, y: 9, w: 8.5, h: 30 },
        shape: 'rect',
        observations: [
          inferred(
            'A framed rectangle at the upper left carries printed characters. Beside it, a separate column of characters and a small round seal appear to sign the print.',
            0.75,
          ),
          verified(
            'The series title is Fugaku sanjūrokkei (Thirty-six Views of Mount Fuji).',
            metRecord(36491, 'title'),
          ),
        ],
        connections: [
          {
            targetArtworkId: 'self-portrait',
            targetMotifId: 'signature',
            relationshipType: 'shared_motif',
            claim: inferred(
              'In both works the maker’s writing sits on the picture surface itself, putting a person behind the image.',
              0.6,
            ),
            visualEvidence:
              'Hokusai’s characters stand in a column beside a printed title frame. Rembrandt’s signature and the date 1660 are brushed in dark paint at the right edge.',
            caveat:
              'A print’s cartouche and a painter’s signature do different jobs. The reading of Hokusai’s column as a signature is an interpretation of the image.',
          },
        ],
      },
    ],
  },

  {
    id: 'gulf-stream',
    metObjectId: 11122,
    title: 'The Gulf Stream',
    metTitle: 'The Gulf Stream',
    creator: {
      name: 'Winslow Homer',
      metBio: 'American, Boston, Massachusetts 1836–1910 Prouts Neck, Maine',
      summary: inferred(
        'An American painter best known for pictures of the sea, many made after he settled on the Maine coast at Prouts Neck.',
        0.85,
      ),
    },
    date: '1899; reworked by 1906',
    medium: 'Oil on canvas',
    dimensions: '28 1/8 x 49 1/8 in. (71.4 x 124.8 cm)',
    credit: 'Catharine Lorillard Wolfe Collection, Wolfe Fund, 1906',
    accessionNumber: '06.1234',
    metTags: ['Men', 'Fish', 'Seas', 'Waves', 'Boats'],
    metUrl: 'https://www.metmuseum.org/art/collection/search/11122',
    image: { src: '/artworks/homer.jpg', width: 1600, height: 987, glow: '#7fb3c8' },
    motifs: [
      {
        id: 'sailor-and-boat',
        label: 'The Sailor on the Drifting Boat',
        kind: 'figure',
        rect: { x: 29, y: 37, w: 40, h: 35 },
        shape: 'rect',
        observations: [
          verified('A man in a boat on open water.', metRecord(11122, 'subject tags “Men”, “Boats”, “Seas”')),
          inferred(
            'A Black man lies propped on one elbow on the deck of a small boat with no standing mast, his head turned away from the sharks.',
            0.85,
          ),
        ],
        connections: [
          {
            targetArtworkId: 'adoration-of-magi',
            targetMotifId: 'black-king',
            relationshipType: 'thematic_echo',
            claim: inferred(
              'Four centuries apart, both painters appear to give a Black man a prominent, dignified place in the composition.',
              0.6,
            ),
            visualEvidence:
              'Homer’s sailor is the only person in the painting and sits at its centre. In David’s panel, a Black king in a green mantle stands at the right, close to the front, holding his gift.',
            caveat:
              'The two roles are unlike: a lone sailor at sea and a king in a religious scene. How each artist meant the figure is not established here.',
            context: [
              verified(
                'David’s panel depicts the Adoration of the Magi.',
                metRecord(436104, 'subject tag “Adoration of the Magi”'),
              ),
            ],
          },
          {
            targetArtworkId: 'great-wave',
            targetMotifId: 'the-boats',
            relationshipType: 'shared_motif',
            claim: inferred(
              'The same situation seen in Hokusai: people in a small boat at the mercy of the sea.',
              0.8,
            ),
            visualEvidence:
              'Homer’s single figure lies still on an open deck; Hokusai’s rowers are many, small, and pressed low under the wave.',
            caveat: 'A shared subject, not evidence of influence.',
          },
        ],
      },
      {
        id: 'sharks',
        label: 'The Sharks',
        kind: 'motif',
        rect: { x: 39, y: 69, w: 25, h: 16 },
        shape: 'ellipse',
        observations: [
          verified('The Met tags the painting with “Fish”.', metRecord(11122, 'subject tags')),
          inferred(
            'Several sharks circle the boat. The nearest turns in the water just below the hull, its jaws open.',
            0.9,
          ),
        ],
        connections: [
          {
            targetArtworkId: 'great-wave',
            targetMotifId: 'wave-crest',
            relationshipType: 'thematic_echo',
            claim: inferred(
              'Both works seem to surround a small boat with a threat that reaches toward it from the water.',
              0.5,
            ),
            visualEvidence:
              'Homer’s sharks crowd the lower edge around the hull. Hokusai’s foam hangs in hooked fingers over the boats.',
            caveat:
              'A living predator and a breaking wave are different kinds of danger; the link is about composition around the boat.',
          },
        ],
      },
      {
        id: 'waterspout',
        label: 'The Waterspout',
        kind: 'motif',
        rect: { x: 80, y: 3, w: 15, h: 22 },
        shape: 'ellipse',
        observations: [
          inferred(
            'On the far right horizon, a grey funnel of water rises into the low cloud.',
            0.85,
          ),
        ],
        connections: [
          {
            targetArtworkId: 'great-wave',
            targetMotifId: 'wave-crest',
            relationshipType: 'thematic_echo',
            claim: inferred(
              'The waterspout appears to play the role Hokusai gives his wave: the sea rising into a single tall shape.',
              0.55,
            ),
            visualEvidence:
              'Homer’s funnel is a continuous grey column; Hokusai’s crest breaks into separate white fingers of foam.',
            caveat:
              'Homer’s waterspout is distant and does not overhang the boat. The comparison is loose.',
          },
        ],
      },
      {
        id: 'distant-ship',
        label: 'The Ship on the Horizon',
        kind: 'object',
        rect: { x: 21.5, y: 18.5, w: 7, h: 7 },
        shape: 'ellipse',
        observations: [
          inferred(
            'A faint three-masted sailing ship stands on the horizon at the upper left, far from the drifting boat.',
            0.8,
          ),
        ],
        connections: [
          {
            targetArtworkId: 'great-wave',
            targetMotifId: 'mount-fuji',
            relationshipType: 'thematic_echo',
            claim: inferred(
              'Like Fuji in Hokusai’s print, the ship is one small, steady form on the far horizon.',
              0.55,
            ),
            visualEvidence:
              'Both shapes are small, pale, and placed on the horizon line behind the main action.',
            caveat: 'Whether Homer’s ship could help the sailor is left open by the painting.',
          },
        ],
      },
    ],
  },

  {
    id: 'adoration-of-magi',
    metObjectId: 436104,
    title: 'The Adoration of the Magi',
    metTitle: 'The Adoration of the Magi',
    creator: {
      name: 'Gerard David',
      metBio: 'Netherlandish, Oudewater ca. 1455–1523 Bruges',
      summary: inferred(
        'A Netherlandish painter born in Oudewater who worked for most of his career in Bruges, painting religious panels in oil.',
        0.8,
      ),
    },
    date: 'ca. 1520',
    medium: 'Oil on wood',
    dimensions: 'Overall 27 3/4 x 28 7/8 in. (70.5 x 73.3 cm)',
    credit: 'The Jack and Belle Linsky Collection, 1982',
    accessionNumber: '1982.60.17',
    metTags: ['Men', 'Dogs', 'Virgin Mary', 'Jesus', 'Adoration of the Magi', 'Joseph'],
    metUrl: 'https://www.metmuseum.org/art/collection/search/436104',
    image: { src: '/artworks/david.jpg', width: 1600, height: 1541, glow: '#c08a3e' },
    motifs: [
      {
        id: 'black-king',
        label: 'The Black King and His Gift',
        kind: 'figure',
        rect: { x: 71, y: 30, w: 19, h: 31 },
        shape: 'rect',
        observations: [
          verified(
            'The scene is the Adoration of the Magi, the kings who bring gifts to the Christ Child.',
            metRecord(436104, 'title; subject tag “Adoration of the Magi”'),
          ),
          inferred(
            'At the right, a Black king in a green mantle stands near the front of the group, holding a lidded gold vessel.',
            0.85,
          ),
        ],
        connections: [
          {
            targetArtworkId: 'water-pitcher',
            targetMotifId: 'pitcher-and-basin',
            relationshipType: 'similar_technique',
            claim: inferred(
              'The king’s gold vessel and Vermeer’s pitcher both appear to be built from small, bright highlights on curved metal, a strength of oil painting in the Low Countries.',
              0.65,
            ),
            visualEvidence:
              'David picks out the vessel’s lid and body with sharp points of light. Vermeer’s pitcher and basin catch the window light in softer, broader reflections.',
            caveat:
              'The objects mean different things: a royal gift in a sacred scene, and a household pitcher.',
            context: [
              verified(
                'Both are oil paintings: David’s on wood, Vermeer’s on canvas.',
                'The Met collection records, objects 436104 and 437881 (medium)',
              ),
              verified(
                'David worked in Bruges; Vermeer in Delft, about 140 years later.',
                'The Met collection records, objects 436104 and 437881 (artist bio, date)',
              ),
            ],
          },
          {
            targetArtworkId: 'gulf-stream',
            targetMotifId: 'sailor-and-boat',
            relationshipType: 'thematic_echo',
            claim: inferred(
              'A Black man again holds a prominent place in the picture, here in Homer’s painting of a sailor adrift.',
              0.6,
            ),
            visualEvidence:
              'David’s king stands upright at the front right; Homer’s sailor lies alone at the centre of the canvas.',
            caveat: 'The roles and the centuries are far apart; the link is about prominence, not meaning.',
          },
        ],
      },
      {
        id: 'virgin-and-child',
        label: 'The Virgin and Child',
        kind: 'figure',
        rect: { x: 5, y: 42, w: 17, h: 28 },
        shape: 'rect',
        observations: [
          verified('The Virgin Mary and the Christ Child.', metRecord(436104, 'subject tags “Virgin Mary”, “Jesus”')),
          inferred(
            'The Virgin, in a white headcloth and a dark blue mantle, sits at the left holding the Child on her lap as the first king offers a gold cup.',
            0.85,
          ),
        ],
        connections: [
          {
            targetArtworkId: 'water-pitcher',
            targetMotifId: 'white-headcloth',
            relationshipType: 'shared_motif',
            claim: inferred(
              'The same costume seems to recur: a woman in a white linen headcloth and deep blue, her head bowed.',
              0.6,
            ),
            visualEvidence:
              'David’s Virgin wears a white veil over a dark blue mantle and looks down at the Child. Vermeer’s young woman wears a white linen hood and collar with a blue skirt and looks down toward the table.',
            caveat:
              'One is a sacred figure and one an unnamed woman at home. The shared elements are dress and pose, not meaning.',
          },
        ],
      },
      {
        id: 'the-dog',
        label: 'The Dog',
        kind: 'motif',
        rect: { x: 62, y: 70, w: 14, h: 12 },
        shape: 'ellipse',
        observations: [
          verified('A dog appears in the scene.', metRecord(436104, 'subject tag “Dogs”')),
          inferred(
            'A small white-and-brown dog walks across the foreground with its nose to the ground, paying no attention to the kings.',
            0.85,
          ),
        ],
        connections: [
          {
            targetArtworkId: 'gulf-stream',
            targetMotifId: 'sharks',
            relationshipType: 'thematic_echo',
            claim: inferred(
              'Both painters let animals move through the lower part of a human scene, following their own business.',
              0.35,
            ),
            visualEvidence:
              'David’s dog noses the ground in the foreground. Homer’s sharks circle below the boat.',
            caveat:
              'A weak link. A household dog and circling sharks carry very different weight, and the pairing rests mostly on position.',
          },
        ],
      },
    ],
  },

  {
    id: 'water-pitcher',
    metObjectId: 437881,
    title: 'Young Woman with a Water Pitcher',
    metTitle: 'Young Woman with a Water Pitcher',
    creator: {
      name: 'Johannes Vermeer',
      metBio: 'Dutch, Delft 1632–1675 Delft',
      summary: inferred(
        'A painter who spent his life in Delft. Relatively few of his paintings survive; many show quiet interiors lit from a window at the left.',
        0.85,
      ),
    },
    date: 'ca. 1662',
    medium: 'Oil on canvas',
    dimensions: '18 x 16 in. (45.7 x 40.6 cm)',
    credit: 'Marquand Collection, Gift of Henry G. Marquand, 1889',
    accessionNumber: '89.15.21',
    metTags: ['Interiors', 'Women', 'Maps', 'Pitchers'],
    metUrl: 'https://www.metmuseum.org/art/collection/search/437881',
    image: { src: '/artworks/vermeer.jpg', width: 1422, height: 1600, glow: '#9fb6c4' },
    motifs: [
      {
        id: 'pitcher-and-basin',
        label: 'The Pitcher and Basin',
        kind: 'object',
        rect: { x: 47, y: 57, w: 33, h: 20 },
        shape: 'rect',
        observations: [
          verified('A pitcher is part of the subject.', metRecord(437881, 'title; subject tag “Pitchers”')),
          inferred(
            'A tall metal pitcher stands in a wide basin on the carpet-covered table. The woman holds its handle.',
            0.85,
          ),
        ],
        connections: [
          {
            targetArtworkId: 'self-portrait',
            targetMotifId: 'lit-face',
            relationshipType: 'similar_technique',
            claim: inferred(
              'The light that makes the pitcher shine comes from a window on the left. Rembrandt’s face is lit from the left too, with the far side left in shadow.',
              0.7,
            ),
            visualEvidence:
              'In Vermeer, the open window at the left edge is the only visible light source, and the pitcher and basin catch its light. In Rembrandt, the forehead and left cheek are brightest and the right side of the face falls into shade.',
            caveat:
              'Light from the left was common in paintings of this period. This shows a shared way of working, not contact between the two painters.',
            context: [
              verified(
                'Both are Dutch painters, working within about two years of each other: Rembrandt’s portrait is dated 1660, Vermeer’s painting ca. 1662.',
                'The Met collection records, objects 437397 and 437881 (artist bio, date)',
              ),
            ],
          },
          {
            targetArtworkId: 'adoration-of-magi',
            targetMotifId: 'black-king',
            relationshipType: 'similar_technique',
            claim: inferred(
              'Curved metal caught in light again, in the gold vessel carried by a king in Gerard David’s panel.',
              0.65,
            ),
            visualEvidence:
              'Vermeer’s reflections are broad and soft; David’s highlights are small, sharp points.',
            caveat: 'A household object and a royal gift; the link is how metal is painted.',
          },
        ],
      },
      {
        id: 'leaded-window',
        label: 'The Leaded Window',
        kind: 'object',
        rect: { x: 1, y: 6, w: 13, h: 58 },
        shape: 'rect',
        observations: [
          inferred(
            'At the left edge, a casement window of leaded glass stands open. The woman rests one hand on its frame.',
            0.9,
          ),
        ],
        connections: [
          {
            targetArtworkId: 'self-portrait',
            targetMotifId: 'lit-face',
            relationshipType: 'similar_technique',
            claim: inferred(
              'This window seems to explain the light in the whole room. Rembrandt’s face is lit from the same side, though his light source is not shown.',
              0.65,
            ),
            visualEvidence:
              'The wall beside the window is brightest and darkens toward the right. Rembrandt’s forehead is brightest on the left.',
            caveat: 'Rembrandt does not show a window, so its source is not visible in his painting.',
          },
        ],
      },
      {
        id: 'white-headcloth',
        label: 'The White Headcloth',
        kind: 'object',
        rect: { x: 30, y: 20, w: 38, h: 33 },
        shape: 'rect',
        observations: [
          verified('A woman in an interior.', metRecord(437881, 'subject tags “Women”, “Interiors”')),
          inferred(
            'A white linen hood and a wide collar frame the young woman’s lowered face. The window light turns the cloth pale blue-grey in its folds.',
            0.85,
          ),
        ],
        connections: [
          {
            targetArtworkId: 'adoration-of-magi',
            targetMotifId: 'virgin-and-child',
            relationshipType: 'shared_motif',
            claim: inferred(
              'A white headcloth, a blue garment and a lowered gaze recur in David’s Virgin.',
              0.6,
            ),
            visualEvidence:
              'Both women wear white linen around the face and deep blue below, and both look down.',
            caveat: 'Similar dress and pose; the two pictures mean very different things.',
          },
        ],
      },
    ],
  },

  {
    id: 'self-portrait',
    metObjectId: 437397,
    title: 'Self-Portrait',
    metTitle: 'Self-Portrait',
    creator: {
      name: 'Rembrandt van Rijn',
      metBio: 'Dutch, Leiden 1606–1669 Amsterdam',
      summary: inferred(
        'A painter, draftsman and printmaker born in Leiden who worked in Amsterdam. He returned to his own face many times in self-portraits across his career.',
        0.9,
      ),
    },
    date: '1660',
    medium: 'Oil on canvas',
    dimensions: '31 5/8 x 26 1/2 in. (80.3 x 67.3 cm)',
    credit: 'Bequest of Benjamin Altman, 1913',
    accessionNumber: '14.40.618',
    metTags: ['Men', 'Self-portraits'],
    metUrl: 'https://www.metmuseum.org/art/collection/search/437397',
    image: { src: '/artworks/rembrandt.jpg', width: 1319, height: 1600, glow: '#8a6f4e' },
    motifs: [
      {
        id: 'lit-face',
        label: 'The Lit Face',
        kind: 'figure',
        rect: { x: 34, y: 26, w: 25, h: 26 },
        shape: 'ellipse',
        observations: [
          verified('A self-portrait of the artist.', metRecord(437397, 'title; subject tag “Self-portraits”')),
          inferred(
            'Light falls from the viewer’s left across the forehead, nose and cheek, while the right side of the face and the dark beret sink into shadow.',
            0.85,
          ),
        ],
        connections: [
          {
            targetArtworkId: 'great-wave',
            targetMotifId: 'title-cartouche',
            relationshipType: 'thematic_echo',
            claim: inferred(
              'Rembrandt puts his own face in front of us. Hokusai’s print carries its maker in a different way, through a column of writing that appears to sign it.',
              0.45,
            ),
            visualEvidence:
              'Here the artist is the subject. In Hokusai’s print, a column of characters and a small seal stand beside the title frame at the upper left.',
            caveat:
              'A self-portrait and an inscription are different kinds of presence. This link closes the loop through the collection rather than asserting a close parallel.',
          },
          {
            targetArtworkId: 'water-pitcher',
            targetMotifId: 'pitcher-and-basin',
            relationshipType: 'similar_technique',
            claim: inferred(
              'Vermeer’s room is lit from the left in the same way, and the light catches his metal pitcher.',
              0.7,
            ),
            visualEvidence:
              'Here the brightest values sit on the left of the face. In Vermeer, the window at the left lights the room and the metal on the table.',
            caveat: 'A common studio practice of the time, not evidence of contact.',
          },
        ],
      },
      {
        id: 'signature',
        label: 'The Signature and Date',
        kind: 'inscription',
        rect: { x: 86, y: 68, w: 13, h: 10 },
        shape: 'rect',
        observations: [
          verified('The painting is dated 1660.', metRecord(437397, 'date')),
          inferred(
            'At the right edge, dark brushed letters read “…brandt” with “f. 1660” below. The start of the name is lost at the canvas edge in this image.',
            0.7,
          ),
        ],
        connections: [
          {
            targetArtworkId: 'great-wave',
            targetMotifId: 'title-cartouche',
            relationshipType: 'shared_motif',
            claim: inferred(
              'Hokusai’s print also carries writing on its surface that appears to name its maker.',
              0.6,
            ),
            visualEvidence:
              'Rembrandt’s letters are brushed into the dark background. Hokusai’s characters stand in a column beside the title frame.',
            caveat: 'Reading Hokusai’s column as a signature is an interpretation of the image.',
          },
        ],
      },
    ],
  },
];

/** The rehearsed demo path starts here (spec §44). */
export const featuredStart = { artworkId: 'great-wave', motifId: 'the-boats' };
