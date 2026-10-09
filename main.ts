import {
  App,
  Notice,
  Platform,
  Plugin,
  PluginSettingTab,
  Setting,
  WorkspaceLeaf,
  WorkspaceSplit,
  setIcon,
} from "obsidian";
import { SyncView, SYNC_VIEW_TYPE } from "./sync-view";
import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { Prec } from "@codemirror/state";

interface ZenSettings {
  // Sidebar layout
  tabHeaderBottom: boolean;
  tabHeaderRightAlign: boolean;
  splitTabHeader: boolean;
  roomySidebar: boolean;
  showTreeLines: boolean;
  defaultLeftSidebarTabs: boolean;
  // Sidebar header
  dailyNoteButton: boolean;
  showFilesTab: boolean;
  showSearchTab: boolean;
  showSyncTab: boolean;
  showNewTab: boolean;
  showTabList: boolean;
  showSidebarToggle: boolean;
  showFileNavHeader: boolean;
  // Window chrome
  showRootTabBar: boolean;
  showRibbon: boolean;
  showTrafficLights: boolean;
  showStatusBar: boolean;
  showVaultName: boolean;
  showScrollbars: boolean;
  showTooltips: boolean;
  // Editor
  highlightActiveLine: boolean;
  showPropertiesReading: boolean;
  scrollOffsetEnabled: boolean;
  scrollOffsetPercentage: boolean;
  scrollOffsetValue: string;
  // Search & modals
  showSearchSuggestions: boolean;
  showSearchCounts: boolean;
  showModalInstructions: boolean;
}

const DEFAULT_SETTINGS: ZenSettings = {
  tabHeaderBottom: true,
  tabHeaderRightAlign: true,
  splitTabHeader: false,
  roomySidebar: true,
  showTreeLines: false,
  defaultLeftSidebarTabs: false,
  dailyNoteButton: true,
  showFilesTab: true,
  showSearchTab: true,
  showSyncTab: true,
  showNewTab: true,
  showTabList: true,
  showSidebarToggle: true,
  showFileNavHeader: true,
  showRootTabBar: false,
  showRibbon: false,
  showTrafficLights: false,
  showStatusBar: false,
  showVaultName: false,
  showScrollbars: false,
  showTooltips: true,
  highlightActiveLine: true,
  showPropertiesReading: false,
  scrollOffsetEnabled: true,
  scrollOffsetPercentage: true,
  scrollOffsetValue: "25",
  showSearchSuggestions: false,
  showSearchCounts: true,
  showModalInstructions: true,
};

type Group =
  | "Sidebar tabs"
  | "Sidebar buttons"
  | "Sidebar layout"
  | "Window"
  | "Editor"
  | "Search & modals";

type ToggleDef = {
  key: keyof ZenSettings;
  name: string;
  desc: string;
  group: Group;
  /** CSS class added to body when the rule fires. Omit for non-visual settings. */
  className?: string;
  /** "on" = add class when setting is true; "off" = add class when setting is false */
  when?: "on" | "off";
  /** Rendered by a custom control instead of a toggle. */
  custom?: true;
};

