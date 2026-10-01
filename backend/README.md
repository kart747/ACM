# ARTSCAPE — backend

The backend runs inside Next.js API routes in `src/app/api/`; there is no separate backend service to start.

The current experience reads a bundled ten-artwork collection. Story GET requests return a validated cache entry or a prepared guide without calling Gemini. Explicit generation runs server-side through Routing.run using only `gemini-3.8-flash`; failure returns the prepared guide. API credentials stay on the server. See [STORYTELLING.md](../STORYTELLING.md).

The `/classic` experience reads validated CreativeDNA from `src/data/generated/` and falls back to the curated data in `src/data/artworks.ts`. The legacy Google-SDK pipeline is retained for reference and offline tests, but live generation is disabled.

Classic motif segmentation (SAM 2.1) runs in the visitor's browser in a Web Worker. See "Classic controls and segmentation" in the [root README](../README.md).

Embeddings-based visual similarity is not implemented.
adhesh
11