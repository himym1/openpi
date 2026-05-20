import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsPane } from '../src/components/customizations/SettingsPane'
import type { ModelInfo } from '../src/lib/ipc'

const models: ModelInfo[] = [
  {
    id: 'gpt-5.5',
    name: 'GPT 5.5',
    provider: 'topping-codex',
    reasoning: true,
    contextWindow: 200_000,
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    reasoning: true,
    contextWindow: 200_000,
  },
]

describe('SettingsPane model settings', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'openpi', {
      configurable: true,
      value: {
        getModels: vi.fn(() => Promise.resolve(models)),
        getSettings: vi.fn(() =>
          Promise.resolve({
            global: { defaultModel: 'gpt-5.5', defaultThinkingLevel: 'xhigh' },
            project: {},
            effective: { defaultModel: 'gpt-5.5', defaultThinkingLevel: 'xhigh' },
            globalPath: '~/.pi/agent/settings.json',
            projectPath: null,
          })
        ),
        saveSettings: vi.fn(() => Promise.resolve()),
      },
    })
  })

  afterEach(() => cleanup())

  it('loads configured model choices from the Pi model registry', async () => {
    render(() => <SettingsPane hasCwd={false} models={[]} onError={vi.fn()} />)

    await screen.findByText('GPT 5.5 · topping-codex')
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
      expect(selects[1]).toHaveProperty('value', 'gpt-5.5')
    })
  })

  it('selecting a default model saves its provider with the model id', async () => {
    render(() => <SettingsPane hasCwd={false} models={[]} onError={vi.fn()} />)

    await screen.findByText('GPT 5.5 · topping-codex')
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    fireEvent.change(selects[1], { target: { value: 'claude-sonnet-4-20250514' } })

    await waitFor(() =>
      expect(window.openpi.saveSettings).toHaveBeenCalledWith(
        'global',
        expect.objectContaining({
          defaultModel: 'claude-sonnet-4-20250514',
          defaultProvider: 'anthropic',
        })
      )
    )
  })
})
