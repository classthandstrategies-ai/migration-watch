/**
 * build-dataset.mjs
 * --------------------------------------------------------------------------
 * Transforms the raw Movebank dumps in scripts/raw/ into the compact,
 * attributed dataset the app ships with (src/data/tracks.json).
 *
 * Two kinds of raw input, both shaped as { individuals: [{ locations: [...] }] }:
 *   - api_*.json  — fetched from Movebank's public JSON API (metadata lives in
 *                   the STUDIES manifest below).
 *   - repo_*.json — fetched by fetch-repository.mjs from the Movebank Data
 *                   Repository (carries a `meta` block with real attribution).
 *
 * For every individual we:
 *   - compute real distance travelled (haversine) on the FULL-resolution fixes,
 *   - keep genuine migrants (per-study minimum distance / fix count),
 *   - downsample to <= MAX_POINTS vertices for smooth animation,
 *   - round coordinates to 4 decimals (~11 m) to keep the bundle small.
 *
 * No coordinates are invented or altered beyond rounding and downsampling.
 * Re-fetch raw repository data first with: npm run fetch:data
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const MAX_POINTS = 130; // vertices kept per track for the traced polyline

function haversineKm([lon1, lat1], [lon2, lat2]) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function downsample(points, max) {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  const out = [];
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)]);
  return out;
}

const round4 = (n) => Math.round(n * 1e4) / 1e4;

// Repository citations (mdr.citation.CSE) embed an HTML <a> tag around the DOI;
// strip tags and collapse whitespace so the citation renders as clean text.
const cleanText = (s) =>
  (s || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function buildTrack(ind, minPoints, minKm) {
  const locs = ind.locations
    .filter((l) => Number.isFinite(l.location_long) && Number.isFinite(l.location_lat))
    .sort((a, b) => a.timestamp - b.timestamp);
  if (locs.length < minPoints) return null;

  let distanceKm = 0;
  for (let i = 1; i < locs.length; i++) {
    distanceKm += haversineKm(
      [locs[i - 1].location_long, locs[i - 1].location_lat],
      [locs[i].location_long, locs[i].location_lat]
    );
  }
  if (distanceKm < minKm) return null;

  const sampled = downsample(locs, MAX_POINTS).map((l) => [
    round4(l.location_long),
    round4(l.location_lat),
    l.timestamp,
  ]);

  const t0 = locs[0].timestamp;
  const t1 = locs[locs.length - 1].timestamp;
  const lons = sampled.map((p) => p[0]);
  const lats = sampled.map((p) => p[1]);

  return {
    id: ind.individual_local_identifier,
    fixCount: locs.length,
    distanceKm: Math.round(distanceKm),
    startDate: new Date(t0).toISOString(),
    endDate: new Date(t1).toISOString(),
    durationDays: Math.round((t1 - t0) / 86400000),
    bbox: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
    points: sampled,
  };
}

/**
 * Study manifest. `take` caps individuals (longest journeys first); minPoints /
 * minKm filter out residents and sparse tracks. API studies carry their own
 * attribution here; repository studies inherit it from the raw file's `meta`.
 */
