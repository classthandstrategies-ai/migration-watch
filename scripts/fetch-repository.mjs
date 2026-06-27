/**
 * fetch-repository.mjs
 * --------------------------------------------------------------------------
 * Downloads a curated, diverse set of REAL animal-tracking data packages from
 * the Movebank Data Repository (datarepository.movebank.org) — a public,
 * peer-reviewed archive where every package is openly licensed (CC0 / CC BY).
 *
 * For each target it:
 *   1. finds the data package (by pinned UUID or a search query),
 *   2. reads its standardised metadata (title, taxon, licence, DOI, citation),
 *   3. downloads the location CSV (GPS or Argos), preferring the richest file
 *      under a size cap,
 *   4. parses the standard Movebank columns and groups fixes per individual,
 *   5. writes scripts/raw/repo_<id>.json in the same shape as the public-API
 *      dumps, with a `meta` block carrying the real attribution.
 *
 * Nothing is fabricated: coordinates and timestamps are passed through verbatim
 * (build-dataset.mjs later downsamples for rendering). Re-run: npm run fetch:data
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = resolve(__dirname, 'raw');
const API = 'https://datarepository.movebank.org/server/api';
const MAX_BYTES = 35 * 1024 * 1024; // skip location files larger than this

/**
 * Curated targets. Each is a genuinely migratory species, chosen for taxonomic
 * and geographic diversity. `uuid` pins an exact package; otherwise `query`
 * (+ optional `match` substring) selects one. `region`/`blurb` are hand-written
 * for presentation; all factual attribution comes from the package metadata.
 */
const TARGETS = [
  {
    id: 'green_turtle',
    uuid: 'df53968d-4bcc-4dd7-9bb6-8358378836ec',
    common: 'Green Sea Turtle',
    region: 'Chagos Archipelago, western Indian Ocean',
    blurb:
      'Green turtles tagged at remote Indian Ocean nesting beaches, tracked by satellite as they swim hundreds of kilometres to distant foraging grounds.',
  },
  {
    id: 'blue_whale',
    uuid: 'b7853a1e-43fc-483d-906a-6991ec676413',
    common: 'Blue Whale',
    region: 'Eastern North Pacific',
    blurb:
      'The largest animal that has ever lived, satellite-tagged off California as it ranges the eastern Pacific between feeding and breeding areas.',
  },
  {
    id: 'osprey',
    query: 'Osprey',
    match: 'osprey',
    common: 'Osprey',
    region: 'North ↔ South America',
    blurb:
      'A fish-eating raptor that migrates each autumn from North American breeding grounds to Central and South America, recorded fix by fix.',
  },
  {
    id: 'cuckoo',
    query: 'cuckoo',
    match: 'cuckoo',
    common: 'Cuckoo',
    region: 'Sub-Saharan Africa',
    blurb:
      'Famous brood parasite and long-haul migrant; satellite tags revealed its previously mysterious intra-African and Afro-Palaearctic routes.',
  },
  {
    id: 'godwit',
    query: 'godwit',
    match: 'godwit',
    common: 'Black-tailed Godwit',
    region: 'Europe ↔ West Africa flyway',
    blurb:
      'A long-billed shorebird whose populations undertake demanding flyway migrations between European wetlands and African wintering sites.',
  },
  {
    id: 'vulture',
    query: 'Turkey vulture',
    match: 'vulture',
    common: 'Turkey Vulture',
    region: 'The Americas',
    blurb:
      'A soaring scavenger that rides thermals on some of the longest raptor migrations in the Americas, between North and South America.',
  },
  {
    id: 'goose',
    query: 'white-fronted goose',
    match: 'goose',
    common: 'White-fronted Goose',
    region: 'Arctic ↔ temperate Eurasia',
    blurb:
      'A high-latitude waterfowl that migrates in flocks between Arctic breeding tundra and temperate wintering grounds along major flyways.',
  },
  {
    id: 'gull',
    query: 'lesser black-backed gull',
    match: 'gull',
    common: 'Lesser Black-backed Gull',
    region: 'NW Europe ↔ Africa',
    blurb:
      'A versatile seabird increasingly tracked to understand its shifting migrations between northern Europe and African and Iberian coasts.',
  },
  {
    id: 'eagle',
    query: 'eagle',
    match: 'eagle',
    common: 'Eagle',
    region: 'Migratory raptor range',
    blurb:
      'A large raptor whose seasonal movements between breeding and wintering ranges are revealed in detail by GPS telemetry.',
  },
  {
    id: 'caribou',
    query: 'caribou',
    match: 'caribou',
    common: 'Caribou',
    region: 'North American Arctic / boreal',
    blurb:
      'Caribou undertake some of the longest land migrations on Earth, moving between calving grounds and wintering ranges across the north.',
  },
  {
    id: 'bar_headed_goose',
    query: 'bar-headed goose',
    match: 'goose',
    common: 'Bar-headed Goose',
    region: 'Central / South Asia',
    blurb:
      'Renowned for migrating over the Himalaya at extreme altitude between Central Asian breeding lakes and South Asian wintering grounds.',
  },
  {
    id: 'stork_black',
    query: 'black stork',
    match: 'stork',
    common: 'Black Stork',
    region: 'Europe ↔ Africa',
    blurb:
      'A shy forest stork that migrates between European breeding forests and African wintering grounds along eastern and western flyways.',
  },
];

// --- helpers ---------------------------------------------------------------

