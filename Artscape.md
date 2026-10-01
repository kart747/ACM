# ARTSCAPE — Improved Winning Solution & Complete Hackathon Preparation Plan

## ACM × MLH Hack Days 2026 — Track 1: Art Beyond Boundaries

> **Tagline:** Step inside the relationships that make art meaningful.
>
> **Core idea:** Don't build an AI that creates art. Build an experience where Gemini helps people step inside human-made art, understand the knowledge embedded in it, and follow meaningful creative relationships to discover another human creator.

---

# 1. Executive Summary

ARTSCAPE is a provenance-aware, Gemini-powered interactive art discovery experience.

A user starts with a real human-created artwork. Instead of simply asking Gemini to describe the image, ARTSCAPE turns Gemini's semantic understanding into the interface itself:

**SEE ART → STEP INSIDE → EXPLORE ELEMENT → UNDERSTAND → FOLLOW RELATIONSHIP → DISCOVER ANOTHER HUMAN CREATOR → EXPLORE AGAIN**

The important distinction is that ARTSCAPE is **not an image-captioning chatbot** and **not an AI art generator**.

Gemini acts as a semantic intelligence layer that helps identify motifs, techniques, traditions, meanings, and relationships. The interface then lets the user physically explore those connections.

Human-created art remains the center of the experience.

---

# 2. Hackathon Context

## Event

- ACM × MLH Hack Days 2026
- Theme: **Beyond Reality**
- Track 1: **"What is Earth without Art? Just a Rock…" — Art Beyond Boundaries**
- Format: 6-hour hackathon
- Team size: 2
- Gemini: compulsory and must be meaningfully incorporated
- Projects must be original and developed during the hackathon
- Live demonstration required

## Track 1 Focus Areas

- **Discover** — surface overlooked artists and creators
- **Preserve** — preserve fading traditions and stories
- **Connect** — bridge creators and communities
- **Reimagine** — create novel interfaces for experiencing traditional art

ARTSCAPE primarily targets **Discover + Preserve + Reimagine**, while also connecting users back to human creators.

---

# 3. Judging Strategy

The judging weights are:

| Criterion | Weight |
|---|---:|
| Innovation & Creativity | 25% |
| Technical Implementation | 25% |
| Problem Relevance | 20% |
| User Experience | 15% |
| Presentation & Demonstration | 15% |

This means:

- Innovation + Technical Implementation = **50%**
- UX + Presentation = **30%**
- Problem relevance = **20%**

Therefore the project must simultaneously be:

1. genuinely different,
2. technically credible,
3. obviously relevant,
4. visually polished,
5. easy to understand in a live demo.

A technically functional but generic AI application is not enough.

A novel concept with poor UX is also not enough.

ARTSCAPE is designed specifically around this scoring structure.

---

# 4. Why ARTSCAPE Instead of a Generic Track 2 Project?

Track 2 naturally attracts common submissions such as:

- deepfake detection,
- phishing detection,
- fake-document detection,
- impersonation detection,
- misinformation analysis.

Those can be technically strong but risk blending into similar submissions.

ARTSCAPE takes the opposite strategy:

- narrow the experience,
- make the interaction memorable,
- exploit the visual nature of Track 1,
- make Gemini central,
- make the artwork itself the interface.

The team has access to Claude Code for frontend development, reducing the primary execution risk of Track 1.

---

# 5. The Core Product

## One-Sentence Pitch

> **ARTSCAPE turns human-made artworks into interactive maps of cultural and creative relationships, using Gemini to help users step inside an artwork and discover the creators and traditions connected to it.**

## The User Experience

```text
                         HUMAN-MADE ART
                               │
                               ▼
                            GEMINI
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
            MOTIFS         TECHNIQUES       TRADITION
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                         CREATIVE DNA
                               │
                               ▼
                    SEMANTIC RELATIONSHIPS
                               │
                               ▼
                           ARTSCAPE
                               │
                   ┌───────────┴───────────┐
                   ▼                       ▼
               UNDERSTAND               DISCOVER
                   │                       │
                   └───────────┬───────────┘
                               ▼
                       ANOTHER HUMAN CREATOR
```

---

