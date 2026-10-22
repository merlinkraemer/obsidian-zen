# Zen UI

Hide the parts of Obsidian you don't use.

## Features

- **Hide UI:** turn off sidebars, toolbars, tab bars, padding and other UI, one toggle each.
- **Sidebar tabs:** choose which tabs the sidebar opens with.
- **Daily note button:** open today's note from the sidebar.
- **Spacing:** adjust file explorer spacing and editor scroll offset.
- **Window drag (optional):** move the window by dragging empty space in the file explorer.
- **Zen mode:** run `zenmode toggle` to go fullscreen with only the note showing.
- **Git sync (optional, off by default):** a sidebar tab with status, pull and push. Needs the [Git](https://github.com/Vinzent03/obsidian-git) plugin.

## Install

**Community plugins:** search for **Zen UI** in Obsidian.

**Manual:** download `main.js`, `manifest.json` and `styles.css` from the latest [release](https://github.com/merlinkraemer/obsidian-zen/releases/latest) into `<vault>/.obsidian/plugins/zen-ui/`.

**BRAT:** add `merlinkraemer/obsidian-zen`.

## Disclosures

- The Git sync tab reads status, branch and the last commit through the Git plugin.
- Pull, push, commit and fetch go through the Git plugin. Zen UI never writes to your repository.
- Zen UI runs no shell commands and makes no network requests.

## License

MIT
