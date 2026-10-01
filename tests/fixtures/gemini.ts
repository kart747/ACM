import { curatedArtworks } from '@/data/artworks';
import type { CreativeDna } from '@/lib/creative-dna/schema';
import type { ModelCall, ModelRequest } from '@/lib/gemini/client';
import type { Artwork } from '@/lib/types';

/**
 * Deterministic stand-ins for Gemini responses. Text is marked "FIXTURE" so a
 * test can never mistake it for real model output.
 */

export const artwork = (id: string): Artwork => {
  const a = curatedArtworks.find((x) => x.id === id);
  if (!a) throw new Error(`no artwork ${id}`);
  return a;
};

const centre = (a: Artwork, motifId: string) => {
  const r = a.motifs.find((m) => m.id === motifId)!.rect;
  return { x: (r.x + r.w / 2) / 100, y: (r.y + r.h / 2) / 100 };
};

export function elementsResponse(a: Artwork) {
  return {
    elements: a.motifs.map((m) => ({
      id: m.id,
      name: m.label.replace(/^The /, ''),
      type: 'motif' as const,
      location: centre(a, m.id),
      meaning: `FIXTURE reading of ${m.label}: it appears to be clearly visible in the marked region.`,
      source_type: 'ai_inferred' as const,
      source_detail: 'Visual reading of the image',
    })),
  };
}

export function techniqueResponse(a: Artwork) {
  return {
    techniques: [
      {
        name: a.medium.split(';')[0],
        description: `FIXTURE: the surface appears consistent with ${a.medium.toLowerCase()}.`,
        source_type: 'externally_verified' as const,
      },
    ],
    tradition: {
      name: a.creator.metBio.split(',')[0],
      description: 'FIXTURE: the record gives the artist’s nationality.',
      source_type: 'externally_verified' as const,
    },
  };
}

export function relationshipResponse(source: string, target: string) {
  return {
    supported: true,
    explanation: `FIXTURE: ${source} and ${target} appear to share a visible idea worth comparing.`,
    evidence: `FIXTURE: both images show the named details.`,
    caveat: 'FIXTURE: this does not show that either artist knew the other’s work.',
    confidence: 0.72,
  };
}

/** A complete, valid CreativeDNA document for one curated artwork. */
export function fixtureDna(id: string): CreativeDna {
  const a = artwork(id);
  const tb = techniqueResponse(a);
  return {
    artwork: {
      id: a.id,
      title: a.title,
      artist: a.creator.name,
      region_or_tradition: tb.tradition.name,
      image_url: a.image.src,
    },
    elements: elementsResponse(a).elements,
    techniques: tb.techniques,
    tradition: tb.tradition,
    relationships: a.motifs.flatMap((m) =>
      m.connections.map((c) => ({
        target_artwork_id: c.targetArtworkId,
        relationship_type: c.relationshipType,
        source_type: 'ai_inferred' as const,
        source_element_id: m.id,
        target_element_id: c.targetMotifId,
        ...(({ supported: _s, ...rest }) => rest)(relationshipResponse(m.id, c.targetMotifId)),
        agreement: { runs: 5, agreeing: 5, failed: 0 },
      })),
    ),
    generation: {
      model: 'fixture-model',
      generated_at: '2026-09-30T12:00:00.000Z',
      prompt_versions: { A: 'test' },
      notes: [],
    },
  };
}

/** Default Prompt H answer: a cautious rewrite for every item it was sent. */
export function hedgingResponse(request: ModelRequest) {
  const text = (request.parts.at(-1) as { text: string }).text;
  const items = JSON.parse(text.slice(text.indexOf('ITEMS:') + 6, text.lastIndexOf('\n\nReturn'))) as { ref: string }[];
  return {
    rewrites: items.map((i) => ({
      ref: i.ref,
      action: 'rewrite' as const,
      text: 'FIXTURE: the two details may suggest a comparison worth making.',
      reason: 'FIXTURE rewrite',
    })),
  };
}

/** Parse the stage, ids and agreement run number out of a request label (see generate.ts). */
export function parseLabel(label: string) {
  const [stage, rest] = [label[0], label.slice(2)];
  if (stage === 'C') {
    const m = rest.match(/^([\w-]+)\/([\w-]+) → ([\w-]+)\/([\w-]+)(?: \(run (\d+)\/\d+\))?$/)!;
    return { stage, source: m[2], target: m[4], run: m[5] ? Number(m[5]) : undefined };
  }
  return { stage, artworkId: rest };
}

export interface MockOptions {
  /** Override the raw text returned for a label (checked first). */
  override?: (request: ModelRequest, attempt: number) => string | undefined;
}

/** A ModelCall that answers every prompt with valid fixture JSON. Records every call. */
export function mockGemini(opts: MockOptions = {}): ModelCall & { calls: ModelRequest[] } {
  const calls: ModelRequest[] = [];
  const attempts = new Map<string, number>();
  const call = (async (request: ModelRequest) => {
    calls.push(request);
    const attempt = (attempts.get(request.label) ?? 0) + 1;
    attempts.set(request.label, attempt);
    const overridden = opts.override?.(request, attempt);
    if (overridden !== undefined) return overridden;

    const l = parseLabel(request.label);
    switch (l.stage) {
      case 'A':
        return JSON.stringify(elementsResponse(artwork(l.artworkId!)));
      case 'B':
        return JSON.stringify(techniqueResponse(artwork(l.artworkId!)));
      case 'C':
        return JSON.stringify(relationshipResponse(l.source!, l.target!));
      case 'D':
        return JSON.stringify({ issues: [] });
      case 'H':
        return JSON.stringify(hedgingResponse(request));
      default:
        throw new Error(`unexpected label ${request.label}`);
    }
  }) as ModelCall & { calls: ModelRequest[] };
  call.calls = calls;
  return call;
}

export const fakeImage = async () => ({ mimeType: 'image/jpeg', data: 'AAAA' });
