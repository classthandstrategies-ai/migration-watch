import { useEffect, useMemo, useRef, useState } from 'react';
import WorldMap from './components/WorldMap.jsx';
import Timeline from './components/Timeline.jsx';
import Legend from './components/Legend.jsx';
import DetailPanel from './components/DetailPanel.jsx';
import EducationPanel from './components/EducationPanel.jsx';
import { dataset, allTracks, formatDate } from './lib/dataset.js';

// Seconds of wall-clock for a full 0→100% journey at 1× speed.
const FULL_JOURNEY_MS = 26000;

const trackByKey = new Map(allTracks.map((t) => [t.key, t]));
const totalIndividuals = allTracks.length;

// Real date at the marker head, interpolated by index along the track.
function tsAtProgress(points, progress) {
  const n = points.length;
  if (!n) return null;
  const f = Math.max(0, Math.min(1, progress)) * (n - 1);
  const i = Math.floor(f);
  const t = f - i;
  const a = points[i][2];
  const b = points[Math.min(i + 1, n - 1)][2];
  return a + (b - a) * t;
}

export default function App() {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [selectedKey, setSelectedKey] = useState(null);
  const [hoveredKey, setHoveredKey] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const [visible, setVisible] = useState(() => new Set(dataset.studies.map((s) => s.id)));

  // Refs keep the rAF loop free of stale state without restarting each frame.
  const progressRef = useRef(0);
  const speedRef = useRef(1);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (!playing) return undefined;
    let last = null;
    let raf = 0;
    const tick = (now) => {
      if (last != null) {
        let p = progressRef.current + ((now - last) / FULL_JOURNEY_MS) * speedRef.current;
        if (p >= 1) p = 0; // loop the replay continuously
        progressRef.current = p;
        setProgress(p);
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const scrub = (p) => {
    progressRef.current = p;
    setProgress(p);
  };

  const toggleStudy = (id) => {
    setVisible((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selected = selectedKey ? trackByKey.get(selectedKey) : null;
  const headTs = useMemo(
    () => (selected ? tsAtProgress(selected.track.points, progress) : null),
    [selected, progress]
  );
  const headLabel = headTs ? formatDate(new Date(headTs).toISOString()) : null;

  return (
    <div className="min-h-screen">
      {/* Announcement bar — the page's one dark band, stating the data's nature. */}
      <div className="bg-ink-black px-4 py-2.5 text-center font-rubik text-[13px] text-pure-white">
        Showing <strong className="font-semibold">real recorded historical</strong> GPS tracks — a
        replay, not live tracking.{' '}
        <a href="#about" className="underline decoration-1 underline-offset-2 hover:text-sage-mint">
          How this works
        </a>
      </div>

      {/* Floating transparent navigation. */}
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5">
        <a href="#top" className="flex items-center gap-2">
          <img src="/leaf.svg" width="28" height="28" alt="" />
          <span className="font-display text-[22px] font-semibold text-ink-black">
            Migration&nbsp;Watch
          </span>
        </a>
        <nav className="hidden items-center gap-7 font-rubik text-[15px] font-medium text-charcoal md:flex">
          <a href="#map" className="hover:text-ink-black">
            Map
          </a>
          <a href="#about" className="hover:text-ink-black">
            How it works
          </a>
          <a href="#about" className="hover:text-ink-black">
            Sources
          </a>
        </nav>
        <a
          href="https://www.movebank.org"
          target="_blank"
          rel="noreferrer"
          className="rounded-[40.5px] border border-ink-black px-4 py-2 font-rubik text-[14px] font-medium text-ink-black transition-colors hover:bg-ink-black hover:text-pure-white"
        >
          View on Movebank
        </a>
      </header>

      {/* Hero. */}
      <section id="top" className="mx-auto max-w-[820px] px-6 pb-10 pt-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-[46px] border border-charcoal/20 bg-bone-card px-3.5 py-1.5 font-rubik text-[12px] font-medium text-charcoal">
          <span className="h-2 w-2 rounded-full bg-sage-deep" aria-hidden="true" />
          Real tracking data · {dataset.studies.length} species · {totalIndividuals} animals
        </span>
        <h1 className="mt-6 font-display text-[44px] font-semibold leading-[1.12] text-ink-black sm:text-[58px] md:text-[68px]">
          Watch real animals cross the real world.
        </h1>
        <p className="mx-auto mt-6 max-w-[620px] font-rubik text-[19px] leading-[1.7] text-charcoal">
          Every line below is a journey that actually happened — recorded fix by fix by GPS and
          satellite tags on wild animals, from albatrosses to blue whales, shared openly by the
          researchers who tracked them. Press play to retrace their migrations.
        </p>
      </section>

      {/* Interactive map module. */}
      <main id="map" className="mx-auto max-w-[1200px] px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-[10px] border border-charcoal/15 bg-bone-card">
              <WorldMap
                progress={progress}
                selectedKey={selectedKey}
                hoveredKey={hoveredKey}
                visible={visible}
                focusTarget={focusTarget}
                onSelect={setSelectedKey}
                onHover={setHoveredKey}
              />
            </div>
            <Timeline
              progress={progress}
              onScrub={scrub}
              playing={playing}
              onTogglePlay={() => setPlaying((p) => !p)}
              speed={speed}
              onSpeed={setSpeed}
              headLabel={headLabel}
            />
            <p className="px-1 font-rubik text-[12px] leading-relaxed text-charcoal">
              Drag to pan · scroll or use the buttons to zoom · click any path to inspect it. The
              timeline is a normalised <em>journey progress</em>, not a calendar — the two studies
              span different years, so each animal advances along its own recorded route together.
            </p>
          </div>

          <aside className="flex flex-col gap-4">
            <div>
              <h2 className="mb-2 font-rubik text-[12px] font-semibold uppercase tracking-[0.14em] text-charcoal">
                Tracked species
              </h2>
              <Legend
                studies={dataset.studies}
                visible={visible}
                onToggle={toggleStudy}
                focusTarget={focusTarget}
                onFocus={setFocusTarget}
              />
            </div>
            <DetailPanel selected={selected} headTs={headTs} />
          </aside>
        </div>
      </main>

      <EducationPanel />

      <footer className="mx-auto mt-[100px] max-w-[1200px] border-t border-charcoal/15 px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="font-rubik text-[13px] text-charcoal">
            Built with open data from{' '}
            <a
              href="https://www.movebank.org"
              target="_blank"
              rel="noreferrer"
              className="text-ink-black underline underline-offset-2"
            >
              Movebank
            </a>
            . Data is real and historical; this is a replay, not live tracking.
          </p>
          <p className="font-rubik text-[12px] text-charcoal">
            Datasets © their researchers · openly licensed (CC0 / CC BY-NC)
          </p>
        </div>
      </footer>
    </div>
  );
}
