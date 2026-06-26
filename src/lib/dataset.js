/**
 * Loads the bundled, real Movebank dataset and decorates each study with the
 * accent colour used on the map and in the legend. Track records are kept as
 * shipped; only presentation metadata is added here.
 */
import data from '../data/tracks.json';

// One colour per study. Both are drawn from the earthy palette — a deep sage
// for the seabird, an ocean ink for the stork — never the pale mint accent,
// which the design reserves for washes and halos.
const STUDY_STYLE = {
  albatross: { color: 'var(--color-sage-deep)', colorHex: '#5a8f63' },
  stork: { color: 'var(--color-ocean-ink)', colorHex: '#2f5d6e' },
};

export const dataset = {
  ...data,
  studies: data.studies.map((s) => ({ ...s, ...STUDY_STYLE[s.id] })),
};

// Flat list of every individual track, each carrying a back-reference to its
// study, plus a stable composite key for selection.
export const allTracks = dataset.studies.flatMap((study) =>
  study.tracks.map((track) => ({
    key: `${study.id}:${track.id}`,
    study,
    track,
  }))
);

export function formatKm(km) {
  return `${km.toLocaleString('en-US')} km`;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
