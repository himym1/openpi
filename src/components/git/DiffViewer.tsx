/**
 * DiffViewer — side-by-side diff overlay.
 *
 * Uses @pierre/diffs vanilla JS FileDiff component for robust side-by-side rendering,
 * syntax highlighting via Shiki, and proper hunk structure.
 *
 * Authority: renderer only — no Git mutations here.
 */

import { FileDiff, parsePatchFiles } from '@pierre/diffs'
import { createEffect, createSignal, onCleanup, Show } from 'solid-js'
import type { GitChangedFile, GitFileDiff } from '../../lib/ipc'

interface DiffViewerProps {
  diff: GitFileDiff
  allFiles: GitChangedFile[]
  currentIndex: number
  onNavigate: (index: number) => void
  onClose: () => void
}

// ─── Keyboard handler ──────────────────────────────────────────────────────

function useKeyboardNav(
  currentIndex: () => number,
  totalFiles: () => number,
  onNavigate: (i: number) => void,
  onClose: () => void
) {
  createEffect(() => {
    const idx = currentIndex()
    const total = totalFiles()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowLeft' && idx > 0) onNavigate(idx - 1)
      if (e.key === 'ArrowRight' && idx < total - 1) onNavigate(idx + 1)
    }
    window.addEventListener('keydown', handler)
    onCleanup(() => window.removeEventListener('keydown', handler))
  })
}

// ─── Pierre diff renderer ─────────────────────────────────────────────────

function PierreDiffRenderer(props: { patch: string; filename: string }) {
  let containerRef!: HTMLDivElement
  let diffInstance: FileDiff | null = null

  const renderDiff = (patch: string) => {
    if (!containerRef) return

    // parsePatchFiles takes a raw patch string and returns ParsedPatch[]
    // each ParsedPatch has .files: FileDiffMetadata[]
    let fileDiff: ReturnType<typeof parsePatchFiles>[number]['files'][number] | undefined
    try {
      const parsed = parsePatchFiles(patch)
      fileDiff = parsed[0]?.files[0]
    } catch (err) {
      console.warn('[DiffViewer] Failed to parse patch:', err)
      containerRef.innerHTML = '<div class="diff-empty">Unable to parse diff.</div>'
      return
    }

    if (!fileDiff) {
      containerRef.innerHTML = '<div class="diff-empty">No changes detected.</div>'
      return
    }

    // Re-use existing instance if available, otherwise create new one
    if (!diffInstance) {
      diffInstance = new FileDiff({
        diffStyle: 'split', // side-by-side view
        theme: 'pierre-dark', // built-in dark theme
        themeType: 'dark',
        expandUnchanged: false, // collapse large identical regions
        disableFileHeader: true, // we render our own header above
      })
    }

    try {
      diffInstance.render({ fileDiff, containerWrapper: containerRef, forceRender: true })
    } catch (err) {
      console.error('[DiffViewer] render error:', err)
      containerRef.innerHTML = '<div class="diff-empty">Failed to render diff.</div>'
    }
  }

  // Re-render when patch or filename changes.
  // Use containerWrapper (not fileContainer) so @pierre/diffs creates its own
  // <diffs-container> shadow host with the correct split-view layout semantics.
  createEffect(() => {
    const patch = props.patch
    // filename read for reactivity — drives language detection in pierre
    void props.filename
    renderDiff(patch)
  })

  onCleanup(() => {
    if (diffInstance) {
      diffInstance.cleanUp()
      diffInstance = null
    }
  })

  return <div ref={containerRef!} class="pierre-diff-container" />
}

// ─── DiffViewer ────────────────────────────────────────────────────────────

export function DiffViewer(props: DiffViewerProps) {
  const [copyDone, setCopyDone] = createSignal(false)

  useKeyboardNav(
    () => props.currentIndex,
    () => props.allFiles.length,
    props.onNavigate,
    props.onClose
  )

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

        <button type="button" class="diff-filepath" onClick={copyPath} title="Click to copy path">
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
        </button>

        <button type="button" class="diff-close-btn" onClick={props.onClose} title="Close (Esc)">
          ✕
        </button>
      </div>

      <div class="diff-body">
        <Show
          when={props.diff.rawPatch}
          fallback={<div class="diff-empty">No diff available for this file.</div>}
        >
          <PierreDiffRenderer patch={props.diff.rawPatch} filename={props.diff.path} />
        </Show>
      </div>
    </div>
  )
}
