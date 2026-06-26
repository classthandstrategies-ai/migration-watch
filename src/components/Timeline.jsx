/**
 * Timeline scrubber. Drives a single normalised "journey progress" (0..1) that
 * advances every tracked animal along its own recorded route together. This is
 * deliberately NOT a wall-clock — the two studies span different years — so the
 * label reads "journey progress", and the real date at the selected animal's
 * current position is shown alongside for honesty.
 */
const SPEEDS = [0.5, 1, 2, 4];

export default function Timeline({
  progress,
  onScrub,
  playing,
  onTogglePlay,
  speed,
  onSpeed,
  headLabel,
}) {
  return (
    <div className="rounded-[10px] border border-charcoal/15 bg-bone-card px-5 py-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-black text-pure-white transition-transform hover:scale-105"
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <rect x="2" y="1" width="3.5" height="12" rx="1" />
              <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <path d="M2.5 1.6c0-.6.7-1 1.2-.6l8 5.4c.5.3.5 1 0 1.3l-8 5.4c-.5.4-1.2 0-1.2-.6V1.6Z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-rubik text-[12px] font-medium uppercase tracking-[0.14em] text-charcoal">
              Journey progress
            </span>
            <span className="font-rubik text-[13px] tabular-nums text-charcoal">
              {Math.round(progress * 100)}%
              {headLabel && (
                <>
                  <span className="mx-2 text-charcoal/40">·</span>
                  <span className="text-ink-black">{headLabel}</span>
                </>
              )}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1000"
            value={Math.round(progress * 1000)}
            onChange={(e) => onScrub(Number(e.target.value) / 1000)}
            className="timeline-range"
            aria-label="Scrub journey progress"
          />
        </div>

        <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Playback speed">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeed(s)}
              className={`rounded-full px-2.5 py-1 font-rubik text-[12px] font-medium transition-colors ${
                speed === s ? 'bg-ink-black text-pure-white' : 'text-charcoal hover:bg-linen-canvas'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
