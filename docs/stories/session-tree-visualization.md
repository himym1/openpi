# Story: Session Tree Visualization

Status: implemented

## Product Contract

Surface Pi's JSONL v3 session tree (parentId branching, fork points, compaction entries, labels) in the OpenPi UI so users can navigate branches, see compaction summaries, jump to fork points, and understand session topology — making "trees, not chats" a visible differentiator vs Cursor/Codex.

## Relevant Product Docs

- docs/product/: TBD

## Acceptance Criteria

- IPC backend: New GET_SESSION_TREE channel that reads session_entries from SQLite and builds the full tree structure (parentId → children mapping, fork point detection, compaction insertion, label attachment), returning TreeBranch[] with entry references.
- Tree data types: Zod schemas in ipc.ts for TreeBranch, ForkPoint, TreeEntryNode (type: message|compaction|branch_summary|label|model_change), and SessionTree response.
- Tree view panel: A left-drawer or modal tree view showing the session as an interactive tree — each entry as a node in a collapsible branch tree, with visual distinction for fork points, compaction entries, labels, and branch ends.
- Branch navigation: Clicking a message entry in the tree view scrolls the conversation pane to the corresponding message and highlights it.
- Fork point indicators: Fork points show the number of child branches and a 'Switch branch' action.
- Compaction summaries: Compaction entry nodes display tokensBefore, reason, and summary inline, same as current system message display.
- Label badges: Labels (user-set bookmarks on entries) appear as badge annotations on tree nodes.
- Current position indicator: The active leaf/branch is visually distinct in the tree.
- Entry point: A 'Show session tree' button or tab in the composer header (or a toggle in the sidebar) opens/closes the tree view.
- Validation: npm run typecheck && npm run lint pass. Tree data is fetched via IPC and rendered correctly for sessions with branches, forks, compaction, and labels.

## Design Notes

- TBD

## Validation

| Check | Command / Evidence | Status |
| --- | --- | --- |
| Story validation | npm run typecheck && npm run lint pass. All branches, fork points, compaction, labels rendered in tree view. Click-to-scroll works. | planned |

## Harness Delta

- Story packet created through story_create.

## Evidence

- Pending implementation evidence.
