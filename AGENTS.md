# Zen UI (obsidian-zen)

Obsidian plugin `zen-ui`, live in the community store. Single-file TS (`main.ts`, `sync-view.ts`, `styles.css`), built with esbuild.

## Unattended

platform: box
validation: `npm ci && npm run build` (tsc + esbuild)
may land: docs, CI workflows, build scripts, internal refactors with no behavior change
must ask: user-visible (settings, CSS, copy, UX), merging external PRs, version bumps, roadmap/scope
never: push tags, push to main, `gh release`, merge/comment/review on GitHub PRs, PRs to obsidianmd/obsidian-releases, secrets
scope fence: no new runtime dependencies; no network or shell calls from the plugin (README disclosures)
lane rules: a pushed tag triggers `.github/workflows/release.yml` → GitHub release → store update. Version lives in package.json, manifest.json, versions.json.
