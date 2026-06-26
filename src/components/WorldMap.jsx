import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  MAP_W,
  MAP_H,
  landPath,
  spherePath,
  graticulePath,
  projectTrack,
  fullPath,
  traceAtProgress,
} from '../lib/geo.js';
import { allTracks } from '../lib/dataset.js';

const MIN_K = 1;
const MAX_K = 9;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * The world map. Renders a calm atlas (land on the cream canvas) and, over it,
 * each individual's recorded route as a faint "ghost" path with a bold traced
 * head that advances with the global journey progress. Supports drag-to-pan,
 * wheel/button zoom, and click-to-select.
 */
export default function WorldMap({
  progress,
  selectedKey,
  hoveredKey,
  visible,
  focusTarget,
  onSelect,
  onHover,
}) {
  const svgRef = useRef(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0, animate: true });
  const drag = useRef(null);

  // Project every track once; this is the expensive part and never changes.
  const projected = useMemo(
    () => allTracks.map((t) => ({ ...t, geo: projectTrack(t.track.points) })),
    []
  );

  // Convert a pointer event to internal SVG user coordinates (0..MAP_W/H).
  const toUser = useCallback((e) => {
    const r = svgRef.current.getBoundingClientRect();
    return {
      ux: ((e.clientX - r.left) / r.width) * MAP_W,
      uy: ((e.clientY - r.top) / r.height) * MAP_H,
    };
  }, []);

  const zoomTo = useCallback((nextK, ux, uy, animate) => {
    setView((v) => {
      const k = clamp(nextK, MIN_K, MAX_K);
      // Keep the point under the cursor fixed while scaling.
      const x = ux - (ux - v.x) * (k / v.k);
      const y = uy - (uy - v.y) * (k / v.k);
      return { k, x, y, animate };
    });
  }, []);

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const { ux, uy } = toUser(e);
      zoomTo(view.k * (e.deltaY < 0 ? 1.18 : 0.85), ux, uy, false);
    },
    [toUser, zoomTo, view.k]
  );

  // Native wheel listener so we can preventDefault (React's is passive).
  useEffect(() => {
    const el = svgRef.current;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const onPointerDown = (e) => {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.sx) / r.width) * MAP_W;
    const dy = ((e.clientY - drag.current.sy) / r.height) * MAP_H;
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.current.moved = true;
    setView((v) => ({ ...v, x: drag.current.ox + dx, y: drag.current.oy + dy, animate: false }));
  };
  const onPointerUp = (e) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    drag.current = null;
  };

  // Fit the map to a study's bounding box when the user focuses one.
  useEffect(() => {
    if (!focusTarget) {
      setView({ k: 1, x: 0, y: 0, animate: true });
      return;
    }
    const tracks = projected.filter((t) => t.study.id === focusTarget);
    if (!tracks.length) return;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const t of tracks)
      for (const p of t.geo.pts) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
    const pad = 60;
    const k = clamp(
      Math.min(MAP_W / (maxX - minX + pad), MAP_H / (maxY - minY + pad)),
      MIN_K,
      MAX_K
    );
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setView({ k, x: MAP_W / 2 - cx * k, y: MAP_H / 2 - cy * k, animate: true });
  }, [focusTarget, projected]);

  const anySelected = Boolean(selectedKey);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="w-full touch-none select-none"
        style={{ cursor: drag.current ? 'grabbing' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        role="img"
        aria-label="World map of recorded animal migration routes"
      >
        {/* Ocean = the linen canvas itself, so the map sits in the page tone. */}
        <path d={spherePath} fill="var(--color-linen-canvas)" />

        <g
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
            transition: view.animate ? 'transform 0.6s cubic-bezier(0.22,1,0.36,1)' : 'none',
          }}
        >
          <path
            d={graticulePath}
            fill="none"
            stroke="var(--color-charcoal)"
            strokeOpacity="0.08"
            strokeWidth="0.5"
          />
          {/* Land as lifted bone paper with a charcoal hairline. */}
          <path
            d={landPath}
            fill="var(--color-bone-card)"
            stroke="var(--color-charcoal)"
            strokeWidth="0.4"
            strokeOpacity="0.35"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={spherePath}
            fill="none"
            stroke="var(--color-charcoal)"
            strokeWidth="0.6"
            strokeOpacity="0.25"
            vectorEffect="non-scaling-stroke"
          />

          {projected.map((t) => {
            if (!visible.has(t.study.id)) return null;
            const isSel = t.key === selectedKey;
            const isHov = t.key === hoveredKey;
            const dim = anySelected && !isSel;
            const { head, path } = traceAtProgress(t.geo, progress);
            const origin = t.geo.pts[0];
            return (
              <g
                key={t.key}
                opacity={dim ? 0.18 : 1}
                style={{ transition: 'opacity 0.35s ease', cursor: 'pointer' }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onSelect(isSel ? null : t.key)}
                onMouseEnter={() => onHover(t.key)}
                onMouseLeave={() => onHover(null)}
              >
                {/* Ghost of the full recorded route. */}
                <path
                  d={fullPath(t.geo)}
                  fill="none"
                  stroke={t.study.color}
                  strokeOpacity={isSel || isHov ? 0.45 : 0.22}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {/* Travelled-so-far, bold. */}
                <path
                  d={path}
                  fill="none"
                  stroke={t.study.color}
                  strokeWidth={isSel ? 2.6 : 1.8}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {/* Wide invisible hit area for easy selection. */}
                <path
                  d={fullPath(t.geo)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={12}
                  vectorEffect="non-scaling-stroke"
                />

                {/* Origin (release/colony) point. */}
                <circle
                  cx={origin.x}
                  cy={origin.y}
                  r={2.5 / view.k}
                  fill="none"
                  stroke={t.study.color}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  opacity={0.6}
                />

                {/* Moving head marker with a sage halo when active. */}
                {(isSel || isHov) && (
                  <circle
                    cx={head.x}
                    cy={head.y}
                    r={9 / view.k}
                    fill="var(--color-sage-mint)"
                    opacity={0.7}
                  />
                )}
                <circle
                  cx={head.x}
                  cy={head.y}
                  r={(isSel ? 4.5 : 3.5) / view.k}
                  fill={t.study.color}
                  stroke="var(--color-bone-card)"
                  strokeWidth={1.2 / view.k}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Zoom controls — ghost pills in keeping with the system. */}
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <ZoomButton
          label="Zoom in"
          onClick={() => zoomTo(view.k * 1.6, MAP_W / 2, MAP_H / 2, true)}
        >
          +
        </ZoomButton>
        <ZoomButton
          label="Zoom out"
          onClick={() => zoomTo(view.k / 1.6, MAP_W / 2, MAP_H / 2, true)}
        >
          −
        </ZoomButton>
        <ZoomButton label="Reset view" onClick={() => setView({ k: 1, x: 0, y: 0, animate: true })}>
          <span className="text-[11px] leading-none">⊙</span>
        </ZoomButton>
      </div>
    </div>
  );
}

function ZoomButton({ children, label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-black bg-bone-card text-[18px] leading-none text-ink-black transition-colors hover:bg-ink-black hover:text-pure-white"
    >
      {children}
    </button>
  );
}
