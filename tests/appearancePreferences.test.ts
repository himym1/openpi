import { describe, expect, it } from 'vitest'
import {
  buildCodeFontStack,
  buildTerminalFontStack,
  buildUiFontStack,
  sanitizeFontPreference,
} from '../src/lib/appearancePreferences'

describe('appearance preferences', () => {
  it('sanitizes font preferences before using them as CSS font-family values', () => {
    expect(sanitizeFontPreference('  JetBrains Mono, "Berkeley Mono", bad;font  ')).toBe(
      'JetBrains Mono, Berkeley Mono'
    )
  })

  it('rejects private macOS system font names and system font aliases', () => {
    expect(
      sanitizeFontPreference(
        '.SFNS-Regular, SF Pro Text, San Francisco, system-ui, -apple-system, BlinkMacSystemFont, Inter'
      )
    ).toBe('Inter')
  })

  it('builds the UI stack without macOS private system aliases', () => {
    const stack = buildUiFontStack('IBM Plex Sans')

    expect(stack).toMatch(/^"IBM Plex Sans", "abcNormal"/)
    expect(stack).not.toContain('system-ui')
    expect(stack).not.toContain('-apple-system')
    expect(stack).not.toContain('BlinkMacSystemFont')
  })

  it('prepends custom code font to the code stack and keeps mono fallbacks', () => {
    const stack = buildCodeFontStack('Berkeley Mono')
    expect(stack.startsWith('"Berkeley Mono"')).toBe(true)
    expect(stack).toContain('ui-monospace')
  })

  it('keeps bundled Nerd Font symbols in the terminal stack', () => {
    const stack = buildTerminalFontStack('JetBrainsMono Nerd Font Mono')
    expect(stack.startsWith('"JetBrainsMono Nerd Font Mono"')).toBe(true)
    expect(stack).toContain('"NerdFontsSymbols Nerd Font"')
  })
})
