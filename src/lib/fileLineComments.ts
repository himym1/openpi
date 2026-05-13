export interface FileLineComment {
  id: string
  path: string
  startLine: number
  endLine: number
  comment: string
  snippet: string
}

export type NewFileLineComment = Omit<FileLineComment, 'id'>

export function formatLineRange(startLine: number, endLine: number): string {
  return startLine === endLine ? `line ${startLine}` : `lines ${startLine}-${endLine}`
}

export function formatFileLineCommentPrompt(comment: FileLineComment): string {
  return [
    `<file_comment path="${comment.path}" ${comment.startLine === comment.endLine ? `line="${comment.startLine}"` : `startLine="${comment.startLine}" endLine="${comment.endLine}"`}>`,
    `<selected_code>`,
    comment.snippet,
    `</selected_code>`,
    `<comment>`,
    comment.comment,
    `</comment>`,
    `</file_comment>`,
  ].join('\n')
}

export function formatFileLineCommentsPrompt(comments: FileLineComment[]): string {
  if (comments.length === 0) return ''
  return [
    'Use these file-specific line comments as context for the next response:',
    '',
    comments.map(formatFileLineCommentPrompt).join('\n\n'),
  ].join('\n')
}