const TOGGLES: ToggleDef[] = [
  // Sidebar tabs
  { key: "showFilesTab", name: "Files", desc: "File explorer tab.", group: "Sidebar tabs" },
  { key: "showSearchTab", name: "Search", desc: "Search tab.", group: "Sidebar tabs" },
  {
    key: "showSyncTab",
    name: "Sync",
    desc: "Git sync status with pull and push. Requires the Git community plugin.",
    group: "Sidebar tabs",
  },
  {
    key: "defaultLeftSidebarTabs",
    name: "Remove other tabs on startup",
    desc: "Close any sidebar tab not enabled above. You can still open others manually.",
    group: "Sidebar tabs",
  },
  // Sidebar buttons
  {
    key: "dailyNoteButton",
    name: "Daily note",
    desc: "Opens today's daily note. Requires the core Daily notes plugin.",
    group: "Sidebar buttons",
  },
  {
    key: "showNewTab",
    className: "zen-hide-new-tab",
    when: "off",
    name: "New tab (+)",
    desc: "Adds a tab to the sidebar.",
    group: "Sidebar buttons",
  },
  {
    key: "showTabList",
    className: "zen-hide-tab-list",
    when: "off",
    name: "Tab list",
    desc: "Dropdown listing all sidebar tabs.",
    group: "Sidebar buttons",
  },
  {
    key: "showSidebarToggle",
    className: "zen-hide-sidebar-toggle",
    when: "off",
    name: "Sidebar toggle",
    desc: "Collapses and expands the sidebars.",
    group: "Sidebar buttons",
  },
  {
    key: "showFileNavHeader",
    className: "zen-hide-file-nav-header",
    when: "off",
    name: "File explorer actions",
    desc: "New note, new folder and sort buttons above the file tree.",
    group: "Sidebar buttons",
  },
  // Sidebar layout
  {
    key: "tabHeaderBottom",
    className: "zen-tab-header-bottom",
    when: "on",
    name: "",
    desc: "",
    group: "Sidebar layout",
    custom: true,
  },
  {
    key: "splitTabHeader",
    className: "zen-split-tab-header",
    when: "on",
    name: "",
    desc: "",
    group: "Sidebar layout",
    custom: true,
  },
  {
    key: "tabHeaderRightAlign",
    className: "zen-tab-header-right",
    when: "on",
    name: "Right-align tab bar",
    desc: "Push tabs and buttons to the right edge.",
    group: "Sidebar layout",
  },
  {
    key: "roomySidebar",
    className: "zen-roomy-sidebar",
    when: "on",
    name: "Roomy file tree",
    desc: "Extra padding between files and folders.",
    group: "Sidebar layout",
  },
  {
    key: "showTreeLines",
    className: "zen-hide-tree-lines",
    when: "off",
    name: "Indent lines",
    desc: "Vertical guide lines for nested folders.",
    group: "Sidebar layout",
  },
  // Window
  {
    key: "showRootTabBar",
    className: "zen-hide-root-tabs",
    when: "off",
    name: "Editor tab bar",
    desc: "Tabs above the main editor.",
    group: "Window",
  },
  {
    key: "showRibbon",
    name: "Ribbon",
    desc: "Icon strip on the far left. Same as Appearance → Show ribbon.",
    group: "Window",
  },
  {
    key: "showTrafficLights",
    className: "zen-hide-traffic-lights",
    when: "off",
    name: "Window buttons",
    desc: "Close, minimize and zoom buttons on macOS. When off, use Cmd+W and Cmd+Q.",
    group: "Window",
  },
  {
    key: "showStatusBar",
    className: "zen-hide-status-bar",
    when: "off",
    name: "Status bar",
    desc: "Word count and plugin info at the bottom of the window.",
    group: "Window",
  },
  {
    key: "showVaultName",
    className: "zen-hide-vault-name",
    when: "off",
    name: "Vault name",
    desc: "Vault switcher and settings icons. When off, use hotkeys or the command palette.",
    group: "Window",
  },
  {
    key: "showScrollbars",
    className: "zen-hide-scrollbars",
    when: "off",
    name: "Scrollbars",
    desc: "All scrollbars across the app.",
    group: "Window",
  },
  {
    key: "showTooltips",
    className: "zen-hide-tooltips",
    when: "off",
    name: "Tooltips",
    desc: "Hover labels on icons and buttons.",
    group: "Window",
  },
  // Editor
  {
    key: "highlightActiveLine",
    className: "zen-no-line-highlight",
    when: "off",
    name: "Current line highlight",
    desc: "Tint the line with the cursor.",
    group: "Editor",
  },
  {
    key: "showPropertiesReading",
    className: "zen-hide-properties-reading",
    when: "off",
    name: "Properties in reading view",
    desc: "Frontmatter block at the top of notes in reading mode.",
    group: "Editor",
  },
  {
    key: "scrollOffsetEnabled",
    name: "Typewriter scrolling",
    desc: "Keep the cursor away from the top and bottom edges.",
    group: "Editor",
  },
  // Search & modals
  {
    key: "showSearchSuggestions",
    className: "zen-hide-search-suggestions",
    when: "off",
    name: "Search suggestions",
    desc: "Popover under the search input.",
    group: "Search & modals",
  },
  {
    key: "showSearchCounts",
    className: "zen-hide-search-counts",
    when: "off",
    name: "Match counts",
    desc: "Number of matches per search result.",
    group: "Search & modals",
  },
  {
    key: "showModalInstructions",
    className: "zen-hide-modal-instructions",
    when: "off",
    name: "Modal hints",
    desc: "Keyboard hint row at the bottom of the command palette and other modals.",
    group: "Search & modals",
  },
];

