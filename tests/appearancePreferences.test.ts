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

  it('prepends custom UI font to the default UI stack', () => {
    expect(buildUiFontStack('SF Pro Text')).toMatch(/^"SF Pro Text", "abcNormal"/)
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
