# Decision: Agent-aware Git workflow integration approach

Status: accepted
Date: 2026-05-17

## Context

The Git panel exists with full source control functionality (status, staging, commit, sync, history). An `AGENT_CHANGED_FILES` IPC event already fires on `agent_end` with a file count. The generateCommitMessage is pure heuristic (scope detection). What's missing: (1) agent_changed_files carries only a count, not which files, (2) the agent banner is display-only — clicking it does nothing, (3) commit messages don't use agent context.

## Decision

Three independent slices, working renderer-first:
1. Extend AGENT_CHANGED_FILES IPC payload from `{count}` to `{count, files: Array<{path, status, added, removed}>}`. Store agent-changed file list in GitPanel state. When set, show a pinned "Agent changed" section above other file sections. Clicking the banner or a "Review" button filters the file tree to show only those files.
2. Banner clickability: clicking the agent banner toggles a `showingAgentChanges` signal that filters which file sections are visible. A "Show all" button restores the full view.
3. Agent-context commit messages: add a `GET_AGENT_TURN_SUMMARY` IPC that returns the last assistant message from the current session's messages (from session history in main). The generateCommitMessage call then has access to this summary to produce better messages. The heuristic scope detection remains as fallback.

## Consequences

(+) Minimal changes to existing IPC interfaces — just extending a payload, not breaking it. (+) Each slice is independently verifiable. (+) Renderer-only filtering means no main process changes for the review flow. (-) Agent turn summary depends on session history being available in main, which it already is for session replay. (-) The AI commit message approach is best-effort (agent turn summary) rather than a full Pi prompt-based generation — tradeoff for simplicity and speed.

## Evidence

- Recorded through decision_record.