const GROUP_ORDER: Group[] = [
  "Sidebar tabs",
  "Sidebar buttons",
  "Sidebar layout",
  "Window",
  "Editor",
  "Search & modals",
];

export default class ObsidianZenPlugin extends Plugin {
  settings!: ZenSettings;

  async onload() {
    await this.loadSettings();
    this.applyAll();
    this.addSettingTab(new ZenSettingTab(this.app, this));
    this.registerView(SYNC_VIEW_TYPE, (leaf) => new SyncView(leaf));

    this.registerEditorExtension(buildScrollOffsetExtension(this));

    this.addCommand({
      id: "zenmode-toggle",
      name: "Zenmode toggle",
      callback: () => this.toggleZenMode(),
    });

    this.app.workspace.onLayoutReady(() => {
      if (this.settings.defaultLeftSidebarTabs) {
        void this.ensureDefaultSidebarTabs();
      } else {
        void this.syncTabVisibility();
      }
      this.refreshDailyNoteButtons();
    });

    this.registerEvent(
      this.app.workspace.on("window-open", (_w, win) =>
        setWindowButtons(win, this.settings.showTrafficLights)
      )
    );

    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.refreshDailyNoteButtons())
    );
  }

  onunload() {
    for (const t of TOGGLES) {
      if (t.className) document.body.classList.remove(t.className);
    }
    this.removeDailyNoteButtons();
    if (!this.settings.showRibbon) this.setVaultConfig("showRibbon", true);
    setWindowButtons(window, true);
  }

  getVaultConfig(key: string): unknown {
    return (this.app.vault as unknown as { getConfig: (k: string) => unknown }).getConfig(key);
  }

  setVaultConfig(key: string, value: unknown) {
    (this.app.vault as unknown as { setConfig: (k: string, v: unknown) => void }).setConfig(key, value);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<ZenSettings>);
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.applyAll();
    this.refreshDailyNoteButtons();
    await this.syncTabVisibility();
  }

  async syncTabVisibility() {
    const ws = this.app.workspace;
    const leaves = ws.getLeavesOfType(SYNC_VIEW_TYPE);
    if (!this.settings.showSyncTab) {
      leaves.forEach((l) => l.detach());
    } else {
      await this.placeSyncTab();
    }
  }

  /** Put the Sync tab in the same tab group as Files (or Search), wherever that sidebar is. */
  async placeSyncTab() {
    const ws = this.app.workspace;
    const anchor =
      ws.getLeavesOfType("file-explorer")[0] ?? ws.getLeavesOfType("search")[0];
    const group = anchor?.parent as unknown as WorkspaceSplit | undefined;
    const existing = ws.getLeavesOfType(SYNC_VIEW_TYPE);
    if (existing.length && existing.every((l) => l.parent === anchor?.parent)) return;
    existing.forEach((l) => l.detach());
    const leaf = group
      ? ws.createLeafInParent(group, (group as unknown as { children: unknown[] }).children.length)
      : ws.getLeftLeaf(false);
    await leaf?.setViewState({ type: SYNC_VIEW_TYPE, active: false });
  }

  applyAll() {
    // Use Obsidian's own setting so the window frame spacing updates with it.
    if (this.getVaultConfig("showRibbon") !== this.settings.showRibbon) {
      this.setVaultConfig("showRibbon", this.settings.showRibbon);
    }
    setWindowButtons(window, this.settings.showTrafficLights);
    for (const t of TOGGLES) {
      if (!t.className || !t.when) continue;
      const v = this.settings[t.key] as boolean;
      const shouldAdd = t.when === "on" ? v : !v;
      document.body.classList.toggle(t.className, shouldAdd);
    }
  }

  calcScrollMargin(containerHeight: number, cursorHeight: number): number {
    if (!this.settings.scrollOffsetEnabled) return 0;
    const max = (containerHeight - cursorHeight) / 2;
    const raw = parseFloat(this.settings.scrollOffsetValue);
    if (!isFinite(raw) || raw <= 0) return 0;
    const requested = this.settings.scrollOffsetPercentage
      ? (containerHeight * raw) / 100
      : raw;
    return Math.min(requested, max);
  }

  toggleZenMode() {
    const ws = this.app.workspace;
    const isFullscreen = !!document.fullscreenElement;
    const leftCollapsed = ws.leftSplit?.collapsed;
    const rightCollapsed = ws.rightSplit?.collapsed;
    const enteringZen = !isFullscreen || !leftCollapsed || !rightCollapsed;

    if (enteringZen) {
      if (!leftCollapsed) ws.leftSplit?.collapse();
      if (!rightCollapsed) ws.rightSplit?.collapse();
      if (!isFullscreen) void document.documentElement.requestFullscreen?.();
    } else {
      ws.leftSplit?.expand();
      ws.rightSplit?.expand();
      if (document.fullscreenElement) void document.exitFullscreen?.();
    }
  }

  refreshDailyNoteButtons() {
    if (!this.settings.dailyNoteButton) {
      this.removeDailyNoteButtons();
      return;
    }
    const containers = document.querySelectorAll<HTMLElement>(
      ".workspace-split.mod-left-split .workspace-tab-header-container, " +
        ".workspace-split.mod-right-split .workspace-tab-header-container"
    );
    containers.forEach((c) => this.injectDailyNoteButton(c));
  }

  injectDailyNoteButton(container: HTMLElement) {
    if (container.querySelector(".zen-daily-note-button")) return;
    const btn = container.createDiv({
      cls: "clickable-icon zen-daily-note-button",
      attr: {
        "aria-label": "Open today's daily note",
        "data-tooltip-position": "bottom",
      },
    });
    setIcon(btn, "calendar-check");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      this.openDailyNote();
    });
    const newTab = container.querySelector(".workspace-tab-header-new-tab");
    if (newTab) container.insertBefore(btn, newTab);
    else container.appendChild(btn);
  }

  removeDailyNoteButtons() {
    document
      .querySelectorAll(".zen-daily-note-button")
      .forEach((el) => el.remove());
  }

  openDailyNote() {
    const cmds = (this.app as unknown as {
      commands: { executeCommandById: (id: string) => boolean };
    }).commands;
    if (!cmds.executeCommandById("daily-notes")) {
      new Notice("Zen UI: enable the daily notes core plugin to use this button.");
    }
  }

  async ensureDefaultSidebarTabs() {
    const ws = this.app.workspace;
    const allowed = new Set<string>();
    if (this.settings.showFilesTab) allowed.add("file-explorer");
    if (this.settings.showSearchTab) allowed.add("search");
    if (this.settings.showSyncTab) allowed.add(SYNC_VIEW_TYPE);

    const sideLeaves: WorkspaceLeaf[] = [];
    ws.iterateAllLeaves((leaf) => {
      const root = leaf.getRoot();
      if (root === ws.leftSplit || root === ws.rightSplit) sideLeaves.push(leaf);
    });
    for (const leaf of sideLeaves) {
      if (!allowed.has(leaf.view.getViewType())) leaf.detach();
    }

    const ensure = async (type: string, active: boolean) => {
      if (ws.getLeavesOfType(type).length > 0) return;
      const leaf = ws.getLeftLeaf(true);
      if (leaf) await leaf.setViewState({ type, active });
    };
    if (this.settings.showFilesTab) await ensure("file-explorer", true);
    if (this.settings.showSearchTab) await ensure("search", false);
    if (this.settings.showSyncTab) await this.placeSyncTab();

    if (this.settings.showFilesTab) {
      const fe = ws.getLeavesOfType("file-explorer")[0];
      if (fe) void ws.revealLeaf(fe);
    }
  }
}

