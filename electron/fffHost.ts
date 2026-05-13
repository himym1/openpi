/**
 * fffHost - long-lived FileFinder instance for the Electron main process.
 *
 * One singleton per workspace (cwd). Recreated when cwd changes.
 * Backed by @ff-labs/fff-node (Rust via ffi-rs): frecency-ranked fuzzy
 * file search + content grep - all in-process without subprocess spawning.
 */

import type { FileItem, GrepMatch, GrepOptions, SearchOptions } from '@ff-labs/fff-node'
import { FileFinder } from '@ff-labs/fff-node'

// ─── Exported result shapes (IPC-safe, lean) ──────────────────────────────────

export interface FffFileResult {
  relativePath: string
  fileName: string
  /** dirname of relativePath, e.g. "src/components" */
  dir: string
}

export interface FffGrepMatch {
  relativePath: string
  fileName: string
  /** 1-based line number */
  lineNumber: number
  lineContent: string
  /** [start, end] byte-offset pairs within lineContent */
  matchRanges: [number, number][]
}

// ─── Singleton state ──────────────────────────────────────────────────────────

let finder: FileFinder | null = null
let currentCwd: string | null = null

// ─── Init / teardown ──────────────────────────────────────────────────────────

/**
 * Initialize (or re-initialize) the FileFinder for `cwd`.
 * Safe to call multiple times - no-op if cwd hasn't changed.
 * Background scan starts immediately; searches work before it completes
 * (may return fewer results initially).
 */
export function initFff(cwd: string): void {
  if (currentCwd === cwd && finder) return

  // Destroy previous instance
  destroyFff()
  currentCwd = cwd

  // FileFinder is imported at the top of the module as a standard ESM import
  const result = FileFinder.create({
    basePath: cwd,
    aiMode: false,
    disableWatch: false, // watch FS for changes
  })

  if (!result.ok) {
    console.error('[fffHost] FileFinder.create failed:', result.error)
    return
  }

  finder = result.value

  // Start scan in background — don’t block init
  finder.waitForScan(30_000).catch((e: unknown) => {
    console.warn('[fffHost] scan timed out or errored:', e)
  })

  console.log('[fffHost] initialized for', cwd)
}

export function destroyFff(): void {
  if (finder) {
    try {
      finder.destroy()
    } catch {}
    finder = null
  }
  currentCwd = null
}

// ─── File search ──────────────────────────────────────────────────────────────

/**
 * Frecency-ranked fuzzy file search.
 * Empty query returns all indexed files sorted by frecency.
 */
export function fffFileSearch(query: string, pageSize = 80): FffFileResult[] {
  if (!finder) return []
  try {
    const opts: SearchOptions = { pageSize }
    const result = finder.fileSearch(query, opts)
    if (!result.ok) return []
    return result.value.items.map(fileItemToResult)
  } catch (e) {
    console.warn('[fffHost] fileSearch error:', e)
    return []
  }
}

function fileItemToResult(item: FileItem): FffFileResult {
  const idx = item.relativePath.lastIndexOf('/')
  const dir = idx >= 0 ? item.relativePath.slice(0, idx) : ''
  return { relativePath: item.relativePath, fileName: item.fileName, dir }
}

// ─── Content grep ─────────────────────────────────────────────────────────────

export interface FffGrepOpts {
  mode?: 'plain' | 'regex' | 'fuzzy'
  /** false = always case-sensitive; true = smart case (default) */
  smartCase?: boolean
  maxMatchesPerFile?: number
  timeBudgetMs?: number
  beforeContext?: number
  afterContext?: number
}

/**
 * Content grep with three modes: plain (SIMD memmem), regex, fuzzy (Smith-Waterman).
 * Returns up to `maxMatchesPerFile` matches per file, with optional context lines.
 */
export function fffGrep(query: string, opts: FffGrepOpts = {}): FffGrepMatch[] {
  if (!finder || !query.trim()) return []
  try {
    const grepOpts: GrepOptions = {
      mode: opts.mode ?? 'plain',
      smartCase: opts.smartCase ?? true,
      maxMatchesPerFile: opts.maxMatchesPerFile ?? 5,
      timeBudgetMs: opts.timeBudgetMs ?? 3000,
      beforeContext: opts.beforeContext ?? 0,
      afterContext: opts.afterContext ?? 0,
    }
    const result = finder.grep(query, grepOpts)
    if (!result.ok) return []
    return result.value.items.map(grepMatchToResult)
  } catch (e) {
    console.warn('[fffHost] grep error:', e)
    return []
  }
}

function grepMatchToResult(m: GrepMatch): FffGrepMatch {
  return {
    relativePath: m.relativePath,
    fileName: m.fileName,
    lineNumber: m.lineNumber,
    lineContent: m.lineContent,
    matchRanges: m.matchRanges,
  }
}
