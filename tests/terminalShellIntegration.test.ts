import { describe, expect, it } from 'vitest'
import {
  parseTerminalIntegrationData,
  terminalCwdLabel,
} from '../src/components/terminal/shellIntegration'

describe('terminal shell integration parser', () => {
  it('strips prompt markers while preserving visible terminal output', () => {
    const parsed = parseTerminalIntegrationData('\x1b]633;A\x07hello\r\n')

    expect(parsed.promptStart).toBe(true)
    expect(parsed.cwd).toBeNull()
    expect(parsed.data).toBe('hello\r\n')
  })

  it('extracts cwd markers and strips them from the terminal stream', () => {
    const parsed = parseTerminalIntegrationData('before\x1b]633;P;Cwd=/Users/me/project\x07after')

    expect(parsed.cwd).toBe('/Users/me/project')
    expect(parsed.data).toBe('beforeafter')
  })

  it('supports OSC string-terminator sequences', () => {
    const parsed = parseTerminalIntegrationData('\x1b]633;P;Cwd=/tmp/workspace\x1b\\')

    expect(parsed.cwd).toBe('/tmp/workspace')
    expect(parsed.data).toBe('')
  })

  it('derives compact cwd labels', () => {
    expect(terminalCwdLabel('/Users/me/project/')).toBe('project')
    expect(terminalCwdLabel('C:\\Users\\me\\project')).toBe('project')
    expect(terminalCwdLabel('/')).toBe('/')
  })
})
