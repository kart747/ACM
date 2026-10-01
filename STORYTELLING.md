# Guided storytelling

Guided stories are available for the ten artworks in the current V2 collection on `/` and `/v2`. All ten are existing public-domain museum reproductions; see [ARTWORK_SOURCES.md](./ARTWORK_SOURCES.md) for the selected files and records. This change adds guided looking, not a chat interface. The proposed Yakshagana demo still requires an appropriately licensed image, catalog record, and accurate regions.

## Using a story

1. Open a painting and choose **Step inside · guided story**.
2. Use **Next** and **Previous** to read at your own pace, or **Play** for timed advancement. Playback starts paused for every visitor, including those who prefer reduced motion.
3. Each detail beat highlights a curated region in the actual artwork image. **More context** pauses playback.
4. **Explore this detail** interrupts the story and opens the existing information/relationship drawer. Choosing another detail directly also interrupts the story.
5. **Skip story and explore freely**, closing the panel, or changing artworks stops the story and pending requests. **Replay story** reuses the loaded story.

The artwork remains visible above the story on small screens and beside it on larger screens. Whole-scene and closing beats remove the detail mask.

## Gemini configuration

The supported provider and model are restricted to:

- Base URL: `https://api.routing.run/v1`
- Model: `gemini-3.8-flash`
- Transport: server-side OpenAI-compatible `/chat/completions`

Set `GEMINI_API_KEY`, `GEMINI_BASE_URL`, and `GEMINI_MODEL` in ignored `.env.local`. Keep the key out of source files and browser environment variables. A different configured provider, requested model, or returned model is rejected; there is no alternate-model fallback.

The existing live analysis and relationship-assessment endpoints use the same restricted transport. Those existing endpoints remain text-only; **story generation includes the local artwork image** as well as its catalog record, curated elements, and provenance.

The legacy Google-SDK generation command is disabled to prevent sending the Routing.run credential to Google. `npm run generate:artscape -- --estimate` remains available for offline estimation; legacy generation, dry-run generation, and model listing fail before loading credentials.

## Prepared and generated stories

Starting a story makes a GET request to `/api/artworks/:id/story`. This reads an accepted cache entry or returns a deterministic prepared guide. GET never calls the model.

**Create a Gemini story** explicitly sends a bodyless POST to that same endpoint. The server:

- Loads the image and context by a known artwork ID; callers cannot supply images, prompts, paths, or model overrides.
- Requests a story from `gemini-3.8-flash` only.
- Validates the shared CreativeDNA story schema, element IDs, evidence references, provenance labels, and unsupported certainty patterns.
- Saves accepted stories under ignored `.cache/artscape-stories/`. Cache keys include the metadata, regions, image bytes, prompt version, and model. Cached stories are validated again before use.
- Coalesces simultaneous generation for the same artwork, limits generation attempts per process, and cools down after failures.

Changing beats, pausing, replaying, and selecting details do not generate new model requests. A cached POST also avoids a model request.

The process-local limits complement, but do not replace, deployment-wide rate limits or spending controls.

If the provider fails, the UI labels the result as **Prepared story**, never as a successful Gemini generation. A locally constructed prepared guide is also available when the story endpoint cannot be reached. Model output is always labeled as interpretation; validation does not establish historical truth or eliminate hallucination risk.

## Verification

Automated tests cover schema constraints, grounding references, cache invalidation, request coalescing, model/provider restrictions, blocked legacy transport, API boundaries, playback, replay, cancellation, and offline guides. Browser checks should cover both `/` and `/v2`, all ten artworks, matching masks, manual detail selection, relationship travel, mobile panels, and provider failures.
