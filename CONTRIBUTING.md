# Contributing to Migration Watch

Thanks for your interest — contributions are welcome and appreciated, whether
it's a bug report, a new openly-licensed dataset, a design refinement, or a
documentation fix.

## Code of conduct

Be kind and constructive. This is a small, science-respecting project; assume
good faith and keep discussion focused on the work.

## Filing issues

Open a [GitHub issue](../../issues) and include:

- **What you expected** vs. **what happened**
- Steps to reproduce (for bugs), ideally with a screenshot or short clip
- Your OS, browser, and Node version
- For data issues, the species/track and the Movebank study involved

Please search existing issues first to avoid duplicates.

## Development setup

```bash
npm install
npm run dev
```

Before opening a pull request, make sure all checks pass locally — these are
the same checks CI runs:

```bash
npm run format:check   # Prettier
npm run lint           # ESLint
npm run build          # production build
```

Run `npm run format` to auto-fix formatting.

## Branch naming

Branch off `main` using a short, prefixed, kebab-case name:

- `feat/…` — a new feature (e.g. `feat/whale-dataset`)
- `fix/…` — a bug fix (e.g. `fix/timeline-wrap`)
- `docs/…` — documentation only
- `chore/…` — tooling, deps, config

## Pull request process

1. Fork the repo and create your branch from `main`.
2. Make your change, keeping commits focused and messages descriptive.
3. Ensure `format:check`, `lint`, and `build` all pass.
4. Open a PR against `main` with a clear description of **what** and **why**.
   Link any related issue (e.g. "Closes #12") and include before/after
   screenshots for visual changes.
5. A maintainer will review; please be responsive to feedback. Squash-merge is
   the default.

## Adding tracking data

Only add data that is **publicly downloadable and openly licensed** (CC0 or a
clearly-attributed CC license). Add the raw fetch step to `scripts/build-dataset.mjs`,
regenerate with `npm run build:data`, and update the attribution in the README
and the on-page sources panel. Never commit fabricated or scraped-without-rights
data — accurate sourcing is the whole point of this project.

## License

By contributing, you agree that your code contributions are licensed under the
project's [MIT License](LICENSE).
