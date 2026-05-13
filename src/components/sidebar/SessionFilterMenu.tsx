import { ChevronDown, ListFilter } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createSignal, onCleanup, onMount, Show } from 'solid-js'
import type { GroupMode, SortMode } from '../../types/session'

type SessionFilterMenuProps = {
  sortBy: SortMode
  groupBy: GroupMode
  showRecent: boolean
  onSort: (value: SortMode) => void
  onGroup: (value: GroupMode) => void
  onShowRecent: (value: boolean) => void
  onCollapseAll: () => void
}

export function SessionFilterMenu(props: SessionFilterMenuProps) {
  const [open, setOpen] = createSignal(false)
  let ref: HTMLDivElement | undefined

  onMount(() => {
    const close = (event: MouseEvent) => {
      if (!open()) return
      if (!(event.target instanceof Node)) return
      if (ref && !ref.contains(event.target)) setOpen(false)
    }

    document.addEventListener('mousedown', close)
    onCleanup(() => document.removeEventListener('mousedown', close))
  })

  return (
    <div ref={ref} class="sidebar-filter">
      <button
        type="button"
        class="icon-button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Session list filter and sort"
      >
        <ListFilter size={15} />
      </button>
      <Show when={open()}>
        <div class="menu-panel">
          <MenuLabel>Sort</MenuLabel>
          <MenuButton checked={props.sortBy === 'created'} onClick={() => props.onSort('created')}>
            Created
          </MenuButton>
          <MenuButton checked={props.sortBy === 'updated'} onClick={() => props.onSort('updated')}>
            Updated
          </MenuButton>
          <MenuDivider />
          <MenuLabel>Group</MenuLabel>
          <MenuButton
            checked={props.groupBy === 'workspace'}
            onClick={() => props.onGroup('workspace')}
          >
            Workspace
          </MenuButton>
          <MenuButton checked={props.groupBy === 'time'} onClick={() => props.onGroup('time')}>
            Time
          </MenuButton>
          <MenuDivider />
          <MenuButton checked={props.showRecent} onClick={() => props.onShowRecent(true)}>
            Recent sessions
          </MenuButton>
          <MenuButton checked={!props.showRecent} onClick={() => props.onShowRecent(false)}>
            All sessions
          </MenuButton>
          <MenuDivider />
          <button
            type="button"
            class="menu-button"
            onClick={() => {
              props.onCollapseAll()
              setOpen(false)
            }}
          >
            <ChevronDown size={14} /> Collapse groups
          </button>
        </div>
      </Show>
    </div>
  )
}

function MenuLabel(props: { children: JSX.Element }) {
  return <div class="menu-label">{props.children}</div>
}

function MenuDivider() {
  return <div class="menu-divider" />
}

function MenuButton(props: { checked: boolean; onClick: () => void; children: JSX.Element }) {
  return (
    <button type="button" class="menu-button" onClick={props.onClick}>
      <span class="menu-check">{props.checked ? '●' : '○'}</span>
      {props.children}
    </button>
  )
}
