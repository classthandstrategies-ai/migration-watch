# 🌿 Migration Watch

> An interactive map that replays **real, openly-licensed wildlife migration tracking data** from Movebank — fix by fix, the way it was actually recorded.

[![CI](https://github.com/classthandstrategies-ai/migration-watch/actions/workflows/ci.yml/badge.svg)](https://github.com/classthandstrategies-ai/migration-watch/actions/workflows/ci.yml)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/classthandstrategies-ai/migration-watch)
[![License: MIT](https://img.shields.io/badge/License-MIT-000000.svg)](LICENSE)

Migration Watch traces the journeys of GPS- and satellite-tagged wild animals
across a calm, documentary-style world map. Press play and watch waved
albatrosses loop out to the Humboldt Current, white storks pour down the western
European flyway, blue whales range the Pacific and caribou cross the Arctic —
every line is a journey that genuinely happened, drawn from 13 datasets the
researchers shared under open licences.

> **Honest by design:** this is a **replay of real recorded historical data**,
> not a live/real-time feed. The UI says so prominently, because accurate
> labelling matters more than the illusion of live tracking.

---

## 📸 Screenshots

> _Add a screenshot or short GIF here once deployed._ Suggested captures:
>
> - `docs/hero.png` — the full landing view with the world map mid-replay
> - `docs/selected.png` — a track selected, showing the detail panel
> - `docs/demo.gif` — a few seconds of the timeline playing
>
> Place files under `docs/` and reference them, e.g. `![Migration Watch](docs/hero.png)`.

## 🔗 Live demo

> _Add your deployment URL here, e.g._ **https://migration-watch.vercel.app**

---

## ✨ Features

- **Real tracking data** — genuine GPS/Argos fixes from **13 openly-licensed Movebank studies** spanning seabirds, raptors, shorebirds, waterfowl, a songbird, land and marine mammals, a fruit bat, a sea turtle and a blue whale — bundled locally with full citations, DOIs and licences.
- **Animated path tracing** — each individual's route is progressively drawn along its real recorded coordinates as the timeline advances.
- **Scrubbable timeline** — play/pause, drag to scrub, and 0.5×–4× playback speeds. Progress is a normalised _journey progress_ (the studies span different years), with the selected animal's **real head-position date** shown alongside.
- **Click to inspect** — select any path or marker to see species, source study, total distance recorded, number of GPS fixes, tracking duration, dates, licence and DOI.
- **Pan & zoom** — drag to pan, scroll/buttons to zoom, and a one-click "Focus" to fly to each species' region.
- **Species filter & legend** — toggle each study on/off.
- **Educational panel** — how animal tracking works and why it matters for conservation, with prominent attribution.
- **Clear data provenance** — "recorded historical, not live" is stated in the announcement bar, the timeline note, and the footer.
- **Earthy editorial design** — the "Evergreen" system: warm linen canvas, Playfair Display headlines, a single sage-mint botanical accent, no map clutter.

## 🛠 Tech stack

| Area        | Choice                                                                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework   | [React 18](https://react.dev/)                                                                                                                                   |
| Build tool  | [Vite 6](https://vite.dev/)                                                                                                                                      |
| Styling     | [Tailwind CSS v4](https://tailwindcss.com/) (via `@tailwindcss/vite`)                                                                                            |
| Mapping     | [d3-geo](https://github.com/d3/d3-geo) + [topojson-client](https://github.com/topojson/topojson-client) + [world-atlas](https://github.com/topojson/world-atlas) |
| Data source | [Movebank](https://www.movebank.org) public API + [Movebank Data Repository](https://datarepository.movebank.org)                                                |
| Tooling     | ESLint 9, Prettier 3, GitHub Actions                                                                                                                             |
| Deployment  | Vercel (static SPA)                                                                                                                                              |

No backend, no API keys, no database — the app is a fully static single-page app.

## ✅ Prerequisites

- **Node.js ≥ 18** (developed and CI-tested on Node 20 — see [`.nvmrc`](.nvmrc))
- **npm** (ships with Node)

## 🚀 Installation

```bash
# 1. Clone
git clone https://github.com/classthandstrategies-ai/migration-watch.git
cd migration-watch

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
# open the printed URL (default http://localhost:5173)
```

To build and preview the production bundle:

```bash
npm run build      # outputs to dist/
npm run preview    # serves the built dist/ locally
```

## 🔐 Environment variables

**None are required.** The app needs no secrets and no runtime configuration —
all data is bundled at build time. An [`.env.example`](.env.example) is included
only to document the _optional_ Movebank credentials you'd use to re-fetch data
from non-public studies (used by your own fetch commands, never by the app).

## 🧭 Usage

- **Press play** (or it autoplays) to retrace every migration along its real route.
- **Scrub** the timeline to jump to any point in the journey; change **speed** with the 0.5×–4× chips.
- **Click** any path or marker to open its detail panel (species, study, distance, dates, licence, DOI).
- **Toggle** a species in the legend to show/hide it; hit **Focus** to fly the map to its region.
- **Drag** to pan and **scroll** (or use the +/−/⊙ buttons) to zoom.
- Scroll down for the **how-it-works** explainer and **full data attribution**.

## 📁 Project structure

```
migration-watch/
├── .github/workflows/ci.yml   # CI: format check, lint, build
├── public/
│   └── leaf.svg               # favicon / wordmark mark
├── scripts/
│   ├── fetch-repository.mjs   # downloads diverse species from the Movebank Data Repository
│   └── build-dataset.mjs      # transforms raw Movebank dumps → src/data/tracks.json
├── src/
│   ├── components/
│   │   ├── WorldMap.jsx        # SVG map, path tracing, zoom/pan, selection
│   │   ├── Timeline.jsx        # play/pause, scrub, speed
│   │   ├── Legend.jsx          # species filter + focus
│   │   ├── DetailPanel.jsx     # selected-track details
│   │   └── EducationPanel.jsx  # explainer + attribution
│   ├── data/
│   │   └── tracks.json         # bundled, attributed, downsampled real dataset
│   ├── lib/
│   │   ├── geo.js              # projection + path/marker interpolation
│   │   └── dataset.js          # dataset loader + formatting helpers
│   ├── App.jsx                 # layout + animation loop
│   ├── main.jsx                # React entry
│   └── index.css               # Tailwind v4 theme (Evergreen tokens)
├── DESIGN.md                   # the Evergreen style reference
├── vercel.json                 # Vercel build/output + SPA rewrites
└── vite.config.js
```

## 🔄 Regenerating the dataset

The committed `src/data/tracks.json` is generated from two real, openly-licensed
Movebank sources. To refresh or extend it:

```bash
# 1. Two studies come from the Movebank public JSON API (no login required):
curl "https://www.movebank.org/movebank/service/public/json?study_id=2911040&sensor_type=gps&attributes=individual_local_identifier" -o scripts/raw/api_albatross.json
curl "https://www.movebank.org/movebank/service/public/json?study_id=21231406&sensor_type=gps&event_reduction_profile=EURING_01" -o scripts/raw/api_stork.json

# 2. The other species are pulled from the Movebank Data Repository:
npm run fetch:data

# 3. Rebuild the bundled dataset (selects migrants, downsamples, computes distances):
npm run build:data
```

Raw dumps (~42 MB) are git-ignored; the processed ~390 KB bundle is what ships.
To add a species, append a target to `scripts/fetch-repository.mjs` and a study
entry to `scripts/build-dataset.mjs`, then rerun steps 2–3.

## 🤝 Contributing

Contributions are very welcome — bug reports, new openly-licensed datasets,
design polish, docs. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the
issue/branch/PR workflow and the rule that **all added data must be publicly
licensed and properly attributed**.

## 🚢 Deployment

Optimized for **Vercel** (zero-config static SPA). [`vercel.json`](vercel.json)
sets the framework (`vite`), build command (`npm run build`), output directory
(`dist`), and SPA rewrites.

**One-click deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/classthandstrategies-ai/migration-watch)

It deploys just as cleanly to **Netlify** or **GitHub Pages** — it's a plain
static build (`dist/`); only the redirect/rewrite config differs per host.

## 📜 License

Source code: **MIT** — see [LICENSE](LICENSE).

The bundled tracking **data** is **not** MIT; each dataset is released by its
owners via Movebank under its own open licence (mostly CC0 1.0; one is CC BY-NC
4.0). See below.

## 🙏 Credits & acknowledgments

This project is an independent visualisation and is **not affiliated with or
endorsed by** Movebank, the Max Planck Institute of Animal Behavior, or the data
owners. Enormous thanks to the researchers who track these animals and share
their data openly.

### Data & attribution

Tracking data accessed via the
[Movebank public data API](https://github.com/movebank/movebank-api-doc) and the
[Movebank Data Repository](https://datarepository.movebank.org) on **2026-06-27**.
Each dataset is released by its owners under the licence noted; attribution is
provided as required and as good scholarly practice. Full per-dataset citations,
DOIs and licences also appear in the app's in-page **Sources** panel.

- **Waved Albatross** (_Phoebastria irrorata_) — CC0 1.0. Cruz S, Proaño CB, Anderson D, Huyvaert K, Wikelski M (2013). Movebank Data Repository. https://doi.org/10.5441/001/1.3hp3s250
- **White Stork** (_Ciconia ciconia_) — CC0 1.0. Fiedler W, Flack A, Schäfle W, Keeves B, Quetting M, Eid B, Schmid H, Wikelski M (2019). Movebank Data Repository. https://doi.org/10.5441/001/1.ck04mn78
- **Osprey** (_Pandion haliaetus_) — CC0 1.0. Martell MS, Douglas D (2019). Movebank Data Repository. https://doi.org/10.5441/001/1.sv6335t3
- **Lesser Black-backed Gull** (_Larus fuscus_) — CC0 1.0. Wikelski M, Arriero E, Gagliardo A, Holland RA, et al. (2015). Movebank Data Repository. https://doi.org/10.5441/001/1.q986rc29
- **Black-tailed Godwit** (_Limosa limosa_) — CC0 1.0. Senner N, Verhoeven M, Abad-Gómez JM, Gutiérrez J, et al. (2015). Movebank Data Repository. https://doi.org/10.5441/001/1.m3b75054
- **African Cuckoo** (_Cuculus gularis_) — CC0 1.0. Iwajomo SB, Willemoes M, Ottosson U, Strandberg R, Thorup K (2017). Movebank Data Repository. https://doi.org/10.5441/001/1.b800b7c3
- **Greater White-fronted Goose** (_Anser albifrons_) — CC0 1.0. Kruckenberg H, Müskens GJDM, Ebbinge BS (2018). Movebank Data Repository. https://doi.org/10.5441/001/1.kk38017f
- **Bald Eagle** (_Haliaeetus leucocephalus_) — **CC BY-NC 4.0**. DeSorbo CR, Biodiversity Research Institute. Movebank Data Repository. https://doi.org/10.5441/001/1.704
- **Caribou** (_Rangifer tarandus_) — CC0 1.0. Seip DR, Price E (2019). Movebank Data Repository. https://doi.org/10.5441/001/1.p5bn656k
- **Green Sea Turtle** (_Chelonia mydas_) — CC0 1.0. Hays GC, Esteban N, Rattray A (2024). Movebank Data Repository. https://doi.org/10.5441/001/1.313
- **Blue Whale** (_Balaenoptera musculus_) — CC0 1.0. Mate BR, Palacios DM, Irvine LM, Follett TM (2019). Movebank Data Repository. https://doi.org/10.5441/001/1.5ph88fk2
- **California Sea Lion** (_Zalophus californianus_) — CC0 1.0. Abrahms B (2017). Movebank Data Repository. https://doi.org/10.5441/001/1.hm5nk220
- **Straw-coloured Fruit Bat** (_Eidolon helvum_) — CC0 1.0. Dechmann DKN, Fahr J, Wikelski M (2014). Movebank Data Repository. https://doi.org/10.5441/001/1.62s17b4v

### Software & assets

- [Movebank](https://www.movebank.org) — global animal movement database (Max Planck Institute of Animal Behavior)
- [world-atlas](https://github.com/topojson/world-atlas) — world boundaries TopoJSON
- [d3-geo](https://github.com/d3/d3-geo) — map projection and geometry
- Fonts: [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) & [Rubik](https://fonts.google.com/specimen/Rubik) via Google Fonts
