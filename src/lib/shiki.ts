/**
 * shiki.ts — shared syntax highlighter instance.
 *
 * Used by MarkdownContent and FileViewerModal/LineNumberedEditor.
 * Exposes a synchronous `highlightCode` function that returns plain HTML
 * when the highlighter is ready (falls back to escaped text otherwise).
 */
import type { createHighlighter } from 'shiki'

type HighlighterInstance = Awaited<ReturnType<typeof createHighlighter>>

let _highlighter: HighlighterInstance | null = null
let _highlighterPromise: Promise<HighlighterInstance> | null = null

export async function ensureHighlighter(): Promise<HighlighterInstance> {
  if (_highlighter) return _highlighter

  _highlighterPromise ??= import('shiki')
    .then(({ createHighlighter }) =>
      createHighlighter({
        themes: ['github-dark-dimmed', 'css-variables'],
        langs: [
          'typescript',
          'javascript',
          'tsx',
          'jsx',
          'css',
          'scss',
          'html',
          'json',
          'bash',
          'python',
          'rust',
          'go',
          'yaml',
          'markdown',
          'sql',
          'toml',
          'ruby',
          'php',
          'graphql',
          'plaintext',
        ],
      })
    )
    .then((h) => {
      _highlighter = h
      return h
    })

  return _highlighterPromise
}

const LANG_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  jsx: 'jsx',
  mjs: 'javascript',
  cjs: 'javascript',
  css: 'css',
  scss: 'scss',
  less: 'css',
  html: 'html',
  htm: 'html',
  json: 'json',
  jsonc: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  md: 'markdown',
  mdx: 'markdown',
  py: 'python',
  rs: 'rust',
  go: 'go',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  rb: 'ruby',
  php: 'php',
  sql: 'sql',
  graphql: 'graphql',
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Resolve extension → shiki language id */
export function extToLang(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return LANG_MAP[ext] ?? null
}

/**
 * Highlight `code` for the given `filename` extension.
 * Uses shiki's css-variables theme so token colours follow the active
 * OpenPi theme palette via --shiki-* CSS variables.
 */
export function highlightCode(code: string, filename: string): string {
  const lang = extToLang(filename)
  if (!_highlighter || !lang) return `<pre>${escHtml(code)}</pre>`
  try {
    return _highlighter.codeToHtml(code, {
      lang,
      theme: 'css-variables',
    })
  } catch {
    return `<pre>${escHtml(code)}</pre>`
  }
}

export function getHighlighter(): HighlighterInstance | null {
  return _highlighter
}