const STUDIES = [
  // --- Public JSON API studies (attribution defined here) ---
  {
    id: 'albatross',
    raw: 'raw/api_albatross.json',
    source: 'api',
    name: 'Galapagos Albatrosses',
    species: 'Waved Albatross',
    taxon: 'Phoebastria irrorata',
    studyId: 2911040,
    license: 'CC0 1.0 Universal',
    doi: '10.5441/001/1.3hp3s250',
    citation:
      'Cruz S, Proaño CB, Anderson D, Huyvaert K, Wikelski M (2013) Data from: The Environmental-Data Automated Track Annotation (Env-DATA) System. Movebank Data Repository.',
    region: 'Galápagos Archipelago ↔ Peru & Ecuador coast',
    blurb:
      'Critically endangered seabirds breeding on Española Island that forage along the Humboldt Current upwelling off South America.',
    take: 10,
    minPoints: 120,
    minKm: 300,
  },
  {
    id: 'stork',
    raw: 'raw/api_stork.json',
    source: 'api',
    name: 'LifeTrack White Stork SW Germany',
    species: 'White Stork',
    taxon: 'Ciconia ciconia',
    studyId: 21231406,
    license: 'CC0 1.0 Universal',
    doi: '10.5441/001/1.ck04mn78',
    citation:
      'Fiedler W, Flack A, Schäfle W, Keeves B, Quetting M, Eid B, Schmid H, Wikelski M (2019) Data from: Study "LifeTrack White Stork SW Germany" (2013-2019). Movebank Data Repository.',
    region: 'Lake Constance, SW Germany ↔ Iberia & sub-Saharan Africa',
    blurb:
      'Storks following the western European flyway south through Iberia and across the Strait of Gibraltar into West Africa.',
    take: 10,
    minPoints: 40,
    minKm: 1200,
  },
  // --- Movebank Data Repository studies (attribution from file meta) ---
  {
    id: 'osprey',
    raw: 'raw/repo_osprey.json',
    source: 'repo',
    take: 10,
    minPoints: 30,
    minKm: 1500,
  },
  { id: 'gull', raw: 'raw/repo_gull.json', source: 'repo', take: 10, minPoints: 40, minKm: 800 },
  {
    id: 'godwit',
    raw: 'raw/repo_godwit.json',
    source: 'repo',
    take: 10,
    minPoints: 30,
    minKm: 800,
  },
  {
    id: 'cuckoo',
    raw: 'raw/repo_cuckoo.json',
    source: 'repo',
    species: 'African Cuckoo',
    take: 6,
    minPoints: 40,
    minKm: 800,
  },
  { id: 'goose', raw: 'raw/repo_goose.json', source: 'repo', take: 7, minPoints: 30, minKm: 500 },
  {
    id: 'eagle',
    raw: 'raw/repo_eagle.json',
    source: 'repo',
    species: 'Bald Eagle',
    region: 'North America',
    take: 6,
    minPoints: 40,
    minKm: 250,
  },
  {
    id: 'caribou',
    raw: 'raw/repo_caribou.json',
    source: 'repo',
    take: 10,
    minPoints: 8,
    minKm: 150,
  },
  {
    id: 'green_turtle',
    raw: 'raw/repo_green_turtle.json',
    source: 'repo',
    take: 8,
    minPoints: 20,
    minKm: 150,
  },
  {
    id: 'blue_whale',
    raw: 'raw/repo_blue_whale.json',
    source: 'repo',
    take: 8,
    minPoints: 20,
    minKm: 400,
  },
  {
    id: 'seal',
    raw: 'raw/repo_seal.json',
    source: 'repo',
    species: 'California Sea Lion',
    region: 'California Current, NE Pacific',
    take: 8,
    minPoints: 20,
    minKm: 250,
  },
  {
    id: 'fruit_bat',
    raw: 'raw/repo_fruit_bat.json',
    source: 'repo',
    take: 6,
    minPoints: 20,
    minKm: 150,
  },
  // NOTE: Humboldt penguin data (study 1.725) was evaluated and deliberately
  // excluded — its tracks are short coastal foraging trips, not migration, so
  // including them would undermine the "migration" framing.
];

function loadStudy(s) {
  const raw = JSON.parse(readFileSync(resolve(root, 'scripts', s.raw), 'utf8'));
  const tracks = raw.individuals
    .map((ind) => buildTrack(ind, s.minPoints, s.minKm))
    .filter(Boolean)
    .sort((a, b) => b.distanceKm - a.distanceKm)
    .slice(0, s.take);
  if (!tracks.length) {
    console.warn(
      `! ${s.id}: no tracks passed filters (minKm=${s.minKm}, minPoints=${s.minPoints})`
    );
    return null;
  }

  // Merge attribution: API studies from the manifest, repo studies from meta.
  const m = raw.meta || {};
  const meta = {
    id: s.id,
    name: s.name || m.name,
    species: s.species || m.common || m.taxon,
    taxon: s.taxon || m.taxon,
    license: s.license || m.license,
    doi: s.doi || m.doi,
    doiUrl: s.doi ? `https://doi.org/${s.doi}` : m.doiUrl,
    citation: cleanText(s.citation || m.citation),
    region: s.region || m.region,
    blurb: s.blurb || m.blurb,
    studyId: s.studyId,
    handle: m.handle,
  };

  const all = tracks.flatMap((t) => t.points);
  const bbox = [
    Math.min(...all.map((p) => p[0])),
    Math.min(...all.map((p) => p[1])),
    Math.max(...all.map((p) => p[0])),
    Math.max(...all.map((p) => p[1])),
  ];
  const years = tracks.flatMap((t) => [
    new Date(t.startDate).getUTCFullYear(),
    new Date(t.endDate).getUTCFullYear(),
  ]);
  const y0 = Math.min(...years);
  const y1 = Math.max(...years);
  meta.period = y0 === y1 ? `${y0}` : `${y0}–${y1}`;

  return { ...meta, bbox, tracks };
}

const studies = STUDIES.map(loadStudy).filter(Boolean);

const out = {
  source: 'Movebank (movebank.org) — public data API + Movebank Data Repository',
  fetchDate: '2026-06-27',
  dataKind: 'real recorded historical GPS / Argos tracking data — NOT live / real-time',
  note: 'Coordinates rounded to 4 decimals and tracks downsampled for rendering; reported distances computed on full-resolution fixes.',
  studies,
};

writeFileSync(resolve(root, 'src/data/tracks.json'), JSON.stringify(out));

const totalTracks = studies.reduce((n, s) => n + s.tracks.length, 0);
console.log(`Wrote src/data/tracks.json`);
console.log(`Species/studies: ${studies.length} | individuals: ${totalTracks}`);
studies.forEach((s) =>
  console.log(
    `  ${s.species.padEnd(26)} ${String(s.tracks.length).padStart(2)} inds | ${s.period.padEnd(
      9
    )} | ${Math.min(...s.tracks.map((t) => t.distanceKm))}–${Math.max(
      ...s.tracks.map((t) => t.distanceKm)
    )} km | ${s.license}`
  )
);
