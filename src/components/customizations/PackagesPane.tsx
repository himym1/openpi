import { AlertTriangle, Check, Copy, ExternalLink, ShieldAlert } from 'lucide-solid'
import { createMemo, createSignal, For, Show } from 'solid-js'
import type { CustomizationItem, CustomizationScope } from '../../lib/ipc'

type PkgSourceType = 'npm' | 'git' | 'local'

interface ParsedPkg {
  sourceType: PkgSourceType
  displayName: string
  version: string | null
  ref: string | null
  isPinned: boolean
  externalUrl: string | null
  installCmd: string
}

function parseNpmSpec(spec: string): { pkgName: string; version: string | null } {
  if (spec.startsWith('@')) {
    const secondAt = spec.indexOf('@', 1)
    if (secondAt === -1) return { pkgName: spec, version: null }
    return { pkgName: spec.slice(0, secondAt), version: spec.slice(secondAt + 1) }
  }
  const atIdx = spec.indexOf('@')
  if (atIdx === -1) return { pkgName: spec, version: null }
  return { pkgName: spec.slice(0, atIdx), version: spec.slice(atIdx + 1) }
}

function parsePackage(name: string): ParsedPkg {
  if (name.startsWith('npm:')) {
    const spec = name.slice(4)
    const { pkgName, version } = parseNpmSpec(spec)
    return {
      sourceType: 'npm',
      displayName: pkgName,
      version,
      ref: null,
      isPinned: version !== null,
      externalUrl: `https://www.npmjs.com/package/${pkgName}`,
      installCmd: `pi install ${name}`,
    }
  }

  if (
    name.startsWith('git:') ||
    name.startsWith('https://') ||
    name.startsWith('http://') ||
    name.startsWith('ssh://') ||
    name.startsWith('git@')
  ) {
    const raw = name.startsWith('git:') ? name.slice(4) : name
    const gitAtIdx = raw.startsWith('git@') ? raw.indexOf(':', 4) : -1
    const searchFrom = gitAtIdx > -1 ? gitAtIdx : 0
    const lastAt = raw.lastIndexOf('@')
    const refCutoff = lastAt > searchFrom ? lastAt : -1
    const ref = refCutoff > -1 ? raw.slice(refCutoff + 1) : null
    const repoRaw = ref ? raw.slice(0, refCutoff) : raw

    const displayName = repoRaw
      .replace(/^https?:\/\//, '')
      .replace(/^git@([^:]+):/, '$1/')
      .replace(/^ssh:\/\/git@[^/]+\//, '')
      .replace(/\.git$/, '')

    let externalUrl: string | null = null
    if (displayName.includes('github.com')) externalUrl = `https://${displayName}`
    else if (repoRaw.startsWith('https://')) externalUrl = repoRaw

    return {
      sourceType: 'git',
      displayName,
      version: null,
      ref,
      isPinned: ref !== null,
      externalUrl,
      installCmd: `pi install ${name}`,
    }
  }

  if (name.startsWith('/') || name.startsWith('./') || name.startsWith('../')) {
    return {
      sourceType: 'local',
      displayName: name,
      version: null,
      ref: null,
      isPinned: false,
      externalUrl: null,
      installCmd: `pi install ${name}`,
    }
  }

  const { pkgName, version } = parseNpmSpec(name)
  return {
    sourceType: 'npm',
    displayName: pkgName,
    version,
    ref: null,
    isPinned: version !== null,
    externalUrl: `https://www.npmjs.com/package/${pkgName}`,
    installCmd: `pi install npm:${name}`,
  }
}

function shortenPath(p: string | null): string {
  if (!p) return ''
  return p.replace(/^\/Users\/[^/]+\//, '~/')
}

type ScopeFilter = 'all' | 'user' | 'project'

const SCOPE_LABELS: Record<ScopeFilter, string> = { all: 'All', user: 'Global', project: 'Project' }

const DISPLAY_SCOPE: Record<CustomizationScope, string> = {
  user: 'Global',
  project: 'Project',
  temporary: 'Temp',
}

const SOURCE_LABELS: Record<PkgSourceType, string> = {
  npm: 'npm packages',
  git: 'git packages',
  local: 'local packages',
}

const SOURCE_ORDER: PkgSourceType[] = ['npm', 'git', 'local']

interface ParsedEntry {
  item: CustomizationItem
  parsed: ParsedPkg
}

function PackageCard(props: { entry: ParsedEntry }) {
  const [copied, setCopied] = createSignal(false)

  const copyInstall = () => {
    void navigator.clipboard.writeText(props.entry.parsed.installCmd).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const openExternal = () => {
    if (props.entry.parsed.externalUrl)
      void window.openpi.openExternal(props.entry.parsed.externalUrl)
  }

  return (
    <article class="pkg-card">
      <div class="pkg-card-inner">
        <div class="pkg-card-body">
          <div class="pkg-card-nameline">
            <span class="pkg-card-name">{props.entry.parsed.displayName}</span>
            <Show
              when={
                props.entry.parsed.isPinned &&
                (props.entry.parsed.version ?? props.entry.parsed.ref)
              }
              fallback={<span class="pkg-float-chip">latest</span>}
            >
              <span class="pkg-pin-chip">
                {props.entry.parsed.version ?? props.entry.parsed.ref}
              </span>
            </Show>
            <span class="pkg-scope-chip">{DISPLAY_SCOPE[props.entry.item.scope]}</span>
            <Show when={!props.entry.item.enabled}>
              <span class="pkg-disabled-chip">disabled</span>
            </Show>
          </div>

          <Show when={props.entry.item.path}>
            <div class="pkg-card-path">{shortenPath(props.entry.item.path)}</div>
          </Show>

          <Show when={props.entry.item.warning}>
            <div class="pkg-card-warning">
              <AlertTriangle size={12} />
              <span>{props.entry.item.warning}</span>
            </div>
          </Show>
        </div>

        <div class="pkg-card-actions">
          <Show when={props.entry.parsed.externalUrl}>
            <button
              type="button"
              class="pkg-action-btn"
              onClick={openExternal}
              title="Open source"
              aria-label="Open package source"
            >
              <ExternalLink size={13} />
            </button>
          </Show>
          <button
            type="button"
            class={`pkg-action-btn${copied() ? ' is-copied' : ''}`}
            onClick={copyInstall}
            title="Copy install command"
            aria-label="Copy install command"
          >
            <Show when={copied()} fallback={<Copy size={13} />}>
              <Check size={13} />
            </Show>
          </button>
        </div>
      </div>
    </article>
  )
}

function SourceGroup(props: { type: PkgSourceType; entries: ParsedEntry[] }) {
  return (
    <div class="pkg-group-box">
      <div class="pkg-group-header">
        <span class="pkg-group-label">{SOURCE_LABELS[props.type]}</span>
        <span class="pkg-group-count">
          {props.entries.length} {props.entries.length === 1 ? 'package' : 'packages'}
        </span>
      </div>

      <div class="pkg-group-rows">
        <For each={props.entries}>{(entry) => <PackageCard entry={entry} />}</For>
      </div>
    </div>
  )
}

type PackagesPaneProps = {
  items: CustomizationItem[]
  loading: boolean
}

export function PackagesPane(props: PackagesPaneProps) {
  const [scopeFilter, setScopeFilter] = createSignal<ScopeFilter>('all')
  const [search, setSearch] = createSignal('')

  const allParsed = createMemo<ParsedEntry[]>(() =>
    props.items.map((item) => ({ item, parsed: parsePackage(item.name) }))
  )

  const counts = createMemo(() => ({
    all: props.items.length,
    user: props.items.filter((i) => i.scope === 'user').length,
    project: props.items.filter((i) => i.scope === 'project').length,
  }))

  const filtered = createMemo(() => {
    let list = allParsed()
    if (scopeFilter() !== 'all') list = list.filter((e) => e.item.scope === scopeFilter())
    if (search().trim()) {
      const q = search().toLowerCase()
      list = list.filter(
        (e) =>
          e.item.name.toLowerCase().includes(q) || e.parsed.displayName.toLowerCase().includes(q)
      )
    }
    return list
  })

  const groups = createMemo(() => {
    const byType = new Map<PkgSourceType, ParsedEntry[]>()
    for (const entry of filtered()) {
      const arr = byType.get(entry.parsed.sourceType) ?? []
      arr.push(entry)
      byType.set(entry.parsed.sourceType, arr)
    }
    return SOURCE_ORDER.filter((t) => byType.has(t)).map((t) => ({
      type: t,
      entries: byType.get(t) ?? [],
    }))
  })

  return (
    <div class="pkg-pane">
      <div class="pkg-security-bar">
        <ShieldAlert size={14} class="pkg-security-icon" />
        <span>
          Extensions inside packages run with <strong>full system permissions</strong>. Review
          source code before enabling any third-party package.
        </span>
      </div>

      <div class="pkg-toolbar">
        <div class="pkg-scope-tabs">
          <For each={['all', 'user', 'project'] as ScopeFilter[]}>
            {(scope) => (
              <button
                type="button"
                class={`pkg-scope-tab${scopeFilter() === scope ? ' is-active' : ''}`}
                onClick={() => setScopeFilter(scope)}
              >
                {SCOPE_LABELS[scope]}
                <span class="pkg-scope-count">{counts()[scope] ?? 0}</span>
              </button>
            )}
          </For>
        </div>
        <div class="pkg-toolbar-right">
          <input
            class="pkg-search"
            placeholder="Filter packages…"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
            aria-label="Filter packages"
          />
          <button
            type="button"
            class="pkg-gallery-btn"
            onClick={() => void window.openpi.openExternal('https://pi.dev/packages')}
            title="Browse Pi package gallery"
          >
            <ExternalLink size={12} />
            Gallery
          </button>
        </div>
      </div>

      <div class="pkg-groups">
        <Show
          when={!props.loading}
          fallback={<div class="pkg-empty">Scanning Pi resource directories…</div>}
        >
          <Show
            when={filtered().length > 0}
            fallback={
              <div class="pkg-empty">
                <Show
                  when={props.items.length === 0}
                  fallback={<p>No packages match the current filter.</p>}
                >
                  <p>No packages installed.</p>
                  <p class="pkg-empty-hint">
                    Run <code>pi install npm:package-name</code> in your terminal, then refresh.
                  </p>
                </Show>
              </div>
            }
          >
            <For each={groups()}>
              {(group) => <SourceGroup type={group.type} entries={group.entries} />}
            </For>
          </Show>
        </Show>
      </div>

      <Show when={props.items.length > 0}>
        <div class="pkg-footer">
          <span class="pkg-footer-label">Install:</span>
          <code class="pkg-footer-cmd">pi install npm:@scope/pkg</code>
          <span class="pkg-footer-sep">·</span>
          <code class="pkg-footer-cmd">pi install git:github.com/user/repo</code>
        </div>
      </Show>
    </div>
  )
}
