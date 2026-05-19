# OpenPi v0.1.17 - 2026-05-19

### Added

- **Goal and plan feedback loop** — added durable goal/plan sync for OpenPi, a structured `clear_goal` tool, clearer `update_plan` output for Pi TUI, and explicit guidance separating ephemeral plans from durable `pi-tasks`. (173c823, caa39ec)
- **Terminal polish** — added shell integration for zsh/bash cwd markers, true-color env, WebGL rendering, Ghostty-like styling, Nerd Font fallback, cwd-aware terminal tab labels, rename flow, and exit indicators. (00e86e0)
- **File editor upgrades** — migrated preview editing to CodeMirror 6 with language support for TS/JS, Rust, Python, HTML/CSS, JSON, and Markdown; added working word wrap, Vim mode, search highlighting/autoscroll, and a persisted theme selector for GitHub, Tokyo Night, Nord, Atom One, Aura, Xcode, and Copilot-like themes. (820d2c0, 8d6b4ac, ac37a66)
- **Workbench file controls** — added file/folder delete from the file tree with main-owned trash confirmation, Git/file tree refresh, and automatic closing of deleted previews. (c8f7e3c)
- **Harness and IPC coverage** — expanded IPC, PTY, session index, and harness lint coverage. (e5c420a)

### Changed

- **Workbench surfaces** — polished file preview search behavior, file tree scrolling, plan tool cards, Git/file surfaces, composer metadata, and release update metadata. (c8f7e3c, 3dda132)
- **Stories navigation** — removed the bottom-bar Stories entry point while keeping story docs available in the repository. (caa39ec)
- **Roadmap and architecture docs** — documented Phase 7 Agent Workbench Quality and Terax architecture lessons. (fdf1258, b7462eb)

### Fixed

- **OpenPi bridge detection** — fixed `workerPid` getter and `OPENPI_BRIDGE_APP` sync bridge detection. (452e200)
- **Composer TPS display** — summed per-message durations and moved TPS display into the Composer. (ae258b2)
- **Release automation** — pinned `action-gh-release` with explicit token handling and fail-on-unmatched-assets behavior. (21b4186)
