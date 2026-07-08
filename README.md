# 3DS:ATLAS

**A**pplication **T**oolkit, **L**ibraries, **A**PIs & **S**ervices — a module for FoundryVTT.

## Development

```bash
npm install          # install dev dependencies
npm run setup        # create foundry/ + dnd5e/ symlinks for IDE intellisense
npm run dev          # rollup watch build (unminified)
npm run build        # production build to dist/
npm run validate     # eslint + prettier + stylelint
npm test             # vitest
```

Releases are triggered by pushing a `release-X.Y.Z` tag (see `.github/workflows/release.yml`).
