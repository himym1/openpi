import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { sessionIndexTestExports } from '../electron/sessionIndex'

const tempRoots: string[] = []

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'openpi-session-index-'))
  tempRoots.push(dir)
  return dir
}

describe('session index discovery', () => {
  afterEach(() => {
    for (const dir of tempRoots.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
  })

  it('discovers sessions from a scoped Pi session directory', () => {
    const sessionsRoot = makeTempDir()
    const workspace = path.join(makeTempDir(), 'workspace')
    fs.mkdirSync(workspace)

    const sessionDir = sessionIndexTestExports.getDefaultSessionDir(workspace, sessionsRoot)
    fs.mkdirSync(sessionDir)
    fs.writeFileSync(
      path.join(sessionDir, 'session.jsonl'),
      `${JSON.stringify({ type: 'session', id: 'session-1', cwd: workspace, timestamp: '2026-05-18T00:00:00.000Z' })}\n`,
      'utf-8'
    )

    const sessions = sessionIndexTestExports.listSessionInfos(workspace, sessionsRoot)

    expect(sessions.map((session) => session.id)).toEqual(['session-1'])
  })

  it('returns an empty scoped result when no session files exist', () => {
    const sessionsRoot = makeTempDir()
    const workspace = path.join(makeTempDir(), 'workspace')
    fs.mkdirSync(workspace)
    fs.mkdirSync(sessionIndexTestExports.getDefaultSessionDir(workspace, sessionsRoot))

    expect(sessionIndexTestExports.listSessionInfos(workspace, sessionsRoot)).toEqual([])
  })
})