# 6. The Core Interaction Loop

```text
SEE ART
   ↓
STEP INSIDE
   ↓
CLICK VISUAL ELEMENT
   ↓
UNDERSTAND ITS MEANING
   ↓
SEE ITS PROVENANCE
   ↓
FOLLOW CREATIVE RELATIONSHIP
   ↓
DISCOVER ANOTHER ARTWORK / CREATOR
   ↓
EXPLORE AGAIN
```

The entire product should strengthen this loop.

If a feature does not strengthen:

**Explore → Understand → Discover**

cut it.

---

# 7. What Makes ARTSCAPE Different

## 7.1 The artwork becomes the interface

The artwork is not merely an input to an AI chatbot.

Users interact directly with the artwork.

Example:

```text
                    ARTWORK

          •
                 •
     •                    •

                •
```

Clicking a hotspot opens contextual information without removing the artwork from view.

This is the main UX innovation.

---

## 7.2 CreativeDNA is the intelligence layer

CreativeDNA is **not the product**.

It is the structured semantic representation underneath ARTSCAPE.

It contains:

- artwork metadata,
- visual elements,
- meanings,
- techniques,
- traditions,
- provenance,
- relationships,
- confidence.

This lets the frontend become a deterministic experience instead of depending on free-form chatbot output.

---

## 7.3 Gemini has a real technical role

The original plan risked making Gemini look like it was merely writing descriptions for manually selected relationships.

The improved architecture gives Gemini a stronger role.

### Better architecture

```text
Human-curated evidence
        ↓
      Gemini
        ↓
Visual / semantic extraction
        ↓
Comparison & relationship reasoning
        ↓
Candidate relationship
        ↓
Provenance + confidence
        ↓
Human-approved relationship
        ↓
Interactive discovery
```

The human provides the factual foundation.

Gemini performs semantic interpretation and comparison.

The application does not blindly trust Gemini.

This gives a much stronger answer to:

> "What is Gemini actually contributing?"

---

# 8. Human vs Gemini Responsibilities

## Human / source layer

Humans provide:

- real artwork,
- artist information,
- artist statements,
- cultural references,
- externally verified facts,
- known relationships,
- relationship evidence.

## Gemini layer

Gemini helps:

- identify visual elements,
- extract motifs,
- identify possible techniques,
- interpret meaning,
- compare artworks,
- explain relationships,
- generate structured CreativeDNA,
- flag uncertain or inferred information.

## Application layer

ARTSCAPE:

- validates Gemini output,
- displays provenance,
- displays hotspots,
- controls navigation,
- connects artworks,
- presents creators,
- manages the discovery flow.

---

# 9. Provenance and Trust System

This is one of the strongest differentiators.

Every factual or interpretive claim receives a provenance type.

```text
artist_declared
externally_verified
ai_inferred
```

## Artist Declared

Information explicitly supplied by the artist.

Example:

> "The peacock represents prosperity."

Label:

**Artist**

---

## Externally Verified

Information supported by reliable external cultural or institutional sources.

Label:

**Verified**

---

## AI Inferred

Gemini's interpretation or pattern-based observation.

Label:

**AI interpretation**

AI-inferred claims must be phrased cautiously.

For example:

> "This appears to draw from..."

rather than:

> "This definitely represents..."

---

# 10. Provenance UI

Do not clutter the interface.

Use compact indicators:

```text
✓ Artist
✓ Verified
◇ AI interpretation
```

Clicking the indicator can reveal:

```text
SOURCE

Artist statement
Regional craft archive
Gemini interpretation
```

For AI-inferred relationships, show confidence where useful:

```text
AI interpretation
Confidence: 0.87
```

The purpose is not to make the UI bureaucratic.

The purpose is to communicate:

> **ARTSCAPE knows the difference between fact and interpretation.**

---

# 11. The Critical Relationship Problem

A major weakness of the initial plan was the possibility that judges would say:

> "The interesting relationships were manually created, so Gemini isn't really discovering anything."

The improved solution addresses this.

## Relationship pipeline

