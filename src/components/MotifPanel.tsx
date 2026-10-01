'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { featuredStart } from '@/data/artworks';
import { findArtwork, findMotif, useExperience } from '@/lib/experience-state';
import { isJourneyComplete } from '@/lib/journey';
import { motifAspect, motifCropBackgroundStyle } from '@/lib/rect';
import type { Artwork, Motif, MotifConnection, RelationshipType } from '@/lib/types';
import { ClaimText, ProvenanceBadge, ProvenanceLegend } from './ProvenanceBadge';

export const RELATIONSHIP_LABEL: Record<RelationshipType, string> = {
  shared_motif: 'Shared motif',
  similar_technique: 'Similar technique',
  same_tradition: 'Same tradition',
  thematic_echo: 'Thematic echo',
};

const KIND_LABEL: Record<Motif['kind'], string> = {
  motif: 'Motif',
  figure: 'Figure',
  object: 'Object',
  inscription: 'Inscription',
};

const eyebrow = 'm-0 text-[10px] uppercase tracking-[0.18em] text-[#6a675f]';

interface Props {
  enabled: boolean;
  onTravel: () => void;
}

export function MotifPanel({ enabled, onTravel }: Props) {
  const { artwork, selectedMotif } = useExperience();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {selectedMotif ? (
        <motion.aside
          key={`${artwork.id}/${selectedMotif.id}`}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Motif detail"
          data-source={artwork.dataSource ?? 'curated'}
          className={panelClass}
        >
          <MotifDetail artwork={artwork} motif={selectedMotif} enabled={enabled} onTravel={onTravel} />
        </motion.aside>
      ) : (
        <motion.aside
          key={`idle/${artwork.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-label="Artwork and creator"
          className={panelClass}
        >
          <ArtworkOverview artwork={artwork} enabled={enabled} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

const panelClass =
  'ui-sans flex max-h-[48dvh] w-full shrink-0 flex-col border-t border-[#26262a] bg-[#0b0b0c] md:max-h-none md:w-[380px] md:border-l md:border-t-0';

function MotifDetail({
  artwork,
  motif,
  enabled,
  onTravel,
}: {
  artwork: Artwork;
  motif: Motif;
  enabled: boolean;
  onTravel: () => void;
}) {
  const { connection, connectionIndex, dispatch } = useExperience();
  const targetArtwork = connection ? findArtwork(connection.targetArtworkId) : null;
  const targetMotif = connection ? findMotif(connection.targetArtworkId, connection.targetMotifId) : null;
  const [lead, ...rest] = motif.observations;

  return (
    <>
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#1c1c1f] px-6 pb-4 pt-5">
        <div className="min-w-0">
          <p className={eyebrow}>{KIND_LABEL[motif.kind]}</p>
          <h2 className="mt-1.5 mb-0 text-[19px] leading-snug text-[#ece9e2]">{motif.label}</h2>
          <p className="mt-1 mb-0 truncate text-[11.5px] text-[#8a867d]">
            {artwork.title} · {artwork.creator.name}
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'clear-motif' })}
          disabled={!enabled}
          aria-label="Close motif detail"
          className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center text-[20px] leading-none text-[#6a675f] transition-colors hover:text-[#ece9e2] disabled:opacity-40"
        >
          &times;
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 px-6 py-5">
          <section className="flex flex-col gap-3">
            {lead && (
              <ClaimText claim={lead} className="m-0 text-[13.5px] leading-[1.65] text-[#c9c5bc]" />
            )}
            {rest.map((claim) => (
              <ClaimText
                key={claim.text}
                claim={claim}
                className="m-0 text-[12.5px] leading-[1.6] text-[#9a968d]"
              />
            ))}
          </section>

          {connection && targetArtwork && targetMotif ? (
            <RelationshipSection connection={connection} />
          ) : (
            <p className="m-0 border-t border-[#1c1c1f] pt-5 text-[12.5px] text-[#6a675f]">
              No documented connection from this detail yet.
            </p>
          )}

          {motif.connections.length > 1 && (
            <section className="border-t border-[#1c1c1f] pt-5">
              <p className={eyebrow}>This detail also connects to</p>
              <ul className="mt-3 mb-0 flex list-none flex-col gap-1.5 p-0">
                {motif.connections.map((c, index) => {
                  if (index === connectionIndex) return null;
                  const a = findArtwork(c.targetArtworkId);
                  const m = findMotif(c.targetArtworkId, c.targetMotifId);
                  if (!a || !m) return null;
                  return (
                    <li key={`${c.targetArtworkId}/${c.targetMotifId}`}>
                      <button
                        type="button"
                        disabled={!enabled}
                        onClick={() => dispatch({ type: 'choose-connection', index })}
                        className="w-full border border-[#26262a] px-3 py-2 text-left text-[12px] text-[#9a968d] transition-colors hover:border-[#3a3a3f] hover:text-[#ece9e2] disabled:opacity-40"
                      >
                        <span className="text-[#ece9e2]">{m.label}</span> · {a.creator.name}
                        <span className="block text-[10.5px] uppercase tracking-[0.14em] text-[#6a675f]">
                          {RELATIONSHIP_LABEL[c.relationshipType]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <CreatorCard artwork={artwork} />
          <Trail enabled={enabled} />
        </div>
      </div>

      {connection && targetArtwork && targetMotif && (
        <div className="shrink-0 border-t border-[#26262a] bg-[#0e0e10] px-6 py-4">
          <p className={eyebrow}>Travels to</p>
          <div className="mt-2.5 flex items-center gap-3">
            <MotifThumb artwork={targetArtwork} motif={targetMotif} />
            <span className="min-w-0">
              <span className="block truncate text-[13px] text-[#ece9e2]">{targetMotif.label}</span>
              <span className="mt-0.5 block truncate text-[11px] text-[#8a867d]">
                {targetArtwork.creator.name}, {targetArtwork.title}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={onTravel}
            disabled={!enabled}
            className={[
              'mt-3 flex w-full items-center justify-between gap-3 border px-4 py-3 text-left transition-colors',
              enabled
                ? 'border-[#c9a227]/70 bg-[#c9a227]/10 hover:border-[#c9a227] hover:bg-[#c9a227]/20'
                : 'cursor-not-allowed border-[#26262a] opacity-40',
            ].join(' ')}
          >
            <span className="text-[13.5px] text-[#ece9e2]">Explore this connection</span>
            <span aria-hidden className="text-[#c9a227]">
              &rarr;
            </span>
          </button>
        </div>
      )}
    </>
  );
}

function RelationshipSection({ connection }: { connection: MotifConnection }) {
  return (
    <section className="border-t border-[#1c1c1f] pt-5">
      <p className="m-0 text-[10px] uppercase tracking-[0.18em] text-[#c9a227]">
        {RELATIONSHIP_LABEL[connection.relationshipType]}
      </p>
      <ClaimText
        claim={connection.claim}
        showConfidence
        className="mt-2.5 mb-0 text-[14px] leading-[1.6] text-[#ece9e2]"
      />

      <dl className="mt-4 mb-0 flex flex-col gap-4">
        <div>
          <dt className={eyebrow}>What you can see in both</dt>
          <dd className="mt-1.5 mb-0 border-l border-[#3a3a3f] pl-3 text-[12.5px] leading-[1.6] text-[#9a968d]">
            {connection.visualEvidence}
          </dd>
        </div>
        <div>
          <dt className={eyebrow}>What this does not show</dt>
          <dd className="mt-1.5 mb-0 border-l border-[#3a3a3f] pl-3 text-[12.5px] leading-[1.6] text-[#9a968d]">
            {connection.caveat}
          </dd>
        </div>
        {connection.context && connection.context.length > 0 && (
          <div>
            <dt className={eyebrow}>Checked context</dt>
            {connection.context.map((claim) => (
              <dd key={claim.text} className="mt-1.5 mb-0 border-l border-[#3a3a3f] pl-3">
                <ClaimText claim={claim} className="m-0 text-[12.5px] leading-[1.6] text-[#9a968d]" />
              </dd>
            ))}
          </div>
        )}
      </dl>
    </section>
  );
}

/** Shows exactly the destination detail, at its own aspect ratio. */
function MotifThumb({ artwork, motif }: { artwork: Artwork; motif: Motif }) {
  const aspect = motifAspect(artwork, motif.rect);
  const maxW = 84;
  const maxH = 52;
  const width = Math.min(maxW, maxH * aspect);
  const height = width / aspect;

  return (
    <span className="flex h-[52px] w-[84px] shrink-0 items-center justify-center bg-[#050506]">
      <span
        aria-hidden
        className="block border border-[#3a3a3f]"
        style={{
          width,
          height,
          backgroundRepeat: 'no-repeat',
          ...motifCropBackgroundStyle(artwork, motif.rect),
        }}
      />
    </span>
  );
}

function CreatorCard({ artwork }: { artwork: Artwork }) {
  const { creator } = artwork;
  return (
    <section className="border-t border-[#1c1c1f] pt-5">
      <p className={eyebrow}>The creator</p>
      <h3 className="mt-2 mb-0 text-[17px] font-normal leading-snug text-[#ece9e2]">{creator.name}</h3>
      <p className="mt-1 mb-0 text-[12px] text-[#9a968d]">
        {creator.metBio}
        <ProvenanceBadge
          claim={{
            text: creator.metBio,
            sourceType: 'externally_verified',
            sourceDetail: `The Met collection record, object ${artwork.metObjectId} (artist bio)`,
          }}
        />
      </p>
      <ClaimText claim={creator.summary} className="mt-3 mb-0 text-[12.5px] leading-[1.6] text-[#9a968d]" />
      {artwork.creativeDna && <TechniqueAndTradition dna={artwork.creativeDna} />}
      <ArtworkFacts artwork={artwork} />
    </section>
  );
}

/** CreativeDNA technique and tradition (spec §16), shown only when Gemini data exists. */
function TechniqueAndTradition({ dna }: { dna: NonNullable<Artwork['creativeDna']> }) {
  return (
    <div className="mt-4">
      <p className={eyebrow}>Technique &amp; tradition</p>
      <ul className="mt-2 mb-0 flex list-none flex-col gap-2 p-0">
        {[...dna.techniques, dna.tradition].map((item) => (
          <li key={item.name} className="text-[12px] leading-[1.6] text-[#9a968d]">
            <span className="text-[#c9c5bc]">{item.name}.</span> {item.text}
            <ProvenanceBadge claim={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArtworkFacts({ artwork }: { artwork: Artwork }) {
  return (
    <div className="mt-4 text-[11.5px] leading-[1.6] text-[#6a675f]">
      <p className="m-0">
        <span className="text-[#9a968d]">{artwork.title}</span>, {artwork.date}. {artwork.medium}.{' '}
        {artwork.dimensions}. {artwork.credit}, {artwork.accessionNumber}.
        <ProvenanceBadge
          claim={{
            text: 'Object record',
            sourceType: 'externally_verified',
            sourceDetail: `The Met collection record, object ${artwork.metObjectId}. Image: Open Access, public domain (CC0).`,
          }}
        />
      </p>
      <a
        href={artwork.metUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-[#9a968d] underline underline-offset-4 hover:text-[#ece9e2]"
      >
        View the record at The Met
      </a>
    </div>
  );
}

function ArtworkOverview({ artwork, enabled }: { artwork: Artwork; enabled: boolean }) {
  const { state, dispatch } = useExperience();
  const isStart = artwork.id === featuredStart.artworkId && state.trail.length === 0;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex flex-col gap-6 px-6 py-5">
        <section>
          <p className={eyebrow}>Now viewing</p>
          <h2 className="mt-2 mb-0 text-[20px] leading-snug text-[#ece9e2]">{artwork.title}</h2>
          <p className="mt-1.5 mb-0 text-[12.5px] text-[#9a968d]">
            {artwork.creator.name}, {artwork.date}
          </p>
        </section>

        <section>
          <p className={eyebrow}>Details in this work</p>
          <p className="mt-2 mb-0 text-[12px] leading-[1.6] text-[#8a867d]">
            Select a marked detail on the artwork, or choose one here, to see what it is and where it leads.
          </p>
          <ul className="mt-3 mb-0 flex list-none flex-col gap-1.5 p-0">
            {artwork.motifs.map((motif) => {
              const featured = isStart && motif.id === featuredStart.motifId;
              return (
                <li key={motif.id}>
                  <button
                    type="button"
                    disabled={!enabled}
                    onClick={() => dispatch({ type: 'select-motif', motifId: motif.id })}
                    className={[
                      'flex w-full items-center justify-between gap-3 border px-3 py-2.5 text-left text-[13px] transition-colors disabled:opacity-40',
                      featured
                        ? 'border-[#c9a227]/70 bg-[#c9a227]/10 text-[#ece9e2] hover:bg-[#c9a227]/20'
                        : 'border-[#26262a] text-[#c9c5bc] hover:border-[#3a3a3f] hover:text-[#ece9e2]',
                    ].join(' ')}
                  >
                    <span>
                      {motif.label}
                      {featured && (
                        <span className="mt-0.5 block text-[10.5px] uppercase tracking-[0.14em] text-[#c9a227]">
                          Start the journey here
                        </span>
                      )}
                    </span>
                    <span aria-hidden className="text-[#6a675f]">
                      &rarr;
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <CreatorCard artwork={artwork} />

        <section className="border-t border-[#1c1c1f] pt-5">
          <p className={eyebrow}>How to read the labels</p>
          <div className="mt-3">
            <ProvenanceLegend />
          </div>
        </section>

        <Trail enabled={enabled} />
      </div>
    </div>
  );
}

function Trail({ enabled }: { enabled: boolean }) {
  const { state, artworks, dispatch } = useExperience();
  if (state.trail.length === 0) return null;

  const complete = isJourneyComplete(state.trail, artworks);

  const recent = [...state.trail].reverse().slice(0, 5);

  return (
    <section className="border-t border-[#1c1c1f] pt-5">
      <p className={eyebrow}>Where you have been</p>
      <ol className="mt-3 mb-0 flex list-none flex-col gap-1.5 p-0">
        {recent.map((step, index) => {
          const from = findArtwork(step.fromArtworkId);
          const fromMotif = findMotif(step.fromArtworkId, step.fromMotifId);
          const to = findArtwork(step.toArtworkId);
          if (!from || !to || !fromMotif) return null;
          return (
            <li key={`${state.trail.length - index}`}>
              <button
                type="button"
                disabled={!enabled}
                onClick={() =>
                  dispatch({ type: 'visit', artworkId: step.fromArtworkId, motifId: step.fromMotifId })
                }
                className="w-full text-left text-[11.5px] leading-relaxed text-[#6a675f] transition-colors hover:text-[#ece9e2] disabled:opacity-40"
                title={`Return to ${fromMotif.label} in ${from.title}`}
              >
                <span className="text-[#9a968d]">{from.creator.name}</span> → {to.creator.name}
                <span className="block text-[10.5px] text-[#55524b]">Return to {fromMotif.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {complete && (
        <button
          type="button"
          disabled={!enabled}
          onClick={() => dispatch({ type: 'open-path' })}
          className="mt-3 flex w-full items-center justify-between gap-3 border border-[#26262a] px-3 py-2 text-left text-[12px] text-[#c9c5bc] transition-colors hover:border-[#c9a227]/70 hover:text-[#ece9e2] disabled:opacity-40"
        >
          See your whole path
          <span aria-hidden className="text-[#c9a227]">
            &rarr;
          </span>
        </button>
      )}
    </section>
  );
}
