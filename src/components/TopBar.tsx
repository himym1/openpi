/**
 * TopBar — SolidJS version.
 * Three-zone header: LEFT sidebar toggle · CENTER session name · RIGHT panel toggles.
 */
import logoUrl from '@icons/icon.svg'
import { GitBranch, MonitorCog, PanelLeft, PanelRight, SquareTerminal } from 'lucide-solid'
import { createSignal, Show } from 'solid-js'
import type { ModelInfo } from '../lib/ipc'

interface Props {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  workspaceName: string
  gitBranch: string | null
  gitStats?: { added: number; removed: number; untracked: number } | null
  sessionName: string
  isStreaming: boolean
  onRenameSession: (name: string) => void
  onOpenWorkspace: () => void
  terminalOpen: boolean
  onToggleTerminal: () => void
  secondaryPanelOpen: boolean
  onToggleSecondaryPanel: () => void
  onOpenSettings: () => void
  /** Optional ref callback — parent calls the returned function to trigger rename mode */
  startRenameRef?: (fn: () => void) => void
  models?: ModelInfo[]
  currentModel?: ModelInfo | null
  onSelectModel?: (model: ModelInfo) => void
}

export function TopBar(props: Props) {
  const [editing, setEditing] = createSignal(false)
  const [draft, setDraft] = createSignal('')
  let inputRef!: HTMLInputElement

  const startEdit = () => {
    setDraft(props.sessionName)
    setEditing(true)
    setTimeout(() => inputRef?.select(), 0)
  }

  // Expose startEdit to parent via callback ref
  props.startRenameRef?.(startEdit)

  const commitEdit = () => {
    const trimmed = draft().trim()
    if (trimmed && trimmed !== props.sessionName) props.onRenameSession(trimmed)
    setEditing(false)
  }

  return (
    <header class="topbar drag">
      <div class="topbar-left-zone">
        <button
          type="button"
          class={`topbar-icon-btn no-drag${props.sidebarOpen ? ' is-active' : ''}`}
          onClick={props.onToggleSidebar}
          title="Toggle sidebar (⌘B)"
        >
          <PanelLeft size={15} />
        </button>
      </div>

      <div class="topbar-center no-drag">
        <span class="topbar-brand-icon" aria-hidden="true">
          <img src={logoUrl} alt="" />
        </span>

        <Show
          when={editing()}
          fallback={
            <button
              type="button"
              class="topbar-name-btn"
              onClick={startEdit}
              title="Click to rename session"
            >
              {props.sessionName}
            </button>
          }
        >
          <input
            ref={(el) => {
              inputRef = el
            }}
            class="topbar-name-input"
            value={draft()}
            onInput={(e) => setDraft(e.currentTarget.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') setEditing(false)
            }}
          />
        </Show>

        <span class="topbar-sep">in</span>

        <button
          type="button"
          class="topbar-workspace-btn no-drag"
          onClick={props.onOpenWorkspace}
          title="Change workspace"
        >
          {props.workspaceName}
        </button>

        <Show when={props.gitBranch}>
          {(getBranch) => (
            <span class="topbar-branch">
              <GitBranch size={11} class="topbar-branch-icon" />
              {getBranch()}
              <Show
                when={
                  props.gitStats &&
                  (props.gitStats.added > 0 ||
                    props.gitStats.removed > 0 ||
                    props.gitStats.untracked > 0)
                }
              >
                <span class="topbar-branch-stats">
                  <Show when={props.gitStats!.added > 0}>
                    <span class="topbar-stat-add">+{props.gitStats!.added}</span>
                  </Show>
                  <Show when={props.gitStats!.removed > 0}>
                    <span class="topbar-stat-rem">-{props.gitStats!.removed}</span>
                  </Show>
                  <Show when={props.gitStats!.untracked > 0}>
                    <span class="topbar-stat-unt">?{props.gitStats!.untracked}</span>
                  </Show>
                </span>
              </Show>
            </span>
          )}
        </Show>

        <Show when={props.isStreaming}>
          <span class="pulse topbar-streaming-dot">·</span>
        </Show>
      </div>

      <div class="topbar-right-zone">
        <button
          type="button"
          class={`topbar-icon-btn no-drag${props.terminalOpen ? ' is-active' : ''}`}
          onClick={props.onToggleTerminal}
          title="Toggle terminal (⌘J)"
        >
          <SquareTerminal size={15} />
        </button>
        <button
          type="button"
          class={`topbar-icon-btn no-drag${props.secondaryPanelOpen ? ' is-active' : ''}`}
          onClick={props.onToggleSecondaryPanel}
          title="Toggle source control panel"
        >
          <PanelRight size={15} />
        </button>
        <button
          type="button"
          class="topbar-icon-btn no-drag"
          onClick={props.onOpenSettings}
          title="Customize OpenPi"
          aria-label="Customize OpenPi"
        >
          <MonitorCog size={15} />
        </button>
      </div>
    </header>
  )
}