```text
Real artwork
     ↓
Verified / artist-provided evidence
     ↓
Gemini analyzes both artworks
     ↓
Candidate semantic relationship
     ↓
Human review / approval
     ↓
Stored relationship
     ↓
ARTSCAPE discovery interface
```

Gemini should not invent arbitrary links to random artworks.

It should reason over a **closed, pre-sourced artwork universe**.

---

# 12. Connected Artwork Universe

Use **5 artworks**, not just 3.

But do not choose five unrelated works.

Create a small connected creative universe.

Example:

```text
             Artwork B
              ↗
             /
Artwork A → Artwork C → Artwork D
             \
              ↘
             Artwork E
```

Each connection should have a defensible basis:

- shared motif,
- similar technique,
- same tradition,
- thematic echo,
- related cultural context.

This gives the judge a continuous discovery journey instead of a dead-end demo.

---

# 13. Artwork Selection Strategy

Prefer a coherent artistic ecosystem over a random museum catalog.

Bad:

```text
Yakshagana
+
Warli
+
Madhubani
+
Tigalari
+
random contemporary art
```

This can feel like a generic cultural database.

Better:

```text
One region / cultural ecosystem
        ↓
multiple artistic expressions
        ↓
shared motifs
        ↓
shared techniques
        ↓
shared stories
        ↓
creative relationships
```

A coherent domain makes the system feel deeper and more intentional.

Coastal Karnataka is a particularly strong candidate because it offers culturally distinctive material that is less likely to overlap with generic hackathon projects.

---

# 14. The "Step Inside" Experience

This is the **money shot** of the project.

## Initial screen

Use a beautiful full-screen artwork.

Minimal UI.

Example structure:

```text
                         ARTWORK

                 •
                       •
            •
                              •

                     •


                 STEP INSIDE →
```

---

## User clicks a hotspot

The artwork remains visible.

A panel slides in.

```text
PEACOCK

Symbolism
A recurring motif associated with...

TECHNIQUE
...

SOURCE
✓ Artist statement

INTERPRETATION
◇ AI interpretation

Explore this connection →
```

The user clicks:

**Explore this connection →**

The second artwork transitions into view.

That transition should feel like entering another part of the same creative world.

---

# 15. Do Not Make the Main UI a Generic Graph

The original plan considered relationship graph visualization as a P1 feature.

This should be secondary.

A large graph like:

```text
○────○
│ ╲  │
○───○
```

can look like a generic hackathon knowledge graph.

Instead, make the **relationship itself the navigation mechanism**.

Example:

> **This motif travels across two artistic traditions →**

Then transition to the next artwork.

A graph may exist internally, but it should not dominate the experience.

---

# 16. CreativeDNA Schema

Recommended structure:

```json
{
  "artwork": {
    "id": "peacock-motif-01",
    "title": "Artwork title",
    "artist": "Artist name",
    "region_or_tradition": "Tradition",
    "image_url": "local/path"
  },
  "elements": [
    {
      "id": "el_01",
      "name": "Peacock",
      "type": "motif",
      "location": {
        "x": 0.65,
        "y": 0.42
      },
      "meaning": "Explanation",
      "source_type": "artist_declared",
      "source_detail": "Artist statement"
    }
  ],
  "techniques": [
    {
      "name": "Technique",
      "description": "Description",
      "source_type": "externally_verified"
    }
  ],
  "tradition": {
    "name": "Tradition",
    "description": "Description",
    "source_type": "externally_verified"
  },
  "relationships": [
    {
      "target_artwork_id": "artwork-02",
      "relationship_type": "shared_motif",
      "explanation": "Short explanation",
      "source_type": "ai_inferred",
      "confidence": 0.87
    }
  ]
}
```

Relationship types:

- `similar_technique`
- `shared_motif`
- `same_tradition`
- `thematic_echo`

All relationship targets must exist in the sourced artwork set.

---

# 17. Gemini Prompt Architecture

Prepare and test four prompts.

## Prompt A — Element Extraction

Gemini receives:

- artwork image,
- artist context.

It identifies:

- motifs,
- characters,
- techniques,
- materials,
- normalized coordinates,
- meaning,
- provenance.

Rules:

- artist-declared only when explicitly supplied,
- otherwise AI-inferred,
- avoid overconfident claims,
- return valid JSON only.