/** Show or hide the macOS traffic lights. Obsidian exposes the Electron window as `electronWindow`. */
function setWindowButtons(win: Window, visible: boolean) {
  if (!Platform.isMacOS) return;
  const ew = (win as unknown as {
    electronWindow?: { setWindowButtonVisibility?: (v: boolean) => void };
  }).electronWindow;
  ew?.setWindowButtonVisibility?.(visible);
}

function buildScrollOffsetExtension(plugin: ObsidianZenPlugin) {
  return Prec.highest(
    ViewPlugin.fromClass(
      class {
        margin = 0;
        ignoreNext = false;
        constructor(_view: EditorView) {}
        update(u: ViewUpdate) {
          if (!u.selectionSet) return;
          const view = u.view;
          view.requestMeasure({
            read: () => ({
              cursor: view.coordsAtPos(view.state.selection.main.head),
            }),
            write: ({ cursor }) => {
              if (!cursor) return;
              if (this.ignoreNext) {
                this.margin = 0;
                this.ignoreNext = false;
                return;
              }
              const cursorHeight = cursor.bottom - cursor.top + 5;
              this.margin = plugin.calcScrollMargin(
                view.dom.offsetHeight,
                cursorHeight
              );
            },
          });
        }
      },
      {
        eventHandlers: {
          mousedown(this: { ignoreNext: boolean }) {
            this.ignoreNext = true;
          },
          keydown(this: { ignoreNext: boolean }) {
            this.ignoreNext = false;
          },
        },
        provide: (vp) =>
          EditorView.scrollMargins.of((view) => {
            const value = view.plugin(vp) as { margin: number } | null;
            if (!value) return null;
            return { top: value.margin, bottom: value.margin };
          }),
      }
    )
  );
}

