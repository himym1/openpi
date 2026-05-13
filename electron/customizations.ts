import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import {
  DefaultPackageManager,
  DefaultResourceLoader,
  SettingsManager,
} from '@earendil-works/pi-coding-agent'
import type {
  CustomizationDiagnostic,
  CustomizationItem,
  CustomizationsInventory,
} from '../src/lib/ipc'

type SourceScope = 'user' | 'project' | 'temporary'
type SourceOrigin = 'top-level' | 'package' | 'settings'

type SourceLike = {
  path?: string
  source?: string
  scope?: SourceScope
  origin?: 'top-level' | 'package'
  baseDir?: string
}

type DiagnosticLike = {
  type?: string
  message?: string
  path?: string
}

const EXTENSION_ENTRY_EXTENSIONS = new Set(['.ts'])

export async function discoverCustomizations(options: {
  cwd: string | null
  agentDir: string
}): Promise<CustomizationsInventory> {
  const { cwd, agentDir } = options
  if (!cwd) {
    return { cwd: null, workspaceTrusted: false, items: [], diagnostics: [] }
  }

  const settingsManager = SettingsManager.create(cwd, agentDir)
  const loader = new DefaultResourceLoader({
    cwd,
    agentDir,
    settingsManager,
    noExtensions: true,
  })
  const items: CustomizationItem[] = []
  const diagnostics: CustomizationDiagnostic[] = []

  // loader.reload() invokes the Pi SDK package manager which may run `npm root -g`.
  // If npm is not in PATH (e.g., GUI-launched on macOS from Finder/Dock),
  // capture the failure as a warning so skills/prompts/themes still load from fs.
  await loader.reload().catch((err: unknown) => {
    diagnostics.push({
      type: 'warning' as const,
      message: `Package resource resolution failed (npm may not be in PATH): ${
        err instanceof Error ? err.message : String(err)
      }`,
    })
  })

  items.push(...discoverExtensionItems({ cwd, agentDir, settingsManager, diagnostics }))

  const skills = loader.getSkills()
  diagnostics.push(...skills.diagnostics.map(toDiagnostic))
  for (const skill of skills.skills) {
    const source = sourceFrom(skill.sourceInfo, skill.filePath)
    items.push({
      id: itemId('skills', skill.filePath),
      type: 'skills',
      name: skill.name,
      description: skill.description,
      path: skill.filePath,
      scope: source.scope,
      origin: source.origin,
      source: source.source,
      enabled: !skill.disableModelInvocation,
      packageSource: source.origin === 'package' ? source.source : undefined,
    })
  }

  const prompts = loader.getPrompts()
  diagnostics.push(...prompts.diagnostics.map(toDiagnostic))
  for (const prompt of prompts.prompts) {
    const source = sourceFrom(prompt.sourceInfo, prompt.filePath)
    items.push({
      id: itemId('prompts', prompt.filePath),
      type: 'prompts',
      name: prompt.name,
      description: prompt.description || prompt.argumentHint,
      argumentHint: prompt.argumentHint,
      path: prompt.filePath,
      scope: source.scope,
      origin: source.origin,
      source: source.source,
      enabled: true,
      packageSource: source.origin === 'package' ? source.source : undefined,
    })
  }

  const themes = loader.getThemes()
  diagnostics.push(...themes.diagnostics.map(toDiagnostic))
  for (const theme of themes.themes) {
    const themePath = theme.sourcePath ?? theme.sourceInfo?.path ?? null
    const source = sourceFrom(theme.sourceInfo, themePath)
    items.push({
      id: itemId('themes', themePath ?? theme.name ?? 'theme'),
      type: 'themes',
      name:
        theme.name ??
        (themePath ? path.basename(themePath, path.extname(themePath)) : 'Unnamed theme'),
      description: themePath ?? undefined,
      path: themePath,
      scope: source.scope,
      origin: source.origin,
      source: source.source,
      enabled: true,
      packageSource: source.origin === 'package' ? source.source : undefined,
    })
  }

  try {
    const packageManager = new DefaultPackageManager({ cwd, agentDir, settingsManager })
    for (const configured of packageManager.listConfiguredPackages()) {
      items.push({
        id: `packages:${configured.scope}:${configured.source}`,
        type: 'packages',
        name: configured.source,
        description: configured.filtered
          ? 'Configured with resource filters'
          : 'Configured Pi package source',
        path: configured.installedPath ?? null,
        scope: configured.scope,
        origin: 'package',
        source: configured.source,
        enabled: true,
        packageSource: configured.source,
      })
    }
  } catch (err) {
    // listConfiguredPackages() calls `npm root -g` for user-scoped npm packages.
    // If npm is not in PATH (GUI-launched app on macOS), degrade gracefully.
    diagnostics.push({
      type: 'warning',
      message: `Pi package discovery unavailable (npm may not be in PATH): ${
        err instanceof Error ? err.message : String(err)
      }`,
    })
  }

  const dedupedItems = dedupeItems(items)
  const hasProjectExtensions = dedupedItems.some(
    (item) => item.type === 'extensions' && item.scope === 'project'
  )

  return {
    cwd,
    workspaceTrusted: !hasProjectExtensions,
    items: dedupedItems,
    diagnostics,
  }
}

