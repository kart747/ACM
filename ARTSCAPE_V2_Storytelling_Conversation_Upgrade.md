# ARTSCAPE V2 — Storytelling & Contextual Gemini Conversation Upgrade

## Purpose

Upgrade the **existing ARTSCAPE V2 implementation**. Assume the base project is already built and working with:

- artwork → visual element → CreativeDNA
- element selection / isolation
- contextual information
- provenance / evidence labels
- follow-element / motif-travels navigation
- transition to another artwork / creator

Do **not** rebuild the base architecture.

The upgrade adds a **guided storytelling layer** and a **contextual Gemini conversation layer** whose purpose is to improve the user's understanding of the artwork.

The product must remain **ARTSCAPE, not an art chatbot**.

Core philosophy:

> The artwork is the interface. Gemini explains what the user is looking at, guides attention, answers questions about the selected element, and helps the user discover the relationship to another human-made artwork.

---

# 1. Core Experience

The new experience should be:

```text
SEE ART
   ↓
STEP INSIDE
   ↓
GUIDED STORY
   ↓
NOTICE A VISUAL ELEMENT
   ↓
UNDERSTAND
   ↓
ASK / EXPLORE
   ↓
FOLLOW ELEMENT
   ↓
MOTIF TRAVELS
   ↓
DISCOVER ANOTHER ARTWORK
```

The existing V2 interaction remains the backbone.

Storytelling and conversation are supporting layers.

Do NOT turn the landing page into a chat UI.

---

# 2. Design Principle

Avoid:

```text
Artwork
+
Huge AI text panel
+
Chatbot
```

Prefer:

```text
                 ARTWORK

        subtle visual focus
                ↓
          "Notice this."

       selected element
                ↓
        short explanation
                ↓
        "Why is this important?"
                ↓
           user explores
                ↓
          motif travels
```

The user should spend most of the time looking at the artwork.

---

# 3. Guided Storytelling Mode

Add a guided storytelling mode to the artwork viewer.

When the user presses:

**STEP INSIDE**

the artwork becomes an interactive canvas.

Gemini/CreativeDNA should provide a small sequence of meaningful observations.

Example for the primary demo artwork (Yakshagana):

### Beat 1 — Establish the scene

```text
LOOK AT THE FIGURE IN THE CENTER
```

Subtle focus/zoom/highlight.

Narration:

> "The figure at the center is not simply a person in costume. In Yakshagana, the performer becomes part of a larger theatrical world through costume, makeup and movement."

### Beat 2 — Direct attention

Highlight headgear.

```text
NOTICE THE HEADGEAR
```

Explanation:

> "The elaborate headgear is part of Yakshagana's visual language. Its scale and ornamentation help transform the performer into a larger-than-life character."

### Beat 3 — Explain meaning

Highlight makeup.

```text
NOW LOOK AT THE FACE
```

Explanation should explain the visual/cultural significance using supplied evidence.

### Beat 4 — Invite exploration

```text
WHAT DO YOU WANT TO EXPLORE?
```

Show hotspots:

- Costume
- Makeup
- Headgear
- Gesture
- Character
- Symbol / motif

The user can interrupt the guided story at any point.

---

# 4. Storytelling Must Be Data-Driven

Do not hard-code paragraphs directly into React components.

Extend CreativeDNA with something conceptually like:

```json
{
  "story": {
    "intro": "...",
    "beats": [
      {
        "id": "central_figure",
        "element_id": "element_01",
        "title": "Look at the central figure",
        "short_text": "...",
        "explanation": "...",
        "duration": 5
      },
      {
        "id": "headgear",
        "element_id": "element_02",
        "title": "Notice the headgear",
        "short_text": "...",
        "explanation": "...",
        "duration": 5
      }
    ]
  }
}
```

Use the existing CreativeDNA schema conventions rather than creating a competing data model.

If the current schema already has an appropriate narrative/story field, extend it instead.

---

# 5. Three Information Depths

Every important element should support three levels of explanation.

## Level 1 — Micro explanation

Visible directly in the artwork experience.

Example:

> "The headgear helps establish the performer's character and visual presence."

