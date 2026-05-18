# OpenPi Goal System

Session-level objective + plan management for the Pi coding agent.

## Architecture

The goal system runs as a Pi extension (`.pi/extensions/harness/index.ts`) and integrates with OpenPi's Electron main process via a shared JSON file.

### Extension Layer (Pi SDK)

- **4 LLM tools**: `get_goal`, `create_goal`, `update_goal`, `update_plan`
- **Context injection**: `<goal_context>`, `<budget_limit>`, `<objective_updated>` fragments
- **Plan approval**: `<proposed_plan>` streaming detection + overlay
- **`/goal` slash command**: set, edit, pause, resume, clear, budget

### Electron Main Layer

- **Goal file watcher**: polls `.openpi-goal.json`, forwards to renderer via IPC
- **GoalStatusIndicator**: compact footer badge in BottomBar

## User Commands

| Command | Action |
|---|---|
| `/goal <objective>` | Set a new active goal |
| `/goal` | Show current goal summary |
| `/goal edit` | Edit goal objective inline |
| `/goal pause` | Pause active goal |
| `/goal resume` | Resume paused goal |
| `/goal clear` | Mark goal complete |
| `/goal budget N` | Set token budget |

## Agent Tools

| Tool | Description |
|---|---|
| `get_goal` | Read current goal status + remaining budget |
| `create_goal` | Create new goal (fails if one exists) |
| `update_goal` | Mark goal complete |
| `update_plan` | Track task progress with steps |

## Goal Lifecycle

```
No Goal ── /goal "do X" ──→ Active ── /goal pause ──→ Paused
                               │                          │
                               │                     /goal resume
                               │                          │
                          budget exceeded            Active
                               │
                               ▼
                        BudgetLimited ── /goal clear ──→ Complete
```

## Session Persistence

Goal state is persisted to the session JSONL via `pi.appendEntry("goal_set", ...)`. On resume or fork, the extension restores the goal from session entries.
