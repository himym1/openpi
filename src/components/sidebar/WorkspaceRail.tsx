import { FolderPlus, Plus } from 'lucide-solid'
import { createSignal, For, Show } from 'solid-js'
import type { SessionListItem, WorkspaceInfo } from '../../lib/ipc'
import { formatRelativeTime } from '../../lib/sessionView'

type WorkspaceRailProps = {
  workspaces: WorkspaceInfo[]
  selectedPath?: string | null
  activePath?: string | null
  onSelectWorkspace: (path: string) => void
  onOpenWorkspace: () => void
  onNewSessionIn: (workspacePath: string) => void
  onOpenSession: (session: SessionListItem) => void
  onPreviewSessions: (workspacePath: string) => Promise<SessionListItem[]>
}

export function WorkspaceRail(props: WorkspaceRailProps) {
  const [hoveredPath, setHoveredPath] = createSignal<string | null>(null)
  const [loadingPath, setLoadingPath] = createSignal<string | null>(null)
  const [previewSessions, setPreviewSessions] = createSignal<Map<string, SessionListItem[]>>(
    new Map()
  )

  const ensurePreview = (workspacePath: string) => {
    if (previewSessions().has(workspacePath) || loadingPath() === workspacePath) return
    setLoadingPath(workspacePath)
    props
      .onPreviewSessions(workspacePath)
      .then((sessions) => {
        setPreviewSessions((previous) => {
          const next = new Map(previous)
          next.set(workspacePath, sessions)
          return next
        })
      })
      .catch(() => {
        setPreviewSessions((previous) => {
          const next = new Map(previous)
          next.set(workspacePath, [])
          return next
        })
      })
      .finally(() => {
        setLoadingPath((current) => (current === workspacePath ? null : current))
      })
  }

  const initialsFor = (name: string) => {
    const cleaned = name.trim()
    if (!cleaned) return 'P'
    const parts = cleaned.split(/[-_\s.]+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }

  return (
    <nav class="workspace-rail" aria-label="Workspaces">
      <div class="workspace-rail-list">
        <For each={props.workspaces}>
          {(workspace) => {
            const isSelected = () => props.selectedPath === workspace.path
            const isActive = () => props.activePath === workspace.path
            const preview = () => previewSessions().get(workspace.path) ?? []
            const isHovered = () => hoveredPath() === workspace.path

            return (
              <fieldset
                class="workspace-rail-item"
                onMouseEnter={() => {
                  setHoveredPath(workspace.path)
                  ensurePreview(workspace.path)
                }}
                onMouseLeave={() => setHoveredPath(null)}
                onFocusIn={() => {
                  setHoveredPath(workspace.path)
                  ensurePreview(workspace.path)
                }}
                onFocusOut={() => setHoveredPath(null)}
              >
                <button
                  type="button"
                  class={`workspace-rail-button${isSelected() ? ' is-selected' : ''}${isActive() ? ' is-active' : ''}`}
                  title={workspace.path}
                  aria-label={`Show sessions for ${workspace.displayName}`}
                  aria-pressed={isSelected()}
                  onClick={() => props.onSelectWorkspace(workspace.path)}
                >
                  <span class="workspace-rail-initials">{initialsFor(workspace.displayName)}</span>
                </button>

                <Show when={isHovered()}>
                  <div class="workspace-preview" role="status">
                    <div class="workspace-preview-head">
                      <div>
                        <div class="workspace-preview-name">{workspace.displayName}</div>
                        <div class="workspace-preview-path">{workspace.path}</div>
                      </div>
                      <button
                        type="button"
                        class="workspace-preview-new"
                        title="New session in workspace"
                        onClick={(event) => {
                          event.stopPropagation()
                          props.onNewSessionIn(workspace.path)
                        }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <Show
                      when={loadingPath() !== workspace.path}
                      fallback={<div class="workspace-preview-empty">Loading recent sessions…</div>}
                    >
                      <Show
                        when={preview().length > 0}
                        fallback={
                          <div class="workspace-preview-empty">No indexed sessions yet</div>
                        }
                      >
                        <For each={preview()}>
                          {(session) => (
                            <button
                              type="button"
                              class="workspace-preview-session"
                              onClick={() => props.onOpenSession(session)}
                              title={session.title}
                            >
                              <span>{session.title}</span>
                              <small>{formatRelativeTime(session.updatedAt)}</small>
                            </button>
                          )}
                        </For>
                      </Show>
                    </Show>
                  </div>
                </Show>
              </fieldset>
            )
          }}
        </For>
      </div>

      <button
        type="button"
        class="workspace-rail-add"
        title="Open workspace"
        aria-label="Open workspace"
        onClick={props.onOpenWorkspace}
      >
        <FolderPlus size={17} />
      </button>
    </nav>
  )
}
