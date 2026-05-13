import { createEffect, createSignal, For, onMount, Show } from 'solid-js'
import type { OutputLine } from '../../lib/ipc'

export function OutputPane() {
  const [lines, setLines] = createSignal<OutputLine[]>([])
  let bottomRef!: HTMLDivElement

  onMount(() => {
    const unsub = window.openpi.onOutputAppend((line) => {
      setLines((prev) => [...prev.slice(-999), line])
    })
    return () => {
      unsub()
    }
  })

  createEffect(() => {
    lines()
    bottomRef?.scrollIntoView({ behavior: 'instant' })
  })

  return (
    <div class="output-pane">
      <Show when={lines().length === 0}>
        <div class="output-empty">
          No output. Pi SDK logs, extension errors, and diagnostics will appear here.
        </div>
      </Show>
      <For each={lines()}>
        {(line, _i) => (
          <div class={`output-line output-${line.level}`}>
            <span class="output-ts">{new Date(line.ts).toLocaleTimeString()}</span>
            <span class="output-text">{line.text}</span>
          </div>
        )}
      </For>
      <div
        ref={(el) => {
          bottomRef = el
        }}
      />
    </div>
  )
}
