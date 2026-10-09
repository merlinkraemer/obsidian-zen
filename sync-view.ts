import { ItemView, Notice, WorkspaceLeaf, setIcon } from "obsidian";

export const SYNC_VIEW_TYPE = "zen-sync";

const GIT_PLUGIN_ID = "obsidian-git";

/** The parts of the Git plugin's git manager this view reads. All git work happens in the Git plugin. */
type GitManager = {
  status: () => Promise<{ all: { vaultPath: string; index: string; workingDir: string }[] }>;
  branchInfo: () => Promise<{ current?: string; tracking?: string }>;
  log: (file: undefined, relativeToVault: boolean, limit: number) => Promise<{ message: string; date?: string }[]>;
  fetch: () => Promise<void>;
  /** simple-git instance on desktop; used only for ahead/behind counts. */
  git?: { raw?: (args: string[]) => Promise<string> };
};

type SyncStatus = {
  branch: string;
  upstream: string | null;
  ahead: number | null;
  behind: number | null;
  changes: { code: string; path: string }[];
  lastCommit: string;
  lastCommitAgo: string;
};

export class SyncView extends ItemView {
  private status: SyncStatus | null = null;
  private error: string | null = null;
  private busy: string | null = null;
  private lastFetch: Date | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return SYNC_VIEW_TYPE;
  }

  getDisplayText() {
    return "Sync";
  }

  getIcon() {
    return "refresh-cw";
  }

  async onOpen() {
    this.contentEl.addClass("zen-sync");
    for (const ev of [
      "obsidian-git:refreshed",
      "obsidian-git:head-change",
      "obsidian-git:status-changed",
    ]) {
      this.registerEvent(this.app.workspace.on(ev as "quit", () => void this.refresh()));
    }
    this.render();
    await this.refresh(true);
  }

  private gitManager(): GitManager {
    const app = this.app as unknown as {
      plugins: { enabledPlugins: Set<string>; plugins: Record<string, { gitManager?: GitManager }> };
    };
    const manager = app.plugins.enabledPlugins.has(GIT_PLUGIN_ID)
      ? app.plugins.plugins[GIT_PLUGIN_ID]?.gitManager
      : undefined;
    if (!manager) throw new Error("Enable the Git community plugin to see sync status.");
    return manager;
  }

  async refresh(fetch = false) {
    try {
      const git = this.gitManager();
      if (fetch) {
        this.busy = "Fetching…";
        this.render();
        await git.fetch();
        this.lastFetch = new Date();
      }
      const [status, branch, log] = await Promise.all([git.status(), git.branchInfo(), git.log(undefined, false, 1)]);
      let ahead: number | null = null;
      let behind: number | null = null;
      if (branch.tracking && git.git?.raw) {
        const counts = await git.git.raw(["rev-list", "--left-right", "--count", `HEAD...${branch.tracking}`]);
        [ahead, behind] = counts.trim().split(/\s+/).map(Number);
      }
      this.status = {
        branch: branch.current ?? "?",
        upstream: branch.tracking ?? null,
        ahead,
        behind,
        changes: status.all.map((f) => ({ code: (f.index + f.workingDir).trim(), path: f.vaultPath })),
        lastCommit: log[0]?.message ?? "",
        lastCommitAgo: log[0]?.date ? timeAgo(new Date(log[0].date)) : "",
      };
      this.error = null;
    } catch (e) {
      this.error = (e as Error).message;
    }
    this.busy = null;
    this.render();
  }

  private runGitCommand(id: string, label: string) {
    const app = this.app as unknown as {
      plugins: { enabledPlugins: Set<string> };
      commands: { executeCommandById: (id: string) => boolean };
    };
    if (!app.plugins.enabledPlugins.has(GIT_PLUGIN_ID)) {
      new Notice("Zen UI: enable the Git community plugin to sync.");
      return;
    }
    // The Git plugin runs the command async and emits obsidian-git:* events when done.
    this.busy = label;
    this.render();
    app.commands.executeCommandById(`${GIT_PLUGIN_ID}:${id}`);
  }

  private render() {
    const el = this.contentEl;
    el.empty();

    const body = el.createDiv({ cls: "zen-sync-body" });
    const s = this.status;

    let icon = "check-circle-2";
    let title = "In sync";
    let tone = "is-ok";
    if (this.error) {
      icon = "alert-circle";
      title = "Git error";
      tone = "is-error";
    } else if (this.busy) {
      icon = "loader";
      title = this.busy;
      tone = "is-busy";
    } else if (!s) {
      icon = "loader";
      title = "Loading…";
      tone = "is-busy";
    } else if (!s.upstream) {
      icon = "alert-circle";
      title = "No remote branch";
      tone = "is-warn";
    } else if (s.changes.length || s.ahead || s.behind) {
      icon = s.behind ? "arrow-down-circle" : "arrow-up-circle";
      title = [
        s.changes.length && `${s.changes.length} changed`,
        s.ahead && `${s.ahead} to push`,
        s.behind && `${s.behind} to pull`,
      ]
        .filter(Boolean)
        .join(" · ");
      tone = "is-warn";
    }

    const head = body.createDiv({ cls: `zen-sync-state ${tone}` });
    setIcon(head.createSpan({ cls: "zen-sync-state-icon" }), icon);
    head.createSpan({ cls: "zen-sync-state-title", text: title });

    if (this.error) {
      body.createDiv({ cls: "zen-sync-error", text: this.error });
      return;
    }
    if (!s) return;

    const meta = [s.upstream ? `${s.branch} → ${s.upstream}` : s.branch];
    if (this.lastFetch) meta.push(`checked ${this.lastFetch.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
    body.createDiv({ cls: "zen-sync-meta", text: meta.join(" · ") });

    const actions = body.createDiv({ cls: "zen-sync-actions" });
    const action = (icon: string, label: string, onClick: () => void) => {
      const row = actions.createDiv({ cls: "zen-sync-action" });
      setIcon(row.createSpan({ cls: "zen-sync-action-icon" }), icon);
      row.createSpan({ text: label });
      if (this.busy) row.addClass("is-disabled");
      else row.addEventListener("click", onClick);
    };
    action("refresh-cw", "Sync now", () => this.runGitCommand("push", "Syncing…"));
    action("arrow-down-to-line", "Pull", () => this.runGitCommand("pull", "Pulling…"));
    action("arrow-up-from-line", "Push", () => this.runGitCommand("push2", "Pushing…"));
    action("radar", "Check remote", () => void this.refresh(true));

    const section = (label: string) => {
      const sec = body.createDiv({ cls: "zen-sync-section" });
      sec.createDiv({ cls: "zen-sync-heading", text: label });
      return sec;
    };

    const last = section("Last commit");
    last.createDiv({ cls: "zen-sync-commit", text: s.lastCommit, attr: { title: s.lastCommit } });
    last.createDiv({ cls: "zen-sync-meta", text: s.lastCommitAgo });

    if (s.changes.length) {
      const list = section(`Changes · ${s.changes.length}`);
      for (const c of s.changes) {
        const item = list.createDiv({ cls: "zen-sync-change", attr: { title: c.path } });
        item.createSpan({ cls: "zen-sync-code", text: c.code });
        item.createSpan({ cls: "zen-sync-path", text: c.path.split("/").pop() ?? c.path });
      }
    }
  }
}

function timeAgo(date: Date): string {
  const seconds = (date.getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(0, "minute");
}
