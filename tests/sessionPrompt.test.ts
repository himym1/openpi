import { describe, expect, it } from 'vitest'
import { buildSessionPromptText } from '../src/hooks/useOpenPiSession'

describe('session prompt text', () => {
  it('allows context-only prompts', () => {
    expect(buildSessionPromptText('', 'Use this comment')).toBe('Use this comment')
  })

  it('prepends context to typed input', () => {
    expect(buildSessionPromptText('Explain this', 'Use this comment')).toBe(
      'Use this comment\n\nExplain this'
    )
  })

  it('trims empty input without context to an empty prompt', () => {
    expect(buildSessionPromptText('   ')).toBe('')
  })
})
