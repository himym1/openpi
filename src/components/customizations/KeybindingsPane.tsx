import { Keyboard, RotateCcw, Search, X } from 'lucide-solid'
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import {
  buildKeybindingEntries,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  formatKeyLabel,
  type KeybindingActionId,
  type KeybindingCategory,
  type KeybindingEntry,
  type KeybindingOverrides,
  keyEventToBinding,
  loadCustomKeybindings,
  normalizeBinding,
  saveCustomKeybindings,
  splitKeyCombo,
} from '../../lib/keybindings'

export function KeybindingsPane() {
  const [customBindings, setCustomBindings] = createSignal<KeybindingOverrides>({})
  const [loading, setLoading] = createSignal(true)
  const [search, setSearch] = createSignal('')
  const [recordingId, setRecordingId] = createSignal<string | null>(null)
  const [conflictWarning, setConflictWarning] = createSignal<string | null>(null)
  const [saveError, setSaveError] = createSignal<string | null>(null)
  const [resetConfirm, setResetConfirm] = createSignal(false)
  let searchInputRef: HTMLInputElement | undefined

  onMount(() => {
    void loadCustomKeybindings()
      .then(setCustomBindings)
      .catch((err) => setSaveError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  })

  const persistBindings = (next: KeybindingOverrides) => {
    void saveCustomKeybindings(next).catch((err) =>
      setSaveError(err instanceof Error ? err.message : String(err))
    )
  }

  const entries = createMemo<KeybindingEntry[]>(() => buildKeybindingEntries(customBindings()))

  const conflicts = createMemo(() => {
    const map = new Map<string, string[]>()
    for (const entry of entries()) {
      if (entry.keys === 'Unassigned') continue
      const normalizedKeys = normalizeBinding(entry.keys)
      const current = map.get(normalizedKeys) ?? []
      current.push(entry.id)
      map.set(normalizedKeys, current)
    }

    const conflictIds = new Set<string>()
    for (const [, ids] of map) {
      if (ids.length > 1) for (const id of ids) conflictIds.add(id)
    }
    return conflictIds
  })

  const filtered = createMemo(() => {
    const query = search().toLowerCase()
    const all = entries()
    if (!query) return all
    return all.filter(
      (entry) =>
        entry.label.toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query) ||
        entry.keys.toLowerCase().includes(query) ||
        entry.id.toLowerCase().includes(query)
    )
  })

  const grouped = createMemo(() => {
    const groups: {
      category: KeybindingCategory
      label: string
      items: KeybindingEntry[]
    }[] = []
    for (const category of CATEGORY_ORDER) {
      const items = filtered().filter((entry) => entry.category === category)
      if (items.length > 0) groups.push({ category, label: CATEGORY_LABELS[category], items })
    }
    return groups
  })

  const startRecording = (id: KeybindingActionId) => {
    setRecordingId(id)
    setConflictWarning(null)
    setSaveError(null)
    setResetConfirm(false)
  }

  const stopRecording = () => setRecordingId(null)

  const handleKeyDown = (event: KeyboardEvent) => {
    const activeRecordingId = recordingId()
    if (!activeRecordingId) return

    if (event.key === 'Escape') {
      event.preventDefault()
      stopRecording()
      return
    }

    const binding = keyEventToBinding(event)
    if (!binding) return

    event.preventDefault()
    event.stopPropagation()

    const normalizedBinding = normalizeBinding(binding)
    const conflict = entries().find(
      (entry) =>
        entry.id !== activeRecordingId &&
        entry.keys !== 'Unassigned' &&
        normalizeBinding(entry.keys) === normalizedBinding
    )

    setCustomBindings((prev) => {
      const next = { ...prev, [activeRecordingId]: binding }
      persistBindings(next)
      return next
    })

    setConflictWarning(
      conflict ? `"${binding}" is already used by "${conflict.label}". Both will trigger.` : null
    )
    setRecordingId(null)
  }

  createEffect(() => {
    if (!recordingId()) return
    window.addEventListener('keydown', handleKeyDown, true)
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown, true))
  })

  createEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === 'f' &&
        searchInputRef &&
        document.activeElement?.closest('.kbd-pane')
      ) {
        event.preventDefault()
        searchInputRef.focus()
      }
    }
    window.addEventListener('keydown', handler)
    onCleanup(() => window.removeEventListener('keydown', handler))
  })

  const resetBinding = (id: KeybindingActionId) => {
    setCustomBindings((prev) => {
      const next = { ...prev }
      delete next[id]
      persistBindings(next)
      return next
    })
    setConflictWarning(null)
  }

  const clearBinding = (id: KeybindingActionId) => {
    setCustomBindings((prev) => {
      const next = { ...prev, [id]: 'Unassigned' }
      persistBindings(next)
      return next
    })
    setConflictWarning(null)
  }

  const resetAll = () => {
    if (!resetConfirm()) {
      setResetConfirm(true)
      return
    }
    setCustomBindings({})
    persistBindings({})
    setResetConfirm(false)
    setConflictWarning(null)
  }

  const hasModifications = createMemo(() => Object.keys(customBindings()).length > 0)

  return (
    <div class="kbd-pane">
      <div class="kbd-toolbar">
        <div class="kbd-toolbar-left">
          <div class="kbd-search-wrap">
            <Search size={13} class="kbd-search-icon" />
            <input
              ref={searchInputRef}
              class="kbd-search"
              type="text"
              placeholder="Search keybindings…"
              value={search()}
              onInput={(event) => setSearch(event.currentTarget.value)}
            />
            <Show when={search()}>
              <button type="button" class="kbd-search-clear" onClick={() => setSearch('')}>
                <X size={12} />
              </button>
            </Show>
          </div>
        </div>
        <div class="kbd-toolbar-right">
          <Show when={hasModifications()}>
            <button
              type="button"
              class={`kbd-reset-btn${resetConfirm() ? ' is-confirming' : ''}`}
              onClick={resetAll}
              title="Reset all keybindings to defaults"
            >
              <RotateCcw size={12} />
              {resetConfirm() ? 'Confirm reset?' : 'Reset all'}
            </button>
          </Show>
          <div class="kbd-hint">Click a binding to change it — press keys to record</div>
        </div>
      </div>

      <Show when={conflictWarning()}>
        <div class="kbd-warning">{conflictWarning()}</div>
      </Show>
      <Show when={saveError()}>
        <div class="kbd-warning">Failed to save keybindings: {saveError()}</div>
      </Show>

      <Show when={recordingId()}>
        <div class="kbd-recording-banner">
          <span class="kbd-recording-dot" />
          Recording — press desired key combination
          <button type="button" class="kbd-recording-cancel" onClick={stopRecording}>
            Cancel
          </button>
        </div>
      </Show>

      <div class="kbd-scroll">
        <Show
          when={!loading() && filtered().length > 0}
          fallback={
            <div class="kbd-empty">
              <p>{loading() ? 'Loading keybindings…' : `No keybindings match "${search()}".`}</p>
            </div>
          }
        >
          <For each={grouped()}>
            {(group) => (
              <section class="kbd-section">
                <div class="kbd-section-head">
                  <span class="kbd-section-label">{group.label}</span>
                  <span class="kbd-section-count">{group.items.length}</span>
                </div>
                <div class="kbd-section-body">
                  <For each={group.items}>
                    {(entry) => {
                      const isRecording = () => recordingId() === entry.id
                      const hasConflict = () => conflicts().has(entry.id)
                      const isDefault = () => !entry.isModified

                      return (
                        <div
                          class={`kbd-row${isRecording() ? ' is-recording' : ''}${hasConflict() ? ' has-conflict' : ''}`}
                        >
                          <div class="kbd-row-left">
                            <span class="kbd-row-label">{entry.label}</span>
                            <span class="kbd-row-desc">{entry.description}</span>
                          </div>
                          <div class="kbd-row-right">
                            <Show when={entry.keys !== 'Unassigned'}>
                              <button
                                type="button"
                                class="kbd-row-reset"
                                onClick={() => clearBinding(entry.id)}
                                title={`Clear "${entry.label}" keybinding`}
                              >
                                <X size={10} />
                              </button>
                            </Show>
                            <Show when={entry.isModified}>
                              <button
                                type="button"
                                class="kbd-row-reset"
                                onClick={() => resetBinding(entry.id)}
                                title={`Reset "${entry.label}" to default: ${entry.defaultKeys}`}
                              >
                                <RotateCcw size={10} />
                              </button>
                            </Show>
                            <Show when={isDefault()}>
                              <span class="kbd-row-default-marker">default</span>
                            </Show>
                            <button
                              type="button"
                              class={`kbd-binding-btn${isRecording() ? ' is-recording' : ''}${entry.isModified ? ' is-modified' : ''}`}
                              onClick={() =>
                                isRecording() ? stopRecording() : startRecording(entry.id)
                              }
                              title={
                                isRecording()
                                  ? 'Press keys to record…'
                                  : 'Click to change keybinding'
                              }
                              aria-label={`${isRecording() ? 'Recording' : 'Set'} keybinding for ${entry.label}`}
                            >
                              <Show
                                when={!isRecording()}
                                fallback={<span class="kbd-recording-text">Press keys…</span>}
                              >
                                <Show
                                  when={entry.keys !== 'Unassigned'}
                                  fallback={<span class="kbd-recording-text">Unassigned</span>}
                                >
                                  <For each={splitKeyCombo(entry.keys)}>
                                    {(key) => (
                                      <span class="kbd-key-chip">{formatKeyLabel(key)}</span>
                                    )}
                                  </For>
                                </Show>
                              </Show>
                            </button>
                          </div>
                        </div>
                      )
                    }}
                  </For>
                </div>
              </section>
            )}
          </For>
        </Show>
      </div>

      <div class="kbd-footer">
        <Keyboard size={12} />
        <span>
          Keybindings are stored in OpenPi preferences. Supported app-level shortcuts take effect
          immediately.
        </span>
      </div>
    </div>
  )
}
