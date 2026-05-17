import { Bookmark, FileCog, GitFork, GitMerge, MessageSquare, Shrink } from 'lucide-solid'
import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
} from 'solid-js'
import type { ForkPoint, SessionTreeResponse, TreeEntryNode } from '../../lib/ipc'

type SessionTreePanelProps = {
  sessionPath: string | null
  onScrollToMessage: (entryId: string) => void
  /** Bump to trigger a re-fetch of tree data (used for live refresh during streaming). */
  refreshTrigger?: number
}

type EntryTone = 'message' | 'user' | 'assistant' | 'fork' | 'compaction' | 'label' | 'system'

const shortId = (id: string | null | undefined) => (id ? id.slice(0, 8) : 'none')

const formatCount = (value: number, singular: string, plural = `${singular}s`) =>
  `${value} ${value === 1 ? singular : plural}`

const formatTokens = (value: number | undefined) => {
  if (!value) return null
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m tokens`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k tokens`
  return `${value.toLocaleString()} tokens`
}

const cleanPreview = (preview: string | undefined) => {
  const text = preview?.replace(/\s+/g, ' ').trim()
  return text && text.length > 0 ? text : null
}

/**
 * Left-drawer inspector for Pi's JSONL v3 session tree.
 *
 * The panel intentionally renders branch paths as a structural map rather than a
 * chat list: branch rails show root→leaf paths, fork points are promoted, labels
 * and compactions get distinct treatment, and the active leaf is marked as the
 * current session position.
 */