1–2 sentences.

## Level 2 — Context

Shown when the user selects the element.

Example:

> "Yakshagana uses elaborate costumes and makeup as part of its theatrical language. These visual conventions help distinguish characters and amplify expression for an audience."

Keep it concise.

## Level 3 — Conversation

The user can ask:

> "Why is it so elaborate?"

Gemini answers specifically about the selected element.

This gives:

```text
SEE
 ↓
NOTICE
 ↓
UNDERSTAND
 ↓
ASK DEEPER
```

---

# 6. Contextual Gemini Conversation

Add a small **ASK ABOUT THIS** action after an element is selected.

It must be contextual.

The model should receive:

- current artwork metadata
- selected element
- CreativeDNA for that element
- known cultural context
- provenance/evidence
- artist-declared information if available
- previous conversation turns
- user's current question

Conceptual request:

```text
SYSTEM
You are the contextual cultural guide inside ARTSCAPE.

You are not a generic chatbot.

The user is looking at a specific human-made artwork
and has selected a specific visual element.

Explain only what is relevant to the selected element
and the current artwork.

Prefer supplied evidence and artist-declared context.
Never invent cultural facts.

If information is uncertain, say so.

Your goal is to improve the user's understanding
and encourage visual exploration of the artwork.

Do not generate artwork.
Do not claim AI-created cultural knowledge is authoritative.
Do not overwhelm the user with an essay.
```

Then provide structured context:

```json
{
  "artwork": {},
  "selected_element": {},
  "cultural_context": {},
  "evidence": {},
  "conversation_history": []
}
```

Then:

```text
USER:
Why is this costume so elaborate?
```

---

# 7. Conversation Response Format

Prefer structured responses.

Example:

```json
{
  "answer": "The elaborate costume is part of Yakshagana's theatrical language...",
  "visual_reference": {
    "element_id": "costume_01"
  },
  "follow_up": "Look at the headgear next — it reinforces the character's presence.",
  "related_action": {
    "type": "focus_element",
    "element_id": "headgear_01"
  },
  "confidence": "supported"
}
```

The frontend should render:

```text
Why is this costume so elaborate?

Gemini:
The elaborate costume is part of Yakshagana's
theatrical language...

      ↓

Look at the headgear next.

[ SHOW ME ]
```

The answer should feel like part of the artwork experience, not a separate AI application.

---

# 8. Conversation Rules

Gemini should:

### DO

- explain visual details
- explain supplied cultural context
- explain symbolism when supported
- explain artistic techniques
- explain relationships
- answer "why", "what", and "how" questions
- reference the currently selected visual element
- point the user toward another visible element
- suggest a relevant next exploration step

### DON'T

- invent traditions
- invent artist statements
- invent historical facts
- confidently state unsupported symbolism
- hallucinate provenance
- drift into unrelated general conversation
- become a generic assistant
- produce huge essays
- replace the artwork with text

---

# 9. Evidence-Aware Storytelling

Preserve the existing ARTSCAPE trust model.

Every substantive claim should retain its provenance:

```text
ARTIST-DECLARED
EXTERNALLY-VERIFIED
AI-INFERRED
```

For conversational answers, internally track the evidence source.

If the answer is AI inference:

> "ARTSCAPE's AI interpretation: ..."

Do not present an AI inference as historical fact.

If evidence is unavailable:

> "The available information doesn't establish this with certainty."

---

# 10. Conversation Memory

The conversation should be short-lived and artwork-specific.

Example:

```text
Artwork A
  selected: headgear
  Q1: Why is it so large?
  A1: ...
  Q2: Is this unique to Yakshagana?
  A2: ...
```

If the user follows the motif into Artwork B:

```text
Artwork B
  selected: corresponding element
```

Start a new contextual thread while optionally preserving:

```text
origin_artwork
origin_element
relationship
```

This allows Gemini to answer:

> "How is this different from the one we saw earlier?"

---

# 11. Conversation → Motif Travels

This is the most important integration.

Conversation must eventually feed back into the core ARTSCAPE interaction.

Example:

User:

