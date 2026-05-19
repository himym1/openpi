import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Welcome } from '../src/components/Welcome'

const installOpenPiMock = (firstRun = true) => {
  Object.defineProperty(window, 'openpi', {
    configurable: true,
    value: {
      getFirstRun: vi.fn(() => Promise.resolve(firstRun)),
    },
  })
}

describe('Welcome', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    installOpenPiMock()
  })

  afterEach(() => {
    cleanup()
  })

  it('keeps the open workspace button busy until the picker action settles', async () => {
    let finishOpen: (() => void) | undefined
    const onOpen = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishOpen = resolve
        })
    )

    render(() => <Welcome appName="OpenPi" appVersionLabel={null} error={null} onOpen={onOpen} />)

    const button = screen.getByRole('button', { name: /open workspace/i })
    fireEvent.click(button)

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(button).toHaveProperty('disabled', true)
    expect(button.textContent).toContain('Opening workspace…')

    finishOpen?.()
    await Promise.resolve()

    expect(button).toHaveProperty('disabled', false)
    expect(button.textContent).toContain('Open workspace')
  })

  it('surfaces picker failures instead of silently staying on welcome', async () => {
    const onOpen = vi.fn(() => Promise.reject(new Error('dialog failed')))

    render(() => <Welcome appName="OpenPi" appVersionLabel={null} error={null} onOpen={onOpen} />)

    fireEvent.click(screen.getByRole('button', { name: /open workspace/i }))
    await Promise.resolve()
    await Promise.resolve()

    expect(screen.getByText('dialog failed')).toBeTruthy()
  })
})
