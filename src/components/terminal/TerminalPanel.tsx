import { createEffect, createSignal, For, onMount, Show } from 'solid-js'
import { OutputPane } from './OutputPane'
import { terminalCwdLabel } from './shellIntegration'
import { TerminalPane } from './TerminalPane'

const DEFAULT_HEIGHT = 260
const MIN_HEIGHT = 120
const MAX_HEIGHT = 800
const PREF_KEY = 'terminalHeight'

interface TermTab {
  id: string
  label: string
  cwd: string
  renamed?: boolean
  exited?: boolean
}

interface Props {
  cwd: string
  isOpen: boolean
  newTerminalRequest: number
  onClose: () => void
}

export function TerminalPanel(props: Props) {
  const [activeTab, setActiveTab] = createSignal<'output' | string>('output')
  const [termTabs, setTermTabs] = createSignal<TermTab[]>([])
  const [height, setHeight] = createSignal(DEFAULT_HEIGHT)
  const [renamingTabId, setRenamingTabId] = createSignal<string | null>(null)
  const [renameValue, setRenameValue] = createSignal('')
  let dragState: { startY: number; startHeight: number } | null = null
  let tabCount = 0
  let renameInputRef: HTMLInputElement | undefined

  onMount(() => {
    void window.openpi.getPref(PREF_KEY).then((v) => {
      if (v) {
        const n = Number.parseInt(v, 10)
        if (!Number.isNaN(n)) setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, n)))
      }
    })

    const onMove = (e: MouseEvent) => {
      if (!dragState) return
      const dy = dragState.startY - e.clientY
      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragState.startHeight + dy)))
    }

    const onUp = (e: MouseEvent) => {
      if (!dragState) return
      const dy = dragState.startY - e.clientY
      const newH = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragState.startHeight + dy))
      dragState = null
      void window.openpi.setPref(PREF_KEY, String(newH))
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  })

  const onDragStart = (e: MouseEvent) => {
    e.preventDefault()
    dragState = { startY: e.clientY, startHeight: height() }
  }

  const terminalLabel = (cwd: string) => `shell · ${terminalCwdLabel(cwd) || 'terminal'}`

  const addTerminal = () => {
    tabCount += 1
    const id = `term-${tabCount}`
    const cwd = props.cwd
    setTermTabs((prev) => [...prev, { id, cwd, label: terminalLabel(cwd) }])
    setActiveTab(id)
  }

  createEffect(() => {
    if (props.newTerminalRequest > 0) addTerminal()
  })

  const onTerminalExit = (id: string) => {
    setTermTabs((prev) => prev.map((t) => (t.id === id ? { ...t, exited: true } : t)))
  }

  const onTerminalCwdChange = (id: string, cwd: string) => {
    setTermTabs((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, cwd, label: t.renamed ? t.label : terminalLabel(cwd) } : t
      )
    )
  }

  const _startRename = (tab: TermTab) => {
    setRenamingTabId(tab.id)
    setRenameValue(tab.label)
    requestAnimationFrame(() => {
      renameInputRef?.focus()
      renameInputRef?.select()
    })
  }

  const _commitRename = () => {
    const id = renamingTabId()
    const label = renameValue().trim()
    if (id && label) {
      setTermTabs((prev) => prev.map((t) => (t.id === id ? { ...t, label, renamed: true } : t)))
    }
    setRenamingTabId(null)
    setRenameValue('')
  }

  const closeTerminal = (id: string) => {
    setTermTabs((prev) => prev.filter((t) => t.id !== id))
    if (activeTab() === id) setActiveTab('output')
  }

  return (
    <Show when={props.isOpen}>
      <div class="terminal-panel" style={{ height: `${height()}px` }}>
        <button
          type="button"
          class="terminal-drag-handle"
          aria-label="Resize terminal panel"
          onMouseDown={onDragStart}
        />

        <div class="terminal-tabbar">
          <button
            type="button"
            class={`terminal-tab${activeTab() === 'output' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('output')}
          >
            Output
          </button>

          <For each={termTabs()}>
            {(tab) => (
              <div
                class={`terminal-tab terminal-tab-closable${activeTab() === tab.id ? ' is-active' : ''}${tab.exited ? ' is-exited' : ''}`}
              >
                <span
                  class={`terminal-tab-status ${tab.exited ? 'is-exited' : 'is-running'}`}
                  aria-hidden="true"
                />
                <Show
                  when={renamingTabId() === tab.id}
                  fallback={
                    <button
                      type="button"
                      class="terminal-tab-label"
                      onClick={() => setActiveTab(tab.id)}
                      onDblClick={() => _startRename(tab)}
                      title={`${tab.cwd}${tab.exited ? ' — exited' : ''}`}
                    >
                      {tab.label}
                    </button>
                  }
                >
                  <input
                    ref={(el) => {
                      renameInputRef = el
                    }}
                    class="terminal-tab-rename-input"
                    value={renameValue()}
                    onInput={(e) => setRenameValue(e.currentTarget.value)}
                    onBlur={_commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') _commitRename()
                      if (e.key === 'Escape') {
                        setRenamingTabId(null)
                        setRenameValue('')
                      }
                    }}
                  />
                </Show>
                <button
                  type="button"
                  class="terminal-tab-close"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTerminal(tab.id)
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </For>

          <button type="button" class="terminal-tab-add" onClick={addTerminal} title="New terminal">
            +
          </button>

          <div style={{ flex: '1' }} />

          <button
            type="button"
            class="terminal-panel-close"
            onClick={props.onClose}
            title="Close panel (⌘J)"
          >
            ×
          </button>
        </div>

        <div class="terminal-content">
          <Show when={activeTab() === 'output'}>
            <OutputPane />
          </Show>

          <For each={termTabs()}>
            {(tab) => (
              <div
                style={{
                  display: activeTab() === tab.id ? 'flex' : 'none',
                  flex: '1',
                  'min-height': '0',
                  overflow: 'hidden',
                }}
              >
                <TerminalPane
                  id={tab.id}
                  cwd={props.cwd}
                  isVisible={activeTab() === tab.id && props.isOpen}
                  onExit={onTerminalExit}
                  onCwdChange={onTerminalCwdChange}
                />
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  )
}
