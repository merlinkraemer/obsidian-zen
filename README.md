# zen-ui

adds toggles in settings to hide lots of chrome. Make it as minimal as you want

also:
- sync tab: git status + pull / push / sync buttons in the sidebar. needs the [Git](https://github.com/Vinzent03/obsidian-git) plugin, which does the actual pulling and pushing
- daily note button in the sidebar tab bar
- edit default sidebar tabs
- more file-explorer spacing
- scroll offset
- `zenmode toggle` - enter zenmode to fullscreen + hide sidebars etc

## install

Community plugins: search for **Zen UI**.

Manual: grab `main.js`, `manifest.json`, `styles.css` from the latest [release](../../releases/latest), drop into `<vault>/.obsidian/plugins/zen-ui/`.

BRAT: add `merlinkraemer/obsidian-zen`.

## disclosures

- the sync tab runs your local `git` in the vault folder (`status`, `log`, and `fetch` when you hit Check remote). `fetch` talks to your configured git remote, nothing else leaves your machine
- pull / push / commit go through the Git plugin, zen-ui never writes to your repo itself

## License

MIT
