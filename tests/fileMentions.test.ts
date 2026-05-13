import { describe, expect, it } from 'vitest'
import { findFileMentionTrigger, removeFileMentionToken } from '../src/lib/fileMentions'

describe('file mention triggers', () => {
  it('detects an @ token at the cursor', () => {
    expect(findFileMentionTrigger('@as')).toEqual({ start: 0, end: 3, query: 'as' })
    expect(findFileMentionTrigger('check @src/App')).toEqual({
      start: 6,
      end: 14,
      query: 'src/App',
    })
  })

  it('ignores email-like @ characters', () => {
    expect(findFileMentionTrigger('me@example')).toBeNull()
  })

  it('removes the selected mention token from the prompt', () => {
    const trigger = findFileMentionTrigger('please inspect @app now', 19)
    expect(trigger).toEqual({ start: 15, end: 19, query: 'app' })
    expect(removeFileMentionToken('please inspect @app now', trigger!)).toEqual({
      text: 'please inspect now',
      cursor: 15,
    })
  })

  it('clears a standalone mention after attach', () => {
    const trigger = findFileMentionTrigger('@README')
    expect(removeFileMentionToken('@README', trigger!)).toEqual({ text: '', cursor: 0 })
  })
})
