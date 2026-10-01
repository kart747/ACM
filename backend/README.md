# ARTSCAPE — backend

There is no server. The only backend work is the **build-time Gemini pipeline**, which lives in
`src/lib/gemini/` and runs from `npm run generate:artscape`. See the "Gemini pipeline" section of
the root README.

The web app never calls Gemini and never sees the API key. It reads validated CreativeDNA from
`src/data/generated/` and falls back to the curated data in `src/data/artworks.ts`.

Motif segmentation (SAM 2.1) also needs no server: it runs in the visitor's browser, in a Web
Worker. See "Motif segmentation" in the root README.

Later phases (not built): embeddings for visual similarity.
