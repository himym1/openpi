import { ChevronDown } from 'lucide-solid'
import { createEffect, createSignal, For, onCleanup, Show } from 'solid-js'
import type { ModelInfo, SessionReady } from '../lib/ipc'

type ModelSelectorProps = {
  models: ModelInfo[]
  current: SessionReady['model']
  onSelect: (model: ModelInfo) => void
}

export function ModelSelector(props: ModelSelectorProps) {
  const [open, setOpen] = createSignal(false)
  let ref!: HTMLDivElement

  createEffect(() => {
    if (!open()) return
    const close = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!ref?.contains(target ?? null)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    onCleanup(() => document.removeEventListener('mousedown', close))
  })

  return (
    <div
      ref={(el) => {
        ref = el
      }}
      class="model-selector no-drag"
    >
      <button type="button" class="model-button" onClick={() => setOpen((value) => !value)}>
        <span>model</span>
        <strong>{props.current?.name ?? 'Select model'}</strong>
        <ChevronDown size={14} />
      </button>
      <Show when={open()}>
        <div class="model-menu">
          <For each={props.models}>
            {(model) => {
              const active =
                props.current?.id === model.id && props.current?.provider === model.provider
              return (
                <button
                  type="button"
                  class={active ? 'model-option is-active' : 'model-option'}
                  onClick={() => {
                    props.onSelect(model)
                    setOpen(false)
                  }}
                >
                  <span>{model.name}</span>
                  <small>{model.provider}</small>
                </button>
              )
            }}
          </For>
        </div>
      </Show>
    </div>
  )
}