class ZenSettingTab extends PluginSettingTab {
  plugin: ObsidianZenPlugin;

  constructor(app: App, plugin: ObsidianZenPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const s = this.plugin.settings;
    const save = async (redraw = false) => {
      await this.plugin.saveSettings();
      if (redraw) this.display();
    };
    containerEl.empty();
    containerEl.addClass("zen-settings");
    containerEl.createEl("p", {
      cls: "zen-settings-intro",
      text: "Toggles show or enable each element. Turn one off to hide it.",
    });

    for (const group of GROUP_ORDER) {
      new Setting(containerEl).setName(group).setHeading();

      if (group === "Sidebar layout") {
        new Setting(containerEl)
          .setName("Tab bar position")
          .setDesc("Where the sidebar tabs and buttons sit. Split keeps tabs on top and buttons at the bottom.")
          .addDropdown((d) =>
            d
              .addOptions({ top: "Top", bottom: "Bottom", split: "Split" })
              .setValue(s.splitTabHeader ? "split" : s.tabHeaderBottom ? "bottom" : "top")
              .onChange(async (v) => {
                s.tabHeaderBottom = v === "bottom";
                s.splitTabHeader = v === "split";
                await save();
              })
          );
      }

      for (const t of TOGGLES.filter((x) => x.group === group && !x.custom)) {
        new Setting(containerEl)
          .setName(t.name)
          .setDesc(t.desc)
          .addToggle((tg) =>
            tg.setValue(s[t.key] as boolean).onChange(async (v) => {
              (s[t.key] as boolean) = v;
              await save(t.key === "scrollOffsetEnabled");
            })
          );
      }

      if (group === "Editor" && s.scrollOffsetEnabled) {
        new Setting(containerEl)
          .setName("Typewriter distance")
          .setDesc("Distance kept above and below the cursor; use 0 to turn it off.")
          .setClass("zen-setting-sub")
          .addText((t) =>
            t
              .setPlaceholder("25")
              .setValue(s.scrollOffsetValue)
              .onChange(async (v) => {
                s.scrollOffsetValue = v;
                await save();
              })
          )
          .addDropdown((d) =>
            d
              .addOptions({ percent: "% of editor", px: "px" })
              .setValue(s.scrollOffsetPercentage ? "percent" : "px")
              .onChange(async (v) => {
                s.scrollOffsetPercentage = v === "percent";
                await save();
              })
          );
      }
    }
  }
}
