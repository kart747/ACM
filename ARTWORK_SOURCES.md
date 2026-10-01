# Ten-artwork V2 collection

The V2 collection uses ten existing local reproductions of human-made artworks from The Metropolitan Museum of Art. All ten catalog records identify the reproductions as public domain. No new images were scraped, synthesized, or generated for this expansion.

| ID | Artwork / creator | Local file under `public/` | Museum record |
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

Some older filenames describe superseded placeholder content; the current image, catalog record, and displayed title determine identity. The unused standalone prototype and redundant image copies have been removed; the ten files listed above remain.

## Data and interpretation

The first five records are in `src/data/artworks-v2.ts`; the additions are in `src/data/artworks-v2-extension.ts`. The exported V2 corpus combines both. The classic collection and its five-work journey remain unchanged.

Catalog metadata is supported by the linked museum records. Visual descriptions, prepared narration, hand-drawn regions, and proposed comparisons remain labeled interpretations. Shared shapes, subject matter, or materials do not establish historical influence. The regions are guides to details, not pixel-perfect segmentation masks.

## Gemini-independent operation

All ten artworks have local images, metadata, selectable details, visual comparisons, and prepared stories. Browsing and starting a story do not require a Gemini call. If the story endpoint is unavailable, the client builds the prepared guide from the local collection. If explicit Gemini generation fails, the server returns the prepared version with a clear fallback label.

The existing API configuration is unchanged. Live generation remains optional and restricted to `gemini-3.8-flash`; a replacement key can be supplied later. See [STORYTELLING.md](./STORYTELLING.md) for controls and generation behavior.
