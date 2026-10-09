# Release checklist

Pushing a tag is a public release (the community store serves it). Get Merlin's go first.
Replace `X` with the new version, e.g. `1.1.7`.

## Prepare
- [ ] On `main`, clean tree, up to date.
- [ ] Using a newer Obsidian API? Raise `minAppVersion` in `manifest.json` (currently 1.13.0).
- [ ] `npm version X --no-git-tag-version` (updates `package.json` + `package-lock.json`).
- [ ] `manifest.json`: set `"version": "X"`.
- [ ] `versions.json`: add `"X": "<minAppVersion>"` (same value as in `manifest.json`).
- [ ] Tag must equal the `manifest.json` version exactly, no `v` prefix.
- [ ] `npm run build` (runs `tsc -noEmit`, then esbuild production) passes.

## Cut
- [ ] `git commit -am "chore: release X"` (files: package.json, package-lock.json, manifest.json, versions.json).
- [ ] `git tag X`
- [ ] Needs Merlin's go: `git push origin main`, then `git push origin X`.

## Verify
- [ ] `gh run list --workflow Release --limit 1` shows success.
      Workflow `.github/workflows/release.yml` (on tag push): `npm ci`, `npm run build`,
      build attestation, `gh release create X main.js manifest.json styles.css --generate-notes`.
- [ ] `gh release view X` lists exactly 3 assets: `main.js`, `manifest.json`, `styles.css`.
- [ ] The store picks the update up from the GitHub release; no further submission needed.
