import { render } from '@solidjs/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOpenPiSession } from '../src/hooks/useOpenPiSession'
import type { SessionEvent, SessionReady } from '../src/lib/ipc'

const noopUnsub = () => {}

type SessionApi = ReturnType<typeof useOpenPiSession>

function installOpenPiMock() {
  let readyHandler: ((payload: SessionReady) => void) | null = null
  let eventHandler: ((event: SessionEvent) => void) | null = null
  const getSessionStats = vi.fn(() => Promise.resolve({ contextUsagePercent: 133 }))

  Object.defineProperty(window, 'openpi', {
    configurable: true,
    value: {
      getWorkspaces: vi.fn(() => Promise.resolve([])),
      getSessions: vi.fn(() => Promise.resolve([])),
      getSessionStats,
      getWorkspaceSummary: vi.fn(() => Promise.resolve({ branch: null })),
      getModels: vi.fn(() => Promise.resolve([])),
      onSessionEvent: vi.fn((handler: (event: SessionEvent) => void) => {
        eventHandler = handler
        return noopUnsub
      }),
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
      prompt: vi.fn(() => Promise.resolve()),
      steer: vi.fn(() => Promise.resolve()),
      followUp: vi.fn(() => Promise.resolve()),
      git: {
        onStatusChanged: vi.fn(() => noopUnsub),
      },
    },
  })

  return {
    getSessionStats,
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
    emit(event: SessionEvent) {
      if (!eventHandler) throw new Error('session event handler not registered')
      eventHandler(event)
    },
  }
}

async function flush() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('useOpenPiSession context usage after compaction', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('invalidates a stale overflow badge when context compaction starts', async () => {
    const openpi = installOpenPiMock()
    let session!: SessionApi

    render(() => {
      session = useOpenPiSession()
      return <div />
    })

    openpi.ready()
    await flush()
    expect(session.contextPercent).toBe(133)

    openpi.emit({ type: 'compaction_start', reason: 'threshold' })

    expect(session.contextPercent).toBeNull()
  })

  it('keeps context usage unknown after compaction ends until the next trusted usage refresh', async () => {
    const openpi = installOpenPiMock()
    let session!: SessionApi

    render(() => {
      session = useOpenPiSession()
      return <div />
    })

    openpi.ready()
    await flush()
    expect(session.contextPercent).toBe(133)

    openpi.emit({
      type: 'compaction_end',
      reason: 'threshold',
      aborted: false,
      willRetry: false,
      result: { tokensBefore: 268667, summary: 'Compacted previous work.' },
    })

    expect(session.contextPercent).toBeNull()
    expect(openpi.getSessionStats).toHaveBeenCalledTimes(1)
  })
})
