/**
 * npm run generate:artscape -- [--only=great-wave,gulf-stream]
 *     [--relationships=none | source-motif:target-artwork/target-motif,…]
 *     [--estimate] [--max-requests=10] [--keys=key-default,key-1] [--overwrite]
 *     [--dry-run] [--list-models]
 *
 * Legacy generation is disabled; use the artwork story endpoint for live AI.
 * Only --estimate is available. The retained pipeline uses curated fallbacks
 * for artworks without valid documents in src/data/generated/.
 *
 * Quota safety (free-tier keys allow few requests per day):
 *   --estimate       print the request count for the selection and exit; no API call, no key needed
 *   --max-requests   hard cap on HTTP requests this run (default 10); the run refuses to start
 *                    if even the minimum estimate exceeds it, and stops sending once it is reached
 *   --relationships  run Prompt C (×AGREEMENT_RUNS each) only for these; `none` skips Prompt C
 *   --keys           use only these key slots, in the given order
 *   --overwrite      regenerate artworks that already have a stored document (skipped otherwise)
 *   cache            successful responses are kept in .artscape-cache/ (gitignored), so rerunning the
 *                    same command continues where a quota-limited run stopped; hits cost no request
 * --dry-run and --list-models are disabled without reading keys or sending requests.
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { curatedArtworks } from '@/data/artworks';
import { CreativeDnaSchema, type CreativeDna } from '@/lib/creative-dna/schema';
import {
  createGeminiCall,
  GeminiUnavailableError,
  LEGACY_GENERATION_DISABLED_MESSAGE,
  readGeminiConfig,
} from '@/lib/gemini/client';
import { formatAgreement } from '@/lib/gemini/agreement';
import { withCache } from '@/lib/gemini/cache';
import { estimateRequests, runPipeline } from '@/lib/gemini/generate';
import { AGREEMENT_RUNS } from '@/lib/creative-dna/schema';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'src/data/generated');
const CACHE_DIR = path.join(ROOT, '.artscape-cache');

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : 'true';
}

async function readExisting(): Promise<CreativeDna[]> {
  const files = (await readdir(OUT_DIR).catch(() => [])).filter((f) => f.endsWith('.json') && f !== 'last-run.json');
  const docs: CreativeDna[] = [];
  for (const f of files) {
    const parsed = CreativeDnaSchema.safeParse(JSON.parse(await readFile(path.join(OUT_DIR, f), 'utf8')));
    if (parsed.success) docs.push(parsed.data);
  }
  return docs;
}

/** Rewrite index.ts so the app imports every stored document. */
async function writeIndex() {
  const files = (await readdir(OUT_DIR))
    .filter((f) => f.endsWith('.json') && f !== 'last-run.json')
    .sort();
  const names = files.map((f, i) => ({ file: f, ident: `dna${i}` }));
  const body = [
    '// Written by `npm run generate:artscape`. Do not edit by hand.',
    '// Each entry is a CreativeDNA document; the collection loader re-validates it.',
    ...names.map((n) => `import ${n.ident} from './${n.file}';`),
    '',
    `export const generatedCreativeDna: unknown[] = [${names.map((n) => n.ident).join(', ')}];`,
    '',
  ].join('\n');
  await writeFile(path.join(OUT_DIR, 'index.ts'), body);
}

function loadConfig(): ReturnType<typeof readGeminiConfig> {
  try {
    return readGeminiConfig();
  } catch (error) {
    if (error instanceof GeminiUnavailableError) {
      console.error(`✗ ${error.message}\n  Nothing was changed. The app keeps using its curated data.`);
      process.exit(2);
    }
    throw error;
  }
}

function list(name: string): string[] | undefined {
  return arg(name)?.split(',').map((s) => s.trim()).filter(Boolean);
}

