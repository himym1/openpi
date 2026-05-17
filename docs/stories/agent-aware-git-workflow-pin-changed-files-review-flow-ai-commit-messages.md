# Story: Agent-aware Git workflow: pin changed files, review flow, AI commit messages

Status: implemented

## Product Contract

Wire the agent integration path in the Git panel so that after agent turns, users can instantly see which files were changed, review those changes via a dedicated flow, and commit with AI-drafted messages that reflect what the agent actually did.

## Relevant Product Docs

- docs/product/: TBD

## Acceptance Criteria

- Agent_changed_files IPC event carries file paths (not just count) — `{ count: number, files: Array<{path, status, added, removed}> }` [implemented]
- GitPanel agent banner shows changed file count and is clickable — clicking opens a filtered view showing only agent-changed files [implemented]
- Agent-changed files section is visually distinguished and stays pinned until dismissed or committed [implemented]
- Dismissing the banner clears the pinned state and returns the GitPanel to normal unfiltered view [implemented]
- Generate commit message uses agent turn context (last assistant message) when available, falls back to heuristic [implemented]
- All IPC payloads are Zod-validated (no breaking changes to existing git IPC schemas) [verified: typecheck passes]
- Test matrix updated with 4 validation rows [implemented: docs/TEST_MATRIX.md]

## Design Notes

- TBD

## Validation

| Check | Command / Evidence | Status |
| --- | --- | --- |
| Story validation | npm run typecheck && npm run lint pass (zero errors). npx vitest run passes (17 tests). GitPanel agent banner is clickable and filters to agent-changed files. AGENT_CHANGED_FILES IPC carries file list. Commit message generation reads agent context from session messages. | implemented |

## Harness Delta

- Story packet created through story_create.

## Evidence

- `AGENT_CHANGED_FILES` IPC extended: electron/main.ts:731 sends `{ count, files }` — electron/preload.ts handles payload with typed `GitChangedFile[]`.
- GitPanel agent banner: `src/components/git/GitPanel.tsx` — `agentChangedFiles` signal replaced `agentChangedCount`, `showingAgentFiles` memo filters file sections, `handleReviewAgentChanges` toggles filtered view, `handleDismissAgentChanges` clears state.
- Commit message generation: `electron/gitHost.ts` — `generateCommitMessage()` accepts `agentContext`, `summarizeContext()` helper strips markdown/thinking blocks and extracts first 1-2 sentences.
- Agent context source: `electron/main.ts` — `GIT_GENERATE_COMMIT_MSG` handler reads last assistant message from session history.
- CSS: `src/index.css` — `.git-agent-banner:hover`, `.is-active`, `.git-agent-banner-review`, `.git-section--agent`, `.git-show-all-btn`.
- Verification: `npm run typecheck` (0 errors), `npm run lint` (0 warnings), `npx vitest run tests/gitHostFileTree.test.ts` (17/17 pass), `harness_lint` (0 issues).
