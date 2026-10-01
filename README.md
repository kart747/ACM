# ARTSCAPE — The Motif Travels

> Explore the details that connect human-made artworks, with their sources and uncertainties in view.

ARTSCAPE is an interactive art collection built for ACM × MLH Hack Days 2026. Select a highlighted detail, follow a visual comparison into another artwork, or take a guided story at your own pace.

**The current collection contains 13 works, 33 selectable detail regions, and 30 directed visual comparisons.** Browsing, motif travel, and prepared stories work without a Gemini API key. All images are sourced photographs or museum reproductions—not AI-generated or artistically filtered images.

## What you can do

- **Explore the gallery:** browse the collection and filter by its represented traditions.
- **Select a motif:** choose a numbered region or detail button to inspect a subject, shape, or visual feature.
- **Travel between works:** compare related details, land in the destination artwork, and revisit your discovery trail.
- **Follow a guided story:** use Next, Previous, Play, Pause, Replay, or Explore this detail.
- **Check the evidence:** read source records, image credits, licence terms, and claim-specific cultural limitations.
- **Learn how CreativeDNA works:** use the home-page link to open the explanation of artwork records, detail regions, comparisons, and Gemini’s role.

The interface supports desktop and mobile layouts, keyboard interaction, and reduced-motion preferences. Highlighted regions are hand-drawn guides, not live object detection or pixel-perfect cutouts.

## Quick start

Use **Node.js 22.13+ on the 22.x line, or Node.js 24.x**, with npm. The current test tooling requires a newer runtime than Next.js alone; the project was verified with Node 22.23.3.

```bash
git clone https://github.com/kart747/ACM.git
cd ACM
npm ci
npm run dev
```

Open **http://localhost:3000**. No API key is needed for the prepared experience.

| Route | Experience |
| --- | --- |
| `/` | Current home page, CreativeDNA explanation, gallery, stories, and motif travel |
| `/#concept` | Direct link to the CreativeDNA explanation |
| `/v2` | Alias of the current experience; shares the same implementation and collection |
| `/classic` | Original five-work journey with rectangle hotspots and optional browser-side segmentation |

### Try motif travel

1. Choose **Gallery**, then **Explore** on an artwork.
2. Select a numbered region or a detail button below the image.
3. Find **Visual Comparisons** in the detail panel and choose **Travel**.
4. Read the comparison, then choose **Land in…** to continue at the related detail.

Some details have no comparison yet. While a guided story is open, choose **Explore this detail** or **Skip story and explore freely** to return to detail exploration.

## The collection

The original ten museum works remain available, alongside three cultural additions:

| Addition | Source and rights |
| --- | --- |
| *Lord Shree Durga Devi slays Mahishasura* — Yakshagana performance photograph by Krishnamoorthy Sudhakar | Wikimedia Commons, CC BY-SA 4.0; subject identification is uploader-stated |
| *The Goddess Durga Slaying the Buffalo Demon (Mahisasura Mardini)* — unknown artist, 10th century | The Metropolitan Museum of Art, object 38418, public domain / CC0 |
| *Durga Confronts the Buffalo Demon Mahisha: Scene from the Devi Mahatmya* — unknown artist, ca. 1780 | The Metropolitan Museum of Art, object 73169, public domain / CC0 |

The other works include Manohar, Habiballah of Sava, Utagawa Hiroshige, an unnamed artist depicting Krishna and the gopis, Melchior d’ Hondecoeter, Katsushika Hokusai, Winslow Homer, Gerard David, Rembrandt, and Johannes Vermeer.

All twelve Met reproductions are public domain. The performance photograph has separate attribution and ShareAlike requirements. Display copies may be resized and JPEG-reencoded; the cultural additions retain their supplied image bytes without further transformations. Source links and modification notices accompany them.

See **[ARTWORK_SOURCES.md](./ARTWORK_SOURCES.md)** for all thirteen titles, image paths, museum accessions, credits, and licence details. The independent `/classic` collection still uses Hokusai, Homer, David, Vermeer, and Rembrandt.

## CreativeDNA and provenance

CreativeDNA is ARTSCAPE’s structured record of an artwork: its source, selected regions, descriptions, and proposed connections. It is not a claim that AI has established the artwork’s meaning.

- Catalog facts cite museum or photograph records.
- Visual descriptions, prepared narration, and proposed comparisons remain interpretations.
- Cultural evidence distinguishes **Verified record**, **Documented**, **Unverified**, **Interpretation**, and **Needs community review**.
- A shared subject or similar shape does not establish historical influence, common origins, or cultural transmission.
- The photograph’s venue, troupe, performers, costume designers, and specific performance narrative remain unverified. An image licence does not establish performer consent or community endorsement.

The cultural additions provide expandable evidence panels in the gallery, detail view, story, and comparison. All current travel comparisons are provisional. No current content qualifies as an artist-declared interpretation.

## Guided stories and Gemini

### What works without an API

Every artwork has a prepared guide with a whole-scene introduction, highlighted details, and an invitation to explore. Starting a story reads a validated cache entry or returns the prepared guide—it does not generate a new story. If the endpoint cannot be reached, the browser constructs the guide from local collection data.

Changing beats, pausing, replaying, and traveling between works do not generate model requests. If optional generation fails, the interface keeps the prepared story and labels it honestly.

