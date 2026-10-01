# ARTSCAPE

> Step inside the relationships that make art meaningful.

ARTSCAPE is an interactive collection experience. A visitor stands in front of one
painting, selects a detail they notice, and travels along a documented relationship
into a second painting — landing on the detail that answers the first.

This is **not** an image-captioning chatbot and **not** an AI art generator. The point
is to move through human-made work along documented relationships, and to keep
observation separate from interpretation.

Design documents live in this repo:

- [`Artscape.md`](./Artscape.md) — the product specification.
- [`reaserch.md`](./reaserch.md) — the earlier research report (SAM, embeddings, vector search) that shaped the first build.

---

## Current status

The discovery experience works end to end. Its AI interpretations can now be produced by a
build-time Gemini pipeline (see below). The app never calls Gemini: it reads stored, validated
CreativeDNA, and falls back to the curated data in `src/data/artworks.ts` wherever generated
data is missing or invalid.

---

## Gemini pipeline

```
image + Met record + curated motif regions
  → Prompt A  element extraction            (per artwork)
  → Prompt B  technique & tradition         (per artwork)
  → Prompt C  relationship explanation      (per human-approved relationship, both images, ×5 runs)
  → Prompt D  sanity check                  (per artwork)
  → hedging linter                          (rules; Prompt H rewrites only where needed)
  → validate_creative_dna                   (schema + semantic rules)
  → hedging linter again                    (texts the validator downgraded; usually a no-op)
  → validate_creative_dna
  → src/data/generated/<artwork-id>.json    (only accepted documents)
  → app: applyCreativeDna(curated, generated), re-validated at load
```

```bash
cp .env.example .env              # add GEMINI_API_KEY (or GEMINI_API_KEY_1…_N to rotate on rate limits)
npm run generate:artscape         # all artworks
npm run generate:artscape -- --only=great-wave --dry-run
npm run generate:artscape -- --list-models
```

| Path | Role |
| --- | --- |
| `src/lib/creative-dna/schema.ts` | CreativeDNA (spec §16) and per-prompt response schemas, in Zod |
| `src/lib/creative-dna/validate.ts` | `validateCreativeDna` (spec §20, §35) |
| `src/lib/creative-dna/merge.ts` | Applies validated documents over the curated collection |
| `src/lib/gemini/prompts.ts` | Prompts A–D and H (hedging review), versioned |
| `src/lib/gemini/client.ts` | Node-only Gemini client (`@google/genai`), key from env |
| `src/lib/gemini/generate.ts` | The pipeline |
| `src/lib/hedging/rules.ts` | Hedging linter, rule layer (build-time only) |
| `src/lib/hedging/document.ts` | Hedging linter, document pass and Prompt H rewrites (build-time only) |
| `scripts/generate-artscape.ts` | The CLI |
| `src/data/generated/` | Stored output, `index.ts` rewritten by the CLI, `last-run.json` report |

Rules the validator enforces: the artwork must be in the closed set with its Met title and artist
unchanged; elements must be supplied motifs, located inside their rectangle; relationships must be
human-approved edges with the approved type, cite both elements, carry evidence and a caveat, and
explain in at most 25 words; overconfident or influence wording in an AI interpretation is
rejected; `artist_declared`, and `externally_verified` that the Met record does not back, are
downgraded to `ai_inferred`. A bad item falls back to its curated version; a bad document falls
back entirely.

### Hedging linter

Keeps generated text from sounding more certain than its evidence (spec §9, §35). Each sentence
is classed as an **observation** ("Both artworks contain circular forms."), an **interpretation**
("The circular forms may create a framing effect.") or an **unsupported certainty** ("The artist
intentionally used the circle to symbolize…"). Rules cover intent, certainty ("proves",
"definitely", non-visual "clearly"), influence, copying, causation, dates and history the Met record
does not contain, unhedged symbolism, and unsupported statements of fact ("most famous",
"scholars agree"). Negated wording in caveats ("Nothing here shows that Homer knew this print") passes.

| Outcome | When | Effect |
| --- | --- | --- |
| pass | observation, or cautious interpretation | kept |
| flag | hedged lineage ("appears to draw from…"), hedged causation | kept, noted in `last-run.json` |
| downgrade | verified text that interprets, or artist-declared text that claims influence or history | `ai_inferred`, then judged as an interpretation |
| rewrite | intent, certainty, influence, unhedged symbolism or causation, unsupported fact | Prompt H asks Gemini for a safer version; the rewrite must pass the rules again |
| reject | copying claims (hedged or not), invented dates or history | item removed; curated text kept |

Prompt D's `overconfident` errors are also sent for a rewrite instead of being dropped. A failed
rewrite, a Gemini "reject", or a failed Prompt H call removes the item. A rejected tradition rejects
the document. Provenance is only ever lowered. The linter is not part of the app bundle; the app
keeps its existing load-time check in `validate.ts`.

