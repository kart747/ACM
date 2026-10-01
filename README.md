# ARTSCAPE

> Step inside the relationships that make art meaningful.

ARTSCAPE is an interactive collection experience built around human-made artworks. Select a detail, explore a visual comparison, or follow a guided story. Museum catalog facts are kept separate from interpretations; a visual similarity does not establish historical influence.

## Getting started

Requires Node 20+.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

| Route | Experience |
| --- | --- |
| `/` | Current ten-artwork gallery, detail exploration, comparisons, and guided stories |
| `/v2` | Alias of the current experience; reuses the same page implementation |
| `/classic` | Original five-artwork journey with rectangle-based hotspots and optional SAM segmentation |

## The ten artworks

All ten gallery images are existing local reproductions of human-made works from The Metropolitan Museum of Art. Their catalog records identify the images as public domain. No AI-generated images are used in this collection.

The collection includes works by Manohar, Habiballah of Sava, Utagawa Hiroshige, an unnamed artist depicting Krishna and the gopis, Melchior d’ Hondecoeter, Katsushika Hokusai, Winslow Homer, Gerard David, Rembrandt, and Johannes Vermeer.

See [ARTWORK_SOURCES.md](./ARTWORK_SOURCES.md) for the titles, museum records, and local image paths. The current collection has 24 selectable detail regions and 20 directed visual comparisons. Regions are hand-drawn guides, not pixel-perfect object cutouts.

The classic collection independently uses the five works by Hokusai, Homer, David, Vermeer, and Rembrandt. It shares their image files with the current gallery.

## Guided stories and Gemini

Every artwork has a prepared guide with scene-setting, highlighted details, and an invitation to explore. Stories support manual navigation, timed playback, pause, replay, and skipping into free exploration.

- Browsing the collection requires no Gemini request.
- Starting a story reads a validated cached story or returns a prepared guide; it does not invoke Gemini.
- Explicit generation sends the selected artwork image and its bundled context to the server-side provider.
- Failed generation falls back to the prepared guide with a clear label.
- If the story endpoint is unavailable, the browser builds a prepared guide from local collection data.

Live requests are restricted to `gemini-3.8-flash` through `https://api.routing.run/v1`. Credentials belong in ignored `.env.local`, never in browser code. The existing provider configuration has not produced working live generation; the prepared experience remains usable while that is resolved.

Story generation includes an image. The separate analysis and relationship-assessment endpoints currently use text context only. Uploads, search grounding, automatic motif discovery, and embeddings-based similarity search are not implemented.

See [STORYTELLING.md](./STORYTELLING.md) for configuration, controls, validation, caching, and limitations.

## Provenance

Museum titles, creators, dates, and other catalog facts cite the museum records. Visual descriptions, prepared narration, and proposed connections remain interpretations. The interface distinguishes these from externally verified metadata.

A comparison explains what is visible and what the pairing does not establish. No current content qualifies as an artist-declared interpretation. Model confidence or agreement is not historical verification.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build with static pages and server-side API routes |
| `npm start` | Serve the production build |
| `npm run typecheck` | TypeScript checks |
| `npm test` | Unit and UI tests with Vitest |
| `npm run generate:artscape -- --estimate` | Offline request estimate for the retained legacy pipeline |

The existing `npm run lint` script requires ESLint setup before it can be used as a verification step.

## Project structure

```text
src/
  app/
    page.tsx                 current experience
    v2/page.tsx              alias of the current page
    classic/page.tsx         original five-artwork journey
    api/                     artwork, story, analysis, and relationship endpoints
  components/
    v2/                      current gallery, detail panels, stories, and travel UI
    ArtworkStage.tsx          classic artwork frame and spotlight
    MotifPanel.tsx            classic detail and relationship panel
    TravelStage.tsx           classic crop-flight transition
    HotspotTuner.tsx          classic development-only rectangle editor
  data/
    artworks-v2.ts           current corpus and original five records
    artworks-v2-extension.ts five additional records and comparisons
    artworks.ts              independent classic collection
    collection.ts            classic loader with validated generated-data fallback
    generated/index.ts       stored classic CreativeDNA document list
  lib/
    story/                   prepared narration, validation, and generation/cache service
    gemini/routing-client.ts current provider transport
    gemini/server-service.ts current analysis and relationship assessments
    creative-dna/            shared schemas, classic validation, and merging
    segmentation/            classic browser-side SAM segmentation
public/
  assets/artworks/           first five gallery reproductions
  artworks/                  five reproductions shared with classic mode
```

## Classic controls and segmentation

On `/classic`, select a detail and choose **Explore this connection** to travel to its paired detail. The sample journey runs Hokusai → Homer → David → Vermeer → Rembrandt → Hokusai.

- `Escape` clears a selection or cancels travel; the path panel handles its own dismissal.
- `d` toggles the hotspot tuner in development builds.
- Reduced-motion preferences replace the travel animation with a short fade.

Classic hotspot rectangles use normalized `0–100` coordinates in `src/data/artworks.ts`. Optional SAM 2.1 segmentation runs in a browser Web Worker through Transformers.js using `onnx-community/sam2.1-hiera-tiny-ONNX`. The curated box and optional click guide the model. Accepted masks drive the spotlight and travel crop.

The first use downloads approximately 61 MB of model data. Model failures, timeouts, or rejected masks retain the curated rectangle. Set `NEXT_PUBLIC_ARTSCAPE_SEGMENTATION=off` to avoid segmentation downloads. Segmentation is specific to classic mode; the current gallery uses its bundled polygon regions.

## Retained legacy generation pipeline

The original Google-SDK generation pipeline remains as reference code with offline tests and request estimation. Its live generation and model-listing commands are disabled to prevent sending Routing.run credentials to another provider. Use the current story endpoint for optional live story generation instead.

The legacy pipeline contains element extraction, technique/tradition descriptions, five-run relationship agreement, sanity checks, hedging rules, and CreativeDNA validation. Its primary files are `scripts/generate-artscape.ts`, `src/lib/gemini/generate.ts`, `src/lib/gemini/prompts.ts`, and `src/lib/hedging/`.

Classic mode still imports `src/data/generated/index.ts` through its collection loader. Accepted stored documents are revalidated and merged with curated content; an empty list or invalid document keeps the curated fallback. These loader and validation files are active dependencies, even though live legacy generation is disabled.

## Documentation

- [ARTWORK_SOURCES.md](./ARTWORK_SOURCES.md) — current image provenance and collection details.
- [STORYTELLING.md](./STORYTELLING.md) — implemented storytelling behavior and configuration.
- [Artscape.md](./Artscape.md) — original product specification.
- [reaserch.md](./reaserch.md) — earlier technical research, including proposed features.
- [ARTSCAPE_V2_Winning_Solution.md](./ARTSCAPE_V2_Winning_Solution.md) — improvement proposal.
- [ARTSCAPE_V2_Storytelling_Conversation_Upgrade.md](./ARTSCAPE_V2_Storytelling_Conversation_Upgrade.md) — storytelling and conversation proposal; not every proposed feature is implemented.
