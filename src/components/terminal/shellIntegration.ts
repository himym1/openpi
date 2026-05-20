const ESC = String.fromCharCode(27)
const BEL = String.fromCharCode(7)
const OSC_633_PREFIX = `${ESC}]633;`

export interface ParsedTerminalIntegrationData {
  data: string
  cwd: string | null
  promptStart: boolean
}

export function parseTerminalIntegrationData(data: string): ParsedTerminalIntegrationData {
  let cwd: string | null = null
  let promptStart = false
  let visible = ''
  let cursor = 0

  while (cursor < data.length) {
    const start = data.indexOf(OSC_633_PREFIX, cursor)
    if (start === -1) {
      visible += data.slice(cursor)
      break
    }

    visible += data.slice(cursor, start)
    const payloadStart = start + OSC_633_PREFIX.length
    const belEnd = data.indexOf(BEL, payloadStart)
    const stEnd = data.indexOf(`${ESC}\\`, payloadStart)
    const hasBel = belEnd !== -1
    const hasSt = stEnd !== -1

    if (!hasBel && !hasSt) {
      visible += data.slice(start)
      break
    }

    const payloadEnd = hasBel && (!hasSt || belEnd < stEnd) ? belEnd : stEnd
    const payload = data.slice(payloadStart, payloadEnd)
    if (payload === 'A') {
      promptStart = true
    } else if (payload.startsWith('P;Cwd=')) {
      const nextCwd = payload.slice('P;Cwd='.length).trim()
      if (nextCwd) cwd = nextCwd
    }

    cursor = payloadEnd + (payloadEnd === stEnd ? 2 : 1)
  }

  return { data: visible, cwd, promptStart }
}

export function terminalCwdLabel(cwd: string): string {
  const normalized = cwd.replace(/\\+/g, '/').replace(/\/+$/g, '')
  if (!normalized || normalized === '/') return normalized || cwd
  return normalized.split('/').pop() || normalized
}
