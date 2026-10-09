# Zen UI

Less clutter, more Zen. Make Obsidian as minimal as you want.

## Features

- **Less chrome** — hide sidebars, toolbars, padding, and other distractions with simple toggles in settings
- **Git sync** — check status, pull, push, and sync from a dedicated sidebar tab (requires [Git](https://github.com/Vinzent03/obsidian-git))
- **Daily notes** — open today's note right from the sidebar
- **Sidebar tabs** — customize the default tabs
- **More breathing room** — adjust file-explorer spacing and scroll offset
- **Zen mode** — run `zenmode toggle` to go fullscreen and hide everything but what matters

## Install

**Community plugins:** Search for **Zen UI** in Obsidian.

**Manual:** Download `main.js`, `manifest.json`, and `styles.css` from the latest [release](https://github.com/merlinkraemer/obsidian-zen/releases/latest) and place them in `<vault>/.obsidian/plugins/zen-ui/`.

**BRAT:** Add `merlinkraemer/obsidian-zen`.

## Disclosures

- The sync tab reads status, branch, and the last commit through the Git plugin. Zen UI never runs Git or shell commands itself and makes no network requests.
- Pull, push, commit, and fetch are handled by the Git plugin. Zen UI never writes to your repository directly.

## License

MIT