> "Does this kind of visual exaggeration appear elsewhere?"

Gemini:

> "A related theatrical exaggeration appears in this Japanese work, particularly in the treatment of the figure's silhouette."

Then show:

```text
[ FOLLOW THIS RELATIONSHIP ]
```

Clicking it triggers the existing:

```text
ISOLATE
   ↓
ZOOM
   ↓
TRANSITION
   ↓
SECOND ARTWORK
   ↓
HIGHLIGHT CORRESPONDING ELEMENT
```

Conversation should therefore strengthen:

**UNDERSTAND → DISCOVER**

not become a dead-end chat.

---

# 12. Suggested UI

Do not use a conventional chatbot sidebar by default.

Use a small contextual layer.

Concept:

```text
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    ARTWORK                          │
│                                                     │
│                    ✦                                │
│              selected element                       │
│                                                     │
│                           ┌──────────────────────┐  │
│                           │ HEADGEAR             │  │
│                           │                      │  │
│                           │ Part of Yakshagana's │  │
│                           │ theatrical language. │  │
│                           │                      │  │
│                           │ [ ASK ABOUT THIS ]   │  │
│                           │                      │  │
│                           │ [ FOLLOW ELEMENT → ] │  │
│                           └──────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

When ASK ABOUT THIS is clicked:

```text
┌─────────────────────────────────────────────────────┐
│ HEADGEAR                                             │
│                                                     │
│ Why is it so elaborate?                             │
│                                                     │
│ GEMINI                                              │
│ The scale and ornamentation help create a dramatic  │
│ theatrical presence...                              │
│                                                     │
│ Look at the makeup next.                            │
│                                                     │
│ [ SHOW ME ]                                         │
│                                                     │
│ ┌───────────────────────────────────────────────┐   │
│ │ Ask about this element...                     │   │
│ └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

Keep the artwork visible at all times.

---

# 13. Visual Direction

Use the existing ARTSCAPE visual direction.

Primary inspiration:

**black-and-white ink / brush artwork**

The primary demo artwork should be a **Yakshagana artwork**.

Visual language:

- black
- off-white
- ink texture
- large negative space
- brush edges
- subtle grain
- restrained red accent
- calligraphic details
- cinematic transitions
- asymmetrical composition

Do not turn the UI into a generic SaaS dashboard.

Avoid:

- excessive cards
- neon gradients
- glassmorphism everywhere
- chatbot-style bubbles
- conventional AI UI
- excessive icons

The interface should feel like an extension of the artwork.

---

# 14. Animation Direction

Story beats should animate attention rather than animate the entire UI.

Use:

- slow camera push
- subtle parallax
- ink reveal
- brush-stroke masks
- localized glow/highlight
- fade/dim of irrelevant artwork regions
- smooth transition through selected motifs

Avoid:

- excessive bouncing
- generic Framer Motion effects
- flashy particle effects
- unnecessary 3D

Signature transition:

```text
selected element
       ↓
everything else fades
       ↓
element fills the frame
       ↓
ink/brush transition
       ↓
next artwork
```

---

# 15. Gemini API Architecture

Create a clean service abstraction.

Concept:

```text
frontend
   ↓
ARTSCAPE API
   ↓
GeminiService
   ├── analyzeArtwork()
   ├── generateStory()
   ├── answerElementQuestion()
   └── explainRelationship()
```

Do not call Gemini directly from UI components.

Keep API credentials server-side.

Environment:

```text
GEMINI_API_KEY=
GEMINI_MODEL=
```

Allow model selection through environment configuration.

Do not hard-code a provider-specific model throughout the application.

---

# 16. Cost-Aware Design

Do NOT call Gemini for every UI interaction.

Precompute and cache:

- artwork analysis
- CreativeDNA
- story beats
- element explanations
- relationship explanations

Use live Gemini primarily for:

- user questions
- genuinely dynamic explanations
- relationship questions not already cached

Cache conversation context where practical.

If API fails:

```text
live Gemini
   ↓ failure
cached explanation
   ↓ failure
static CreativeDNA explanation
```

The demo must never break because of API availability.

---