---

## Prompt B — Technique & Tradition

Gemini identifies:

- technique,
- medium,
- stylistic approach,
- artistic tradition,
- regional lineage.

It should only mark something as externally verified when supported by established documentation.

Otherwise use cautious language:

> "This appears to draw from..."

---

## Prompt C — Relationship Explanation

Input:

- Artwork A CreativeDNA,
- Artwork B CreativeDNA,
- human/validated relationship type.

Output:

- one short sentence,
- maximum 25 words,
- no invented facts.

Purpose:

Make the connection compelling enough that the user wants to explore the second artwork.

---

## Prompt D — Sanity Check

Validate:

- coordinates,
- missing fields,
- provenance,
- overconfident claims,
- invalid relationships.

This gives the pipeline a validation layer rather than trusting raw Gemini output.

---

# 18. Technical Architecture

```text
                    ┌──────────────────┐
                    │  Artwork Images  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Artist Context + │
                    │ Verified Sources │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │      Gemini      │
                    │ Vision + Reason  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  CreativeDNA     │
                    │  JSON Generator  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Validation Layer │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ CreativeDNA JSON │
                    │     Storage      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ ARTSCAPE Frontend│
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
         Hotspots        Understand       Discover
                             │                │
                             └───────┬────────┘
                                     ▼
                              Another Artwork
```

---

# 19. Recommended Frontend Structure

The exact framework can be chosen beforehand, but the conceptual component structure should be known before the event.

```text
/app
 ├── Home
 ├── ArtworkViewer
 ├── ArtworkCanvas
 ├── Hotspot
 ├── InsightPanel
 ├── ProvenanceBadge
 ├── RelationshipPanel
 ├── ArtistCard
 └── DiscoveryView
```

The team should not spend hackathon time deciding basic frontend architecture.

---

# 20. JSON Validation

Prepare a validator before the event.

Example responsibilities:

```text
validate_creative_dna(data)
```

Check:

- valid JSON,
- required fields,
- coordinates between 0 and 1,
- valid source types,
- valid relationship types,
- relationship IDs exist,
- confidence exists,
- no missing artwork IDs,
- no malformed structures.

This makes the Gemini pipeline more technically credible.

---

# 21. Reliability Architecture

The live demo must **not depend on a live Gemini request succeeding at the exact moment of judging**.

Use:

```text
                Gemini
                  │
                  ▼
          CreativeDNA generation
                  │
                  ▼
              Validation
                  │
                  ▼
            Stored JSON
                  │
                  ▼
              ARTSCAPE
```

During the actual demo, the UI primarily reads validated CreativeDNA.

Separately demonstrate the live Gemini pipeline.

This provides:

- technical proof,
- deterministic demo,
- protection against API latency,
- protection against network failures.

---

# 22. Three Demo States

## State 1 — Full Demo

Everything works.

Show:

```text
Artwork
→ hotspot
→ meaning
→ provenance
→ relationship
→ second artwork
→ creator
```

---

## State 2 — Gemini unavailable

Use precomputed CreativeDNA.

The experience still works.

---

## State 3 — Frontend failure

Have a 60–90 second recorded screen capture.

Never depend on this unless necessary, but always have it.

---

# 23. Six-Hour Execution Plan

The original plan can be improved by moving the first working end-to-end interaction earlier.

## 0:00–0:30 — Setup

- initialize repository,
- install dependencies,
- copy prepared assets,
- define final schema,
- verify Gemini credentials,
- verify environment.

**Goal:** no environment uncertainty.

---

## 0:30–1:30 — One Artwork End-to-End

Get exactly one artwork through:

```text
image
→ Gemini
→ CreativeDNA
→ validation
→ JSON
```

Do not attempt five artworks yet.

**Goal:** prove the AI pipeline.

---

## 1:30–3:00 — Core Interface

Build:

- artwork viewer,
- hotspot,
- side panel,
- provenance,
- basic interaction.

By 3 hours:

> **One artwork → hotspot → explanation**

must work.

---

## 3:00–4:00 — Discovery Loop

Add:

```text
relationship
→ second artwork
→ creator
```

Now the full product loop exists.

