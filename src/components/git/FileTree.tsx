/**
 * FileTree — workspace file browser for the Git panel "Files" tab.
 *
 * Tree structure: Zed-style connector rails and elbows instead of text glyphs.
 * Folder open/closed state is shown by the folder icon itself.
 * File icons are provided by fileIcons.tsx.
 *
 * Renderer is read-only: displays the file tree and emits file-click events.
 * Actual I/O lives in Electron main (getFileTree IPC).
 */

import { createEffect, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import { FileIcon, FolderIcon } from '../../lib/fileIcons'
import type { FileTreeNode, FileTreeResult } from '../../lib/ipc'

interface FileTreeProps {
  cwd: string | null
  changedPaths?: Set<string>
  onFileClick?: (relPath: string) => void
  triggerCollapseAll?: number
}

function TreeConnector(props: { parentLines: boolean[]; isLast: boolean }) {
  return (
    <span class="ftree-connectors" aria-hidden>
      <For each={props.parentLines}>
        {(hasMore) => <span class={`ftree-rail${hasMore ? ' is-active' : ''}`} />}
      </For>
      <span class={`ftree-branch${props.isLast ? ' is-last' : ''}`} />
    </span>
  )
}

interface NodeProps {
  node: FileTreeNode
  isLast: boolean
  parentLines: boolean[]
  changedPaths: Set<string>
  expanded: Set<string>
  onToggle: (path: string) => void
  onFileClick?: (relPath: string) => void
}

function TreeNode(props: NodeProps) {
  const isExpanded = () => props.expanded.has(props.node.path)
  const isChanged = () => props.changedPaths.has(props.node.path)

  return (
    <Show
      when={props.node.isDir}
      fallback={
        <button
          type="button"
          class="ftree-row ftree-file"
          title={props.node.path}
          onClick={() => props.onFileClick?.(props.node.path)}
        >
          <TreeConnector parentLines={props.parentLines} isLast={props.isLast} />
          <FileIcon name={props.node.name} size={15} />
          <span class={`ftree-name${isChanged() ? ' is-changed' : ''}`}>{props.node.name}</span>
        </button>
      }
    >
      <button
        type="button"
        class="ftree-row ftree-dir"
        onClick={() => props.onToggle(props.node.path)}
        title={props.node.path}
      >
        <TreeConnector parentLines={props.parentLines} isLast={props.isLast} />
        <FolderIcon name={props.node.name} size={15} open={isExpanded()} />
        <span class={`ftree-name${isChanged() ? ' is-changed' : ''}`}>{props.node.name}</span>
      </button>
      <Show when={isExpanded()}>
        <For each={props.node.children ?? []}>
          {(child, idx) => {
            const childParentLines = [...props.parentLines, !props.isLast]
            const isLastChild = idx() === (props.node.children?.length ?? 0) - 1
            return (
              <TreeNode
                node={child}
                isLast={isLastChild}
                parentLines={childParentLines}
                changedPaths={props.changedPaths}
                expanded={props.expanded}
                onToggle={props.onToggle}
                onFileClick={props.onFileClick}
              />
            )
          }}
        </For>
      </Show>
    </Show>
  )
}

export function FileTree(props: FileTreeProps) {
  const [tree, setTree] = createSignal<FileTreeResult | null>(null)
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set())
  let mounted = true
  let requestId = 0

  const refreshTree = async (resetExpansion = false) => {
    const currentRequest = ++requestId
    const result = await window.openpi.git.getFileTree()
    if (!mounted || currentRequest !== requestId) return
    setTree(result)
    if (result && resetExpansion) setExpanded(new Set(['']))
  }

  onMount(() => {
    mounted = true
    onCleanup(() => {
      mounted = false
    })
  })

  createEffect(() => {
    const trigger = props.triggerCollapseAll
    if (trigger !== undefined && trigger > 0) {
      void Promise.resolve().then(() => setExpanded(new Set([''])))
    }
  })

  createEffect(() => {
    const cwd = props.cwd
    if (!cwd) {
      setTree(null)
      requestId += 1
      return
    }

    void refreshTree(true)
    const unsubscribe = window.openpi.git.onFileTreeChanged(() => {
      void refreshTree(false)
    })
    onCleanup(unsubscribe)
  })

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const changedPaths = () => props.changedPaths ?? new Set<string>()
  const isRootExpanded = () => expanded().has('')

  return (
    <Show
      when={tree()}
      fallback={<div class="ftree-empty">{props.cwd ? 'Loading…' : 'No workspace'}</div>}
    >
      {(resolvedTree) => (
        <div class="ftree-root">
          <button
            type="button"
            class="ftree-row ftree-dir ftree-workspace-root"
            onClick={() => toggle('')}
          >
            <span class="ftree-root-chevron">{isRootExpanded() ? '▾' : '▸'}</span>
            <FolderIcon name={resolvedTree().rootName} size={15} open={isRootExpanded()} />
            <span class="ftree-name">{resolvedTree().rootName}</span>
          </button>

          <Show when={isRootExpanded()}>
            <For each={resolvedTree().children}>
              {(child, idx) => (
                <TreeNode
                  node={child}
                  isLast={idx() === resolvedTree().children.length - 1}
                  parentLines={[]}
                  changedPaths={changedPaths()}
                  expanded={expanded()}
                  onToggle={toggle}
                  onFileClick={props.onFileClick}
                />
              )}
            </For>
          </Show>
        </div>
      )}
    </Show>
  )
}