function discoverExtensionItems(options: {
  cwd: string
  agentDir: string
  settingsManager: SettingsManager
  diagnostics: CustomizationDiagnostic[]
}): CustomizationItem[] {
  const { cwd, agentDir, settingsManager, diagnostics } = options
  const items: CustomizationItem[] = []

  const globalSettings = settingsManager.getGlobalSettings()
  const projectSettings = settingsManager.getProjectSettings()

  items.push(
    ...collectExtensionPath(path.join(agentDir, 'extensions'), {
      scope: 'user',
      origin: 'top-level',
      source: 'user-global',
      diagnostics,
    })
  )
  items.push(
    ...collectExtensionPath(path.join(cwd, '.pi', 'extensions'), {
      scope: 'project',
      origin: 'top-level',
      source: 'project-local',
      diagnostics,
    })
  )

  for (const configuredPath of globalSettings.extensions ?? []) {
    items.push(
      ...collectExtensionPath(resolveConfiguredPath(configuredPath, agentDir), {
        scope: 'user',
        origin: 'settings',
        source: 'settings.json',
        diagnostics,
        configuredPath,
      })
    )
  }

  for (const configuredPath of projectSettings.extensions ?? []) {
    items.push(
      ...collectExtensionPath(resolveConfiguredPath(configuredPath, cwd), {
        scope: 'project',
        origin: 'settings',
        source: '.pi/settings.json',
        diagnostics,
        configuredPath,
      })
    )
  }

  return items
}

function collectExtensionPath(
  targetPath: string,
  options: {
    scope: SourceScope
    origin: SourceOrigin
    source: string
    diagnostics: CustomizationDiagnostic[]
    configuredPath?: string
  }
): CustomizationItem[] {
  const resolvedPath = path.resolve(targetPath)
  if (!existsSync(resolvedPath)) {
    if (options.configuredPath) {
      options.diagnostics.push({
        type: 'warning',
        message: `Configured extension path does not exist: ${options.configuredPath}`,
        path: resolvedPath,
        scope: options.scope,
      })
    }
    return []
  }

  const files = collectExtensionFiles(resolvedPath)
  return files.map((filePath) => ({
    id: itemId('extensions', filePath),
    type: 'extensions',
    name: extensionName(filePath),
    description:
      options.scope === 'project'
        ? 'Project-local executable Pi extension. OpenPi lists it but does not load it until the trust gate exists.'
        : 'Executable Pi extension. OpenPi lists it read-only in this Phase 2 slice.',
    path: filePath,
    scope: options.scope,
    origin: options.origin,
    source: options.source,
    enabled: false,
    warning:
      options.scope === 'project'
        ? 'Project-local extensions have full system permissions and require explicit workspace trust before enabling.'
        : 'Extensions have full system permissions; execution remains disabled in OpenPi for this slice.',
  }))
}