### Optional configuration

```bash
cp .env.example .env.local
```

The current application transport supports these settings:

```dotenv
GEMINI_BASE_URL=https://api.routing.run/v1
GEMINI_MODEL=gemini-3.8-flash
GEMINI_API_KEY=
```

Leave the key blank to use the prepared experience. Add an authorized working key only to the ignored `.env.local` file, then restart the server. Never use a `NEXT_PUBLIC_` variable for API credentials or commit them to Git.

- **Create a Gemini story:** sends the selected artwork image and bundled context to the server-side provider. Accepted stories are schema-validated and cached under ignored `.cache/artscape-stories/`.
- **Analysis and relationship checks:** currently send text context only. They are not historical verification or multi-model consensus.
- **Health indicator:** reports configuration, not successful inference or provider availability.

### Current provider status

As checked on **2026-10-01**, live generation has not been verified as working with the supplied credentials:

| Provider tested | Observed result |
| --- | --- |
| Routing.run `/v1/chat/completions`, `gemini-3.8-flash` | HTTP 401 `PROVIDER_ERROR` |
| ZenLLM `/v1/chat/completions`, advertised Gemini 3-series models including 3.1 and 3.8 | HTTP 403 `forbidden` |
| ZenLLM `/chat/completions` without `/v1`, `gemini-3.8-flash` | HTTP 403 `forbidden` |

These are observations for the tested credentials and date, not a claim that either service is universally unavailable. A successful model-list response does not establish generation access. ZenLLM was tested separately and **has not been integrated into the application**; changing the base URL alone will not enable it because the current transport restricts provider and model selection.

See [STORYTELLING.md](./STORYTELLING.md) for validation, caching, playback, and fallback behavior.

## Commands and verification

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create the production build, including server-side API routes |
| `npm start` | Serve the production build |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Run unit and UI tests with Vitest |
| `npm run generate:artscape -- --estimate` | Offline request estimate for the retained legacy pipeline |

The most recent application verification passed **383 tests**, TypeScript checks, and a production build. Chromium browser checks covered the thirteen works, detail masks, guided stories, new cultural travel connections, evidence panels, simulated generation/network failures, and CreativeDNA navigation on desktop and mobile. Tests do not establish that live Gemini generation works.

The existing `npm run lint` script requires ESLint setup before it can be used as a verification step.

## Architecture

**Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Zod, and Vitest/Testing Library.

```text
src/
  app/
    page.tsx                      current experience
    v2/page.tsx                   alias of the current page
    classic/page.tsx              original five-work journey
    api/                          artwork, story, analysis, and relationship routes
  components/v2/                  gallery, CreativeDNA explanation, stories, credits, and travel
  data/
    artworks-v2.ts                current corpus and original five records
    artworks-v2-extension.ts      next five museum records and comparisons
    artworks-v2-cultural.ts       cultural additions, credits, evidence, and comparisons
    artworks.ts                   independent classic collection
    collection.ts                 classic validated-data loader with curated fallback
  lib/
    artwork-sources.ts            credit types, evidence labels, and source references
    story/                        prepared narration, validation, generation, and caching
    gemini/routing-client.ts      restricted server-side provider transport
    gemini/server-service.ts      text-based analysis and relationship assessments
    creative-dna/                 shared schemas, classic validation, and merging
    segmentation/                 classic browser-side segmentation
public/
  assets/artworks/                 first five gallery reproductions
  artworks/                       five classic reproductions and three cultural additions
```

### Classic mode and retained code

Classic mode optionally runs SAM 2.1 image segmentation in a browser Web Worker through Transformers.js. The first use downloads approximately 61 MB of model data. Failed or rejected masks fall back to curated rectangles. Set `NEXT_PUBLIC_ARTSCAPE_SEGMENTATION=off` to avoid the download. The current gallery uses bundled polygon regions instead.

On `/classic`, `Escape` clears a selection or cancels travel, and `d` toggles the hotspot tuner in development builds. Reduced-motion preferences replace travel animation with a short fade.

The original Google-SDK generation pipeline remains for reference, offline tests, and request estimation. Its live generation and model-listing commands are disabled. Classic mode still uses the stored CreativeDNA loader and validation code; those are active dependencies, not unused files.

## Current scope

Uploads, chat, live search grounding, automatic motif discovery, and embeddings-based similarity search are not implemented. Proposal documents describe additional ideas and should not be read as a list of shipped features. This application requires a Next.js server for its API routes; it is not a static-only export.

## Further documentation

- [ARTWORK_SOURCES.md](./ARTWORK_SOURCES.md) — image provenance, credits, licences, and source limitations.
- [STORYTELLING.md](./STORYTELLING.md) — implemented storytelling and configuration.
- [Artscape.md](./Artscape.md) — original product specification.
- [reaserch.md](./reaserch.md) — earlier technical research and proposals.
- [ARTSCAPE_V2_Winning_Solution.md](./ARTSCAPE_V2_Winning_Solution.md) — improvement proposal.
- [ARTSCAPE_V2_Storytelling_Conversation_Upgrade.md](./ARTSCAPE_V2_Storytelling_Conversation_Upgrade.md) — storytelling and conversation proposal; not every proposed feature is implemented.
