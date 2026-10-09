import { FileSystemAdapter, ItemView, Notice, WorkspaceLeaf, setIcon } from "obsidian";
import { execFile } from "child_process";

export const SYNC_VIEW_TYPE = "zen-sync";

const GIT_PLUGIN_ID = "obsidian-git";
// Obsidian launched from the Dock doesn't inherit the shell PATH.
const GIT_PATH = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", process.env.PATH].join(":");

type SyncStatus = {
  branch: string;
  upstream: string | null;
  ahead: number;
  behind: number;
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

  private git(args: string[]): Promise<string> {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter)) return Promise.reject(new Error("Vault is not on the local file system."));
    const cwd = adapter.getBasePath();
    return new Promise((resolve, reject) => {
      execFile("git", ["-c", "core.quotePath=false", ...args], { cwd, env: { ...process.env, PATH: GIT_PATH } }, (err, stdout, stderr) =>
        err ? reject(new Error(stderr.trim() || err.message)) : resolve(stdout)
      );
    });
  }

  async refresh(fetch = false) {
    try {
      if (fetch) {
        this.busy = "Fetching…";
        this.render();
        await this.git(["fetch", "--quiet"]);
        this.lastFetch = new Date();
      }
      const [status, log] = await Promise.all([
        this.git(["status", "--porcelain=v1", "-b"]),
        this.git(["log", "-1", "--format=%cr%x00%s"]),
      ]);
      this.status = parseStatus(status, log);
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

function parseStatus(status: string, log: string): SyncStatus {
  const [head, ...lines] = status.split("\n").filter(Boolean);
  // e.g. "## main...origin/main [ahead 1, behind 2]"
  const m = head.match(/^## (.+?)(?:\.\.\.(\S+))?(?: \[(.*)\])?$/);
  const tracking = m?.[3] ?? "";
  const [ago, ...msg] = log.trim().split("\0");
  return {
    branch: m?.[1] ?? "?",
    upstream: m?.[2] ?? null,
    ahead: Number(tracking.match(/ahead (\d+)/)?.[1] ?? 0),
    behind: Number(tracking.match(/behind (\d+)/)?.[1] ?? 0),
    changes: lines.map((l) => ({ code: l.slice(0, 2).trim(), path: l.slice(3).replace(/^"|"$/g, "") })),
    lastCommit: msg.join(" "),
    lastCommitAgo: ago,
  };
}
