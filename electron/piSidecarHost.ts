/**
 * piSidecarHost.ts — Thin bridge between Electron main and the Pi SDK utilityProcess sidecar.
 *
 * Main process stays Pi-SDK-free. All Pi SDK memory lives in the sidecar child process.
 * Main receives typed SidecarMessage events and routes them to renderer or handles locally.
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { type UtilityProcess, utilityProcess } from 'electron'
import type { SidecarCommand, SidecarMessage } from './piSidecar'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

const SIDECAR_PATH = path.join(currentDir, 'piSidecar.js')
const SIDECAR_SERVICE_NAME = 'openpi-pi-sidecar'
const RESTART_DELAY_MS = 1500
const MAX_RESTARTS = 3

type PendingRequest = {
  resolve: (msg: SidecarMessage) => void
  reject: (err: Error) => void
  timeout: NodeJS.Timeout
}

export class PiSidecarHost {
  private child: UtilityProcess | null = null
  private readonly onMessage: (msg: SidecarMessage) => void
  private readonly onCrash: () => void
  private readonly pendingRequests = new Map<string, PendingRequest>()
  private restartCount = 0
  private stopping = false

  constructor(opts: {
    onMessage: (msg: SidecarMessage) => void
    onCrash: () => void
  }) {
    this.onMessage = opts.onMessage
    this.onCrash = opts.onCrash
  }

  start(): void {
    this.stopping = false
    this.restartCount = 0
    this.spawnChild()
  }

  private spawnChild(): void {
    const child = utilityProcess.fork(SIDECAR_PATH, [], {
      serviceName: SIDECAR_SERVICE_NAME,
      stdio: 'pipe',
    })

    child.stdout?.on('data', (chunk: Buffer) => {
      process.stdout.write(`[piSidecar] ${chunk.toString('utf8').trimEnd()}\n`)
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      process.stderr.write(`[piSidecar] ${chunk.toString('utf8').trimEnd()}\n`)
    })

    child.on('message', (msg: unknown) => {
      const message = msg as SidecarMessage
      const requestId = 'requestId' in message ? message.requestId : undefined
      if (requestId) {
        const pending = this.pendingRequests.get(requestId)
        if (pending) {
          clearTimeout(pending.timeout)
          this.pendingRequests.delete(requestId)
          if (message.type === 'error' || message.type === 'session_error') {
            pending.reject(new Error(message.message))
          } else {
            pending.resolve(message)
          }
          return
        }
      }
      this.onMessage(message)
    })

    child.on('exit', (code) => {
      this.child = null
      for (const pending of this.pendingRequests.values()) {
        clearTimeout(pending.timeout)
        pending.reject(new Error(`Pi sidecar exited with code ${code}`))
      }
      this.pendingRequests.clear()
      if (this.stopping) return
      process.stderr.write(`[piSidecarHost] sidecar exited with code ${code}\n`)
      if (this.restartCount < MAX_RESTARTS) {
        this.restartCount++
        setTimeout(() => {
          if (!this.stopping) this.spawnChild()
        }, RESTART_DELAY_MS)
      } else {
        this.onCrash()
      }
    })

    this.child = child
  }

  send(command: SidecarCommand): void {
    this.child?.postMessage(command)
  }

  request<T extends SidecarMessage>(
    command: SidecarCommand & { requestId: string },
    timeoutMs = 60_000
  ): Promise<T> {
    if (!this.child) return Promise.reject(new Error('Pi sidecar is not running'))

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(command.requestId)
        reject(new Error(`Pi sidecar request timed out: ${command.type}`))
      }, timeoutMs)

      this.pendingRequests.set(command.requestId, {
        resolve: (msg) => resolve(msg as T),
        reject,
        timeout,
      })
      this.child!.postMessage(command)
    })
  }

  stop(): Promise<void> {
    this.stopping = true
    if (!this.child) return Promise.resolve()

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.child?.kill()
        resolve()
      }, 4000)

      const cleanup = (msg: unknown) => {
        if ((msg as SidecarMessage).type === 'stopped') {
          clearTimeout(timeout)
          resolve()
        }
      }

      this.child!.on('message', cleanup)
      this.child!.postMessage({ type: 'stop' } satisfies SidecarCommand)
    })
  }
}
