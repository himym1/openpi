import { cleanup, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, it } from 'vitest'
import { UserMessage } from '../src/components/conversation/Messages'
import type { SessionHistoryMessage } from '../src/lib/ipc'

function userMessage(text: string): SessionHistoryMessage {
  return {
    id: 'user-1',
    role: 'user',
    text,
    toolCards: [],
  }
}

describe('UserMessage', () => {
  afterEach(() => cleanup())

  it('renders pasted skill XML literally instead of treating it as HTML', async () => {
    render(() => <UserMessage message={userMessage('<skill name="cs">\n# cs\n</skill>')} />)

    expect(await screen.findByText(/<skill name="cs">/)).toBeTruthy()
    expect(screen.getByText(/<\/skill>/)).toBeTruthy()
  })

  it('uses a full-width bubble for large pasted context blocks', () => {
    const longText = '<skill name="cs">\n'.repeat(40)
    const { container } = render(() => <UserMessage message={userMessage(longText)} />)

    expect(container.querySelector('.user-msg-stack.is-long')).toBeTruthy()
  })
})