### Multi-run agreement

Prompt C runs **5 times independently** for every approved relationship, at generation time only:
the same images, records and curator-approved type, as separate concurrent calls with one attempt
each (no run sees another's output or gets feedback). The conclusion voted on is `supported`: do
the images support this relationship. A run that errors or returns unparseable or off-schema JSON
is a failed run and counts against agreement.

- At least 3 of the 5 runs must agree, or the curated relationship is kept.
- The text stored is the first agreeing run's.
- The result is stored on the relationship as `"agreement": { "runs": 5, "agreeing": 4, "failed": 1 }`
  and shown in the UI as "4/5 runs agree".
- The validator drops a generated relationship with no agreement, a run count other than 5, or no
  majority; malformed agreement (non-integers, `agreeing + failed > runs`) rejects the document.

`confidence` is still stored (spec §16) but is Gemini's self-assessment from one run and is labelled
as such; it plays no part in agreement. Agreement measures consistency, not truth.

Cost: each relationship costs 5 Prompt C calls, about 5× the previous Prompt C volume. Gemini's
free tier (20 requests/day per model) is not enough for a full run.

---

## The five artworks

All five are Open Access (CC0) images from The Metropolitan Museum of Art. Every local file was
checked pixel-for-pixel against the Met's primary image for the object id below, and all record
fields (title, artist bio, date, medium, dimensions, credit line, tags) come from the Met API.

| id | Creator | Work | Met object | Details |
| --- | --- | --- | --- | --- |
| `great-wave` | Katsushika Hokusai | *Under the Wave off Kanagawa* | [36491](https://www.metmuseum.org/art/collection/search/36491) | boats, wave crest, Mount Fuji, title cartouche |
| `gulf-stream` | Winslow Homer | *The Gulf Stream* | [11122](https://www.metmuseum.org/art/collection/search/11122) | sailor and boat, sharks, waterspout, distant ship |
| `adoration-of-magi` | Gerard David | *The Adoration of the Magi* | [436104](https://www.metmuseum.org/art/collection/search/436104) | Black king and his gift, Virgin and Child, dog |
| `water-pitcher` | Johannes Vermeer | *Young Woman with a Water Pitcher* | [437881](https://www.metmuseum.org/art/collection/search/437881) | pitcher and basin, leaded window, white headcloth |
| `self-portrait` | Rembrandt van Rijn | *Self-Portrait* | [437397](https://www.metmuseum.org/art/collection/search/437397) | lit face, signature and date |

### Provenance

Every claim is a `Claim` with a `sourceType` (spec §9), shown as a compact badge that opens to
show its source:

- **✓ Verified** (`externally_verified`) — only facts present in the Met collection record.
- **◇ AI interpretation** (`ai_inferred`) — everything else: visual descriptions beyond the
  record, creator summaries, and every relationship. Phrased cautiously, with a confidence.
- **✓ Artist** (`artist_declared`) — supported by the schema and UI; no current content qualifies.

Relationships use the spec's types (`shared_motif`, `similar_technique`, `same_tradition`,
`thematic_echo`) and keep three things apart: the interpretive claim, what you can see in both
images, and what the pairing does not show. Confidence values are hand-assigned until the Gemini
pipeline produces them.

### The demo path

Starting from **The Boats in the Trough** (offered as "Start the journey here"):

Hokusai → Homer → Gerard David → Vermeer → Rembrandt → back to Hokusai.

A motif can have several connections. After arriving by travel, the panel offers the first
connection that does not lead straight back, so the journey moves forward; the others are listed
under "This detail also connects to".

---

## Getting started

Requires Node 20+.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (fully static) |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit and UI tests (Vitest) |
| `npm run generate:artscape` | Regenerate CreativeDNA with Gemini (needs `.env`) |
| `npm run lint` | `next lint` |

### Keyboard

| Key | Action |
| --- | --- |
| `Escape` | Clear the current selection, or cancel a journey in progress (selection is kept) |
| `d` | Toggle the hotspot tuner (development builds only) |

`prefers-reduced-motion` collapses the travel animation into a short fade and stops the marker pulse.

---

## How a journey works

1. Press a marker on the artwork, or pick a detail from the panel.
2. The panel shows the detail, the relationship, the evidence, and provenance badges.
3. **Explore this connection** (pinned to the bottom of the panel) starts the journey.
4. The selected detail crops and travels across the screen; the destination artwork swaps in
   at the midpoint and the flight lands on the destination detail.
5. A banner introduces the creator you have reached. "Where you have been" entries return you
   to earlier details.

The destination is always derived from the selected motif's connection; only the in-flight
target is stored.

---

## Project structure

```
src/
  app/
    layout.tsx            root metadata, document shell
    page.tsx              composition, keyboard control, arrival banner
    globals.css           theme, focus styles, marker pulse, reduced motion
  components/
    ArtworkStage.tsx      artwork frame, spotlight, hotspot markers
    MotifPanel.tsx        detail, relationship, creator card, trail, sticky Explore
    ProvenanceBadge.tsx   ✓ Artist / ✓ Verified / ◇ AI interpretation badges
    TravelStage.tsx       the crop-flight journey
    CollectionRail.tsx    filmstrip of the five works
    HotspotTuner.tsx      development overlay for checking hotspot rectangles
  data/
    artworks.ts           all content: Met record fields, motifs, claims, connections
  lib/
    types.ts              Artwork / Motif / MotifConnection / Claim
    rect.ts               rect → CSS, motif crop background
    experience-state.tsx  reducer, context, travel phases, connection choice
    segmentation/         click → SAM 2.1 mask → spotlight and crop region (see below)
public/artworks/          local copies of the five Met images
```

---

## Hotspot rectangles

Rectangles are normalized to `0–100` on both axes and live next to each motif in
`src/data/artworks.ts`. Each was placed against a 5% grid drawn over the local image and then
checked by drawing it back onto the image. In development, press `d` to overlay them in the app.

---

## Motif segmentation

When a visitor clicks a detail, SAM 2.1 traces it and the Living Spotlight follows the traced
outline instead of the rectangle. The rectangles above stay as the fallback and as a prompt.

```
click on a hotspot (normalized 0–100 point)
  → SAM 2.1 Hiera-Tiny in a Web Worker    point + curated box as prompts; box alone without a click
  → 3 mask candidates at ≤512px           with the model's own score (predicted IoU)
  → chooseRegion                          best-scoring mask that passes the sanity checks
  → mask images + padded bounding box     spotlight uses the mask, the travel crop uses the box
```

- **Model.** `onnx-community/sam2.1-hiera-tiny-ONNX`, int8, through Transformers.js, as the
  research report recommends (client-side SAM 2, no GPU server). About 61 MB, downloaded from
  the Hugging Face hub on first use and then cached by the browser. The ONNX runtime is bundled.
- **Prompts.** A lone point is ambiguous on paintings (a click on Hokusai's boat returned a sliver
  of wave), so the curated rectangle is always sent as a box, and the click as a positive point.
  Keyboard, panel and post-travel selections have no point and use the box alone.
- **Sanity checks** (`src/lib/segmentation/region.ts`): score ≥ 0.5, between 0.05% and 50% of the
  image, at least half inside the curated rectangle, and covering the click. Otherwise the
  curated rectangle is used and the reason recorded.
- **Fallback.** Model download blocked, worker crash, timeout (90 s) or a rejected mask all show the
  curated rectangle, exactly as before. `NEXT_PUBLIC_ARTSCAPE_SEGMENTATION=off` disables
  segmentation entirely, for a demo that must not touch the network.
- **Status.** A quiet note on the frame: loading the model, tracing, traced, or showing the
  curated region. The rectangle is shown at once and the mask fades in over it; nothing waits.
- **Swapping the model.** Implement `SegmentationBackend` (`src/lib/segmentation/types.ts`) and
  select it in `src/lib/segmentation/index.ts`. Everything after the mask is backend-agnostic.

Costs, measured in headless Chrome (WASM, one thread): first trace 24–45 s including the download;
encoding a new painting ~12 s; another click on an already-encoded painting ~0.1 s. The two most
recent paintings' embeddings are kept (about 17 MB each).

---

## Images

Downloaded from the Met's Open Access program and resized locally (longest edge 1600px,
re-encoded, interlacing stripped) into `public/artworks/`. Dimensions are declared in
`src/data/artworks.ts`.

All five are public domain, CC0. Attribution for each work is carried in the motif panel.

---

## Known limitations

- Generated data exists only after `npm run generate:artscape` has been run with a key; until
  then every artwork uses curated data (labelled ◇ AI interpretation, hand-assigned confidence).
- Motif regions are still hand-placed. SAM 2.1 traces the detail a visitor clicks, but only within
  a curated hotspot, and Gemini's CreativeDNA is still generated against the curated rectangles.
- Segmentation runs single-threaded WASM: cross-origin isolation (for threads) and WebGPU are not
  enabled yet, so encoding a painting takes seconds and the first use downloads ~61 MB.
- Multi-run agreement covers relationships (Prompt C) only; elements, techniques and tradition
  are single-run.
- `npm run lint` is not configured (Next prompts for an ESLint setup).
- `npm audit` reports advisories in transitive `postcss` / `sharp`; fixing them needs Next 16.

---

## Next

Run the pipeline with a real key, review `src/data/generated/last-run.json`, and rehearse the demo
on the generated data.
