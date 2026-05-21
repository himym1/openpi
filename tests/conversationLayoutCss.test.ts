import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const cssPath = path.join(process.cwd(), 'src', 'index.css')
const css = fs.readFileSync(cssPath, 'utf-8')

function blockFor(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = css.match(new RegExp(`^${escaped}\\s*\\{([^}]*)\\}`, 'm'))
  return match?.[1] ?? ''
}

function hasDeclaration(block: string, property: string, value: string): boolean {
  return new RegExp(`${property}\\s*:\\s*${value}\\s*;`).test(block)
}

describe('conversation layout CSS', () => {
  it('prevents the virtualized message list from horizontally clipping messages', () => {
    const conversationScroll = blockFor('.conversation-scroll')
    const messageList = blockFor('.message-list')
    const messageListItem = blockFor('.message-list-item')

    expect(hasDeclaration(conversationScroll, 'overflow-x', 'hidden')).toBe(true)
    expect(hasDeclaration(messageList, 'overflow-x', 'hidden')).toBe(true)
    expect(hasDeclaration(messageList, 'min-width', '0')).toBe(true)
    expect(hasDeclaration(messageListItem, 'min-width', '0')).toBe(true)
  })

  it('keeps wide code blocks constrained to the message width while allowing internal scrolling', () => {
    const assistantBody = blockFor('.assistant-body')
    const markdownContent = blockFor('.md-content')
    const codeBlock = blockFor('.code-block')
    const shikiBlock = blockFor('.code-block > .shiki,\n.code-block > pre')

    expect(hasDeclaration(assistantBody, 'min-width', '0')).toBe(true)
    expect(hasDeclaration(markdownContent, 'min-width', '0')).toBe(true)
    expect(hasDeclaration(codeBlock, 'max-width', '100%')).toBe(true)
    expect(hasDeclaration(shikiBlock, 'max-width', '100%')).toBe(true)
    expect(hasDeclaration(shikiBlock, 'overflow-x', 'auto')).toBe(true)
  })
})