# 17. Recommended Model Strategy

For the implementation, keep the model configurable.

Use the current Gemini Flash-class multimodal model available to the project.

The model must support:

- image input
- structured JSON output
- multimodal reasoning
- sufficiently long context

For low-cost/high-volume testing, a Flash-Lite class model can be used for simple conversational questions, while the stronger Flash model handles artwork analysis and important story generation.

Do not introduce multiple models until the single-model path works.

---

# 18. Testing Requirements

Create a test mode with:

### Artwork

1. Yakshagana artwork
2. Japanese ink artwork
3. floral artwork
4. tarot artwork

For each artwork test:

### Story test

```text
STEP INSIDE
→ story starts
→ correct element highlights
→ explanation appears
→ next beat works
```

### Conversation test

Ask:

```text
Why is this important?
What does this mean?
Why does it look like this?
Is this specific to this tradition?
What should I look at next?
```

Check:

- answers remain contextual
- answers remain concise
- selected element remains the focus
- no hallucinated facts
- UI remains responsive

### Relationship test

Ask:

```text
How is this connected to the next artwork?
```

The answer should lead into the existing motif-travel flow.

---

# 19. Demo Mode

Add a deterministic demo mode.

The demo should have:

```text
DEMO MODE = true
```

When enabled:

- use precomputed CreativeDNA
- use precomputed story beats
- use precomputed relationship data
- allow Gemini conversation
- gracefully fall back to cached answers

This makes the hackathon demo reliable while still visibly demonstrating Gemini.

---

# 20. Demo Script

Target approximately 90 seconds.

### 0–10 sec

Show the Yakshagana artwork.

> "This is a human-made artwork. Let's step inside it."

### 10–25 sec

Start guided story.

> "Look at the performer."

Highlight face/costume.

### 25–40 sec

Explain costume/headgear.

Then:

> "But you can ask about anything you're looking at."

### 40–55 sec

Ask Gemini:

> "Why is this costume so elaborate?"

Show concise contextual answer.

### 55–65 sec

Ask:

> "Does this visual idea appear somewhere else?"

Gemini identifies the prepared relationship.

### 65–80 sec

Click:

**FOLLOW THIS ELEMENT**

Motif travels.

### 80–90 sec

Second artwork appears.

> "The artwork changed, but the creative idea travelled with it."

Then show provenance/evidence.

---

# 21. Acceptance Criteria

The upgrade is complete only if:

- [ ] Existing ARTSCAPE V2 flow still works.
- [ ] Yakshagana is the primary demo artwork.
- [ ] User can enter guided storytelling mode.
- [ ] Story beats focus attention on actual artwork elements.
- [ ] Story content is driven by structured data.
- [ ] User can select an element.
- [ ] User can ask a question about the selected element.
- [ ] Gemini receives sufficient artwork/CreativeDNA/evidence context.
- [ ] Gemini answers remain contextual.
- [ ] Answers do not fabricate cultural facts.
- [ ] Conversation can point to another visual element.
- [ ] Conversation can lead into motif-travel.
- [ ] Existing relationship navigation remains intact.
- [ ] Artwork remains visually dominant.
- [ ] No generic chatbot dashboard is introduced.
- [ ] API keys remain server-side.
- [ ] Gemini failures have cached/static fallbacks.
- [ ] Demo works deterministically without requiring live Gemini for every step.

---

# 22. Final Product Definition

ARTSCAPE V2 should now feel like:

> **An interactive visual storyteller for human-made art.**

Gemini does not replace the artwork.

Gemini helps the user notice:

```text
"What am I looking at?"
        ↓
"Why does it matter?"
        ↓
"What does it mean?"
        ↓
"Can I ask more?"
        ↓
"Where does this idea appear elsewhere?"
        ↓
"Who created that?"
```

The defining experience remains:

```text
ARTWORK
   ↓
UNDERSTAND
   ↓
ASK
   ↓
FOLLOW
   ↓
MOTIF TRAVELS
   ↓
ANOTHER HUMAN CREATOR
```

The chatbot is not the product.

**The conversation is a doorway deeper into the artwork.**
