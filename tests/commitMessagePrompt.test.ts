import { describe, expect, it } from 'vitest'
import { buildCommitMessagePrompt } from '../electron/gitHost'

describe('buildCommitMessagePrompt', () => {
  it('incorporates safe-commit style staged-only and language rules', () => {
    const prompt = buildCommitMessagePrompt(
      {
        stat: 'docs/review.md | 10 +++++',
        nameStatus: 'A\tdocs/review.md',
        diff: 'diff --git a/docs/review.md b/docs/review.md\n+BLE Korean review notes',
        truncated: false,
      },
      'docs: add 1 file'
    )

    expect(prompt).toContain('conservative Git commit message assistant')
    expect(prompt).toContain('Use only staged diff/name-status/stat')
    expect(prompt).toContain('Ignore unstaged and untracked files')
    expect(prompt).toContain('Follow repository language rules')
    expect(prompt).toContain('If the repo requires Chinese commit messages')
    expect(prompt).toContain('Do not translate file names')
    expect(prompt).toContain('Prefer semantic intent over file counts')
    expect(prompt).toContain('Never write "add N files/remove N files"')
  })
})
