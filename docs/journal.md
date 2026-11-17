# obsidian-zen — journal

2026-10-09 13:06 orchestrator - init: moved from Mac (clean, = origin/main 85cc1c5; .pi/ + data.json copied), build green, store listing + release 1.1.4 checked
2026-10-09 13:06 orchestrator Q1 spawn: review of PR #1 (drag window from file tree) by yokisubscribe
2026-10-09 13:06 orchestrator Q1 landed: PR #1 verdict merge-with-changes (scrollbar no-drag, right-click note in setting text); build green, untested in Obsidian
2026-10-09 13:12 orchestrator Q1 followup: pr1-fixes 11e620a (drag region on tree root, zen-html-dragging during drags, setting text); build green; installed in Mac vault for manual test
2026-10-09 13:21 orchestrator Q1 landed: PR #1 squash-merged (9b4d3f9) after Merlin's manual test
2026-10-09 13:21 orchestrator - decided: Merlin approved release; 1.1.5 pushed, release workflow green, assets up
2026-10-09 13:21 orchestrator Q4 spawn: settings tabs (Merlin asked, for next update)
2026-10-09 13:21 orchestrator Q4 followup: feat/settings-tabs 4de209a, 5 tabs, build green, installed in Mac vault for manual test
2026-10-09 13:25 orchestrator Q4 landed: settings tabs on main (f71436e), released 1.1.6 with Merlin's go; worktrees removed
2026-10-09 13:26 orchestrator Q2 spawn: CI build check
2026-10-09 13:26 orchestrator Q3 spawn: release checklist
2026-10-09 13:26 orchestrator Q2 landed: .github/workflows/ci.yml (build on PR + main), YAML + build verified
2026-10-09 13:26 orchestrator Q3 landed: docs/RELEASE.md
2026-10-22 10:52 orchestrator Q5 spawn: git sync tab opt-in (Merlin decided: keep one plugin, don't split)
2026-10-22 10:58 orchestrator Q5 landed: git sync opt-in (dc6571c), released 1.1.7 with Merlin's go
2026-10-22 11:01 orchestrator - landed: README rewritten (no em dashes, plainer), pushed with Merlin's go
2026-11-06 01:33 orchestrator - resumed: thread moved lab2 -> dev (rsync, npm ci + build green at c9e378c); lab2 copy left in place
2026-11-06 01:33 orchestrator Q6 followup: new issue #2 (Windows minimize button), queued
2026-11-06 01:33 orchestrator Q7 followup: new issue #3 (changes only in Zen mode), decision to Merlin
2026-11-06 01:55 orchestrator Q7 decided: Merlin picked reset button + "Only in Zen mode" option
2026-11-06 01:55 orchestrator Q7 spawn: credit run sonnet/high, budget $5
2026-11-06 01:58 orch-worker Q7 cost: $0.4986 (sonnet) — RESULT: both features are built and committed, but I couldn't run them in Obsidian. Build is green. ✅ **Done** - "Only in Zen mode" toggle (off by default, so e [branch drain/Q7-20261106]
2026-11-06 01:58 orchestrator Q7 blocked: built a4c0899 on drain/Q7-20261106, build rerun green; user-visible, waits on Merlin's Obsidian test. cost: $0.50
2026-11-06 01:58 orchestrator Q6 spawn: credit run sonnet/medium, budget $3
2026-11-06 02:00 orch-worker Q6 cost: $0.1388 (sonnet) — ✅ **Done** - Window buttons set to no-drag on Windows/Linux frameless. macOS excluded. It is a 5-line CSS rule in `styles.css`. - Root cause: the sidebar tab-ba [branch drain/Q6-20261106]
2026-11-06 02:01 orchestrator Q6 failed: 7b03beb adds no-drag Obsidian already has (checked app.css 1.15); cost $0.14
2026-11-06 02:01 orchestrator Q6 spawn: retry sonnet/high with root cause (view-header drag under window buttons when root tabs hidden), branch drain/Q6b-20261106
2026-11-06 02:02 orch-worker Q6 cost: $0.2154 (sonnet) — ✅ **Done** - Fix: in `styles.css`, the top-right note header now has a no-drag strip over the window buttons. It also has right padding, mirroring Obsidian's ow [branch drain/Q6b-20261106]
2026-11-06 02:03 orchestrator Q6 blocked: 31373b2 on drain/Q6b-20261106 (no-drag strip + padding on top-right view header), build rerun green, titlebar z-index checked in app.css; needs Windows test. cost: $0.21
2026-11-06 02:10 orchestrator Q7 followup: test/q6-q7 6521d6a (Q7+Q6b) installed in Mac iCloud vault for Merlin's test; old files backed up on mbp ~/dev/build/zen-ui-backup-20261106
2026-11-17 05:54 orchestrator Q7 followup: fresh test vault on mbp ~/dev/build/zen-test-vault (only zen-ui, test/q6-q7 6521d6a), opened in Obsidian
2026-11-17 05:59 orchestrator Q7 landed: merged with Q6b at a8d17b0 after Merlin's test ("features is great publish now")
2026-11-17 05:59 orchestrator Q6 landed: in a8d17b0, Windows unverified
2026-11-17 05:59 orchestrator - decided: Merlin "publish now"; released 1.1.8 (d883a76), pushed main + tag
2026-11-17 05:59 orchestrator Q8 followup: settings tab row spacing broken in Obsidian 1.15 (Merlin's screenshot), queued
2026-11-17 06:00 orchestrator - landed: 1.1.8 release workflow green, 3 assets up
2026-11-17 06:00 orchestrator Q8 spawn: credit run sonnet/high, budget $4
2026-11-17 06:01 orchestrator - landed: replies posted on #3 and #2 (1.1.8 out, #2 asks reporter to test) with Merlin's go
