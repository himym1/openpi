export interface FileMentionTrigger {
  start: number
  end: number
  query: string
}

const TOKEN_BOUNDARY = /[\s([{"'`]/
const TOKEN_BREAK = /[\s\])}"'`]/

export function findFileMentionTrigger(
  input: string,
  cursor = input.length
): FileMentionTrigger | null {
  const boundedCursor = Math.max(0, Math.min(cursor, input.length))
  let start = boundedCursor - 1

  while (start >= 0 && !TOKEN_BREAK.test(input[start])) {
    if (input[start] === '@') break
    start -= 1
  }

  if (start < 0 || input[start] !== '@') return null
  if (start > 0 && !TOKEN_BOUNDARY.test(input[start - 1])) return null

  return {
    start,
    end: boundedCursor,
    query: input.slice(start + 1, boundedCursor),
  }
}

export function removeFileMentionToken(input: string, trigger: FileMentionTrigger) {
  const before = input.slice(0, trigger.start)
  const after = input.slice(trigger.end)
  const normalizedAfter = before.endsWith(' ') && after.startsWith(' ') ? after.slice(1) : after
  let text = `${before}${normalizedAfter}`
  let cursor = before.length

  if (text.trim().length === 0) {
    text = ''
    cursor = 0
  }

  return { text, cursor }
}
