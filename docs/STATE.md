# obsidian-zen — state

_Updated: 2026-10-09 13:12 by orchestrator. Live state only, max ~80 lines. History → docs/journal.md._

## Direction
Not in Compass (~/dev/brief/baseline.md missing on lab2). Maintenance mode: plugin is shipped; keep it healthy, answer contributors, cut releases when Merlin says.

## Ship target
Zen UI is live in the Obsidian community store (1.1.4, GitHub release with main.js/manifest.json/styles.css). Done for the current queue: PR #1 decided, CI builds every PR, release steps written down.

## Rulebook
AGENTS.md ## Unattended. Pushing a tag = public release; always gated.

## Waiting on Merlin
1. PR #1 + fixes (scrollbar, drop target, setting text) — installed in vault for Merlin's manual test; 1.1.4 backup ~/zen-ui-1.1.4-backup on Mac — rec: merge if test passes — branch: pr1-fixes (worktree /tmp/claude-1000/zen-pr1, local only)

## Queue

### Q1 Review PR #1 drag-file-tree [landed] [box]
goal: verdict on merlinkraemer/obsidian-zen#1
acceptance: build result, problems with file:line, draft review comment
validation: npm run build on the PR head
do not touch: GitHub (no comment/merge), main

### Q2 Build check on PRs [queued] [box]
goal: workflow that runs `npm ci && npm run build` on pull_request and push to main
acceptance: .github/workflows/ci.yml, release.yml untouched
validation: actionlint or YAML parse; build passes locally
do not touch: release.yml, plugin code

### Q3 Release checklist [queued] [box]
goal: docs/RELEASE.md: bump package/manifest/versions.json, build, tag, push tag, check release assets + store
acceptance: matches release.yml and how 1.1.0–1.1.4 were cut (git log)
validation: none (docs)
do not touch: code, versions

## Rundown
Init done. Moved to lab2, build green, store listing and release 1.1.4 verified. PR #1 fixed on pr1-fixes, test build installed in Obsidian; waiting on Merlin's test.
