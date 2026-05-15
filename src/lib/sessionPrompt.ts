export type SessionPromptPayload = {
  text: string
  contextPrefix?: string
}

export type ExpandablePromptTemplate = {
  name: string
  content: string
}

export function buildSessionPromptText(inputText: string, contextPrefix?: string): string {
  const userText = inputText.trim()
  const prefix = contextPrefix?.trim()
  if (prefix && userText) return `${prefix}\n\n${userText}`
  return prefix || userText
}

export function buildSessionPromptPayload(
  inputText: string,
  contextPrefix?: string
): SessionPromptPayload {
  const userText = inputText.trim()
  const prefix = contextPrefix?.trim()
  if (userText) return prefix ? { text: userText, contextPrefix: prefix } : { text: userText }
  return { text: prefix || '' }
}

function parseCommandArgs(argsString: string): string[] {
  const args: string[] = []
  let current = ''
  let inQuote: string | null = null

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i]
    if (inQuote) {
      if (char === inQuote) inQuote = null
      else current += char
    } else if (char === '"' || char === "'") {
      inQuote = char
    } else if (char === ' ' || char === '\t') {
      if (current) {
        args.push(current)
        current = ''
      }
    } else {
      current += char
    }
  }

  if (current) args.push(current)
  return args
}

function substituteArgs(content: string, args: string[]): string {
  let result = content
  result = result.replace(/\$(\d+)/g, (_, num: string) => args[Number.parseInt(num, 10) - 1] ?? '')
  result = result.replace(
    /\$\{@:(\d+)(?::(\d+))?\}/g,
    (_, startStr: string, lengthStr?: string) => {
      let start = Number.parseInt(startStr, 10) - 1
      if (start < 0) start = 0
      if (lengthStr) {
        const length = Number.parseInt(lengthStr, 10)
        return args.slice(start, start + length).join(' ')
      }
      return args.slice(start).join(' ')
    }
  )
  const allArgs = args.join(' ')
  result = result.replace(/\$ARGUMENTS/g, allArgs)
  result = result.replace(/\$@/g, allArgs)
  return result
}

export function expandPromptTemplateText(
  text: string,
  templates: readonly ExpandablePromptTemplate[]
): { text: string; expanded: boolean } {
  if (!text.startsWith('/')) return { text, expanded: false }

  const spaceIndex = text.indexOf(' ')
  const templateName = spaceIndex === -1 ? text.slice(1) : text.slice(1, spaceIndex)
  const argsString = spaceIndex === -1 ? '' : text.slice(spaceIndex + 1)
  const template = templates.find((candidate) => candidate.name === templateName)
  if (!template) return { text, expanded: false }

  return { text: substituteArgs(template.content, parseCommandArgs(argsString)), expanded: true }
}

export function buildPromptTextWithContext(
  inputText: string,
  contextPrefix: string | undefined,
  templates: readonly ExpandablePromptTemplate[]
): { text: string; expandedTemplate: boolean } {
  const userText = inputText.trim()
  const prefix = contextPrefix?.trim()
  if (!prefix) return { text: userText, expandedTemplate: false }
  if (!userText) return { text: prefix, expandedTemplate: false }

  const expanded = expandPromptTemplateText(userText, templates)
  return {
    text: `${prefix}\n\n${expanded.text}`,
    expandedTemplate: expanded.expanded,
  }
}