export const SessionTreePanel: Component<SessionTreePanelProps> = (props) => {
  const [treeData, setTreeData] = createSignal<SessionTreeResponse | null>(null)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [collapsedBranches, setCollapsedBranches] = createSignal<Set<string>>(new Set())
  const [collapsedForkDetails, setCollapsedForkDetails] = createSignal<Set<string>>(new Set())

  // ── Fetch tree data when session path or refresh trigger changes ───────────
  createEffect(() => {
    const sessionPath = props.sessionPath
    // Read refreshTrigger so SolidJS tracks it as a dependency
    void props.refreshTrigger
    if (!sessionPath) {
      setTreeData(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const result = await window.openpi.getSessionTree(sessionPath)
        if (cancelled) return
        setTreeData(result)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    onCleanup(() => {
      cancelled = true
    })
  })

  // ── Derived data ──────────────────────────────────────────────────────────
  const forkPointMap = createMemo(() => {
    const map = new Map<string, ForkPoint>()
    for (const fp of treeData()?.forkPoints ?? []) {
      map.set(fp.entryId, fp)
    }
    return map
  })

  const activeLeafId = () => treeData()?.activeLeafId ?? null

  const metrics = createMemo(() => {
    const data = treeData()
    const uniqueNodes = new Map<string, TreeEntryNode>()
    for (const branch of data?.branches ?? []) {
      for (const node of branch.nodes) uniqueNodes.set(node.id, node)
    }
    const nodes = [...uniqueNodes.values()]
    return {
      branches: data?.branches.length ?? 0,
      forks: data?.forkPoints.length ?? 0,
      compactions: nodes.filter((node) => node.type === 'compaction').length,
      labels: nodes.filter((node) => node.type === 'label').length,
    }
  })

  const summaryParts = createMemo(() => {
    const m = metrics()
    const parts = [formatCount(m.branches, 'path')]
    if (m.forks > 0) parts.push(formatCount(m.forks, 'fork'))
    if (m.compactions > 0) parts.push(formatCount(m.compactions, 'compaction'))
    if (m.labels > 0) parts.push(formatCount(m.labels, 'label'))
    return parts.join(' · ')
  })

  const toggleBranch = (leafId: string) => {
    setCollapsedBranches((prev) => {
      const next = new Set(prev)
      if (next.has(leafId)) next.delete(leafId)
      else next.add(leafId)
      return next
    })
  }

  const toggleFork = (entryId: string) => {
    setCollapsedForkDetails((prev) => {
      const next = new Set(prev)
      if (next.has(entryId)) next.delete(entryId)
      else next.add(entryId)
      return next
    })
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  const EntryIcon = (props: { node: TreeEntryNode; size?: number }) => {
    const s = props.size ?? 13
    switch (props.node.type) {
      case 'message':
        return <MessageSquare size={s} />
      case 'compaction':
        return <Shrink size={s} />
      case 'branch_summary':
        return <GitMerge size={s} />
      case 'label':
        return <Bookmark size={s} />
      case 'model_change':
      case 'session_info':
      case 'thinking_level_change':
        return <FileCog size={s} />
      default:
        return <MessageSquare size={s} />
    }
  }

  const entryTone = (node: TreeEntryNode): EntryTone => {
    if (forkPointMap().has(node.id)) return 'fork'
    if (node.type === 'compaction') return 'compaction'
    if (node.type === 'label') return 'label'
    if (node.type !== 'message') return 'system'
    if (node.role === 'user') return 'user'
    if (node.role === 'assistant') return 'assistant'
    return 'message'
  }

  const entryChip = (node: TreeEntryNode): string => {
    switch (node.type) {
      case 'message':
        if (node.role === 'user') return 'U'
        if (node.role === 'assistant') return 'A'
        return 'M'
      case 'compaction':
        return 'Σ'
      case 'label':
        return 'TAG'
      case 'branch_summary':
        return 'BR'
      case 'model_change':
        return 'MODEL'
      case 'session_info':
        return 'INFO'
      case 'thinking_level_change':
        return 'THINK'
      default:
        return 'ENTRY'
    }
  }

  const nodeTitle = (node: TreeEntryNode): string => {
    switch (node.type) {
      case 'message':
        return cleanPreview(node.contentPreview) ?? `empty ${node.role ?? 'message'} turn`
      case 'compaction':
        return node.summary ?? 'Session compacted'
      case 'branch_summary':
        return node.summary ?? 'Branch summary'
      case 'label':
        return node.summary ?? 'Bookmark label'
      case 'model_change':
        return node.modelId ?? 'Model changed'
      case 'session_info':
        return node.name ?? 'Session info updated'
      case 'thinking_level_change':
        return node.summary ?? 'Thinking level changed'
      default:
        return `Entry ${shortId(node.id)}`
    }
  }

  const nodeMeta = (node: TreeEntryNode): string | null => {
    const fork = forkPointMap().get(node.id)
    if (fork) return `fork point · ${formatCount(fork.branchCount, 'path')}`
    switch (node.type) {
      case 'message':
        return null
      case 'compaction':
        return formatTokens(node.tokensBefore) ?? 'summary checkpoint'
      case 'label':
        return node.targetId ? `bookmark → ${shortId(node.targetId)}` : 'bookmark'
      case 'branch_summary':
        return 'branch summary'
      case 'model_change':
        return 'model change'
      case 'session_info':
        return 'session metadata'
      case 'thinking_level_change':
        return 'thinking setting'
      default:
        return null
    }
  }

  const isActiveLeaf = (nodeId: string): boolean => activeLeafId() === nodeId
  const forkInfo = (nodeId: string): ForkPoint | undefined => forkPointMap().get(nodeId)
  const hasNodeDetails = (node: TreeEntryNode, fp: ForkPoint | undefined): boolean =>
    Boolean(nodeMeta(node) || isActiveLeaf(node.id) || fp || node.type === 'label')

  return (
    <aside class="session-tree-panel" aria-label="Session map">
      <header class="stp-header">
        <div class="stp-title-row">
          <div class="eyebrow">Session Map</div>
          <Show when={treeData() && treeData()!.branches.length > 0}>
            <span class="stp-current-leaf">
              <span class="stp-current-dot" aria-hidden="true" />
              <code>{shortId(activeLeafId())}</code>
            </span>
          </Show>
        </div>
        <Show
          when={treeData() && treeData()!.branches.length > 0}
          fallback={<div class="stp-subtitle">Root → leaf paths, forks, labels, compactions</div>}
        >
          <div class="stp-subtitle">{summaryParts()} · current leaf</div>
        </Show>
      </header>

      <div class="stp-content">
        <Show when={error()}>
          <div class="stp-error">Failed to load map: {error()}</div>
        </Show>

        <Show when={loading()}>
          <div class="stp-loading">Loading session map…</div>
        </Show>

        <Show when={!props.sessionPath && !loading() && !error()}>
          <div class="stp-empty">Open a session to view its map.</div>
        </Show>

        <Show
          when={
            !loading() &&
            !error() &&
            props.sessionPath &&
            (!treeData() || treeData()!.branches.length === 0)
          }
        >
          <div class="stp-empty">No session tree data found.</div>
        </Show>

        <Show when={treeData() && treeData()!.branches.length > 0}>
          <div class="stp-branch-list">
            <For each={treeData()!.branches}>
              {(branch, index) => {
                const isCollapsed = () => collapsedBranches().has(branch.leafId)
                const isActive = () => activeLeafId() === branch.leafId
                const branchLabel = () => (isActive() ? 'Active path' : `Branch ${index() + 1}`)
                const isSolo = () => treeData()!.branches.length === 1

                return (
                  <section
                    class={`stp-branch${isActive() ? ' stp-branch--active' : ''}${isSolo() ? ' stp-branch--solo' : ''}`}
                  >
                    <button
                      type="button"
                      class="stp-branch-header"
                      onClick={() => toggleBranch(branch.leafId)}
                      title={
                        isActive() ? 'Active root-to-leaf path' : `Branch leaf ${branch.leafId}`
                      }
                    >
                      <span class="stp-branch-toggle" aria-hidden="true">
                        {isCollapsed() ? '▸' : '▾'}
                      </span>
                      <span class="stp-branch-heading">
                        <span class="stp-branch-title-row">
                          <span class="stp-branch-label">{branchLabel()}</span>
                          <Show when={isActive()}>
                            <span class="stp-active-pill">current</span>
                          </Show>
                        </span>
                        <span class="stp-branch-meta">
                          {branch.nodes.length} entries · leaf <code>{shortId(branch.leafId)}</code>
                        </span>
                      </span>
                    </button>

                    <Show when={!isCollapsed()}>
                      <div class="stp-branch-nodes">
                        <For each={branch.nodes}>
                          {(node, nodeIndex) => {
                            const fp = forkInfo(node.id)
                            const tone = () => entryTone(node)
                            const isLast = () => nodeIndex() === branch.nodes.length - 1

                            return (
                              <div
                                class={`stp-node-wrap stp-node-wrap--${tone()}${isLast() ? ' stp-node-wrap--last' : ''}`}
                              >
                                <button
                                  type="button"
                                  class={`stp-node stp-node--${tone()}${isActiveLeaf(node.id) ? ' stp-node--active' : ''}`}
                                  onClick={() => props.onScrollToMessage(node.id)}
                                  title={`${nodeTitle(node)} · ${node.id}`}
                                >
                                  <span class="stp-node-rail" aria-hidden="true">
                                    <span class="stp-node-marker">
                                      <EntryIcon node={node} />
                                    </span>
                                  </span>
                                  <span class="stp-node-body">
                                    <span class="stp-node-main">
                                      <span class="stp-node-chip">{entryChip(node)}</span>
                                      <span class="stp-node-title">{nodeTitle(node)}</span>
                                    </span>
                                    <Show when={hasNodeDetails(node, fp)}>
                                      <span class="stp-node-meta-row">
                                        <Show when={nodeMeta(node)}>
                                          <span class="stp-node-meta">{nodeMeta(node)}</span>
                                        </Show>
                                        <Show when={isActiveLeaf(node.id)}>
                                          <span class="stp-you-are-here">you are here</span>
                                        </Show>
                                        <Show when={fp}>
                                          <span
                                            class="stp-fork-badge"
                                            title={`${fp!.branchCount} paths`}
                                          >
                                            <GitFork size={10} />
                                            {fp!.branchCount} paths
                                          </span>
                                        </Show>
                                        <Show when={node.type === 'label'}>
                                          <span class="stp-label-badge" title="Label">
                                            <Bookmark size={10} /> label
                                          </span>
                                        </Show>
                                      </span>
                                    </Show>
                                  </span>
                                </button>

                                <Show when={fp && fp.branchCount > 1}>
                                  <div class="stp-fork-detail">
                                    <button
                                      type="button"
                                      class="stp-fork-toggle"
                                      onClick={() => toggleFork(node.id)}
                                    >
                                      <span aria-hidden="true">
                                        {collapsedForkDetails().has(node.id) ? '▸' : '▾'}
                                      </span>
                                      Fork point · {fp!.branchCount} possible paths
                                    </button>
                                    <Show when={!collapsedForkDetails().has(node.id)}>
                                      <div class="stp-fork-children">
                                        <For each={fp!.childLeaves}>
                                          {(leafId) => (
                                            <button
                                              type="button"
                                              class={`stp-fork-child${leafId === activeLeafId() ? ' stp-fork-child--active' : ''}`}
                                              onClick={() => props.onScrollToMessage(leafId)}
                                              title={`Branch leaf: ${leafId}`}
                                            >
                                              <span
                                                class="stp-fork-child-line"
                                                aria-hidden="true"
                                              />
                                              <span>
                                                {leafId === activeLeafId()
                                                  ? 'current leaf'
                                                  : 'leaf'}
                                              </span>
                                              <code>{shortId(leafId)}</code>
                                            </button>
                                          )}
                                        </For>
                                      </div>
                                    </Show>
                                  </div>
                                </Show>
                              </div>
                            )
                          }}
                        </For>
                      </div>
                    </Show>
                  </section>
                )
              }}
            </For>
          </div>
        </Show>
      </div>
    </aside>
  )
}
