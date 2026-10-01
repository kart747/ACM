import type { Artwork, Claim, Motif, NamedClaim } from '@/lib/types';
import type { CreativeDna, CreativeDnaElement, CreativeDnaRelationship } from './schema';
import { contextFromArtworks, validateCreativeDna } from './validate';

/**
 * Puts validated Gemini output underneath the existing UI.
 *
 * The curated collection is the base and the fallback. For every artwork with
 * a valid CreativeDNA document, the AI-interpretation text is replaced
 * item by item; anything Gemini did not produce, or the validator rejected,
 * keeps its curated text. Met-record facts are never replaced: they are not
 * interpretations.
 */

export interface MergeReport {
  artworkId: string;
  dataSource: 'gemini' | 'curated';
  replacedElements: number;
  replacedRelationships: number;
  errors: string[];
  warnings: string[];
}

export function applyCreativeDna(
  curated: Artwork[],
  generated: unknown[],
): { artworks: Artwork[]; report: MergeReport[] } {
  const ctx = contextFromArtworks(curated);
  const report: MergeReport[] = [];

  const valid = new Map<string, CreativeDna>();
  const rejected = new Map<string, string[]>();
  for (const doc of generated) {
    const result = validateCreativeDna(doc, ctx);
    const id = (doc as { artwork?: { id?: unknown } })?.artwork?.id;
    const key = typeof id === 'string' ? id : '(unknown)';
    if (result.ok && result.dna) valid.set(key, result.dna);
    else rejected.set(key, result.errors);
  }

  const artworks = curated.map((artwork) => {
    const dna = valid.get(artwork.id);
    if (!dna) {
      report.push({
        artworkId: artwork.id,
        dataSource: 'curated',
        replacedElements: 0,
        replacedRelationships: 0,
        errors: rejected.get(artwork.id) ?? [],
        warnings: [],
      });
      return markCurated(artwork);
    }

    const model = dna.generation?.model ?? 'unknown model';
    const generatedAt = dna.generation?.generated_at ?? 'unknown date';
    const stamp = `Gemini (${model}), generated ${generatedAt.slice(0, 10)}, passed ARTSCAPE validation`;
    let replacedElements = 0;
    let replacedRelationships = 0;

    const motifs: Motif[] = artwork.motifs.map((motif) => {
      const element = dna.elements.find((e) => e.id === motif.id);
      const observations = element
        ? (replacedElements++, replaceInterpretation(motif.observations, elementClaim(element, stamp)))
        : motif.observations.map(curatedClaim);

      const connections = motif.connections.map((c) => {
        const rel = dna.relationships.find(
          (r) =>
            r.source_element_id === motif.id &&
            r.target_artwork_id === c.targetArtworkId &&
            r.target_element_id === c.targetMotifId,
        );
        const context = c.context?.map(curatedClaim);
        if (!rel) return { ...c, claim: curatedClaim(c.claim), context };
        replacedRelationships++;
        return {
          ...c,
          claim: relationshipClaim(rel, stamp),
          visualEvidence: rel.evidence ?? c.visualEvidence,
          caveat: rel.caveat ?? c.caveat,
          context,
        };
      });

      return { ...motif, observations, connections };
    });

    report.push({
      artworkId: artwork.id,
      dataSource: 'gemini',
      replacedElements,
      replacedRelationships,
      errors: [],
      warnings: dna.generation?.notes ?? [],
    });

    return {
      ...markCurated(artwork),
      motifs,
      dataSource: 'gemini' as const,
      creativeDna: {
        model,
        generatedAt,
        techniques: dna.techniques.map((t) => namedClaim(t, artwork, stamp)),
        tradition: namedClaim(dna.tradition, artwork, stamp),
      },
    };
  });

  return { artworks, report };
}

function curatedClaim(claim: Claim): Claim {
  return { ...claim, origin: claim.origin ?? 'curated' };
}

function markCurated(artwork: Artwork): Artwork {
  return {
    ...artwork,
    dataSource: 'curated',
    creator: { ...artwork.creator, summary: curatedClaim(artwork.creator.summary) },
    motifs: artwork.motifs.map((m) => ({
      ...m,
      observations: m.observations.map(curatedClaim),
      connections: m.connections.map((c) => ({
        ...c,
        claim: curatedClaim(c.claim),
        context: c.context?.map(curatedClaim),
      })),
    })),
  };
}

/** Swap the curated AI interpretation for Gemini's, keeping Met-record claims in place. */
function replaceInterpretation(observations: Claim[], generated: Claim): Claim[] {
  const out: Claim[] = [];
  let inserted = false;
  for (const claim of observations) {
    if (claim.sourceType === 'ai_inferred') {
      if (!inserted) out.push(generated);
      inserted = true;
    } else {
      out.push(curatedClaim(claim));
    }
  }
  if (!inserted) out.push(generated);
  return out;
}

function elementClaim(el: CreativeDnaElement, stamp: string): Claim {
  return {
    text: el.meaning,
    sourceType: el.source_type,
    sourceDetail: `${el.source_detail}. ${stamp}.`,
    origin: 'gemini',
  };
}

function relationshipClaim(rel: CreativeDnaRelationship, stamp: string): Claim {
  return {
    text: rel.explanation,
    sourceType: rel.source_type,
    sourceDetail: `Gemini comparison of both images and their museum records; the relationship type was approved by a human curator. ${stamp}.`,
    confidence: rel.confidence,
    agreement: rel.agreement && { agreeing: rel.agreement.agreeing, runs: rel.agreement.runs },
    origin: 'gemini',
  };
}

function namedClaim(
  item: { name: string; description: string; source_type: Claim['sourceType'] },
  artwork: Artwork,
  stamp: string,
): NamedClaim {
  return {
    name: item.name,
    text: item.description,
    sourceType: item.source_type,
    sourceDetail:
      item.source_type === 'externally_verified'
        ? `Named in The Met collection record, object ${artwork.metObjectId}; wording by ${stamp}.`
        : `${stamp}.`,
    origin: 'gemini',
  };
}
