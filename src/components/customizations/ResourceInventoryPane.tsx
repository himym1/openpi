import { AlertTriangle, Check, Copy, FileCode2, FolderOpen } from 'lucide-solid'
import { createMemo, createSignal, For, Show } from 'solid-js'
import type { CustomizationItem, CustomizationType } from '../../lib/ipc'

type ResourceInventoryPaneProps = {
  type: Extract<CustomizationType, 'extensions' | 'skills' | 'prompts'>
  items: CustomizationItem[]
  loading: boolean
}

type ResourceFilter = 'all' | 'project' | 'user' | 'package'

type ResourceGroup = {
  id: ResourceFilter | 'other'
  label: string
  description: string
  items: CustomizationItem[]
}

const FILTER_LABELS: Record<ResourceFilter, string> = {
  all: 'All',
  project: 'Project',
  user: 'Global',
  package: 'Package',
}

const EMPTY_COPY: Record<ResourceInventoryPaneProps['type'], string> = {
  extensions: 'No extensions discovered for this workspace.',
  skills: 'No skills discovered for this workspace.',
  prompts: 'No prompt templates discovered for this workspace.',
}

function classifyGroup(item: CustomizationItem): ResourceGroup['id'] {
  if (item.origin === 'package') return 'package'
  if (item.scope === 'project') return 'project'
  if (item.scope === 'user') return 'user'
  return 'other'
}

function groupLabel(id: ResourceGroup['id']): Pick<ResourceGroup, 'label' | 'description'> {
  switch (id) {
    case 'project':
      return { label: 'Project-local', description: 'Resources loaded from this workspace.' }
    case 'user':
      return { label: 'User-global', description: 'Resources available across workspaces.' }
    case 'package':
      return {
        label: 'Installed packages',
        description: 'Resources discovered from configured Pi packages.',
      }
    default:
      return { label: 'Other', description: 'Resources discovered from less common locations.' }
  }
}

function shortenPath(value: string | null | undefined): string {
  if (!value) return 'No path available'
  return value.replace(/^\/Users\/[^/]+\//, '~/')
}

function ResourceCard(props: { item: CustomizationItem }) {
  const [copied, setCopied] = createSignal(false)
  const displayPath = () => props.item.path ?? props.item.packageSource ?? props.item.source

  const copyPath = () => {
    if (!displayPath()) return
    void navigator.clipboard.writeText(displayPath() ?? '').then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <article class="czi-card">
      <div class="czi-card-main">
        <div class="czi-card-head">
          <div class="czi-card-name-row">
            <FileCode2 size={15} />
            <strong>{props.item.name}</strong>
          </div>
          <div class="czi-card-chips">
            <span class="czi-chip">{props.item.scope}</span>
            <span class="czi-chip">{props.item.origin}</span>
            <Show when={!props.item.enabled}>
              <span class="czi-chip czi-chip-warning">disabled</span>
            </Show>
          </div>
        </div>

        <Show when={props.item.description}>
          <p class="czi-card-description">{props.item.description}</p>
        </Show>

        <div class="czi-card-path">
          <FolderOpen size={13} />
          <span>{shortenPath(displayPath())}</span>
        </div>

        <Show when={props.item.warning}>
          <div class="czi-card-warning">
            <AlertTriangle size={13} />
            <span>{props.item.warning}</span>
          </div>
        </Show>
      </div>

      <button
        type="button"
        class={`czi-copy-btn${copied() ? ' is-copied' : ''}`}
        onClick={copyPath}
        title="Copy source path"
        aria-label="Copy source path"
      >
        <Show when={copied()} fallback={<Copy size={13} />}>
          <Check size={13} />
        </Show>
      </button>
    </article>
  )
}

export function ResourceInventoryPane(props: ResourceInventoryPaneProps) {
  const [filter, setFilter] = createSignal<ResourceFilter>('all')
  const [query, setQuery] = createSignal('')

  const counts = createMemo(() => ({
    all: props.items.length,
    project: props.items.filter((item) => item.scope === 'project' && item.origin !== 'package')
      .length,
    user: props.items.filter((item) => item.scope === 'user' && item.origin !== 'package').length,
    package: props.items.filter((item) => item.origin === 'package').length,
  }))

  const filteredItems = createMemo(() => {
    let next = props.items
    if (filter() === 'project')
      next = next.filter((item) => item.scope === 'project' && item.origin !== 'package')
    if (filter() === 'user')
      next = next.filter((item) => item.scope === 'user' && item.origin !== 'package')
    if (filter() === 'package') next = next.filter((item) => item.origin === 'package')

    const search = query().trim().toLowerCase()
    if (!search) return next

    return next.filter((item) => {
      const haystack = [item.name, item.description, item.path, item.source, item.packageSource]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(search)
    })
  })

  const groups = createMemo<ResourceGroup[]>(() => {
    const byId = new Map<ResourceGroup['id'], CustomizationItem[]>()
    for (const item of filteredItems()) {
      const id = classifyGroup(item)
      const groupItems = byId.get(id) ?? []
      groupItems.push(item)
      byId.set(id, groupItems)
    }

    return ['project', 'user', 'package', 'other']
      .filter((id) => byId.has(id as ResourceGroup['id']))
      .map((id) => {
        const meta = groupLabel(id as ResourceGroup['id'])
        return {
          id: id as ResourceGroup['id'],
          label: meta.label,
          description: meta.description,
          items: byId.get(id as ResourceGroup['id']) ?? [],
        }
      })
  })

  return (
    <div class="czi-pane">
      <div class="czi-toolbar">
        <div class="czi-filter-tabs">
          <For each={['all', 'project', 'user', 'package'] as ResourceFilter[]}>
            {(entry) => (
              <button
                type="button"
                class={`czi-filter-tab${filter() === entry ? ' is-active' : ''}`}
                onClick={() => setFilter(entry)}
              >
                <span>{FILTER_LABELS[entry]}</span>
                <span class="czi-filter-count">{counts()[entry]}</span>
              </button>
            )}
          </For>
        </div>

        <input
          class="czi-search"
          value={query()}
          onInput={(event) => setQuery(event.currentTarget.value)}
          placeholder={`Search ${props.type}…`}
          aria-label={`Search ${props.type}`}
        />
      </div>

      <Show
        when={!props.loading}
        fallback={<div class="czi-empty">Scanning Pi resource directories…</div>}
      >
        <Show
          when={filteredItems().length > 0}
          fallback={
            <div class="czi-empty">
              {props.items.length === 0
                ? EMPTY_COPY[props.type]
                : `No ${props.type} match the current filter.`}
            </div>
          }
        >
          <div class="czi-groups">
            <For each={groups()}>
              {(group) => (
                <section class="czi-group">
                  <div class="czi-group-head">
                    <div>
                      <h3>{group.label}</h3>
                      <p>{group.description}</p>
                    </div>
                    <span class="czi-group-count">{group.items.length}</span>
                  </div>
                  <div class="czi-group-list">
                    <For each={group.items}>{(item) => <ResourceCard item={item} />}</For>
                  </div>
                </section>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  )
}