function collectExtensionFiles(targetPath: string): string[] {
  const resolvedPath = path.resolve(targetPath)
  const stats = statSync(resolvedPath)
  if (stats.isFile()) {
    if (isExtensionEntryFile(resolvedPath)) return [resolvedPath]
    return []
  }
  if (!stats.isDirectory()) return []

  const files: string[] = []

  // Match Pi's documented auto-discovery shape exactly:
  //   ~/.pi/agent/extensions/*.ts
  //   ~/.pi/agent/extensions/*/index.ts
  //   .pi/extensions/*.ts
  //   .pi/extensions/*/index.ts
  // Do not recursively count helper modules inside extension folders.
  for (const entry of readdirSync(resolvedPath, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const entryPath = path.join(resolvedPath, entry.name)
    if (entry.isFile() && isExtensionEntryFile(entryPath)) {
      files.push(entryPath)
      continue
    }
    if (entry.isDirectory()) {
      const indexPath = path.join(entryPath, 'index.ts')
      if (existsSync(indexPath) && statSync(indexPath).isFile()) {
        files.push(indexPath)
      }
    }
  }

  return files.sort((a, b) => a.localeCompare(b))
}

function isExtensionEntryFile(filePath: string): boolean {
  return EXTENSION_ENTRY_EXTENSIONS.has(path.extname(filePath))
}

function sourceFrom(
  sourceInfo: SourceLike | undefined,
  fallbackPath: string | null | undefined
): Required<Pick<SourceLike, 'source' | 'scope' | 'origin'>> {
  if (sourceInfo) {
    return {
      source: sourceInfo.source ?? inferSource(fallbackPath),
      scope: sourceInfo.scope ?? inferScope(fallbackPath),
      origin: sourceInfo.origin ?? 'top-level',
    }
  }
  return {
    source: inferSource(fallbackPath),
    scope: inferScope(fallbackPath),
    origin: 'top-level',
  }
}

function inferScope(filePath: string | null | undefined): SourceScope {
  if (filePath?.includes(`${path.sep}.pi${path.sep}`)) return 'project'
  return 'user'
}

function inferSource(filePath: string | null | undefined): string {
  if (!filePath) return 'built-in'
  if (filePath.includes(`${path.sep}.pi${path.sep}`)) return 'project-local'
  return 'user-global'
}

function toDiagnostic(diagnostic: DiagnosticLike): CustomizationDiagnostic {
  const kind =
    diagnostic.type === 'error' ? 'error' : diagnostic.type === 'info' ? 'info' : 'warning'
  return {
    type: kind,
    message: diagnostic.message ?? 'Resource diagnostic',
    path: diagnostic.path,
  }
}

function resolveConfiguredPath(inputPath: string, baseDir: string): string {
  if (path.isAbsolute(inputPath)) return inputPath
  return path.resolve(baseDir, inputPath)
}

function extensionName(filePath: string): string {
  const base = path.basename(filePath, path.extname(filePath))
  if (base === 'index') return path.basename(path.dirname(filePath))
  return base
}

function itemId(type: CustomizationItem['type'], key: string): string {
  return `${type}:${key}`
}

function dedupeItems(items: CustomizationItem[]): CustomizationItem[] {
  const byId = new Map<string, CustomizationItem>()
  for (const item of items) {
    const existing = byId.get(item.id)
    if (!existing) {
      byId.set(item.id, item)
      continue
    }
    byId.set(item.id, {
      ...existing,
      enabled: existing.enabled || item.enabled,
      origin: existing.origin === 'settings' ? existing.origin : item.origin,
      source:
        existing.source === item.source ? existing.source : `${existing.source}, ${item.source}`,
    })
  }
  return [...byId.values()].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type)
    if (a.scope !== b.scope) return a.scope.localeCompare(b.scope)
    return a.name.localeCompare(b.name)
  })
}
