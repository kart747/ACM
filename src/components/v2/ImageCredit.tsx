import type { ImageCredit as ImageCreditData } from '@/lib/artwork-sources';

interface ImageCreditProps {
  credit?: ImageCreditData;
  photograph?: boolean;
  compact?: boolean;
}

export function ImageCredit({ credit, photograph = false, compact = false }: ImageCreditProps) {
  if (!credit) return null;

  const attribution = `${credit.title} — ${credit.creator}. ${credit.license}${credit.changes ? `. Modifications: ${credit.changes}` : ''}`;
  const linkClass = 'text-amber-300 underline hover:text-amber-200';

  if (compact) {
    return (
      <span className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-stone-400">
        <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer" title={attribution} aria-label={`${photograph ? 'Photo' : 'Image'} credit: ${attribution}`} className={linkClass}>{photograph ? 'Photo credit' : 'Image credit'} ↗</a>
        <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" aria-label={`Image licence: ${credit.license}`} className={linkClass}>{credit.license} ↗</a>
      </span>
    );
  }

  return (
    <div className="space-y-1 text-xs leading-relaxed text-stone-400 break-words">
      <p><span className="text-stone-300">{photograph ? 'Photograph' : 'Image'}:</span> {credit.title}</p>
      <p><span className="text-stone-300">{photograph ? 'Photographer' : 'Creator'}:</span> {credit.creator}</p>
      <p className="flex flex-wrap gap-x-3 gap-y-1">
        <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>Image source ↗</a>
        <span>Licence: <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>{credit.license} ↗</a></span>
      </p>
      {credit.changes && <p>Modifications: {credit.changes}</p>}
    </div>
  );
}
