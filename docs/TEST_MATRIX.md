# OpenPi Test Matrix

Map product behavior to proof. Statuses: `planned`, `in_progress`, `implemented`, `changed`, `retired`.

| Area | Behavior | Status | Evidence | Notes |
|---|---|---|---|---|
| Harness | Goal/harness loop is discoverable via `/goal` | implemented | `/goal` in Composer.tsx, sidecar expansion | |
| Harness | Harness status reports repo-local docs | implemented | `harness_status` extension tool | |
| Harness | Intake classifies intent and risk | implemented | `harness_intake` extension tool | |
| Harness | Harness init scaffolds `docs/` | implemented | `harness_init` extension tool | |
| Harness | Harness lint audits docs for gaps | implemented | `harness_lint` extension tool | |
| Harness | Story packets can be created | implemented | `story_create` extension tool | |
| Harness | Decisions can be recorded | implemented | `decision_record` extension tool | |
| Harness | Test matrix rows can be appended | implemented | `test_matrix_update` extension tool | |
| Harness | Legacy spec tools are compatibility-only | implemented | Labels/descriptions mark legacy; guidance stripped from controller | |
| Harness | Renderer shows harness tool cards | implemented | `HarnessToolRow` in ToolCardView.tsx | |
| Harness | docs/HARNESS.md exists with operating rules | implemented | docs/HARNESS.md | |
| Harness | docs/FEATURE_INTAKE.md exists with risk checklist | implemented | docs/FEATURE_INTAKE.md | |
| Harness | docs/TEST_MATRIX.md exists with evidence rules | implemented | docs/TEST_MATRIX.md | |
| Harness | docs/templates/story.md exists | implemented | docs/templates/story.md | |
| Harness | docs/templates/spec-intake.md exists | implemented | docs/templates/spec-intake.md | |
| Harness | docs/product/ describes goal/harness system | implemented | docs/product/GOAL_HARNESS.md | |
| Harness | docs/product/ describes process model | implemented | docs/product/PROCESS_MODEL.md | |
| Harness | docs/decisions/ records goal-harness-model ADR | implemented | docs/decisions/2026-05-17-goal-harness-model.md | |
| Harness | docs/decisions/ records legacy-adapters ADR | implemented | docs/decisions/2026-05-17-harness-v2-legacy-adapters.md | |
| Harness | docs/decisions/ records renderer-not-authority ADR | implemented | docs/decisions/2026-05-17-renderer-not-authority.md | |
| Harness | docs/stories/ has next-slice story packet | implemented | docs/stories/goal-status-indicator.md | |
| IPC | Renderer never runs Git or filesystem | implemented | Preload boundary, contextIsolation, Zod validation | |
| IPC | All IPC payloads validated by Zod | implemented | Schema definitions in ipc.ts | |
| Tool Cards | `harness_status` shows doc counts | implemented | `parseHarnessOutputSummary` | |
| Tool Cards | `harness_intake` shows classification/risk | implemented | `parseHarnessOutputSummary` | |
| Tool Cards | `story_create` shows criteria count | implemented | `parseHarnessOutputSummary` | |
| Tool Cards | `decision_record` shows status | implemented | `parseHarnessOutputSummary` | |
| Tool Cards | `test_matrix_update` shows area/behavior | implemented | `parseHarnessOutputSummary` | |
| Composer | `/goal` slash command is surfaced | implemented | Slash commands in Composer.tsx | |
| Palette | Goal loop palette entry exists | implemented | `goalLoop` in App.tsx | |
| Extension | Extension typechecks with bundler resolution | implemented | CI verification command | |
| UI | Harness tool cards show `legacy` badge | implemented | `harness-badge--legacy` in ToolCardView.tsx | |
| UI | Goal banner shows when /goal is active | implemented | GoalBanner.tsx | |
| UI | Goal banner shows run/idle step badge | implemented | `goal-badge--running`/`goal-badge--idle` in index.css | |
| UI | Goal banner can be dismissed | implemented | onDismiss clears activeGoalText | |
| Composer | Goal state syncs from /goal &lt;intent&gt; on send | implemented | detectAndSetGoal in useOpenPiSession.send() | |
| Composer | Goal clears on /goal clear or empty /goal | implemented | send() clears activeGoalText | |
| UI | Story browser panel lists stories from docs/stories/ with status badges | implemented | StoryBrowser.tsx |  |
| Tooling | Harness lint pre-commit hook detects missing docs before commit | implemented | scripts/harness-lint.sh, .githooks/pre-commit |  |
| Tooling | Harness lint can be run standalone via npm run precommit | implemented | package.json scripts.precommit |  |
| Sidecar / Extensions Lifecycle | session_shutdown emitted before session.dispose() so extensions can clean up timers and ctx references | implemented | electron/piSidecar.ts — emitSessionShutdown helper called before both session.dispose() sites (startSession line 375, stop handler line 901). npm run typecheck + lint pass. | Fixes pi-sub-bar crash: Error "This extension ctx is stale after session replacement or reload" — the extension's timer kept firing with stale ctx because session_shutdown was never emitted before disposal. |
| Session Tree | IPC backend reads session tree from SQLite session_entries and returns structured tree with branches, fork points, compaction, labels | planned | npm run typecheck && npm run lint | New GET_SESSION_TREE IPC channel. Tree types in ipc.ts. SessionIndexStore.getSessionTree() method. |
| Session Tree | Tree view panel renders session as interactive tree with branch navigation, fork points, compaction summaries, label badges | planned | Visual verification on sessions with branches, compaction, labels | TreeView component in src/components/session-tree/. Trigger from composer header or sidebar toggle. |
| Session Tree | Clicking a tree node scrolls conversation pane to the corresponding message | planned | Message highlight + scroll-to-index in VList |  |
| Session Tree | IPC backend reads session tree from SQLite session_entries and returns structured tree with branches, fork points, compaction, labels | implemented | npm run typecheck && npm run lint pass. GET_SESSION_TREE IPC channel with Zod schemas (treeEntryNodeSchema, forkPointSchema, branchSchema, sessionTreeResponseSchema). SessionIndexStore.getSessionTree() method. preload API. main IPC handler. |  |
| Session Tree | Tree view panel renders session as interactive tree with branch navigation, fork points, compaction summaries, label badges | implemented | npm run typecheck && npm run lint pass. SessionTreePanel component in left drawer. Collapsible branches, fork point badges with child leaf navigation, compaction labels with tokens, label badges, active leaf dot. GitBranch icon toggle in BottomBar. |  |
| Session Tree | Clicking a tree node scrolls conversation pane to the corresponding message | implemented | scrollToMessageId prop on ConversationPane. createEffect searches items[] for matching entryId and calls VList scrollToIndex. Wire in App.tsx via setScrollToMessageId. |  |
| Session Tree | Tree view panel auto-refreshes when agent finishes a turn (isStreaming true→false) — live tree mutations during streaming | implemented | npm run typecheck && npm run lint pass. treeRefreshVersion signal in App.tsx bumped on streaming-end. refreshTrigger prop on SessionTreePanel watched alongside sessionPath. | Completes the "live tree mutations" enhancement from ADR. Covers agent-end refresh. Compaction-during-streaming edge case TBD. |
| Session Tree | Session Tree UI is redesigned as a Session Map with branch metrics, visible root-to-leaf rails, stronger fork/compaction/label treatment, clearer active leaf marker, and a distinct GitFork entry point tooltip. | implemented | npm run typecheck; npm run lint; src/components/sidebar/SessionTreePanel.tsx; src/components/BottomBar.tsx; src/index.css | Replaces flat chat-list visual treatment with structural session-map hierarchy while preserving click-to-scroll and live refresh behavior. |
| Session Tree | Session Map uses compact inspector density by default: inline summary header, hidden zero metric cards, single-line normal entries, important-only metadata, smaller markers/rails, lighter solo active branch styling, and clearer empty-entry copy. | implemented | npm run typecheck; npm run lint; src/components/sidebar/SessionTreePanel.tsx; src/index.css | Refines the prior visual redesign after screenshot review so long single-branch sessions scan as a navigation map rather than a tall transcript. |
| Appearance Preferences | Renderer UI font stack avoids macOS private/system UI font aliases that trigger CoreText `.SFNS-*` fallback warnings; saved font preferences reject private `.SF*`, SF Pro/San Francisco, `system-ui`, `-apple-system`, and `BlinkMacSystemFont` UI aliases. | implemented | npx vitest run tests/appearancePreferences.test.ts; npm run typecheck; npm run lint; src/lib/appearancePreferences.ts; src/index.css | Default UI stack now uses bundled/named app fonts followed by Helvetica Neue, Arial, Segoe UI, sans-serif instead of Chromium/macOS system aliases. |
| Session Tree | Clicking a Session Map node scrolls the conversation to the matching message. The scroll effect re-fires when the same node is clicked again (nonce-based signal identity). | implemented | npm run typecheck; npm run lint; src/App.tsx:786-788; src/components/conversation/ConversationPane.tsx:194-200 | Fixed SolidJS signal identity bug: setScrollToMessageId with the same value twice is a no-op, so re-clicking the same node did nothing. Added scrollToMessageNonce counter that makes each click produce a unique signal value. |
