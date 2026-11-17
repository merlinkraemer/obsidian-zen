# obsidian-zen — state

_Updated: 2026-11-06 by orchestrator on dev. Live state only, max ~80 lines. History → docs/journal.md._

## Direction
Not in Compass (~/dev/brief/baseline.md missing on dev). Thread runs on dev since 2026-11-06 (moved from lab2; lab2 copy left in place). Maintenance mode: plugin is shipped; keep it healthy, answer contributors, cut releases when Merlin says.

## Ship target
Zen UI is live in the Obsidian community store (1.1.4, GitHub release with main.js/manifest.json/styles.css). Done for the current queue: PR #1 decided, CI builds every PR, release steps written down.

## Rulebook
AGENTS.md ## Unattended. Pushing a tag = public release; always gated.

## Waiting on Merlin
1. Post issue replies for #3 and #2 (drafts in .agent/issue-3-reply.md, issue-2-reply.md) - rec: post both now that 1.1.8 is out - branch: none

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

### Q5 Git sync tab opt-in [landed] [box]
goal: sync tab off by default; never shown without the obsidian-git plugin enabled
acceptance: new installs see no sync tab; existing users without Git lose the error tab; Git users keep it
validation: npm ci && npm run build; manual test by Merlin
do not touch: other settings, settings tabs layout

### Q6 Windows window buttons clickable [landed] [box]
goal: fix merlinkraemer/obsidian-zen#2: minimize (and close/maximize) clickable on Windows in default Zen UI
acceptance: root cause named (likely a drag region over .titlebar-button-container); window buttons no-drag on Windows/Linux frameless; macOS unchanged
validation: npm ci && npm run build; Windows test by the issue author (we have no Windows)
may write: styles.css, main.ts (only if needed)
do not touch: settings keys/defaults, release files, GitHub
timebox: 45 min

### Q7 Issue #3: reset button + Zen-only mode [landed] [box]
goal: answer merlinkraemer/obsidian-zen#3 (Merlin decided 2026-11-06): (a) settings button that resets every toggle to Obsidian's own look; (b) option "Only in Zen mode": plugin changes apply only while Zen mode is toggled on, otherwise Obsidian looks default
acceptance: reset + option in settings; option off = today's behavior; option on = no plugin changes until the Zenmode toggle command, all of them while on, clean restore when off (incl. ribbon/view header vault config, window buttons, reload while in Zen); draft issue reply in docs/issue-3-reply.md
validation: npm ci && npm run build
may write: main.ts, styles.css, README.md, docs/issue-3-reply.md
do not touch: existing setting keys/defaults, release files, GitHub
timebox: 60 min

### Q8 Settings tab row spacing [queued] [box]
goal: tab row in Zen UI settings looks native in Obsidian 1.15 settings cards (pills touch card edge, row wraps, uneven padding; Merlin's screenshot .agent/q8/screenshot.png)
acceptance: pills inset like other rows, even padding, tidy wrap; works on older Obsidian too; headless before/after screenshots
validation: npm ci && npm run build
may write: styles.css, main.ts (renderTabRow only)
do not touch: settings keys/defaults, behavior, release files, GitHub
timebox: 45 min

## Rundown
~700 downloads (Merlin, 2026-10-22). Reddit feedback: theme-only option, split Git into its own plugin. Decided: keep one plugin, Git tab opt-in, released 1.1.7. 1.1.8 released 2026-11-17: Only in Zen mode, reset button, Windows window buttons fix. Next: Q8 tab spacing.