This is the most important milestone.

---

## 4:00–4:45 — Scale

Expand:

- 2 artworks → 5 artworks,
- relationship network,
- additional hotspots,
- creator information.

---

## 4:45–5:30 — Polish

Focus on:

- typography,
- spacing,
- transitions,
- provenance badges,
- animations,
- click affordances,
- loading states,
- empty/error states.

Do not add major new features.

---

## 5:30–6:00 — Freeze

- full end-to-end test,
- remove broken features,
- prepare fallback,
- rehearse pitch,
- verify submission,
- record demo backup.

**The final 30 minutes are not feature-development time.**

---

# 24. P0 / P1 / P2 / P3

## P0 — Absolutely Required

- artwork viewer,
- Step Inside interaction,
- Gemini pipeline,
- CreativeDNA JSON,
- hotspots,
- provenance,
- related artwork navigation,
- one complete discovery loop,
- clean demo.

---

## P1 — Strongly Recommended

- smooth transitions,
- 5 connected artworks,
- artist profile,
- source/reference display,
- relationship explanation,
- confidence indicator,
- polished typography.

---

## P2 — Only If Everything Works

- voice narration,
- richer animations,
- search,
- additional cultural domains,
- live Gemini generation during the demo,
- optional relationship graph.

---

## P3 — Do Not Build

- marketplace,
- accounts,
- likes,
- follows,
- social network,
- blockchain,
- full 3D reconstruction,
- complex recommendation engine,
- ZK layer,
- unnecessary backend infrastructure.

---

# 25. What To Prepare Before the Hackathon

This is the most important section.

The goal is:

> **Prepare everything that is research, scaffolding, validation, content preparation, rehearsal, and tooling practice — but build the actual judged application during the hackathon.**

---

## A. Artwork Research

Prepare **5 real artworks**.

For every artwork collect:

```text
Artwork ID
Title
Artist
Region / tradition
Image
Artist statement
Technique
Materials
Cultural context
Known motifs
Reliable source(s)
```

Do not fabricate cultural information.

---

# 26. Prepare Artist Context

For each artwork write a clean context document.

Example:

```text
ARTWORK:
Artist:
Tradition:
Region:

ARTIST-DECLARED MEANING:
...

TECHNIQUE:
...

MATERIAL:
...

CULTURAL CONTEXT:
...

VERIFIED SOURCES:
...
```

This becomes Gemini input.

---

# 27. Prepare Relationships

For each pair, determine whether a meaningful connection exists.

Example:

```text
Artwork A
    ↓ shared motif
Artwork B

Artwork B
    ↓ similar technique
Artwork C

Artwork C
    ↓ same tradition
Artwork D

Artwork D
    ↓ thematic echo
Artwork E
```

For every relationship record:

```text
source artwork
target artwork
relationship type
evidence
why it matters
source
```

The relationship must be defensible.

---

# 28. Prepare a Relationship Evidence Table

Create this before the event:

| From | To | Relationship | Evidence | Source |
|---|---|---|---|---|
| A | B | Shared motif | ... | ... |
| B | C | Similar technique | ... | ... |
| C | D | Same tradition | ... | ... |
| D | E | Thematic echo | ... | ... |

This gives you a factual foundation for Gemini's semantic reasoning.

---

# 29. Prompt Testing Beforehand

Run all prompts against the actual sourced artworks.

Test:

- good images,
- complicated images,
- multiple motifs,
- ambiguous motifs,
- low-quality image,
- missing artist context.

Look for:

- hallucinations,
- overconfident claims,
- malformed JSON,
- inaccurate coordinates,
- excessive output,
- unsupported cultural claims.

Fix prompts before the event.

---

# 30. Prepare Example Gemini Outputs

Keep validated examples.

You should know approximately what Gemini produces for each artwork.

This allows you to:

- debug faster,
- identify bad outputs,
- know which fields require fallback handling,
- avoid discovering prompt problems during the six-hour build.

---

# 31. Prepare the Frontend by Practicing on Throwaway UI

This is legitimate preparation if the final project itself is not built.

Practice:

### Exercise 1

Image + hotspot.

### Exercise 2

Hotspot → side panel.

