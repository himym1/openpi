/**
 * MarkdownContent — renders Pi agent responses as formatted markdown.
 * Uses marked + marked-shiki (shiki for code blocks, GFM extensions).
 * The shiki highlighter is shared from src/lib/shiki.ts.
 */

import { marked } from 'marked'
import markedShiki from 'marked-shiki'
import { type Component, createEffect, createSignal, onCleanup } from 'solid-js'
import { ensureHighlighter } from '../../lib/shiki'

type Props = { text: string; streaming?: boolean }

export const MarkdownContent: Component<Props> = (props) => {
  const [html, setHtml] = createSignal('')

  createEffect(() => {
    const text = props.text
    let cancelled = false

    const renderPlainMarkdown = async () => {
      const plainHtml = await marked.parse(text, { gfm: true })
      if (!cancelled) setHtml(plainHtml)
    }

    const renderHighlightedMarkdown = async () => {
      try {
        const h = await ensureHighlighter()
        if (cancelled) return

        // markedShiki takes a custom highlight callback — wrap shiki inside it.
        // This is progressive enhancement only; plain markdown is rendered first
        // so file previews never appear blank while Shiki loads or fails.
        const parser = marked.use(
          markedShiki({
            highlight: (code, lang) =>
              h.codeToHtml(code, {
                lang: lang || 'plaintext',
                theme: 'css-variables',
              }),
          })
        )
        const highlightedHtml = await parser.parse(text, { gfm: true })
        if (!cancelled) setHtml(highlightedHtml)
      } catch {
        // Keep the already-rendered plain markdown fallback.
      }
    }

    void renderPlainMarkdown()
    void renderHighlightedMarkdown()

    onCleanup(() => {
      cancelled = true
    })
  })

  return <div class={`md-content${props.streaming ? ' is-streaming' : ''}`} innerHTML={html()} />
}
