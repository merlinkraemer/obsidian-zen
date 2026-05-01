# Obsidian Zen

A minimal-UI plugin for Obsidian. Hide whatever you don't need, reshape the sidebar, and add a few quality-of-life tweaks. Every change is a toggle in settings.

> Personal plugin — not on the community plugin store. Install manually or via [BRAT](https://github.com/TfTHacker/obsidian42-brat).

## Features

**Sidebar layout**
- Move the tab header to the bottom of the sidebar
- Right-align tab header icons
- Split tab header — tabs on top, action icons on the bottom
- Roomy file explorer spacing
- Hide tree indent guide lines
- On startup, auto-detach all sidebar tabs except the ones you choose

**Sidebar header buttons**
- Daily-note button (opens today's note via the core Daily notes plugin)
- Per-button visibility for Files tab, Search tab, `+`, dropdown, sidebar toggle, file-explorer action bar

**Window chrome**
- Hide root tab bar, status bar, vault name, scrollbars, tooltips

**Editor**
- Disable current-line highlight
- Hide reading-view properties block
- Scroll offset (typewriter scrolling) — keep the cursor a configurable distance from the edges

**Search & modals**
- Hide search suggestions, search match counts, modal instruction footers

**Commands**
- `Zenmode toggle` — fullscreen the app and collapse both sidebars (bind a hotkey)

## Install

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [release](../../releases/latest).
2. Drop them into `<your-vault>/.obsidian/plugins/obsidian-zen/`.
3. Reload Obsidian and enable **Obsidian Zen** in *Settings → Community plugins*.

### BRAT

Add `merlinkraemer/obsidian-zen` as a beta plugin in BRAT.

## Build from source

```bash
git clone https://github.com/merlinkraemer/obsidian-zen
cd obsidian-zen
npm install
npm run build
```

`main.js` and `styles.css` will be written to the project root.

## License

MIT
