import { formatKm, formatDate } from '../lib/dataset.js';

/**
 * Details for the selected individual: species, the study it comes from, its
 * licence/DOI, and the real distance/duration recorded in the dataset. When
 * nothing is selected it invites the user to pick a track.
 */
export default function DetailPanel({ selected, headTs }) {
  if (!selected) {
    return (
      <div className="rounded-[10px] border border-dashed border-charcoal/25 bg-bone-card/60 px-5 py-6 text-center">
        <p className="font-rubik text-[15px] text-charcoal">
          Select any path or marker on the map to read its species, source study and recorded
          distance.
        </p>
      </div>
    );
  }

  const { study, track } = selected;
  const headDate = headTs ? formatDate(new Date(headTs).toISOString()) : null;

  return (
    <div className="rounded-[10px] border border-charcoal/15 bg-bone-card px-5 py-5">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: study.colorHex }}
          aria-hidden="true"
        />
        <span className="font-rubik text-[12px] font-medium uppercase tracking-[0.14em] text-charcoal">
          {study.species}
        </span>
      </div>
      <h3 className="font-display text-[30px] leading-tight text-ink-black">{track.id}</h3>
      <p className="mb-4 font-rubik text-[13px] italic text-charcoal">{study.taxon}</p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Stat label="Distance recorded" value={formatKm(track.distanceKm)} />
        <Stat label="Tracking duration" value={`${track.durationDays.toLocaleString()} days`} />
        <Stat label="GPS fixes" value={track.fixCount.toLocaleString()} />
        <Stat label="Head position date" value={headDate || '—'} />
        <Stat label="First fix" value={formatDate(track.startDate)} />
        <Stat label="Last fix" value={formatDate(track.endDate)} />
      </dl>

      <div className="mt-4 border-t border-charcoal/15 pt-3">
        <p className="font-rubik text-[12px] uppercase tracking-[0.14em] text-charcoal">
          Source study
        </p>
        <p className="mt-1 font-rubik text-[14px] leading-snug text-ink-black">{study.name}</p>
        <p className="mt-0.5 font-rubik text-[12px] text-charcoal">{study.region}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-[46px] bg-sage-mint px-2.5 py-0.5 font-rubik text-[11px] font-semibold text-ink-black">
            {study.license}
          </span>
          <a
            href={study.doiUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-[46px] border border-ink-black/30 px-2.5 py-0.5 font-rubik text-[11px] font-medium text-charcoal underline-offset-2 hover:border-ink-black hover:text-ink-black"
          >
            DOI: {study.doi}
          </a>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <dt className="font-rubik text-[11px] uppercase tracking-[0.1em] text-charcoal">{label}</dt>
      <dd className="font-rubik text-[18px] font-medium tabular-nums text-ink-black">{value}</dd>
    </div>
  );
}
