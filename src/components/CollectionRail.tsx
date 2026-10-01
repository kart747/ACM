'use client';

import { useExperience } from '@/lib/experience-state';

interface Props {
  onSelectArtwork: (artworkId: string) => void;
  enabled: boolean;
}

/** A slim filmstrip under the artwork, so the collection never competes with it. */
export function CollectionRail({ onSelectArtwork, enabled }: Props) {
  const { artworks, state } = useExperience();

  return (
    <nav aria-label="Collection" className="ui-sans relative z-20 shrink-0 px-4 pb-3 md:px-8 md:pb-5">
      <ul className="m-0 flex list-none items-end justify-center gap-2 overflow-x-auto p-0 md:gap-3">
        {artworks.map((artwork) => {
          const isCurrent = artwork.id === state.currentArtworkId;
          const ratio = artwork.image.width / artwork.image.height;
          return (
            <li key={artwork.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelectArtwork(artwork.id)}
                disabled={!enabled}
                aria-current={isCurrent ? 'true' : undefined}
                aria-label={`${artwork.title} by ${artwork.creator.name}`}
                title={`${artwork.title} — ${artwork.creator.name}`}
                className={[
                  'block h-10 transition-all duration-300 md:h-12',
                  isCurrent
                    ? 'opacity-100 outline outline-2 outline-offset-2 outline-[#c9a227]'
                    : 'opacity-45 hover:opacity-90',
                  enabled ? 'cursor-pointer' : 'cursor-default',
                ].join(' ')}
                style={{
                  aspectRatio: `${ratio}`,
                  backgroundImage: `url(${artwork.image.src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
