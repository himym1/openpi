import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Composer } from '../src/components/Composer'
import type { PromptImage } from '../src/lib/ipc'

const baseProps = {
  input: '',
  isStreaming: false,
  isShellRunning: false,
  queueMode: 'prompt' as const,
  workspaceName: 'workspace',
  promptHistory: [],
  steeringQueue: [],
  followUpQueue: [],
  setTextareaRef: vi.fn(),
  cwd: '/tmp/workspace',
  attachedFiles: [],
  attachedImages: [] as PromptImage[],
  onAddFile: vi.fn(),
  onRemoveFile: vi.fn(),
  lineComments: [],
  onRemoveLineComment: vi.fn(),
  loadedSkills: [],
  onAddSkill: vi.fn(),
  onRemoveSkill: vi.fn(),
  models: [],
  currentModel: null,
  onSelectModel: vi.fn(),
  thinkingLevel: 'medium',
  onThinkingLevel: vi.fn(),
  onConnectProvider: vi.fn(),
  onManageModels: vi.fn(),
  onInput: vi.fn(),
  onQueueMode: vi.fn(),
  onSend: vi.fn(),
  onShellSend: vi.fn(),
  onAbort: vi.fn(),
  activeGoalText: null,
  activeGoalStep: null,
  activeGoalElapsed: null,
  activeGoalProgress: null,
  onSetActiveGoal: vi.fn(),
  contextPercent: null,
  agentTps: null,
}

describe('Composer image paste', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'openpi', {
      configurable: true,
      value: {
        listPromptTemplates: vi.fn(() => Promise.resolve([])),
        listSkills: vi.fn(() => Promise.resolve([])),
        fff: {
          fileSearch: vi.fn(() => Promise.resolve([])),
        },
      },
    })
  })

  afterEach(() => cleanup())

  it('renders pasted image attachment previews', () => {
    const { container } = render(() => (
      <Composer
        {...baseProps}
        attachedImages={[{ type: 'image', mimeType: 'image/png', data: 'AQID' }]}
        onAddImages={vi.fn()}
        onRemoveImage={vi.fn()}
      />
    ))

    const preview = container.querySelector('.ctx-chip-image-thumb') as HTMLImageElement | null
    expect(preview?.src).toContain('data:image/png;base64,AQID')
  })

  it('converts pasted image clipboard items into prompt image attachments', async () => {
    const onAddImages = vi.fn()
    const onRemoveImage = vi.fn()
    render(() => (
      <Composer {...baseProps} onAddImages={onAddImages} onRemoveImage={onRemoveImage} />
    ))

    const textarea = screen.getByRole('textbox')
    const imageFile = new File([new Uint8Array([1, 2, 3])], 'paste.png', { type: 'image/png' })
    fireEvent.paste(textarea, {
      clipboardData: {
        items: [
          {
            kind: 'file',
            type: 'image/png',
            getAsFile: () => imageFile,
          },
        ],
      },
    })

    await waitFor(() => expect(onAddImages).toHaveBeenCalledTimes(1))
    expect(onAddImages.mock.calls[0][0]).toMatchObject([
      { type: 'image', mimeType: 'image/png', data: 'AQID' },
    ])
  })
})
