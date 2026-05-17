export type ColorSchemePreference = 'system' | 'light' | 'dark'

export type AppearancePreferences = {
  colorScheme: ColorSchemePreference
  uiFont: string
  codeFont: string
  terminalFont: string
}

export const APPEARANCE_PREFERENCES_CHANGED_EVENT = 'openpi:appearance-preferences-changed'

export const COLOR_SCHEME_OPTIONS: Array<{ value: ColorSchemePreference; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
]

export const DEFAULT_APPEARANCE_PREFERENCES: AppearancePreferences = {
  colorScheme: 'system',
  uiFont: '',
  codeFont: '',
  terminalFont: '',
}

export const APPEARANCE_PREF_KEYS = {
  colorScheme: 'appearance.color_scheme',
  uiFont: 'appearance.ui_font',
  codeFont: 'appearance.code_font',
  terminalFont: 'appearance.terminal_font',
} as const

const UI_FONT_FALLBACKS = [
  '"abcNormal"',
  '"abcNormal Fallback"',
  'Inter',
  '"Helvetica Neue"',
  'Arial',
  '"Segoe UI"',
  'sans-serif',
]

const CODE_FONT_FALLBACKS = [
  '"Berkeley Mono"',
  '"IBM Plex Mono"',
  '"JetBrains Mono"',
  '"Geist Mono"',
  'ui-monospace',
  'SFMono-Regular',
  'Menlo',
  'Monaco',
  'Consolas',
  '"Liberation Mono"',
  'monospace',
]

const TERMINAL_FONT_FALLBACKS = [
  '"Berkeley Mono"',
  '"NerdFontsSymbols Nerd Font"',
  '"Symbols Nerd Font Mono"',
  '"Symbols Nerd Font"',
  '"MesloLGS NF"',
  '"MesloLGM Nerd Font Mono"',
  '"Meslo LG M for Powerline"',
  '"Source Code Pro for Powerline"',
  '"Symbol Neu for Powerline"',
  '"JetBrains Mono"',
  '"IBM Plex Mono"',
  'ui-monospace',
  'monospace',
]

function normalizeColorScheme(value: string | null): ColorSchemePreference {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

export function sanitizeFontPreference(value: string | null): string {
  return (value ?? '')
    .split(',')
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
    .filter((part) => /^[\w\s.\-+]+$/.test(part))
    .filter((part) => !part.startsWith('.'))
    .filter((part) => !/^SF (Pro|Compact)\b/i.test(part))
    .filter((part) => !/^San Francisco\b/i.test(part))
    .filter((part) => !['system-ui', '-apple-system', 'BlinkMacSystemFont'].includes(part))
    .slice(0, 4)
    .join(', ')
    .slice(0, 160)
}

function quoteFontFamilyName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''
  if (
    /^(ui-|system-ui|monospace|sans-serif|serif|cursive|fantasy|emoji|math|fangsong)/.test(trimmed)
  )
    return trimmed
  return `"${trimmed.replaceAll('"', '')}"`
}

export function buildFontStack(preferred: string, fallbacks: readonly string[]): string {
  const customFonts = sanitizeFontPreference(preferred)
    .split(',')
    .map(quoteFontFamilyName)
    .filter(Boolean)

  return [...customFonts, ...fallbacks]
    .filter((font, index, fonts) => fonts.indexOf(font) === index)
    .join(', ')
}

export function buildUiFontStack(preferred: string): string {
  return buildFontStack(preferred, UI_FONT_FALLBACKS)
}

export function buildCodeFontStack(preferred: string): string {
  return buildFontStack(preferred, CODE_FONT_FALLBACKS)
}

export function buildTerminalFontStack(preferred: string): string {
  return buildFontStack(preferred, TERMINAL_FONT_FALLBACKS)
}

export async function loadAppearancePreferences(): Promise<AppearancePreferences> {
  const [colorScheme, uiFont, codeFont, terminalFont] = await Promise.all([
    window.openpi.getPref(APPEARANCE_PREF_KEYS.colorScheme),
    window.openpi.getPref(APPEARANCE_PREF_KEYS.uiFont),
    window.openpi.getPref(APPEARANCE_PREF_KEYS.codeFont),
    window.openpi.getPref(APPEARANCE_PREF_KEYS.terminalFont),
  ])

  return {
    colorScheme: normalizeColorScheme(colorScheme),
    uiFont: sanitizeFontPreference(uiFont),
    codeFont: sanitizeFontPreference(codeFont),
    terminalFont: sanitizeFontPreference(terminalFont),
  }
}

export async function saveAppearancePreference<K extends keyof AppearancePreferences>(
  key: K,
  value: AppearancePreferences[K]
): Promise<AppearancePreferences> {
  const nextValue =
    key === 'colorScheme'
      ? normalizeColorScheme(String(value))
      : sanitizeFontPreference(String(value))
  await window.openpi.setPref(APPEARANCE_PREF_KEYS[key], nextValue)
  const next = await loadAppearancePreferences()
  applyAppearancePreferences(next)
  window.dispatchEvent(new CustomEvent(APPEARANCE_PREFERENCES_CHANGED_EVENT, { detail: next }))
  return next
}

function resolvedColorScheme(colorScheme: ColorSchemePreference): 'light' | 'dark' {
  if (colorScheme !== 'system') return colorScheme
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function applyAppearancePreferences(prefs: AppearancePreferences): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const scheme = resolvedColorScheme(prefs.colorScheme)
  root.dataset.colorScheme = scheme
  root.style.colorScheme = scheme
  root.style.setProperty('--font-ui', buildUiFontStack(prefs.uiFont))
  root.style.setProperty('--font-code', buildCodeFontStack(prefs.codeFont))
  root.style.setProperty('--font-terminal', buildTerminalFontStack(prefs.terminalFont))
}
