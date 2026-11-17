import {
  App,
  Notice,
  Platform,
  Plugin,
  PluginSettingTab,
  Modal,
  Setting,
  SettingDefinitionItem,
  WorkspaceLeaf,
  WorkspaceSplit,
  setIcon,
} from "obsidian";
import { SyncView, SYNC_VIEW_TYPE, GIT_PLUGIN_ID } from "./sync-view";
import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { Prec } from "@codemirror/state";

type VaultBackup = { showRibbon?: boolean; showViewHeader?: boolean };

interface ZenSettings {
  onlyInZenMode: boolean;
  zenBackup?: VaultBackup;
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
  showViewHeader: boolean;
  dragFileTree: boolean;
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
  onlyInZenMode: false,
  tabHeaderBottom: true,
  tabHeaderRightAlign: true,
  splitTabHeader: false,
  roomySidebar: true,
  showTreeLines: false,
  defaultLeftSidebarTabs: false,
  dailyNoteButton: true,
  showFilesTab: true,
  showSearchTab: true,
  showSyncTab: false,
  showNewTab: true,
  showTabList: true,
  showSidebarToggle: true,
  showFileNavHeader: true,
  showRootTabBar: false,
  showRibbon: false,
  showViewHeader: true,
  dragFileTree: false,
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

const OBSIDIAN_DEFAULTS: Omit<
  ZenSettings,
  "onlyInZenMode" | "zenBackup" | "scrollOffsetPercentage" | "scrollOffsetValue"
> = {
  tabHeaderBottom: false,
  tabHeaderRightAlign: false,
  splitTabHeader: false,
  roomySidebar: false,
  showTreeLines: true,
  defaultLeftSidebarTabs: false,
  dailyNoteButton: false,
  showFilesTab: true,
  showSearchTab: true,
  showSyncTab: false,
  showNewTab: true,
  showTabList: true,
  showSidebarToggle: true,
  showFileNavHeader: true,
  showRootTabBar: true,
  showRibbon: true,
  showViewHeader: true,
  dragFileTree: false,
  showTrafficLights: true,
  showStatusBar: true,
  showVaultName: true,
  showScrollbars: true,
  showTooltips: true,
  highlightActiveLine: true,
  showPropertiesReading: true,
  scrollOffsetEnabled: false,
  showSearchSuggestions: true,
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
    name: "Git sync",
    desc: "Git status with pull and push. Needs the Git community plugin.",
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
    key: "showViewHeader",
    name: "Note title bar",
    desc: "Bar above each note with its title. It's also where you drag the window; when off, drag by the empty part of a sidebar tab bar instead.",
    group: "Window",
  },
  {
    key: "dragFileTree",
    className: "zen-drag-file-tree",
    when: "on",
    name: "Drag window from file tree",
    desc: "Empty space in the file explorer moves the window, like a title bar. Right-click on empty space won't open the menu.",
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
  declare settings: ZenSettings;
  zenActive = false;

  async onload() {
    await this.loadSettings();
    this.applyAll();
    this.addSettingTab(new ZenSettingTab(this.app, this));
    this.registerView(SYNC_VIEW_TYPE, (leaf) => new SyncView(leaf));

    this.registerEditorExtension(buildScrollOffsetExtension(this));

    // Drag regions swallow HTML5 drag events, so switch them off for the whole
    // drag. That keeps drops on empty file-tree space (move to vault root) working.
    this.registerDomEvent(document, "dragstart", () =>
      document.body.classList.add("zen-html-dragging"),
    );
    this.registerDomEvent(document, "dragend", () =>
      document.body.classList.remove("zen-html-dragging"),
    );
    this.registerDomEvent(document, "drop", () =>
      document.body.classList.remove("zen-html-dragging"),
    );
    this.register(() => document.body.classList.remove("zen-html-dragging"));

    this.registerDomEvent(document, "fullscreenchange", () => {
      if (!document.fullscreenElement) this.setZenActive(false);
    });

    this.addCommand({
      id: "zenmode-toggle",
      name: "Zenmode toggle",
      callback: () => this.toggleZenMode(),
    });

    this.app.workspace.onLayoutReady(() => {
      if (this.effectiveSettings().defaultLeftSidebarTabs) {
        void this.ensureDefaultSidebarTabs();
      } else {
        void this.syncTabVisibility();
      }
      this.refreshDailyNoteButtons();
    });

    this.registerEvent(
      this.app.workspace.on("window-open", (_w, win) =>
        setWindowButtons(win, this.effectiveSettings().showTrafficLights)
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
    if (this.settings.onlyInZenMode) {
      this.zenActive = false;
      this.syncVaultConfig();
    } else {
      this.restoreVaultDefaults();
    }
    setWindowButtons(window, true);
  }

  restoreVaultDefaults() {
    if (!this.settings.showRibbon) this.setVaultConfig("showRibbon", true);
    if (!this.settings.showViewHeader) this.setVaultConfig("showViewHeader", true);
  }

  isStyling() {
    return !this.settings.onlyInZenMode || this.zenActive;
  }

  effectiveSettings(): ZenSettings {
    return this.isStyling() ? this.settings : { ...this.settings, ...OBSIDIAN_DEFAULTS };
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

  async setOnlyInZenMode(on: boolean) {
    if (on) {
      this.restoreVaultDefaults();
      this.zenActive = false;
    } else {
      this.settings.zenBackup = undefined;
    }
    this.settings.onlyInZenMode = on;
    await this.saveSettings();
  }

  async resetToObsidianDefaults() {
    Object.assign(this.settings, OBSIDIAN_DEFAULTS);
    await this.saveSettings();
  }

  setZenActive(active: boolean) {
    if (this.zenActive === active) return;
    this.zenActive = active;
    if (!this.settings.onlyInZenMode) return;
    this.applyAll();
    this.refreshDailyNoteButtons();
    if (active && this.settings.defaultLeftSidebarTabs) {
      void this.ensureDefaultSidebarTabs(false);
    } else {
      void this.syncTabVisibility();
    }
  }

  shouldShowSyncTab() {
    const plugins = (this.app as unknown as { plugins: { enabledPlugins: Set<string> } }).plugins;
    return this.effectiveSettings().showSyncTab && plugins.enabledPlugins.has(GIT_PLUGIN_ID);
  }

  async syncTabVisibility() {
    const ws = this.app.workspace;
    const leaves = ws.getLeavesOfType(SYNC_VIEW_TYPE);
    if (!this.shouldShowSyncTab()) {
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
    this.syncVaultConfig();
    const s = this.effectiveSettings();
    setWindowButtons(window, s.showTrafficLights);
    for (const t of TOGGLES) {
      if (!t.className || !t.when) continue;
      const v = s[t.key] as boolean;
      const shouldAdd = t.when === "on" ? v : !v;
      document.body.classList.toggle(t.className, shouldAdd);
    }
  }

  syncVaultConfig() {
    const keys = ["showRibbon", "showViewHeader"] as const;
    if (!this.settings.onlyInZenMode) {
      for (const k of keys) {
        if (this.getVaultConfig(k) !== this.settings[k]) this.setVaultConfig(k, this.settings[k]);
      }
      return;
    }
    const backup = (this.settings.zenBackup ??= {});
    let changed = false;
    for (const k of keys) {
      if (this.zenActive) {
        if (backup[k] === undefined) {
          backup[k] = this.getVaultConfig(k) !== false;
          changed = true;
        }
        if (this.getVaultConfig(k) !== this.settings[k]) this.setVaultConfig(k, this.settings[k]);
      } else if (backup[k] !== undefined) {
        this.setVaultConfig(k, backup[k]);
        delete backup[k];
        changed = true;
      }
    }
    if (changed) void this.saveData(this.settings);
  }

  calcScrollMargin(containerHeight: number, cursorHeight: number): number {
    if (!this.isStyling() || !this.settings.scrollOffsetEnabled) return 0;
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

    this.setZenActive(enteringZen);
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
    if (!this.effectiveSettings().dailyNoteButton) {
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

  async ensureDefaultSidebarTabs(reveal = true) {
    const ws = this.app.workspace;
    const allowed = new Set<string>();
    if (this.settings.showFilesTab) allowed.add("file-explorer");
    if (this.settings.showSearchTab) allowed.add("search");
    if (this.shouldShowSyncTab()) allowed.add(SYNC_VIEW_TYPE);

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
    if (this.shouldShowSyncTab()) await this.placeSyncTab();

    if (reveal && this.settings.showFilesTab) {
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

/** Tabs of the settings pane, in order. Remembered for the session only. */
const SETTINGS_TABS: { name: string; groups: Group[] }[] = [
  { name: "Sidebar tabs", groups: ["Sidebar tabs"] },
  { name: "Sidebar buttons & layout", groups: ["Sidebar buttons", "Sidebar layout"] },
  { name: "Window", groups: ["Window"] },
  { name: "Editor", groups: ["Editor"] },
  { name: "Search & modals", groups: ["Search & modals"] },
];
let activeSettingsTab = 0;

class ConfirmModal extends Modal {
  constructor(
    app: App,
    private message: string,
    private confirmText: string,
    private onConfirm: () => void
  ) {
    super(app);
  }

  onOpen() {
    this.contentEl.createEl("p", { text: this.message });
    new Setting(this.contentEl)
      .addButton((b) => b.setButtonText("Cancel").onClick(() => this.close()))
      .addButton((b) =>
        b
          .setButtonText(this.confirmText)
          .setDestructive()
          .onClick(() => {
            this.close();
            this.onConfirm();
          })
      );
  }

  onClose() {
    this.contentEl.empty();
  }
}

type SettingRow = {
  name: string;
  desc: string;
  render: (setting: Setting) => void;
  visible?: () => boolean;
};

class ZenSettingTab extends PluginSettingTab {
  plugin: ObsidianZenPlugin;

  constructor(app: App, plugin: ObsidianZenPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.containerEl.addClass("zen-settings");
  }

  /**
   * Rendered declaratively by Obsidian and indexed for settings search.
   * Obsidian has no tab API, so every group is always defined (and searchable);
   * the tab row only toggles which panel is visible via CSS.
   */
  getSettingDefinitions(): SettingDefinitionItem[] {
    const rowsByGroup = new Map(this.groups().map((g) => [g.heading, g.rows]));
    const defs: SettingDefinitionItem[] = [
      {
        name: "Only in Zen mode",
        desc: "Change nothing in Obsidian until you run the Zenmode toggle command. Everything below applies while Zen mode is on.",
        render: (setting: Setting) => {
          setting
            .setName("Only in Zen mode")
            .setDesc("Change nothing in Obsidian until you run the Zenmode toggle command. Everything below applies while Zen mode is on.")
            .addToggle((tg) =>
              tg.setValue(this.plugin.settings.onlyInZenMode).onChange((v) => {
                void this.plugin.setOnlyInZenMode(v);
              })
            );
        },
      },
      {
        name: "Reset to Obsidian defaults",
        desc: "Set every toggle below to Obsidian's own look.",
        render: (setting: Setting) => {
          setting
            .setName("Reset to Obsidian defaults")
            .setDesc("Set every toggle below to Obsidian's own look.")
            .addButton((b) =>
              b
                .setButtonText("Reset")
                .setDestructive()
                .onClick(() =>
                  new ConfirmModal(
                    this.app,
                    "Reset every Zen UI toggle to Obsidian's own look?",
                    "Reset",
                    () => {
                      void this.plugin.resetToObsidianDefaults().then(() => this.update());
                    }
                  ).open()
                )
            );
        },
      },
      {
        name: "Settings sections",
        searchable: false,
        render: (setting: Setting) => this.renderTabRow(setting),
      },
    ];
    SETTINGS_TABS.forEach((tab, i) => {
      for (const group of tab.groups) {
        defs.push({
          type: "group" as const,
          // A tab holding one group needs no heading; the tab label says it.
          heading: tab.groups.length > 1 ? group : undefined,
          cls: `zen-tab-panel zen-tab-panel-${i}`,
          items: (rowsByGroup.get(group) ?? []).map((r) => ({
            name: r.name,
            desc: r.desc,
            visible: r.visible,
            render: (setting: Setting) => {
              setting.setName(r.name).setDesc(r.desc);
              r.render(setting);
            },
          })),
        });
      }
    });
    return defs;
  }

  private renderTabRow(setting: Setting) {
    const row = setting.settingEl;
    row.empty();
    row.addClass("zen-tabs");
    row.setAttr("role", "tablist");
    const apply = () => {
      this.containerEl.dataset.zenTab = String(activeSettingsTab);
      buttons.forEach((b, i) => {
        const on = i === activeSettingsTab;
        b.toggleClass("is-active", on);
        b.setAttr("aria-selected", String(on));
      });
    };
    const buttons = SETTINGS_TABS.map((tab, i) => {
      const b = row.createEl("button", { text: tab.name, cls: "zen-tab" });
      b.setAttr("role", "tab");
      b.addEventListener("click", () => {
        activeSettingsTab = i;
        apply();
      });
      return b;
    });
    apply();
  }

  private groups(): { heading: string; rows: SettingRow[] }[] {
    const s = this.plugin.settings;
    const save = () => this.plugin.saveSettings();

    return GROUP_ORDER.map((group) => {
      const rows: SettingRow[] = [];

      if (group === "Sidebar layout") {
        rows.push({
          name: "Tab bar position",
          desc: "Where the sidebar tabs and buttons sit. Split keeps tabs on top and buttons at the bottom.",
          render: (setting) => {
            setting.addDropdown((d) =>
              d
                .addOptions({ top: "Top", bottom: "Bottom", split: "Split" })
                .setValue(s.splitTabHeader ? "split" : s.tabHeaderBottom ? "bottom" : "top")
                .onChange((v) => {
                  s.tabHeaderBottom = v === "bottom";
                  s.splitTabHeader = v === "split";
                  void save();
                })
            );
          },
        });
      }

      for (const t of TOGGLES.filter((x) => x.group === group && !x.custom)) {
        rows.push({
          name: t.name,
          desc: t.desc,
          render: (setting) => {
            setting.addToggle((tg) =>
              tg.setValue(s[t.key] as boolean).onChange((v) => {
                (s[t.key] as boolean) = v;
                void save().then(() => {
                  if (t.key === "scrollOffsetEnabled") this.update();
                });
              })
            );
          },
        });
      }

      if (group === "Editor") {
        rows.push({
          name: "Typewriter distance",
          desc: "Distance kept above and below the cursor; use 0 to turn it off.",
          visible: () => s.scrollOffsetEnabled,
          render: (setting) => {
            setting
              .setClass("zen-setting-sub")
              .addText((t) =>
                t
                  .setPlaceholder("25")
                  .setValue(s.scrollOffsetValue)
                  .onChange((v) => {
                    s.scrollOffsetValue = v;
                    void save();
                  })
              )
              .addDropdown((d) =>
                d
                  .addOptions({ percent: "% of editor", px: "px" })
                  .setValue(s.scrollOffsetPercentage ? "percent" : "px")
                  .onChange((v) => {
                    s.scrollOffsetPercentage = v === "percent";
                    void save();
                  })
              );
          },
        });
      }

      return { heading: group, rows };
    });
  }
}