### Exercise 3

Side panel → provenance.

### Exercise 4

Relationship button → second artwork.

### Exercise 5

Smooth artwork transition.

### Exercise 6

Mobile/desktop resizing if relevant.

Do not spend the preparation time making the final ARTSCAPE application.

Practice the **skills** required to build it quickly.

---

# 32. Prepare the Design System

Decide beforehand:

## Typography

- heading font,
- body font,
- metadata font.

## Spacing

- panel width,
- margins,
- hotspot size.

## UI language

- minimal,
- museum/gallery-like,
- immersive,
- not "AI dashboard."

## Components

Prepare design decisions for:

- buttons,
- cards,
- provenance badges,
- transitions,
- panel,
- artwork frame.

This prevents design decisions from consuming hackathon time.

---

# 33. Prepare a Generic Frontend Scaffold

Before the event, prepare only legitimate scaffolding:

```text
empty repository
package configuration
dependency installation
basic project structure
development environment
build tooling
linting
formatting
```

Do not pre-build:

- ARTSCAPE viewer,
- real hotspot logic,
- Gemini integration,
- real CreativeDNA,
- actual app logic.

The project itself should be built during the event.

---

# 34. Prepare the Gemini Environment

Before the event verify:

- Gemini API access,
- credentials,
- model availability,
- image input,
- structured JSON output,
- API quotas,
- local environment,
- network access.

Have a tiny throwaway test script that confirms the environment works.

---

# 35. Prepare Error Handling

Decide beforehand what happens if:

### Gemini returns invalid JSON

Run validation / retry.

### Gemini misses coordinates

Use fallback handling.

### Gemini gives an overconfident interpretation

Downgrade to `ai_inferred` and hedge.

### Relationship doesn't exist

Reject it.

### API fails

Use stored CreativeDNA.

### Image fails

Use local asset.

This prevents panic during the hackathon.

---

# 36. Prepare the Demo Script

The demo should be rehearsed until it feels natural.

Target:

**60–90 seconds of actual product interaction.**

Suggested sequence:

### 0–10 sec

Show artwork.

> "This is a human-made artwork. Today we're going to step inside it."

### 10–25 sec

Click motif.

Show meaning.

### 25–35 sec

Show provenance.

> "ARTSCAPE distinguishes what the artist said, what is externally verified, and what Gemini inferred."

### 35–55 sec

Click relationship.

Transition to second artwork.

### 55–70 sec

Show second creator.

### 70–90 sec

Deliver the core message:

> "We aren't asking AI to create culture. We're using AI to help people discover the culture that already exists."

---

# 37. Pitch

## 90-Second Pitch

> Every day, we scroll past thousands of images. We see the artwork, but we rarely see the human knowledge behind it.
>
> ARTSCAPE changes that.
>
> We take a human-made artwork and use Gemini to understand its motifs, techniques, stories, traditions, and creative relationships.
>
> But we don't turn that analysis into another chatbot. We turn it into the interface.
>
> You can literally step inside the artwork. Click a motif and understand its meaning. See where that information came from. Follow the technique to another creator. And discover another human artwork through a relationship that was hidden inside the first one.
>
> We are not asking AI to create culture. We are using AI to help people discover the culture that already exists.
>
> **ARTSCAPE — step inside the relationships that make art meaningful.**

---

# 38. The Three Things Judges Must Remember

At the end of the presentation, the judges should remember:

### 1. The artwork became the interface.

### 2. Gemini uncovered semantic relationships rather than merely describing pixels.

### 3. Those relationships lead users back to real human creators and cultural context.

Everything in the demo should reinforce these three points.

---

# 39. Hard Judge Questions

## Q: "Isn't this just image recognition?"

Answer:

> No. Image recognition identifies objects. ARTSCAPE connects visual elements to cultural context and then turns those semantic relationships into a navigable discovery experience.

---

## Q: "Why Gemini?"

Answer:

> Gemini provides the multimodal reasoning layer — it can interpret the artwork together with artist-provided context and compare the semantic information across artworks. We then structure that output into CreativeDNA so the interface can expose the reasoning rather than hiding it in a chatbot.

---

