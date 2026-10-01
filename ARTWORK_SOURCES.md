# Thirteen-artwork V2 collection

The V2 collection retains ten existing museum reproductions and adds one Yakshagana performance photograph and two Durga museum works. The twelve museum reproductions are public domain; the photograph is CC BY-SA 4.0. The three additions were selectively copied from the `sacred-coast` branch's sourced assets, not its replacement homepage or full research archive. They are byte-identical to the supplied display JPEGs. No generative imagery, stylized derivatives, or artistic filters were added.

| ID | Artwork / creator | Local file under `public/` | Source record |
| --- | --- | --- | --- |
| `art_001` | Garden episode from the *Khamsa* — Manohar | `assets/artworks/peacock_mughal.jpg` | [446567 · 13.228.33](https://www.metmuseum.org/art/collection/search/446567) |
| `art_002` | *The Concourse of the Birds* — Habiballah of Sava | `assets/artworks/persian_garden.jpg` | [451725 · 63.210.11](https://www.metmuseum.org/art/collection/search/451725) |
| `art_003` | *A Peacock Perched on a Maple Tree* — Utagawa Hiroshige | `assets/artworks/japanese_crane.jpg` | [36741 · JP269](https://www.metmuseum.org/art/collection/search/36741) |
| `art_004` | *Krishna Revels with the Gopis* — unnamed artist | `assets/artworks/rajasthani_folk.jpg` | [65584 · 2003.165](https://www.metmuseum.org/art/collection/search/65584) |
| `art_005` | *Peacocks* — Melchior d’ Hondecoeter | `assets/artworks/contemporary.jpg` | [436671 · 27.250.1](https://www.metmuseum.org/art/collection/search/436671) |
| `art_006` | *Under the Wave off Kanagawa* — Katsushika Hokusai | `artworks/hokusai.jpg` | [36491 · JP10](https://www.metmuseum.org/art/collection/search/36491) |
| `art_007` | *The Gulf Stream* — Winslow Homer | `artworks/homer.jpg` | [11122 · 06.1234](https://www.metmuseum.org/art/collection/search/11122) |
| `art_008` | *The Adoration of the Magi* — Gerard David | `artworks/david.jpg` | [436104 · 1982.60.17](https://www.metmuseum.org/art/collection/search/436104) |
| `art_009` | *Self-Portrait* — Rembrandt | `artworks/rembrandt.jpg` | [437397 · 14.40.618](https://www.metmuseum.org/art/collection/search/437397) |
| `art_010` | *Young Woman with a Water Pitcher* — Johannes Vermeer | `artworks/vermeer.jpg` | [437881 · 89.15.21](https://www.metmuseum.org/art/collection/search/437881) |
| `art_011` | *Lord Shree Durga Devi slays Mahishasura* — photograph by Krishnamoorthy Sudhakar | `artworks/yk-durga-slays-mahishasura.jpg` | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Lord_Shree_Durga_Devi_slays_Mahishasura.jpg) |
| `art_012` | *The Goddess Durga Slaying the Buffalo Demon (Mahisasura Mardini)* — unknown artist | `artworks/met-38418-mahishasura-mardini-rajasthan.jpg` | [38418 · 33.65.2](https://www.metmuseum.org/art/collection/search/38418) |
| `art_013` | *Durga Confronts the Buffalo Demon Mahisha: Scene from the Devi Mahatmya* — unknown artist | `artworks/met-73169-durga-mahisha-guler.jpg` | [73169 · 2005.436.2](https://www.metmuseum.org/art/collection/search/73169) |

Some older filenames describe superseded placeholder content; the current image, catalog record, and displayed title determine identity. The unused standalone prototype and redundant image copies remain removed.

## Cultural additions: credits and verification

The Met APIs for objects **38418** and **73169** and the Commons image metadata API were checked directly on **2026-10-01**. The Met records confirm the titles, unknown artists, dates, media, accession numbers, and public-domain status. Commons confirms photographer **Krishnamoorthy Sudhakar**, the recorded photograph date **2023-01-29**, and [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0). This verifies the source records, not every cultural claim in them.

- **Photograph attribution:** “Lord Shree Durga Devi slays Mahishasura.jpg” by Krishnamoorthy Sudhakar, via Wikimedia Commons, CC BY-SA 4.0. The display copy was resized from 5875 × 3917 to 1400 × 933, JPEG-reencoded, and stripped of embedded camera metadata. No cropping or artistic filtering was added. Attribution, licence links, and modification notices accompany display; adaptations must respect ShareAlike.
- **Sculpture:** The Met, accession 33.65.2, Gift of George D. Pratt, 1933; 10th century, India (Rajasthan), sandstone. [CC0](https://creativecommons.org/publicdomain/zero/1.0/). The display copy is 1050 × 1400.
- **Painting:** The Met, accession 2005.436.2, Gift of Cynthia Hazen Polsky, 2005; ca. 1780, India, Guler, Himachal Pradesh, ink and opaque watercolor on paper. [CC0](https://creativecommons.org/publicdomain/zero/1.0/). The display copy is 1400 × 945.

The museum display copies were also resized and JPEG-reencoded in the source dataset; all three local files preserve those copies without further transformations. Regression tests pin their SHA-256 hashes.

The photograph's subject identification is uploader-stated. Venue, troupe, performer identities, costume designers, and the exact performance narrative remain unverified. Image licensing does not establish performer consent or community endorsement. The *Devi Mahatmya* identification comes from the painting's museum title and is not automatically attributed to the sculpture or photographed production. Two other research records flagged against featuring, Met 74653 and 74660, are excluded.

## Data and interpretation

The first five records are in `src/data/artworks-v2.ts`, the next five in `src/data/artworks-v2-extension.ts`, and the cultural additions in `src/data/artworks-v2-cultural.ts`. The exported V2 corpus combines all three. The classic collection and its five-work journey remain unchanged.

Catalog metadata cites the linked museum or photograph records, with separate claim-level evidence and limitations for the cultural additions. Visual descriptions, prepared narration, hand-drawn regions, and proposed comparisons remain labeled interpretations. Shared shapes, subject matter, or materials do not establish historical influence. The regions are guides to details, not pixel-perfect segmentation masks.

## Gemini-independent operation

All thirteen artworks have local images, metadata, selectable details, visual comparisons, and prepared stories. Browsing and starting a story do not require a Gemini call. If the story endpoint is unavailable, the client builds the prepared guide from the local collection. If explicit Gemini generation fails, the server returns the prepared version with a clear fallback label.

The existing API configuration is unchanged. Live generation remains optional and restricted to `gemini-3.8-flash`; a replacement key can be supplied later. See [STORYTELLING.md](./STORYTELLING.md) for controls and generation behavior.