async function getJSON(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

// Return an ordered list of candidate package UUIDs to try (first match wins,
// but we fall through to later candidates if a package has no usable CSV).
async function resolveCandidates(t) {
  if (t.uuid) return [t.uuid];
  const url = `${API}/discover/search/objects?f.entityType=Datapackage,equals&size=20&query=${encodeURIComponent(
    t.query
  )}`;
  const d = await getJSON(url);
  let objs = (d._embedded?.searchResult?._embedded?.objects || []).map(
    (o) => o._embedded.indexableObject
  );
  if (t.match) {
    const m = t.match.toLowerCase();
    const hit = objs.filter((o) => (o.name || '').toLowerCase().includes(m));
    objs = hit.length ? hit : objs;
  }
  return objs.map((o) => o.uuid);
}

const mv = (md, k) => md?.[k]?.[0]?.value;

// Minimal CSV line splitter that respects double-quoted fields.
function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

// Movebank repository timestamps are UTC like "2014-05-18 13:00:00.000".
function parseTs(s) {
  const t = Date.parse(s.replace(' ', 'T') + 'Z');
  return Number.isFinite(t) ? t : null;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/);
  const header = splitCsvLine(lines[0]);
  const idx = (name) => header.indexOf(name);
  const iTs = idx('timestamp');
  const iLon = idx('location-long');
  const iLat = idx('location-lat');
  const iId = idx('individual-local-identifier');
  const iTax = idx('individual-taxon-canonical-name');
  if (iTs < 0 || iLon < 0 || iLat < 0) throw new Error('missing expected columns');

  const byInd = new Map();
  let taxon = null;
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const f = splitCsvLine(lines[i]);
    const lon = parseFloat(f[iLon]);
    const lat = parseFloat(f[iLat]);
    const ts = parseTs(f[iTs] || '');
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || ts == null) continue;
    const id = (iId >= 0 ? f[iId] : '') || 'unknown';
    if (iTax >= 0 && !taxon && f[iTax]) taxon = f[iTax];
    if (!byInd.has(id)) byInd.set(id, []);
    byInd.get(id).push({ timestamp: ts, location_long: lon, location_lat: lat });
  }
  const individuals = [...byInd.entries()].map(([individual_local_identifier, locations]) => ({
    individual_local_identifier,
    individual_taxon_canonical_name: taxon,
    locations,
  }));
  return { individuals, taxon };
}

// Identify the location CSV in a package: any .csv that isn't the reference /
// license / readme file. Prefer a GPS file, then Argos, then the largest.
function pickLocationFile(files) {
  const cand = files.filter(
    (f) =>
      /\.csv$/i.test(f.name) &&
      !/-reference-data\.csv$/i.test(f.name) &&
      !/^license/i.test(f.name) &&
      !/^readme/i.test(f.name) &&
      (f.sizeBytes || 0) <= MAX_BYTES &&
      (f.sizeBytes || 0) > 0
  );
  cand.sort((a, b) => {
    const score = (n) => (/gps/i.test(n) ? 2 : /argos/i.test(n) ? 1 : 0);
    const d = score(b.name) - score(a.name);
    return d !== 0 ? d : (b.sizeBytes || 0) - (a.sizeBytes || 0);
  });
  return cand[0];
}

async function fetchTarget(t) {
  const candidates = await resolveCandidates(t);
  let item = null;
  let loc = null;
  for (const uuid of candidates.slice(0, 8)) {
    const it = await getJSON(`${API}/core/items/${uuid}?embed=bundles/bitstreams`);
    const bundles = it._embedded?.bundles?._embedded?.bundles || [];
    const files = bundles.flatMap((b) => b._embedded?.bitstreams?._embedded?.bitstreams || []);
    const f = pickLocationFile(files);
    if (f) {
      item = it;
      loc = f;
      break;
    }
  }
  if (!item || !loc) throw new Error('no candidate with a usable location CSV under size cap');
  const md = item.metadata || {};

  const csv = await (await fetch(loc._links.content.href)).text();
  const { individuals, taxon } = parseCsv(csv);

  const doiRaw = mv(md, 'dc.identifier.doi') || '';
  const doi = doiRaw.replace(/^doi:/, '');
  const meta = {
    name: (mv(md, 'dc.title') || item.name || '').replace(/^Data from:\s*/, ''),
    taxon: taxon || mv(md, 'taxon.scientificName') || 'Unknown',
    common: t.common,
    region: t.region,
    blurb: t.blurb,
    license: mv(md, 'dc.rights') || 'CC0 1.0 Universal',
    doi,
    doiUrl: doi ? `https://doi.org/${doi}` : mv(md, 'dc.identifier.uri'),
    citation: mv(md, 'mdr.citation.CSE') || mv(md, 'dc.identifier.citation') || '',
    handle: mv(md, 'dc.identifier.uri'),
    sourceFile: loc.name,
  };

  const totalFixes = individuals.reduce((n, i) => n + i.locations.length, 0);
  writeFileSync(resolve(RAW_DIR, `repo_${t.id}.json`), JSON.stringify({ meta, individuals }));
  return { id: t.id, ok: true, individuals: individuals.length, fixes: totalFixes, meta };
}

// --- run -------------------------------------------------------------------
mkdirSync(RAW_DIR, { recursive: true });
const results = [];
for (const t of TARGETS) {
  try {
    const r = await fetchTarget(t);
    results.push(r);
    console.log(
      `✓ ${t.id.padEnd(22)} ${String(r.individuals).padStart(4)} inds, ${String(r.fixes).padStart(
        7
      )} fixes | ${r.meta.taxon} | ${r.meta.license} | ${r.meta.doi}`
    );
  } catch (e) {
    console.log(`✗ ${t.id.padEnd(22)} FAILED: ${e.message}`);
  }
}
console.log(`\nFetched ${results.length}/${TARGETS.length} repository datasets into scripts/raw/`);
