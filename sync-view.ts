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
    const cwd = (this.app.vault.adapter as FileSystemAdapter).getBasePath();
    return new Promise((resolve, reject) => {
      execFile("git", args, { cwd, env: { ...process.env, PATH: GIT_PATH } }, (err, stdout, stderr) =>
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
      new Notice("Obsidian Zen: enable the Git community plugin to sync.");
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

    const actions = el.createDiv({ cls: "zen-sync-actions" });
    const button = (icon: string, text: string, onClick: () => void, cta = false) => {
      const b = actions.createEl("button", { cls: cta ? "mod-cta" : "" });
      setIcon(b.createSpan({ cls: "zen-sync-btn-icon" }), icon);
      b.createSpan({ text });
      b.disabled = this.busy !== null;
      b.addEventListener("click", onClick);
    };
    button("refresh-cw", "Sync now", () => this.runGitCommand("push", "Syncing…"), true);
    button("arrow-down", "Pull", () => this.runGitCommand("pull", "Pulling…"));
    button("arrow-up", "Push", () => this.runGitCommand("push2", "Pushing…"));
    button("rotate-ccw", "Check", () => void this.refresh(true));

    if (this.busy) el.createDiv({ cls: "zen-sync-busy", text: this.busy });
    if (this.error) {
      el.createDiv({ cls: "zen-sync-error", text: this.error });
      return;
    }
    const s = this.status;
    if (!s) return;

    const summary = el.createDiv({ cls: "zen-sync-summary" });
    const row = (label: string, value: string, cls = "") => {
      const r = summary.createDiv({ cls: "zen-sync-row" });
      r.createSpan({ cls: "zen-sync-label", text: label });
      r.createSpan({ cls: `zen-sync-value ${cls}`, text: value });
    };

    let state = "In sync";
    let stateCls = "is-ok";
    if (!s.upstream) {
      state = "No remote branch";
      stateCls = "is-warn";
    } else if (s.ahead || s.behind) {
      state = [s.ahead && `${s.ahead} to push`, s.behind && `${s.behind} to pull`]
        .filter(Boolean)
        .join(", ");
      stateCls = "is-warn";
    }
    if (s.changes.length) {
      state = `${s.changes.length} uncommitted` + (stateCls === "is-ok" ? "" : `, ${state}`);
      stateCls = "is-warn";
    }
    row("Status", state, stateCls);
    row("Branch", s.upstream ? `${s.branch} → ${s.upstream}` : s.branch);
    row("Last commit", `${s.lastCommitAgo} · ${s.lastCommit}`);
    if (this.lastFetch) row("Checked", this.lastFetch.toLocaleTimeString());

    if (s.changes.length) {
      el.createDiv({ cls: "zen-sync-heading", text: "Changes" });
      const list = el.createDiv({ cls: "zen-sync-changes" });
      for (const c of s.changes) {
        const item = list.createDiv({ cls: "zen-sync-change", attr: { title: c.path } });
        item.createSpan({ cls: "zen-sync-code", text: c.code });
        item.createSpan({ cls: "zen-sync-path", text: c.path });
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
