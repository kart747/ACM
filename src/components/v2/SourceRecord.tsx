import { sourceRecordLabel, sourceRecordRef } from '@/lib/artwork-sources';
import type { ArtworkData } from './types';

export function SourceRecord({ artwork, read = false }: { artwork: ArtworkData; read?: boolean }) {
  const label = sourceRecordLabel(artwork);

  return /^https?:\/\//i.test(artwork.sourceUrl ?? '') ? (
    <a href={artwork.sourceUrl} target="_blank" rel="noopener noreferrer" title={artwork.source} data-source-ref={sourceRecordRef(artwork)} className="text-xs text-amber-300 underline hover:text-amber-200 break-words">
      {read ? `Read the ${label.toLowerCase()}` : label} ↗
    </a>
  ) : <span className="text-xs text-stone-400">{artwork.source}</span>;
}
