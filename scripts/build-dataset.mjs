/**
 * build-dataset.mjs
 * --------------------------------------------------------------------------
 * Transforms the raw Movebank public-API responses (scripts/raw_*.json) into
 * the compact, attributed dataset the app ships with (src/data/tracks.json).
 *
 * The raw files were fetched from Movebank's public JSON service (no login,
 * fully open studies). See README "Data & attribution" for the exact URLs,
 * fetch dates, citations and licenses. Re-run with:  npm run build:data
 *
 * What this does:
 *   - selects a readable subset of individuals per study (richest tracks)
 *   - computes real distance travelled (haversine) on the FULL-resolution fix
 *     sequence, so the reported kilometres reflect the actual recording
 *   - downsamples each track to <= MAX_POINTS vertices for smooth animation
 *   - rounds coordinates to 4 decimals (~11 m) to keep the bundle small
 *   - records real start/end dates, duration and a bounding box
 *
 * No coordinates are invented or altered beyond rounding and downsampling.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const MAX_POINTS = 160; // vertices kept per track for the traced polyline

// Great-circle distance between two [lon, lat] points, in kilometres.
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

// Even index sampling that always keeps the first and last fix.
function downsample(points, max) {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  const out = [];
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)]);
  return out;
}

const round4 = (n) => Math.round(n * 1e4) / 1e4;

/**
 * Turn one raw Movebank "individual" record into our compact track object,
 * or return null if the track is too short / not a real journey.
 */
function buildTrack(ind, minPoints, minKm) {
  // Sort by time and drop obvious null fixes.
  const locs = ind.locations
    .filter((l) => Number.isFinite(l.location_long) && Number.isFinite(l.location_lat))
    .sort((a, b) => a.timestamp - b.timestamp);
  if (locs.length < minPoints) return null;

  // Real distance on the full-resolution sequence.
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
    fixCount: locs.length, // real number of recorded fixes
    distanceKm: Math.round(distanceKm),
    startDate: new Date(t0).toISOString(),
    endDate: new Date(t1).toISOString(),
    durationDays: Math.round((t1 - t0) / 86400000),
    bbox: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
    points: sampled,
  };
}

// --- Study definitions (metadata is hand-verified, see README) -------------
const STUDIES = [
  {
    id: 'albatross',
    raw: 'raw_albatross.json',
    name: 'Galapagos Albatrosses',
    species: 'Waved Albatross',
    taxon: 'Phoebastria irrorata',
    studyId: 2911040,
    license: 'CC0 1.0 Universal',
    doi: '10.5441/001/1.3hp3s250',
    citation:
      'Cruz S, Proaño CB, Anderson D, Huyvaert K, Wikelski M (2013) Data from: The Environmental-Data Automated Track Annotation (Env-DATA) System. Movebank Data Repository.',
    region: 'Galápagos Archipelago ↔ Peru & Ecuador coast',
    period: '2008 breeding season',
    blurb:
      'Critically endangered seabirds breeding on Española Island in the Galápagos. Adults make multi-day foraging trips east to the nutrient-rich Humboldt Current upwelling off the South American coast, using tailwinds on the long return leg.',
    take: 12, // number of individuals to keep
    minPoints: 120,
    minKm: 300,
  },
  {
    id: 'stork',
    raw: 'raw_stork.json',
    name: 'LifeTrack White Stork SW Germany',
    species: 'White Stork',
    taxon: 'Ciconia ciconia',
    studyId: 21231406,
    license: 'CC0 1.0 Universal',
    doi: '10.5441/001/1.ck04mn78',
    citation:
      'Fiedler W, Flack A, Schäfle W, Keeves B, Quetting M, Eid B, Schmid H, Wikelski M (2019) Data from: Study "LifeTrack White Stork SW Germany" (2013-2019). Movebank Data Repository.',
    region: 'Lake Constance, SW Germany ↔ Iberia & sub-Saharan Africa',
    // The 2019 DOI package covers 2013–2019; the live Movebank study is
    // ongoing and the public API served fixes through 2025 on the fetch date.
    period: '2013–2025 (ongoing study)',
    blurb:
      'Storks tagged near Lake Constance follow the western European flyway: south through France and Spain, across the Strait of Gibraltar, and on to wintering grounds in West Africa. Many now winter short, lingering at Iberian landfills.',
    take: 14,
    minPoints: 40,
    minKm: 1200, // keep genuine long-distance migrants, not residents
  },
];

const studies = STUDIES.map((s) => {
  const raw = JSON.parse(readFileSync(resolve(root, 'scripts', s.raw), 'utf8'));
  const tracks = raw.individuals
    .map((ind) => buildTrack(ind, s.minPoints, s.minKm))
    .filter(Boolean)
    // longest journeys first, then keep the top `take`
    .sort((a, b) => b.distanceKm - a.distanceKm)
    .slice(0, s.take);

  const all = tracks.flatMap((t) => t.points);
  const bbox = [
    Math.min(...all.map((p) => p[0])),
    Math.min(...all.map((p) => p[1])),
    Math.max(...all.map((p) => p[0])),
    Math.max(...all.map((p) => p[1])),
  ];

  const { raw: _omit, take, minPoints, minKm, ...meta } = s;
  return {
    ...meta,
    movebankUrl: `https://www.movebank.org/cms/webapp?gwt_fragment=page=studies,path=study${s.studyId}`,
    doiUrl: `https://doi.org/${s.doi}`,
    bbox,
    tracks,
  };
});

const out = {
  // Provenance is part of the data, not a side note.
  source: 'Movebank (movebank.org) public data API',
  fetchedFrom: 'https://www.movebank.org/movebank/service/public/json',
  fetchDate: '2026-06-26',
  dataKind: 'real recorded historical GPS tracking data — NOT live / real-time',
  note: 'Coordinates rounded to 4 decimals and tracks downsampled for rendering; reported distances computed on full-resolution fixes.',
  studies,
};

const dest = resolve(root, 'src/data/tracks.json');
writeFileSync(dest, JSON.stringify(out));

const totalTracks = studies.reduce((n, s) => n + s.tracks.length, 0);
const totalPts = studies.reduce((n, s) => n + s.tracks.reduce((m, t) => m + t.points.length, 0), 0);
console.log(`Wrote ${dest}`);
console.log(`Studies: ${studies.length} | tracks: ${totalTracks} | rendered points: ${totalPts}`);
studies.forEach((s) =>
  console.log(
    `  ${s.species}: ${s.tracks.length} individuals, ${Math.min(
      ...s.tracks.map((t) => t.distanceKm)
    )}–${Math.max(...s.tracks.map((t) => t.distanceKm))} km`
  )
);
