import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

class FakeChild extends EventEmitter {
  pid = 12345
  send = vi.fn()
  stdout = new EventEmitter()
  stderr = new EventEmitter()
}

let currentChild: FakeChild | null = null

const childProcessMock = {
  fork: vi.fn(() => {
    currentChild = new FakeChild()
    return currentChild
  }),
  spawnSync: vi.fn(() => ({ status: 0, stdout: '', stderr: '' })),
}

vi.mock('node:child_process', () => ({
  ...childProcessMock,
  default: childProcessMock,
}))

const electronMock = {
  app: { isPackaged: false },
  utilityProcess: {
    fork: vi.fn(() => {
      currentChild = new FakeChild()
      return currentChild
    }),
  },
}

vi.mock('electron', () => ({
  ...electronMock,
  default: electronMock,
}))

describe('PiSidecarHost failure reporting', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    currentChild = null
    vi.clearAllMocks()
  })

  it('emits a session_error when the sidecar exits unexpectedly', async () => {
    const { PiSidecarHost } = await import('../electron/piSidecarHost')
    const messages: Array<Record<string, unknown>> = []
    const host = new PiSidecarHost({
      onMessage: (msg) => messages.push(msg as Record<string, unknown>),
      onCrash: vi.fn(),
    })

    host.start()
    expect(currentChild).not.toBeNull()

    currentChild?.emit('exit', 1)

    expect(messages).toContainEqual(
      expect.objectContaining({
        type: 'session_error',
        code: 'pi_sidecar_exited',
        message: expect.stringContaining('Pi sidecar exited with code 1'),
      })
    )
  })

  it('reports failed prompt delivery instead of silently dropping it while the sidecar is restarting', async () => {
    const { PiSidecarHost } = await import('../electron/piSidecarHost')
    const messages: Array<Record<string, unknown>> = []
    const host = new PiSidecarHost({
      onMessage: (msg) => messages.push(msg as Record<string, unknown>),
      onCrash: vi.fn(),
    })

    host.start()
    currentChild?.emit('exit', 1)
    const delivered = host.send({ type: 'prompt', text: 'hello' })

    expect(delivered).toBe(false)
    expect(messages).toContainEqual(
      expect.objectContaining({
        type: 'session_error',
        code: 'pi_sidecar_unavailable',
        message: expect.stringContaining('Pi sidecar is not running'),
      })
    )
  })
})
