/**
 * PTY host — Electron main process only.
 * Spawns and manages node-pty instances; forwards data/exit events to renderer.
 * Renderer never has direct PTY or node access.
 */
import * as pty from '@lydell/node-pty'
import type { WebContents } from 'electron'
import { IPC } from '../src/lib/ipc'

interface PtyEntry {
  id: string
  ptyProcess: pty.IPty
  cwd: string
}

export class PtyHost {
  private entries = new Map<string, PtyEntry>()
  private sender: WebContents | null = null
  private nextId = 1

  setSender(webContents: WebContents): void {
    this.sender = webContents
  }

  create(cwd: string, cols: number, rows: number): string {
    const id = `pty-${this.nextId++}`
    const shell = process.env.SHELL ?? '/bin/zsh'

    const p = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: Math.max(1, cols),
      rows: Math.max(1, rows),
      cwd: cwd || (process.env.HOME ?? '/'),
      env: process.env as Record<string, string>,
    })

    p.onData((data: string) => {
      this.sender?.send(IPC.PTY_DATA, { id, data })
    })

    p.onExit(({ exitCode }: { exitCode: number }) => {
      this.entries.delete(id)
      this.sender?.send(IPC.PTY_EXIT, { id, code: exitCode })
    })

    this.entries.set(id, { id, ptyProcess: p, cwd })
    return id
  }

  write(id: string, data: string): void {
    this.entries.get(id)?.ptyProcess.write(data)
  }

  resize(id: string, cols: number, rows: number): void {
    const entry = this.entries.get(id)
    if (!entry) return
    try {
      entry.ptyProcess.resize(Math.max(1, cols), Math.max(1, rows))
    } catch {
      // PTY may be closing; ignore
    }
  }

  close(id: string): void {
    const entry = this.entries.get(id)
    if (!entry) return
    try {
      entry.ptyProcess.kill()
    } catch {
      /* ignore */
    }
    this.entries.delete(id)
  }

  closeAll(): void {
    for (const entry of this.entries.values()) {
      try {
        entry.ptyProcess.kill()
      } catch {
        /* ignore */
      }
    }
    this.entries.clear()
  }
}

export const ptyHost = new PtyHost()