## Q: "How do you know the AI isn't hallucinating?"

Answer:

> We don't treat every AI output as fact. Every claim carries provenance — artist-declared, externally verified, or AI-inferred. We also validate the generated structure and constrain relationships to a known set of real artworks.

---

## Q: "If you manually selected relationships, what is Gemini doing?"

Answer:

> We provide Gemini with grounded artwork evidence and a closed set of candidate artworks. Gemini performs the semantic comparison and explains why the relationship matters. Human curation provides the factual safety layer rather than allowing the model to invent arbitrary cultural connections.

---

## Q: "Why not just use a chatbot?"

Answer:

> A chatbot tells you information. ARTSCAPE lets you discover it spatially through the artwork itself. The artwork becomes the interface.

---

## Q: "Why does this matter?"

Answer:

> Cultural knowledge is often disconnected from the people and artworks that carry it. ARTSCAPE turns that hidden context into a discovery path that leads users from one human creator to another.

---

# 40. Things NOT To Say

Avoid:

> "Gemini understands culture perfectly."

Avoid:

> "Gemini discovers the true meaning of the artwork."

Avoid:

> "AI knows what the artist intended."

Avoid:

> "Our AI automatically finds all relationships."

Instead say:

> "Gemini generates interpretations."

> "We distinguish verified information from AI inference."

> "Relationships are grounded in the artwork set and supporting evidence."

---

# 41. Failure Modes

| Risk | Solution |
|---|---|
| Gemini API fails | Stored CreativeDNA |
| Invalid JSON | Validator + retry |
| Bad coordinates | Clamp/reject/fallback |
| Hallucinated meaning | Provenance + cautious wording |
| Arbitrary relationship | Evidence + human approval |
| UI looks unfinished | Dedicated polish window |
| Team runs out of time | P0/P1/P2 discipline |
| Claude Code produces broken UI | Small incremental tasks |
| Frontend breaks | Recorded demo |
| Demo gets stuck | Predefined happy path |
| Too many features | Cut anything outside core loop |

---

# 42. Team Division

For a 2-person team:

## Person A — AI / Backend / Data

Responsible for:

- Gemini API,
- prompts,
- CreativeDNA,
- validation,
- relationships,
- data flow,
- fallback JSON.

## Person B — Frontend / UX / Demo

Responsible for:

- artwork viewer,
- hotspots,
- panels,
- transitions,
- provenance UI,
- artist cards,
- final polish.

Both should understand the complete architecture.

During the final hour, both work together on:

- integration,
- testing,
- pitch,
- demo.

---

# 43. Practical Claude Code Strategy

Do not give Claude Code:

> "Build the whole application."

Break it into small tasks.

Example:

```text
Build only the artwork viewer with a local image.
```

Then:

```text
Add normalized-coordinate hotspots from JSON.
```

Then:

```text
Add the slide-in insight panel.
```

Then:

```text
Add provenance badges.
```

Then:

```text
Add relationship navigation.
```

Then:

```text
Polish transitions and typography.
```

This makes debugging much easier.

---

# 44. Demo Data Should Be Deterministic

The happy-path demo should always follow the same sequence.

Example:

```text
Artwork A
  ↓
Peacock hotspot
  ↓
Meaning
  ↓
Artist provenance
  ↓
Shared motif relationship
  ↓
Artwork B
  ↓
Artist B
  ↓
Technique relationship
  ↓
Artwork C
```

Don't improvise.

Don't search for an artwork live.

Don't rely on unpredictable model output during the main demonstration.

---

# 45. Final Pre-Hackathon Checklist

## Research

- [ ] Select cultural domain
- [ ] Select 5 real artworks
- [ ] Verify artist information
- [ ] Collect artist statements
- [ ] Collect reliable cultural references
- [ ] Document techniques
- [ ] Document motifs
- [ ] Document traditions

## Relationship Design

- [ ] Build connected artwork graph
- [ ] Identify shared motifs
- [ ] Identify techniques
- [ ] Identify traditions
- [ ] Identify thematic relationships
- [ ] Record evidence for every relationship

## Gemini

