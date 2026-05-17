# Decision: Session Tree Visualization Approach

Status: accepted
Date: 2026-05-17

## Context

Sessions are JSONL v3 trees (parentId branching, fork points, compaction entries, labels) but the OpenPi renderer shows only a flat chat view. The session_entries SQLite table already stores parent_id for every entry. The Pi SDK SessionManager has getTree/getBranch/getChildren/getLabel APIs but these are not exposed to OpenPi. We need a tree view to make "trees, not chats" real.

## Decision

Two-layer approach: (1) Electron main reads session tree structure from the SQLite session_entries table (already indexed with parent_id) via a new IPC GET_SESSION_TREE channel — this is fast, always available, and doesn't depend on an active Pi session. (2) For live sessions, the renderer also subscribes to SessionManager tree events via the existing AgentSessionEvent stream when the active session mutates. Tree data types in ipc.ts (TreeBranch, ForkPoint, TreeEntryNode). Renderer renders a dedicated tree view component. No Pi SDK imports in renderer. No tree logic duplicated in renderer.

## Consequences

+ Tree data can be fetched instantly for any session (even closed ones) without starting Pi. + Clear authority boundary: SQLite read in main, tree rendering in renderer. + Reuses existing session_entries DB schema — no new table. - Live tree mutations (during streaming) need event-based refresh from AgentSessionEvent stream. - Two data sources (SQLite for historical, events for live) must stay consistent. - Need IPC Zod schemas and preload API additions for the new channel.

## Evidence

- Recorded through decision_record.
