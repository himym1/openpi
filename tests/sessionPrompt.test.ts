import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DefaultResourceLoader } from '@earendil-works/pi-coding-agent'
import { describe, expect, it } from 'vitest'
import { formatSlashCommandInput } from '../src/components/Composer'
import {
  buildPromptTextWithContext,
  buildSessionPromptPayload,
  buildSessionPromptText,
} from '../src/lib/sessionPrompt'

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

  it('keeps typed slash commands separate from attached context for sidecar expansion', () => {
    expect(buildSessionPromptPayload('/review', '<file>ctx</file>')).toEqual({
      text: '/review',
      contextPrefix: '<file>ctx</file>',
    })
  })

  it('expands slash templates before combining attached context', () => {
    expect(
      buildPromptTextWithContext('/review Button', '<file>ctx</file>', [
        { name: 'review', content: 'Review $1 with $@' },
      ])
    ).toEqual({
      text: '<file>ctx</file>\n\nReview Button with Button',
      expandedTemplate: true,
    })
  })

  it('formats selected slash commands with a single leading slash', () => {
    expect(formatSlashCommandInput('/review')).toBe('/review ')
    expect(formatSlashCommandInput('review')).toBe('/review ')
    expect(formatSlashCommandInput('/skill:review')).toBe('/skill:review ')
  })

  it('discovers review prompt templates from project before global prompts', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'openpi-prompts-'))
    const agentDir = path.join(root, 'agent')
    const cwd = path.join(root, 'workspace')
    const globalPrompts = path.join(agentDir, 'prompts')
    const projectPrompts = path.join(cwd, '.pi', 'prompts')
    fs.mkdirSync(globalPrompts, { recursive: true })
    fs.mkdirSync(projectPrompts, { recursive: true })
    fs.writeFileSync(
      path.join(globalPrompts, 'review.md'),
      '---\ndescription: Global review\n---\nGLOBAL REVIEW TEMPLATE\n',
      'utf-8'
    )
    fs.writeFileSync(
      path.join(projectPrompts, 'review.md'),
      '---\ndescription: Project review\n---\nPROJECT REVIEW TEMPLATE\n',
      'utf-8'
    )

    const loader = new DefaultResourceLoader({ cwd, agentDir, noExtensions: true })
    await loader.reload()

    const review = loader.getPrompts().prompts.find((prompt) => prompt.name === 'review')
    expect(review?.description).toBe('Project review')
    expect(review?.content.trim()).toBe('PROJECT REVIEW TEMPLATE')
  })
})
