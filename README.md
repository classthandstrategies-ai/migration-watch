# 🌿 Migration Watch

**An interactive map that replays real, openly-licensed wildlife migration tracking data from Movebank — fix by fix, the way it was actually recorded.**

[![CI](https://github.com/classthandstrategies-ai/migration-watch/actions/workflows/ci.yml/badge.svg)](https://github.com/classthandstrategies-ai/migration-watch/actions/workflows/ci.yml)
[![Deploy to Pages](https://github.com/classthandstrategies-ai/migration-watch/actions/workflows/deploy.yml/badge.svg)](https://github.com/classthandstrategies-ai/migration-watch/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-000000.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-339933.svg?logo=node.js&logoColor=white)](package.json)
[![Top language](https://img.shields.io/github/languages/top/classthandstrategies-ai/migration-watch)](package.json)

**Live demo:** https://classthandstrategies-ai.github.io/migration-watch/

---

## What is this

Migration Watch is a static, single-page React app that draws real GPS and satellite (Argos) tracking data on a world map and lets you replay it. Press play and watch waved albatrosses loop out to the Humboldt Current, white storks pour down the western European flyway, blue whales range the Pacific, and caribou cross the boreal Arctic — every line traces a route an actual tagged animal flew, swam, or walked.

The data comes from **13 openly-licensed studies** hosted on [Movebank](https://www.movebank.org) — a free animal-tracking database maintained by the Max Planck Institute of Animal Behavior — covering **106 tracked individuals** across seabirds, raptors, shorebirds, waterfowl, a songbird, a fruit bat, a sea turtle, a blue whale, and land and marine mammals. Every dataset ships with its citation, DOI, and licence, and the app states clearly that this is a **replay of real historical data, not a live feed**.

## Features

- **Real tracking data** — genuine GPS/Argos fixes from 13 Movebank studies, bundled locally in `src/data/tracks.json` with full citations, DOIs, and licences (mostly CC0 1.0; one study is CC BY-NC 4.0).
- **Animated path tracing** — each individual's route is progressively drawn along its real recorded coordinates as the timeline advances (`WorldMap.jsx`).
- **Scrubbable timeline** — play/pause, drag to scrub, and 0.5×–4× playback speeds. Progress is a normalised _journey progress_ (the studies span different years), with the selected animal's real head-position date shown alongside (`Timeline.jsx`).
- **Click to inspect** — select any path or marker to see species, source study, total distance recorded, GPS fix count, tracking duration, first/last fix dates, licence, and DOI (`DetailPanel.jsx`).
- **Species filter & focus** — toggle any of the 13 species on or off, and fly the map to a species' region with one click (`Legend.jsx`).
- **Pan & zoom** — drag to pan, scroll or use the on-screen buttons to zoom.
- **Educational panel** — a short explainer on how animal tracking works and why open sharing of movement data matters for conservation, with attribution treated as primary content (`EducationPanel.jsx`).
- **Honest by design** — an announcement bar and footer state plainly that the map replays real historical fixes, not live tracking.

## Tech stack

| Area        | Choice                                                                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework   | [React 18](https://react.dev/)                                                                                                                                   |
| Build tool  | [Vite 6](https://vite.dev/)                                                                                                                                      |
| Styling     | [Tailwind CSS v4](https://tailwindcss.com/) (via `@tailwindcss/vite`)                                                                                            |
| Mapping     | [d3-geo](https://github.com/d3/d3-geo) + [topojson-client](https://github.com/topojson/topojson-client) + [world-atlas](https://github.com/topojson/world-atlas) |
| Data source | [Movebank](https://www.movebank.org) public API + [Movebank Data Repository](https://datarepository.movebank.org)                                                |
| Tooling     | ESLint 9, Prettier 3, GitHub Actions                                                                                                                             |
| Deployment  | GitHub Pages (auto-deploy) and Vercel (zero-config)                                                                                                              |

There is no backend, database, or API key — the app is a fully static single-page app; all tracking data is bundled at build time.

## Prerequisites

- **Node.js ≥ 18** (CI and the Pages deploy run on Node 20 — see [`.nvmrc`](.nvmrc))
- **npm** (ships with Node)

## Getting started

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

Build and preview the production bundle:

```bash
npm run build      # outputs to dist/
npm run preview    # serves the built dist/ locally
```

Other available scripts:

```bash
npm run lint            # ESLint
npm run format           # Prettier — auto-fix
npm run format:check     # Prettier — check only (what CI runs)
```

### Environment variables

**None are required to run or build the app.** All tracking data is fetched once and bundled into `src/data/tracks.json`, which is committed to the repo. [`.env.example`](.env.example) documents optional Movebank credentials, needed only if you want to re-fetch data from non-public, login-required studies — those variables are read by the fetch scripts below, never by the deployed app.

## Usage

- **Press play** (it autoplays on load) to retrace every migration along its real route, or **scrub** the timeline to jump to any point.
- Change **playback speed** with the 0.5×–4× chips.
- **Click** any path or marker to open its detail panel — species, source study, distance, dates, licence, and DOI.
- **Toggle** a species in the legend to show or hide it, and hit **Focus** to fly the map to its region.
- **Drag** to pan and **scroll** (or use the zoom buttons) to navigate the map.
- Scroll down for the how-it-works explainer and full data attribution.

## Project structure

```
migration-watch/
├── .github/workflows/
│   ├── ci.yml                  # lint, format check, build on every push/PR
│   └── deploy.yml              # build + deploy to GitHub Pages on push to main
├── public/
│   └── leaf.svg                 # favicon / wordmark
├── scripts/
│   ├── fetch-repository.mjs     # downloads studies from the Movebank Data Repository
│   └── build-dataset.mjs        # transforms raw Movebank dumps → src/data/tracks.json
├── src/
│   ├── components/
│   │   ├── WorldMap.jsx          # SVG map, path tracing, zoom/pan, selection
│   │   ├── Timeline.jsx          # play/pause, scrub, speed
│   │   ├── Legend.jsx            # species filter + focus
│   │   ├── DetailPanel.jsx       # selected-track details
│   │   └── EducationPanel.jsx    # explainer + attribution
│   ├── data/
│   │   └── tracks.json           # bundled, attributed, downsampled real dataset
│   ├── lib/
│   │   ├── geo.js                # projection + path/marker interpolation
│   │   └── dataset.js            # dataset loader + formatting helpers
│   ├── App.jsx                   # layout + animation loop
│   ├── main.jsx                  # React entry
│   └── index.css                 # Tailwind v4 theme tokens
├── vercel.json                   # Vercel build/output config + SPA rewrites
└── vite.config.js
```

## Regenerating the dataset

The committed `src/data/tracks.json` is generated from real, openly-licensed Movebank sources — two studies via the public JSON API, the rest via the Movebank Data Repository. To refresh or extend it:

```bash
# 1. Two studies come from the Movebank public JSON API (no login required):
curl "https://www.movebank.org/movebank/service/public/json?study_id=2911040&sensor_type=gps&attributes=individual_local_identifier" -o scripts/raw/api_albatross.json
curl "https://www.movebank.org/movebank/service/public/json?study_id=21231406&sensor_type=gps&event_reduction_profile=EURING_01" -o scripts/raw/api_stork.json

# 2. The remaining species are pulled from the Movebank Data Repository:
npm run fetch:data

# 3. Rebuild the bundled dataset (selects genuine migrants, downsamples, computes distances):
npm run build:data
```

Raw dumps are git-ignored (`scripts/raw/`); only the processed dataset in `src/data/tracks.json` is committed. To add a species, append a target to `scripts/fetch-repository.mjs` and a study entry to `scripts/build-dataset.mjs`, then rerun steps 2–3.

## Contributing

Bug reports, new openly-licensed datasets, design polish, and documentation fixes are all welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the issue/branch/PR workflow — the one hard rule is that **any added tracking data must be publicly downloadable and openly licensed**.

## Deployment

This repo auto-deploys to **GitHub Pages** on every push to `main` via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml); the live demo above is that deployment. It also ships a [`vercel.json`](vercel.json) for zero-config deployment on Vercel, and runs equally well on Netlify or any static host since the build output (`dist/`) is a plain static bundle.

## License

- **Source code:** MIT — see [LICENSE](LICENSE).
- **Tracking data:** the datasets bundled in `src/data/tracks.json` are **not** covered by the MIT license. Each was released by its owners via Movebank under its own open licence — CC0 1.0 Universal for 12 of the 13 studies, and CC BY-NC 4.0 for the Bald Eagle study. Full citations and DOIs are below and in the app's in-page sources panel.

### Data & attribution

Tracking data accessed via the [Movebank public data API](https://github.com/movebank/movebank-api-doc) and the [Movebank Data Repository](https://datarepository.movebank.org) on **2026-06-27**. This project is an independent visualisation and is not affiliated with or endorsed by Movebank, the Max Planck Institute of Animal Behavior, or the data owners.

| Species                  | Taxon                      | Licence      | Citation                                                                                                                                                                            |
| ------------------------ | -------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Waved Albatross          | _Phoebastria irrorata_     | CC0 1.0      | Cruz S, Proaño CB, Anderson D, Huyvaert K, Wikelski M (2013). Movebank Data Repository. [10.5441/001/1.3hp3s250](https://doi.org/10.5441/001/1.3hp3s250)                            |
| White Stork              | _Ciconia ciconia_          | CC0 1.0      | Fiedler W, Flack A, Schäfle W, Keeves B, Quetting M, Eid B, Schmid H, Wikelski M (2019). Movebank Data Repository. [10.5441/001/1.ck04mn78](https://doi.org/10.5441/001/1.ck04mn78) |
| Osprey                   | _Pandion haliaetus_        | CC0 1.0      | Martell MS, Douglas D (2019). Movebank Data Repository. [10.5441/001/1.sv6335t3](https://doi.org/10.5441/001/1.sv6335t3)                                                            |
| Lesser Black-backed Gull | _Larus fuscus_             | CC0 1.0      | Wikelski M, Arriero E, Gagliardo A, Holland RA, et al. (2015). Movebank Data Repository. [10.5441/001/1.q986rc29](https://doi.org/10.5441/001/1.q986rc29)                           |
| Black-tailed Godwit      | _Limosa limosa_            | CC0 1.0      | Senner N, Verhoeven M, Abad-Gómez JM, Gutiérrez J, et al. (2015). Movebank Data Repository. [10.5441/001/1.m3b75054](https://doi.org/10.5441/001/1.m3b75054)                        |
| African Cuckoo           | _Cuculus gularis_          | CC0 1.0      | Iwajomo SB, Willemoes M, Ottosson U, Strandberg R, Thorup K (2017). Movebank Data Repository. [10.5441/001/1.b800b7c3](https://doi.org/10.5441/001/1.b800b7c3)                      |
| White-fronted Goose      | _Anser albifrons_          | CC0 1.0      | Kruckenberg H, Müskens GJDM, Ebbinge BS (2018). Movebank Data Repository. [10.5441/001/1.kk38017f](https://doi.org/10.5441/001/1.kk38017f)                                          |
| Bald Eagle               | _Haliaeetus leucocephalus_ | CC BY-NC 4.0 | DeSorbo CR, Biodiversity Research Institute. Movebank Data Repository. [10.5441/001/1.704](https://doi.org/10.5441/001/1.704)                                                       |
| Caribou                  | _Rangifer tarandus_        | CC0 1.0      | Seip DR, Price E (2019). Movebank Data Repository. [10.5441/001/1.p5bn656k](https://doi.org/10.5441/001/1.p5bn656k)                                                                 |
| Green Sea Turtle         | _Chelonia mydas_           | CC0 1.0      | Hays GC, Esteban N, Rattray A (2024). Movebank Data Repository. [10.5441/001/1.313](https://doi.org/10.5441/001/1.313)                                                              |
| Blue Whale               | _Balaenoptera musculus_    | CC0 1.0      | Mate BR, Palacios DM, Irvine LM, Follett TM (2019). Movebank Data Repository. [10.5441/001/1.5ph88fk2](https://doi.org/10.5441/001/1.5ph88fk2)                                      |
| California Sea Lion      | _Zalophus californianus_   | CC0 1.0      | Abrahms B (2017). Movebank Data Repository. [10.5441/001/1.hm5nk220](https://doi.org/10.5441/001/1.hm5nk220)                                                                        |
| Straw-coloured Fruit Bat | _Eidolon helvum_           | CC0 1.0      | Dechmann DKN, Fahr J, Wikelski M (2014). Movebank Data Repository. [10.5441/001/1.62s17b4v](https://doi.org/10.5441/001/1.62s17b4v)                                                 |

### Software & assets

- [Movebank](https://www.movebank.org) — global animal movement database (Max Planck Institute of Animal Behavior)
- [world-atlas](https://github.com/topojson/world-atlas) — world boundaries TopoJSON
- [d3-geo](https://github.com/d3/d3-geo) — map projection and geometry
- Fonts: [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) & [Rubik](https://fonts.google.com/specimen/Rubik) via Google Fonts

## Author

Built by [Geetesh Parashar](https://github.com/classthandstrategies-ai), a student at VIT Bhopal, as an independent side project.
