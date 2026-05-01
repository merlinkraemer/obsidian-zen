import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  WorkspaceLeaf,
  setIcon,
} from "obsidian";
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
  showNewTab: boolean;
  showTabList: boolean;
  showSidebarToggle: boolean;
  showFileNavHeader: boolean;
  // Window chrome
  showRootTabBar: boolean;
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
  defaultLeftSidebarTabs: true,
  dailyNoteButton: true,
  showFilesTab: true,
  showSearchTab: true,
  showNewTab: true,
  showTabList: true,
  showSidebarToggle: true,
  showFileNavHeader: true,
  showRootTabBar: false,
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
  | "Sidebar layout"
  | "Sidebar header"
  | "Window chrome"
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
};

const TOGGLES: ToggleDef[] = [
  // Sidebar layout
  {
    key: "tabHeaderBottom",
    className: "zen-tab-header-bottom",
    when: "on",
    name: "Tab header at bottom",
    desc: "Move the sidebar tab header bar to the bottom of the sidebar.",
    group: "Sidebar layout",
  },
  {
    key: "tabHeaderRightAlign",
    className: "zen-tab-header-right",
    when: "on",
    name: "Right-align tab header icons",
    desc: "Push tabs and buttons in the sidebar tab header to the right edge.",
    group: "Sidebar layout",
  },
  {
    key: "splitTabHeader",
    className: "zen-split-tab-header",
    when: "on",
    name: "Split tab header",
    desc: "Keep tabs at the top, pin action icons to the bottom. Turn off 'Tab header at bottom' when using this.",
    group: "Sidebar layout",
  },
  {
    key: "roomySidebar",
    className: "zen-roomy-sidebar",
    when: "on",
    name: "Roomy sidebar spacing",
    desc: "Extra padding in the file explorer.",
    group: "Sidebar layout",
  },
  {
    key: "showTreeLines",
    className: "zen-hide-tree-lines",
    when: "off",
    name: "Show tree indent lines",
    desc: "Vertical guide lines for nested folders and files.",
    group: "Sidebar layout",
  },
  {
    key: "defaultLeftSidebarTabs",
    name: "Default sidebar tabs on startup",
    desc: "On startup, detach any sidebar tab not enabled below (Files, Search). You can still add others manually.",
    group: "Sidebar layout",
  },
  // Sidebar header
  {
    key: "showFilesTab",
    name: "Show Files tab",
    desc: "File explorer tab in the sidebar.",
    group: "Sidebar header",
  },
  {
    key: "showSearchTab",
    name: "Show Search tab",
    desc: "Search tab in the sidebar.",
    group: "Sidebar header",
  },
  {
    key: "dailyNoteButton",
    name: "Show daily note button",
    desc: "Calendar icon in the tab header that opens today's daily note (requires the core Daily notes plugin).",
    group: "Sidebar header",
  },
  {
    key: "showNewTab",
    className: "zen-hide-new-tab",
    when: "off",
    name: "Show new tab (+) button",
    desc: "Plus button in the sidebar tab header.",
    group: "Sidebar header",
  },
  {
    key: "showTabList",
    className: "zen-hide-tab-list",
    when: "off",
    name: "Show tab list dropdown",
    desc: "Chevron-down dropdown in the sidebar tab header.",
    group: "Sidebar header",
  },
  {
    key: "showSidebarToggle",
    className: "zen-hide-sidebar-toggle",
    when: "off",
    name: "Show sidebar toggle button",
    desc: "Left and right sidebar collapse/expand buttons.",
    group: "Sidebar header",
  },
  {
    key: "showFileNavHeader",
    className: "zen-hide-file-nav-header",
    when: "off",
    name: "Show file explorer action bar",
    desc: "Action button row (new note, sort, etc.) at the top of the file explorer.",
    group: "Sidebar header",
  },
  // Window chrome
  {
    key: "showRootTabBar",
    className: "zen-hide-root-tabs",
    when: "off",
    name: "Show root tab bar",
    desc: "Tab container at the top of the main editor window.",
    group: "Window chrome",
  },
  {
    key: "showStatusBar",
    className: "zen-hide-status-bar",
    when: "off",
    name: "Show status bar",
    desc: "Word count, character count, backlink count at the bottom of the window.",
    group: "Window chrome",
  },
  {
    key: "showVaultName",
    className: "zen-hide-vault-name",
    when: "off",
    name: "Show vault name",
    desc: "Vault profile in the left sidebar. Warning: also hides Settings and vault switcher icons — use hotkeys or the command palette instead.",
    group: "Window chrome",
  },
  {
    key: "showScrollbars",
    className: "zen-hide-scrollbars",
    when: "off",
    name: "Show scrollbars",
    desc: "All scrollbars across the app.",
    group: "Window chrome",
  },
  {
    key: "showTooltips",
    className: "zen-hide-tooltips",
    when: "off",
    name: "Show tooltips",
    desc: "Hover tooltips on icons and buttons.",
    group: "Window chrome",
  },
  // Editor
  {
    key: "highlightActiveLine",
    className: "zen-no-line-highlight",
    when: "off",
    name: "Highlight current line",
    desc: "Background tint on the line that contains the cursor.",
    group: "Editor",
  },
  {
    key: "showPropertiesReading",
    className: "zen-hide-properties-reading",
    when: "off",
    name: "Show properties in reading view",
    desc: "Frontmatter properties section in reading mode.",
    group: "Editor",
  },
  {
    key: "scrollOffsetEnabled",
    name: "Scroll offset (typewriter scrolling)",
    desc: "Keep the cursor a configurable distance from the top and bottom of the editor.",
    group: "Editor",
  },
  // Search & modals
  {
    key: "showSearchSuggestions",
    className: "zen-hide-search-suggestions",
    when: "off",
    name: "Show search suggestions",
    desc: "Suggestions popover under the search input.",
    group: "Search & modals",
  },
  {
    key: "showSearchCounts",
    className: "zen-hide-search-counts",
    when: "off",
    name: "Show search match counts",
    desc: "Number of matches per result in the search pane.",
    group: "Search & modals",
  },
  {
    key: "showModalInstructions",
    className: "zen-hide-modal-instructions",
    when: "off",
    name: "Show modal instructions",
    desc: "Instructional tip rows at the bottom of modals (e.g. command palette).",
    group: "Search & modals",
  },
];

