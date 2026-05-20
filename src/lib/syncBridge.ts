import { homedir } from 'node:os'
import { join } from 'node:path'

/** Path to the shared sync file written by the openpi-bridge extension. */
export const SYNC_FILE = join(homedir(), '.pi', 'agent', '.openpi-sync.json')

/** Path to the goal state file written by the harness extension. */
export const GOAL_FILE = join(homedir(), '.pi', 'agent', '.openpi-goal.json')

/** Payload shape written by openpi-bridge.ts extension. */
export interface SyncPayload {
  pid: number
  app: string
  status: 'running' | 'idle'
  timestamp: number
  workspace?: string
  sessionFile?: string | null
  startedAt?: number
  /** Bridge payload schema version, used to detect stale running apps. */
  bridgeVersion?: number
  /** Compact live preview written by OpenPi for Pi TUI widgets. */
  previewMessages?: Array<{
    id: string
    role: 'user' | 'assistant'
    text: string
    live?: boolean
  }>
  messageCount?: number
}

/** Payload shape written by the harness extension goal file. */
export interface GoalPayload {
  objective: string | null
  status: string | null
  tokensUsed: number
  tokenBudget: number | null
  timeUsedSeconds: number
  timestamp: number
  bridgeVersion?: number
}

/** Sanity: recent writes are < 10s old. */
export const SYNC_STALE_MS = 10_000

/** Polling interval for the file watcher. */
export const SYNC_POLL_MS = 2_000
