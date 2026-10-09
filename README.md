# Zen UI

Hide interface clutter, tidy the sidebar, and add a git sync tab. Every tweak is a toggle.

## Hides

- Root tab bar, status bar, vault name, scrollbars, tooltips
- Sidebar tab header buttons (`+`, dropdown, sidebar toggle)
- File explorer action bar
- Search suggestions, match counts, modal instruction footers
- Properties block in reading view
- Current-line highlight
- Tree indent guide lines

## Extras

- **Sync tab** — git status, last commit, changed files, and Pull / Push / Sync now buttons in the sidebar. Requires the [Git](https://github.com/Vinzent03/obsidian-git) community plugin: Zen shows the status, the Git plugin does the pulling and pushing. Desktop only.
- Daily-note button in the sidebar tab header
- Optionally close unwanted sidebar tabs on startup (off by default)
- Sidebar tab header at bottom / right-aligned / split (tabs top, icons bottom)
- Roomy sidebar spacing
- Scroll offset (typewriter scrolling)
- `Zenmode toggle` command — fullscreen + collapse both sidebars

## Install

Community plugins: search for **Zen UI** in Settings → Community plugins.

Manual: grab `main.js`, `manifest.json`, `styles.css` from the latest [release](../../releases/latest), drop into `<vault>/.obsidian/plugins/zen-ui/`.

BRAT: add `merlinkraemer/obsidian-zen`.

## Disclosures

- The Sync tab runs your local `git` binary in the vault folder (`status`, `log`, and `fetch` when you press Check remote). `fetch` contacts the git remote you configured. Nothing else leaves your machine.
- Pull, push and commit are handed to the Git plugin; Zen UI never writes to your repository itself.

## License

MIT