- [ ] Test Prompt A
- [ ] Test Prompt B
- [ ] Test Prompt C
- [ ] Test Prompt D
- [ ] Validate JSON outputs
- [ ] Test difficult images
- [ ] Test ambiguous information
- [ ] Test hallucination handling
- [ ] Verify API access

## Frontend Practice

- [ ] Practice image viewer
- [ ] Practice hotspot
- [ ] Practice panel
- [ ] Practice provenance
- [ ] Practice transitions
- [ ] Practice relationship navigation
- [ ] Practice artist card

## Engineering

- [ ] Prepare empty scaffold
- [ ] Prepare dependencies
- [ ] Prepare validation strategy
- [ ] Prepare fallback JSON approach
- [ ] Prepare error handling
- [ ] Verify build process

## Presentation

- [ ] Finalize tagline
- [ ] Finalize 90-second pitch
- [ ] Practice demo
- [ ] Practice judge questions
- [ ] Record fallback demo
- [ ] Prepare screenshots if necessary
- [ ] Prepare submission assets

---

# 46. Final Hackathon-Day Checklist

Before hacking:

- [ ] Confirm Gemini works
- [ ] Confirm repository builds
- [ ] Confirm assets are accessible
- [ ] Confirm responsibilities
- [ ] Confirm final artwork set

After 1 hour:

- [ ] One artwork processed
- [ ] CreativeDNA generated
- [ ] JSON validated

After 3 hours:

- [ ] Step Inside works
- [ ] Hotspot works
- [ ] Meaning panel works
- [ ] Provenance works

After 4 hours:

- [ ] Relationship works
- [ ] Second artwork works
- [ ] Full discovery loop works

After 5 hours:

- [ ] Five artworks connected
- [ ] UI polished
- [ ] No major bugs

Final hour:

- [ ] Freeze features
- [ ] Test demo
- [ ] Record backup
- [ ] Rehearse pitch
- [ ] Submit

---

# 47. Winning Strategy in One Diagram

```text
                  DIFFERENTIATED IDEA
                         │
                         ▼
              "Artwork becomes interface"
                         │
                         ▼
                  GEMINI REASONING
                         │
                         ▼
                   CREATIVE DNA
                         │
                         ▼
              PROVENANCE + VALIDATION
                         │
                         ▼
              SEMANTIC RELATIONSHIPS
                         │
                         ▼
              STEP INSIDE EXPERIENCE
                         │
                         ▼
                HUMAN CREATOR
                         │
                         ▼
                  DISCOVERY LOOP
```

This directly maps to the judging criteria:

```text
Innovation
    ↓
Novel interaction

Technical Implementation
    ↓
Gemini + structured CreativeDNA + validation

Problem Relevance
    ↓
Discover / Preserve / Reimagine

User Experience
    ↓
Immersive artwork exploration

Presentation
    ↓
Strong visual demo + simple narrative
```

---

# 48. Final Assessment

## Concept

**9/10**

The central interaction is memorable and clearly different from generic AI art tools.

## Technical Feasibility

**9/10 with serious preparation**

The project becomes very feasible if the team practices the frontend, tests Gemini beforehand, prepares content, and uses deterministic CreativeDNA for the live demo.

## Innovation

**9/10**

The strongest innovation is not Gemini itself.

It is:

> **Turning semantic understanding of art into an interactive interface.**

## Winning Potential

**9–9.5/10 potential if execution is excellent.**

There is no guarantee of winning because the competition and execution of other teams are unknown.

But ARTSCAPE has the ingredients of a top-tier submission:

- memorable concept,
- strong visual demo,
- meaningful Gemini integration,
- clear Track 1 relevance,
- technical depth,
- provenance/trust layer,
- constrained scope,
- strong presentation narrative.

---

# 49. The Single Most Important Principle

Do not try to make ARTSCAPE bigger.

Make the **one experience** better:

```text
ARTWORK
   ↓
STEP INSIDE
   ↓
CLICK
   ↓
UNDERSTAND
   ↓
TRUST
   ↓
FOLLOW
   ↓
DISCOVER
```

If the judges experience that loop and immediately understand why it is different, the project has done its job.

**Do not build an AI art platform.**

**Build one beautiful, technically credible doorway into human-made art.**