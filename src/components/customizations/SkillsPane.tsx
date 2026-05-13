import { Check, Copy, FolderOpen, Search, ShieldAlert } from 'lucide-solid'
import { createMemo, createSignal, For, Show } from 'solid-js'
import type { CustomizationItem } from '../../lib/ipc'

type SkillsPaneProps = {
  items: CustomizationItem[]
  loading: boolean
}

type SkillFilter = 'all' | 'project' | 'user' | 'package'

type SkillGroup = {
  id: SkillFilter | 'other'
  label: string
  description: string
  items: CustomizationItem[]
}

const FILTER_LABELS: Record<SkillFilter, string> = {
  all: 'All',
  project: 'Project',
  user: 'Global',
  package: 'Package',
}

function classifySkill(item: CustomizationItem): SkillGroup['id'] {
  if (item.origin === 'package') return 'package'
  if (item.scope === 'project') return 'project'
  if (item.scope === 'user') return 'user'
  return 'other'
}

function groupMeta(id: SkillGroup['id']): Pick<SkillGroup, 'label' | 'description'> {
  switch (id) {
    case 'project':
      return {
        label: 'Project skills',
        description: 'Loaded from .pi/skills or .agents/skills for this workspace and ancestors.',
      }
    case 'user':
      return {
        label: 'Global skills',
        description: 'Loaded from ~/.pi/agent/skills or configured user skill directories.',
      }
    case 'package':
      return {
        label: 'Package skills',
        description: 'Discovered from Pi package skill directories or pi.skills manifests.',
      }
    default:
      return {
        label: 'Other skills',
        description: 'Loaded from configured skill paths, CLI additions, or temporary sources.',
      }
  }
}

function shortenPath(value: string | null | undefined): string {
  if (!value) return 'No path available'
  return value.replace(/^\/Users\/[^/]+\//, '~/')
}

function skillCommand(item: CustomizationItem): string {
  return `/skill:${item.name}`
}

function SkillCard(props: { item: CustomizationItem }) {
  const [copied, setCopied] = createSignal(false)
  const displayPath = () => props.item.path ?? props.item.packageSource ?? props.item.source
  const command = () => skillCommand(props.item)

  const copyCommand = () => {
    void navigator.clipboard.writeText(`${command()} `).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <article class="skill-card">
      <div class="skill-card-body">
        <div class="skill-card-title-row">
          <h3>{props.item.name}</h3>
          <button
            type="button"
            class={`skill-copy-btn${copied() ? ' is-copied' : ''}`}
            onClick={copyCommand}
            title="Copy skill command"
            aria-label={`Copy ${command()} command`}
          >
            <Show when={copied()} fallback={<Copy size={13} />}>
              <Check size={13} />
            </Show>
          </button>
        </div>

        <p class="skill-card-description">
          {props.item.description ||
            'Missing description frontmatter; Pi will not load skills without a description.'}
        </p>

        <div class="skill-card-path" title={displayPath() ?? undefined}>
          <FolderOpen size={13} />
          <span>{shortenPath(displayPath())}</span>
        </div>

        <Show when={!props.item.enabled}>
          <div class="skill-card-note">
            <ShieldAlert size={13} />
            <span>
              Hidden from automatic model invocation; use <code>{command()}</code> to load it
              explicitly.
            </span>
          </div>
        </Show>
      </div>
    </article>
  )
}

export function SkillsPane(props: SkillsPaneProps) {
  const [filter, setFilter] = createSignal<SkillFilter>('all')
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

  const groups = createMemo<SkillGroup[]>(() => {
    const byId = new Map<SkillGroup['id'], CustomizationItem[]>()
    for (const item of filteredItems()) {
      const id = classifySkill(item)
      const groupItems = byId.get(id) ?? []
      groupItems.push(item)
      byId.set(id, groupItems)
    }

    return (['project', 'user', 'package', 'other'] as SkillGroup['id'][])
      .filter((id) => byId.has(id))
      .map((id) => ({
        id,
        ...groupMeta(id),
        items: byId.get(id) ?? [],
      }))
  })

  return (
    <div class="skill-pane">
      <section class="skill-hero" aria-labelledby="skill-hero-title">
        <div class="skill-hero-main">
          <p class="skill-kicker">Pi skills</p>
          <h2 id="skill-hero-title">On-demand capability packages</h2>
          <p>
            Skills keep only names and descriptions in context, then load <code>SKILL.md</code> when
            a task matches. Force one with <code>/skill:name</code>; review project skills because
            they can include executable scripts and workflow instructions.
          </p>
        </div>
      </section>

      <div class="skill-toolbar">
        <div class="skill-filter-tabs" role="tablist" aria-label="Skill scope filter">
          <For each={['all', 'project', 'user', 'package'] as SkillFilter[]}>
            {(entry) => (
              <button
                type="button"
                class={`skill-filter-tab${filter() === entry ? ' is-active' : ''}`}
                onClick={() => setFilter(entry)}
                role="tab"
                aria-selected={filter() === entry}
              >
                <span>{FILTER_LABELS[entry]}</span>
                <span class="skill-filter-count">{counts()[entry]}</span>
              </button>
            )}
          </For>
        </div>

        <label class="skill-search-wrap">
          <Search size={13} />
          <input
            class="skill-search"
            value={query()}
            onInput={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search skill, description, path…"
            aria-label="Search skills"
          />
        </label>
      </div>

      <Show
        when={!props.loading}
        fallback={<div class="skill-empty">Scanning Pi skill directories…</div>}
      >
        <Show
          when={filteredItems().length > 0}
          fallback={
            <div class="skill-empty">
              {props.items.length === 0
                ? 'No skills discovered. Add a SKILL.md directory under ~/.pi/agent/skills or .pi/skills.'
                : 'No skills match the current filter.'}
            </div>
          }
        >
          <div class="skill-groups">
            <For each={groups()}>
              {(group) => (
                <section class="skill-group">
                  <div class="skill-group-head">
                    <div>
                      <h3>{group.label}</h3>
                      <p>{group.description}</p>
                    </div>
                    <span class="skill-group-count">{group.items.length}</span>
                  </div>
                  <div class="skill-group-list">
                    <For each={group.items}>{(item) => <SkillCard item={item} />}</For>
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
