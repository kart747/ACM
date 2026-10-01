import { applyCreativeDna } from '@/lib/creative-dna/merge';
import { curatedArtworks } from './artworks';
import { generatedCreativeDna } from './generated';

/**
 * The collection the app renders: curated artworks with validated Gemini
 * CreativeDNA applied on top. Without generated data, or where it fails
 * validation, the curated content is used unchanged.
 */
const merged = applyCreativeDna(curatedArtworks, generatedCreativeDna);

export const artworks = merged.artworks;
export const collectionReport = merged.report;
