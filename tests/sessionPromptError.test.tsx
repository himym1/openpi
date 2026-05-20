import { render } from '@solidjs/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOpenPiSession } from '../src/hooks/useOpenPiSession'
import type { SessionReady } from '../src/lib/ipc'

type SessionApi = ReturnType<typeof useOpenPiSession>

const noopUnsub = () => {}

function installOpenPiMock() {
  let readyHandler: ((payload: SessionReady) => void) | null = null
  const prompt = vi.fn()

  Object.defineProperty(window, 'openpi', {
    configurable: true,
    value: {
      getWorkspaces: vi.fn(() => Promise.resolve([])),
      getSessions: vi.fn(() => Promise.resolve([])),
      getSessionStats: vi.fn(() => Promise.resolve({ contextUsagePercent: 0 })),
      getWorkspaceSummary: vi.fn(() => Promise.resolve({ branch: null })),
      onSessionEvent: vi.fn(() => noopUnsub),
      onRemoteSessionStatus: vi.fn(() => noopUnsub),
      onRemoteSessionUpdate: vi.fn(() => noopUnsub),
      onGoalUpdate: vi.fn(() => noopUnsub),
      onPlanUpdate: vi.fn(() => noopUnsub),
      onSessionReady: vi.fn((handler: (payload: SessionReady) => void) => {
        readyHandler = handler
        return noopUnsub
      }),
      onSessionError: vi.fn(() => noopUnsub),
      onSessionIndexUpdated: vi.fn(() => noopUnsub),
      prompt,
      steer: vi.fn(() => Promise.resolve()),
      followUp: vi.fn(() => Promise.resolve()),
      git: {
        onStatusChanged: vi.fn(() => noopUnsub),
      },
    },
  })

  return {
    prompt,
    ready(payload: Partial<SessionReady> = {}) {
      if (!readyHandler) throw new Error('session ready handler not registered')
      readyHandler({
        cwd: '/tmp/openpi-test-workspace',
        sessionFile: null,
        sessionId: null,
        sessionName: null,
        model: null,
        thinkingLevel: null,
        ...payload,
      })
    },
  }
}

describe('useOpenPiSession prompt errors', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('clears a stale prompt error before a retry that sends successfully', async () => {
    const openpi = installOpenPiMock()
    let session!: SessionApi

    render(() => {
      session = useOpenPiSession()
      return <div />
    })

    await Promise.resolve()
    openpi.ready()

    openpi.prompt.mockRejectedValueOnce(
      new Error('String must contain at most 100000 character(s)')
    )
    session.setInput('too large')
    await session.send()
    expect(session.error).toContain('100000')

    openpi.prompt.mockResolvedValueOnce(undefined)
    session.setInput('smaller retry')
    await session.send()

    expect(session.error).toBeNull()
  })
})
