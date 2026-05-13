import { describe, expect, it } from 'vitest'
import {
  type FileLineComment,
  formatFileLineCommentPrompt,
  formatFileLineCommentsPrompt,
  formatLineRange,
} from '../src/lib/fileLineComments'

describe('file line comments', () => {
  const comment: FileLineComment = {
    id: 'comment-1',
    path: 'src/App.tsx',
    startLine: 10,
    endLine: 12,
    snippet: 'const a = 1\nconst b = 2\nreturn a + b',
    comment: 'Explain whether this should be extracted.',
  }

  it('formats single-line and multi-line ranges for UI labels', () => {
    expect(formatLineRange(4, 4)).toBe('line 4')
    expect(formatLineRange(4, 9)).toBe('lines 4-9')
  })

  it('serializes a line comment as structured prompt context', () => {
    expect(formatFileLineCommentPrompt(comment)).toContain(
      '<file_comment path="src/App.tsx" startLine="10" endLine="12">'
    )
    expect(formatFileLineCommentPrompt(comment)).toContain('<selected_code>')
    expect(formatFileLineCommentPrompt(comment)).toContain(comment.snippet)
    expect(formatFileLineCommentPrompt(comment)).toContain(comment.comment)
  })

  it('serializes a batch only when comments exist', () => {
    expect(formatFileLineCommentsPrompt([])).toBe('')
    expect(formatFileLineCommentsPrompt([comment])).toContain(
      'Use these file-specific line comments as context for the next response:'
    )
  })
})