async function main() {
  if (arg('list-models') || !arg('estimate')) {
    throw new GeminiUnavailableError(LEGACY_GENERATION_DISABLED_MESSAGE);
  }

  // ---- selection and request estimate: no key or network needed ----
  let only = list('only');
  const unknown = only?.filter((id) => !curatedArtworks.some((a) => a.id === id)) ?? [];
  if (unknown.length) {
    console.error(`✗ Unknown artwork id(s): ${unknown.join(', ')}`);
    process.exit(2);
  }
  const relArg = list('relationships');
  const relationships = relArg?.length === 1 && relArg[0] === 'none' ? [] : relArg;
  if (relationships?.length) {
    const known = estimateRequests({ collection: curatedArtworks, only }).relationships;
    const bad = relationships.filter((id) => !known.includes(id));
    if (bad.length) {
      console.error(`✗ Unknown relationship id(s) for the selected artworks: ${bad.join(', ')}\n  Known: ${known.join(', ')}`);
      process.exit(2);
    }
  }
  const stored = new Set(
    (await readdir(OUT_DIR).catch(() => []))
      .filter((f) => f.endsWith('.json') && f !== 'last-run.json')
      .map((f) => f.replace(/\.json$/, '')),
  );
  if (arg('overwrite') !== 'true') {
    const skipped = (only ?? curatedArtworks.map((a) => a.id)).filter((id) => stored.has(id));
    if (skipped.length) {
      console.log(`Skipping ${skipped.join(', ')}: already generated (pass --overwrite to regenerate)`);
      only = (only ?? curatedArtworks.map((a) => a.id)).filter((id) => !stored.has(id));
    }
  }
  const estimate = estimateRequests({ collection: curatedArtworks, only, relationships });
  const budget = Number(arg('max-requests') ?? 10);
  console.log(
    `Gemini requests for ${estimate.artworks.length} artwork(s) [${estimate.artworks.join(', ')}] and ${estimate.relationships.length} relationship(s) ×${AGREEMENT_RUNS} runs:` +
      ` min ${estimate.min}, typical ${estimate.typical}, max ${estimate.max} · budget ${budget}`,
  );
  if (arg('estimate')) {
    for (const id of estimate.relationships) console.log(`  relationship ${id}`);
    return;
  }
  if (!estimate.artworks.length) {
    console.log('Nothing to generate; no request sent.');
    return;
  }
  if (!Number.isInteger(budget) || budget < estimate.min) {
    console.error(`✗ Even the minimum (${estimate.min}) exceeds --max-requests=${arg('max-requests') ?? 10}. Nothing sent.`);
    process.exit(2);
  }

  let config = loadConfig();
  const keyLabels = list('keys');
  if (keyLabels) {
    const keys = keyLabels.map((l) => config.keys.find((k) => k.label === l));
    if (keys.some((k) => !k)) {
      console.error(`✗ --keys must name configured slots: ${config.keys.map((k) => k.label).join(', ')}`);
      process.exit(2);
    }
    config = { ...config, keys: keys as typeof config.keys, apiKey: keys[0]!.apiKey };
  }
  const model = arg('model') ?? config.model;
  const dryRun = arg('dry-run') === 'true';

  console.log(`ARTSCAPE generation · model ${model}${only ? ` · only ${only.join(', ')}` : ''}${dryRun ? ' · dry run' : ''}`);
  console.log(`Gemini keys: ${config.keys.map((k) => k.label).join(', ')} · starting with ${config.keys[0].label}`);
  const sent: string[] = [];
  const { call, stats: cache } = withCache(
    createGeminiCall(config.keys, model, {
      log: (line) => console.log(`  · ${line}`),
      beforeRequest: (slot) => {
        if (sent.length >= budget) throw new Error(`request budget of ${budget} reached; not sent`);
        sent.push(slot);
      },
    }),
    model,
    CACHE_DIR,
  );
  const result = await runPipeline({
    call,
    model,
    collection: curatedArtworks,
    only,
    relationships,
    existing: await readExisting(),
    loadImage: async (a) => ({
      mimeType: 'image/jpeg',
      data: (await readFile(path.join(ROOT, 'public', a.image.src))).toString('base64'),
    }),
    log: (line) => console.log(`  · ${line}`),
  });

  if (!dryRun) {
    await mkdir(OUT_DIR, { recursive: true });
    for (const doc of result.accepted) {
      await writeFile(path.join(OUT_DIR, `${doc.artwork.id}.json`), `${JSON.stringify(doc, null, 2)}\n`);
    }
    await writeIndex();
    await writeFile(
      path.join(OUT_DIR, 'last-run.json'),
      `${JSON.stringify({ model, at: new Date().toISOString(), requests: sent.length, cache, only, relationships, accepted: result.accepted.map((d) => d.artwork.id), failures: result.failures, notes: result.notes }, null, 2)}\n`,
    );
  }

  const perKey = [...new Set(sent)].map((k) => `${k} ×${sent.filter((s) => s === k).length}`).join(', ');
  console.log(`\nGemini network requests sent: ${sent.length}${perKey ? ` (${perKey})` : ''} of budget ${budget}`);
  console.log(`Cache (${path.relative(ROOT, CACHE_DIR)}): ${cache.hits} hit(s) served without a request, ${cache.misses} miss(es)`);
  console.log('\nResult');
  for (const doc of result.accepted) {
    console.log(
      `  ✓ ${doc.artwork.id}: ${doc.elements.length} elements, ${doc.techniques.length} techniques, ${doc.relationships.length} relationships${dryRun ? ' (not written)' : ''}`,
    );
    for (const r of doc.relationships) {
      console.log(`      ${r.source_element_id} → ${r.target_artwork_id}/${r.target_element_id}: ${formatAgreement(r.agreement!)}`);
    }
  }
  for (const f of result.failures) console.log(`  ✗ ${f.artworkId} [${f.stage}] ${f.message} — curated data stays in use`);
  for (const [id, lines] of Object.entries(result.notes)) {
    for (const line of lines) console.log(`  ! ${id}: ${line}`);
  }
  if (result.failures.length) process.exit(1);
}

main().catch((error) => {
  console.error(`✗ Generation failed: ${(error as Error).message}\n  Stored data was not changed for failed artworks.`);
  process.exit(1);
});
