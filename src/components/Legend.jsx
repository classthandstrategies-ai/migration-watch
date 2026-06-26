/**
 * Species legend + filter. Each row toggles a study's visibility on the map and
 * offers a "focus" action that flies the map to that study's region.
 */
export default function Legend({ studies, visible, onToggle, focusTarget, onFocus }) {
  return (
    <div className="flex flex-col gap-2">
      {studies.map((s) => {
        const on = visible.has(s.id);
        const focused = focusTarget === s.id;
        return (
          <div
            key={s.id}
            className={`flex items-center gap-3 rounded-[10px] border px-3 py-2.5 transition-colors ${
              on
                ? 'border-charcoal/15 bg-bone-card'
                : 'border-charcoal/10 bg-transparent opacity-55'
            }`}
          >
            <button
              type="button"
              onClick={() => onToggle(s.id)}
              aria-pressed={on}
              className="flex flex-1 items-center gap-3 text-left"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: on ? s.colorHex : 'transparent',
                  boxShadow: `inset 0 0 0 1.5px ${s.colorHex}`,
                }}
                aria-hidden="true"
              />
              <span>
                <span className="block font-rubik text-[15px] font-medium leading-tight text-ink-black">
                  {s.species}
                </span>
                <span className="block font-rubik text-[12px] italic leading-tight text-charcoal">
                  {s.taxon} · {s.tracks.length} tracked
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => onFocus(focused ? null : s.id)}
              className={`shrink-0 rounded-full border px-3 py-1 font-rubik text-[12px] font-medium transition-colors ${
                focused
                  ? 'border-ink-black bg-ink-black text-pure-white'
                  : 'border-ink-black/30 text-charcoal hover:border-ink-black hover:text-ink-black'
              }`}
            >
              {focused ? 'Focused' : 'Focus'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