const GROUP_ORDER: Group[] = [
  "Window chrome",
  "Sidebar header",
  "Search & modals",
  "Editor",
  "Sidebar layout",
];

export default class ObsidianZenPlugin extends Plugin {
  settings!: ZenSettings;

  async onload() {
    await this.loadSettings();
    this.applyAll();
    this.addSettingTab(new ZenSettingTab(this.app, this));

    this.registerEditorExtension(buildScrollOffsetExtension(this));

    this.addCommand({
      id: "zenmode-toggle",
      name: "Zenmode toggle",
      callback: () => this.toggleZenMode(),
    });

    this.app.workspace.onLayoutReady(() => {
      if (this.settings.defaultLeftSidebarTabs) {
        void this.ensureDefaultSidebarTabs();
      }
      this.refreshDailyNoteButtons();
    });

    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.refreshDailyNoteButtons())
    );
  }

  onunload() {
    for (const t of TOGGLES) {
      if (t.className) document.body.classList.remove(t.className);
    }
    this.removeDailyNoteButtons();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.applyAll();
    this.refreshDailyNoteButtons();
  }

  applyAll() {
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
      if (!isFullscreen) document.documentElement.requestFullscreen?.();
    } else {
      ws.leftSplit?.expand();
      ws.rightSplit?.expand();
      if (document.fullscreenElement) document.exitFullscreen?.();
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
      console.warn(
        "[Obsidian Zen] Daily notes core plugin is disabled — enable it in Settings → Core plugins."
      );
    }
  }

  async ensureDefaultSidebarTabs() {
    const ws = this.app.workspace;
    const allowed = new Set<string>();
    if (this.settings.showFilesTab) allowed.add("file-explorer");
    if (this.settings.showSearchTab) allowed.add("search");

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

    if (this.settings.showFilesTab) {
      const fe = ws.getLeavesOfType("file-explorer")[0];
      if (fe) ws.revealLeaf(fe);
    }
  }
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
    containerEl.empty();
    containerEl.addClass("zen-settings");

    for (const group of GROUP_ORDER) {
      new Setting(containerEl).setName(group).setHeading();
      for (const t of TOGGLES.filter((x) => x.group === group)) {
        new Setting(containerEl)
          .setName(t.name)
          .setDesc(t.desc)
          .addToggle((tg) =>
            tg
              .setValue(this.plugin.settings[t.key] as boolean)
              .onChange(async (v) => {
                (this.plugin.settings[t.key] as boolean) = v;
                await this.plugin.saveSettings();
              })
          );
      }

      if (group === "Editor") {
        new Setting(containerEl)
          .setName("Scroll offset uses percentage")
          .setDesc(
            "Treat the distance value below as a percentage of editor height. Off = pixels."
          )
          .addToggle((tg) =>
            tg
              .setValue(this.plugin.settings.scrollOffsetPercentage)
              .onChange(async (v) => {
                this.plugin.settings.scrollOffsetPercentage = v;
                await this.plugin.saveSettings();
              })
          );

        new Setting(containerEl)
          .setName("Scroll offset distance")
          .setDesc(
            'Minimum distance kept above and below the cursor. Unit: % of editor height (default) or px. 0 disables.'
          )
          .addText((t) =>
            t
              .setPlaceholder("25")
              .setValue(this.plugin.settings.scrollOffsetValue)
              .onChange(async (v) => {
                this.plugin.settings.scrollOffsetValue = v;
                await this.plugin.saveSettings();
              })
          );
      }
    }
  }
}
