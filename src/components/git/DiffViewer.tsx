/**
 * DiffViewer — unified diff overlay.
 *
 * Uses a native Solid renderer instead of @pierre/diffs so line-number gutters
 * and code text are guaranteed to share the same CSS-grid row.
 */

import { createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js'
import type { GitChangedFile, GitFileDiff } from '../../lib/ipc'

interface DiffViewerProps {
  diff: GitFileDiff
  allFiles: GitChangedFile[]
  currentIndex: number
  onNavigate: (index: number) => void
  onClose: () => void
}

type DiffLineRow = {
  type: 'context' | 'add' | 'remove'
  oldLine: number | null
  newLine: number | null
  marker: ' ' | '+' | '-'
  text: string
}
type DiffRow = { type: 'hunk'; text: string } | { type: 'meta'; text: string } | DiffLineRow

function isDiffLineRow(row: DiffRow): row is DiffLineRow {
  return row.type === 'context' || row.type === 'add' || row.type === 'remove'
}

function parseUnifiedDiff(patch: string): DiffRow[] {
  const rows: DiffRow[] = []
  let oldLine = 0
  let newLine = 0

  const patchLines = patch.endsWith('\n') ? patch.slice(0, -1).split('\n') : patch.split('\n')

  for (const rawLine of patchLines) {
    const hunk = rawLine.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/)
    if (hunk) {
      oldLine = Number(hunk[1])
      newLine = Number(hunk[2])
      rows.push({ type: 'hunk', text: rawLine })
      continue
    }

    if (rawLine.startsWith('diff --git') || rawLine.startsWith('index ')) continue
    if (rawLine.startsWith('--- ') || rawLine.startsWith('+++ ')) continue

    if (rawLine.startsWith('\\')) {
      rows.push({ type: 'meta', text: rawLine })
      continue
    }

    if (rawLine.startsWith('-')) {
      rows.push({ type: 'remove', oldLine, newLine: null, marker: '-', text: rawLine.slice(1) })
      oldLine += 1
      continue
    }

    if (rawLine.startsWith('+')) {
      rows.push({ type: 'add', oldLine: null, newLine, marker: '+', text: rawLine.slice(1) })
      newLine += 1
      continue
    }

    const text = rawLine.startsWith(' ') ? rawLine.slice(1) : rawLine
    rows.push({ type: 'context', oldLine, newLine, marker: ' ', text })
    oldLine += 1
    newLine += 1
  }

  return rows
}

function UnifiedDiff(props: { patch: string }) {
  const rows = createMemo(() => parseUnifiedDiff(props.patch))

  return (
    <div class="odiff" role="table" aria-label="Unified diff">
      <For each={rows()}>
        {(row) =>
          isDiffLineRow(row) ? (
            <div class={`odiff-row odiff-row--${row.type}`} role="row">
              <span class="odiff-ln odiff-ln--old">{row.oldLine ?? ''}</span>
              <span class="odiff-ln odiff-ln--new">{row.newLine ?? ''}</span>
              <span class="odiff-marker">{row.marker}</span>
              <code class="odiff-code">{row.text || ' '}</code>
            </div>
          ) : (
            <div class={`odiff-row odiff-row--${row.type}`} role="row">
              <span class="odiff-hunk-text">{row.text}</span>
            </div>
          )
        }
      </For>
    </div>
  )
}

// ─── DiffViewer ────────────────────────────────────────────────────────────

export function DiffViewer(props: DiffViewerProps) {
  const [copyDone, setCopyDone] = createSignal(false)

  createEffect(() => {
    const currentIndex = props.currentIndex
    const totalFiles = props.allFiles.length

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        props.onClose()
        return
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) props.onNavigate(currentIndex - 1)
      if (e.key === 'ArrowRight' && currentIndex < totalFiles - 1)
        props.onNavigate(currentIndex + 1)
    }
    window.addEventListener('keydown', handler)
    onCleanup(() => window.removeEventListener('keydown', handler))
  })

  const copyPath = () => {
    void navigator.clipboard.writeText(props.diff.path)
    setCopyDone(true)
    setTimeout(() => setCopyDone(false), 1200)
  }

  const parts = () => props.diff.path.split('/')
  const filename = () => {
    const p = parts()
    return p.pop() ?? props.diff.path
  }
  const dir = () => {
    const p = parts()
    p.pop()
    return p.join('/') || null
  }

  return (
    <div class="diff-overlay" role="dialog" aria-label="Diff viewer">
      <div class="diff-header">
        <div class="diff-nav">
          <button
            type="button"
            class="diff-nav-btn"
            onClick={() => props.onNavigate(props.currentIndex - 1)}
            disabled={props.currentIndex === 0}
            title="Previous file (←)"
          >
            ←
          </button>
          <span class="diff-nav-counter">
            {props.currentIndex + 1} of {props.allFiles.length}
          </span>
          <button
            type="button"
            class="diff-nav-btn"
            onClick={() => props.onNavigate(props.currentIndex + 1)}
            disabled={props.currentIndex >= props.allFiles.length - 1}
            title="Next file (→)"
          >
            →
          </button>
        </div>

        <div class="diff-filepath" onClick={copyPath} title="Click to copy path">
          <Show when={dir()}>
            <span class="diff-filepath-dir">{dir()}/</span>
          </Show>
          <span class="diff-filepath-name">{filename()}</span>
          <Show when={props.diff.totalAdded > 0 || props.diff.totalRemoved > 0}>
            <span class="diff-filepath-delta">
              <span class="git-delta-add">+{props.diff.totalAdded}</span>{' '}
              <span class="git-delta-rem">-{props.diff.totalRemoved}</span>
            </span>
          </Show>
          <Show when={copyDone()}>
            <span class="diff-copy-flash"> copied</span>
          </Show>
        </div>

        <button type="button" class="diff-close-btn" onClick={props.onClose} title="Close (Esc)">
          ✕
        </button>
      </div>

      <div class="diff-body">
        <Show
          when={props.diff.rawPatch}
          fallback={<div class="diff-empty">No diff available for this file.</div>}
        >
          <UnifiedDiff patch={props.diff.rawPatch} />
        </Show>
      </div>
    </div>
  )
}
