# obsidian-zen — state

_Updated: 2026-10-09 13:26 by orchestrator. Live state only, max ~80 lines. History → docs/journal.md._

## Direction
Not in Compass (~/dev/brief/baseline.md missing on lab2). Maintenance mode: plugin is shipped; keep it healthy, answer contributors, cut releases when Merlin says.

## Ship target
Zen UI is live in the Obsidian community store (1.1.4, GitHub release with main.js/manifest.json/styles.css). Done for the current queue: PR #1 decided, CI builds every PR, release steps written down.

## Rulebook
AGENTS.md ## Unattended. Pushing a tag = public release; always gated.

## Waiting on Merlin
(none)

## Queue

### Q1 Review + fix PR #1 drag-file-tree [landed] [box]
goal: verdict on merlinkraemer/obsidian-zen#1
acceptance: build result, problems with file:line, draft review comment
validation: npm run build on the PR head
do not touch: GitHub (no comment/merge), main

### Q2 Build check on PRs [landed] [box]
goal: workflow that runs `npm ci && npm run build` on pull_request and push to main
acceptance: .github/workflows/ci.yml, release.yml untouched
validation: actionlint or YAML parse; build passes locally
do not touch: release.yml, plugin code

### Q3 Release checklist [landed] [box]
goal: docs/RELEASE.md: bump package/manifest/versions.json, build, tag, push tag, check release assets + store
acceptance: matches release.yml and how 1.1.0–1.1.4 were cut (git log)
validation: none (docs)
do not touch: code, versions

### Q4 Settings tabs [landed] [box]
goal: split the long settings pane into tabs for the next release
acceptance: all settings reachable, no behavior change, native look, build green
validation: npm ci && npm run build; manual look by Merlin
do not touch: setting keys/defaults, release files

## Rundown
Released 1.1.5 (PR #1) and 1.1.6 (settings tabs). Landed locally: CI build check (Q2), docs/RELEASE.md (Q3); main push pending Merlin's go. Queue empty.
