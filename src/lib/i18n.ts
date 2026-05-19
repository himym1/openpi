import { createSignal } from 'solid-js'

export type UiLanguage = 'en' | 'zh-CN'
export type UiLanguagePreference = 'system' | UiLanguage
export type TranslationParams = Record<string, string | number | boolean | null | undefined>

export const UI_LANGUAGE_PREF_KEY = 'ui.language'
export const UI_LANGUAGE_CHANGED_EVENT = 'openpi:ui-language-changed'

const LANGUAGE_OPTIONS = ['system', 'en', 'zh-CN'] as const

const en = {
  'app.name': 'OpenPi',
  'app.tagline': 'A desktop workbench for Pi coding agent',
  'common.loading': 'Loading…',
  'common.saved': 'saved',
  'common.copied': 'copied',
  'common.resetToDefault': 'Reset to default',
  'common.system': 'System',
  'common.english': 'English',
  'common.simplifiedChinese': 'Simplified Chinese',
  'settings.general': 'General',
  'settings.appearance': 'Appearance',
  'settings.language': 'Language',
  'settings.languageDescription':
    'Choose the UI language. System follows your OS/browser language.',
  'welcome.description': 'Local-first sessions, model controls, and recoverable agent state.',
  'welcome.gettingStartedLabel': 'Getting started:',
  'welcome.gettingStartedIntro':
    'Open a workspace directory to start a Pi session. Pi reads your project files, responds to prompts, and edits code — all with full context of your repository.',
  'welcome.stepOpenWorkspace': 'Click Open workspace and select your project folder',
  'welcome.stepSetGoal': 'Type /goal to set an objective, or just start chatting',
  'welcome.stepReviewChanges': 'Review changes in the Git panel, then stage and commit',
  'welcome.piRepo': 'Pi repo',
  'welcome.openPiSource': 'OpenPi source',
  'welcome.openWorkspace': 'Open workspace',
  'welcome.openingWorkspace': 'Opening workspace…',
  'composer.inWorkspace': 'in {name}',
  'topbar.renameSession': 'Click to rename session',
  'topbar.in': 'in',
  'topbar.changeWorkspace': 'Change workspace',
  'topbar.switchBranch': 'Switch branch',
  'topbar.changedFiles': 'Changed files',
  'topbar.customize': 'Customize OpenPi',
  'bottom.showWorkspaces': 'Show workspaces',
  'bottom.showStories': 'Show stories',
  'bottom.showSessionMap': 'Show session map',
  'bottom.showThreadHistory': 'Show thread history (⌘B)',
  'bottom.whatsNew': "What's new",
  'bottom.checkForUpdates': 'Check for updates',
  'bottom.updateAvailable': 'Update available',
  'bottom.copiedBrewCommand': 'Copied brew command',
  'bottom.agentRunning': 'Agent running',
  'bottom.running': 'running',
  'bottom.toggleSourceControl': 'Toggle source control panel',
  'bottom.toggleFileTree': 'Toggle file tree panel',
  'bottom.toggleTerminal': 'Toggle terminal (⌘J)',
  'git.fetching': 'Fetching…',
  'git.pulling': 'Pulling…',
  'git.pullingRebase': 'Pulling (rebase)…',
  'git.pushing': 'Pushing…',
  'sidebar.threads': 'Threads',
  'sidebar.searchThreads': 'Search threads',
  'sidebar.archivedThreads': 'Archived threads',
  'sidebar.newThread': 'New thread',
  'sidebar.newThreadShortcut': 'New thread (⌘N)',
  'sidebar.archived': 'Archived',
  'sidebar.restoreSession': 'Restore session',
  'sidebar.deleteSession': 'Permanently delete session',
  'sidebar.noArchivedSessions': 'No archived sessions',
  'sidebar.pinned': 'Pinned',
  'sidebar.noThreads': 'No threads indexed yet. Start a prompt to create the first Pi thread.',
  'sidebar.archiveAll': 'Archive all',
  'sidebar.newSessionInWorkspace': 'New session in this workspace',
  'sidebar.loadMore': 'Load {count} more',
  'sidebar.remaining': '{count} remaining',
  'workspace.workspaces': 'Workspaces',
  'workspace.workspace': 'Workspace',
  'workspace.subtitle': 'Projects and recent roots',
  'workspace.openWorkspace': 'Open workspace',
  'workspace.noneIndexed': 'No workspaces indexed yet.',
  'workspace.threadCount': '{count} {count, plural, one {thread} other {threads}}',
  'workspace.newThreadIn': 'New thread in {name}',
  'composer.queued': 'Queued · {count}',
  'composer.interruptTitle': 'Interrupt — injected after current tool calls',
  'composer.queueTitle': 'Queue — delivered when agent fully stops',
  'composer.shell': 'Shell',
  'composer.cancel': 'Cancel',
  'composer.enterShellCommand': 'Enter shell command…',
  'composer.interruptPlaceholder': 'Interrupt Pi after current tool calls…',
  'composer.queuePlaceholder': 'Queue message for when Pi finishes…',
  'composer.messagePi': 'Message Pi…',
  'composer.askAbout': 'Ask Pi about {name}…',
  'composer.addContextFile': 'Add context file',
  'composer.addContextFileShortcut': 'Add context file (⌘/)',
  'composer.selectModel': 'Select model',
  'composer.noModel': 'No model',
  'composer.searchModels': 'Search models',
  'composer.connectProvider': 'Connect provider',
  'composer.manageModels': 'Manage models',
  'composer.noModelsMatch': 'No models match',
  'composer.thinkingLevel': 'Thinking level',
  'composer.interrupt': 'Interrupt',
  'composer.queue': 'Queue',
  'composer.resetDeliveryTitle': 'Reset to normal prompt mode ({shortcut} to re-activate)',
  'composer.resetDelivery': 'Reset delivery mode to normal',
  'composer.runShell': 'Run shell command (Enter)',
  'composer.send': 'Send (Enter)',
  'composer.stopAgent': 'Stop agent',
  'composer.shellHint': 'enter to run shell · esc cancel · ⌘⇧X shell mode',
  'composer.steerHint':
    'interrupt mode · injects after tool calls · enter to send · alt+enter switch',
  'composer.followupHint':
    'queue mode · delivers when agent stops · enter to send · alt+enter switch',
  'composer.streamingHint': 'enter to send · alt+enter switch delivery mode',
  'composer.defaultHint':
    'enter to send · shift+enter new line · ↑ recall last · ⌘/ add context · ⌘⇧X shell',
  'conversation.unknown': 'Unknown',
  'conversation.noGitBranch': 'No git branch',
  'conversation.mainBranch': 'Main branch ({branch})',
  'conversation.branch': 'Branch {branch}',
  'conversation.sessionWorking': 'Session is working',
  'conversation.newSessionSummary': 'New session workspace summary',
  'conversation.emptyTitle': 'Build anything your way',
  'conversation.changeWorkspace': 'Change workspace: {path}',
  'conversation.lastModified': 'Last modified',
  'conversation.loadingOlder': 'Loading older messages…',
  'conversation.loadOlder': 'Load older messages',
  'conversation.scrollToBottom': 'Scroll to bottom',
  'time.justNow': 'just now',
  'time.minuteAgo': '{count} {count, plural, one {minute} other {minutes}} ago',
  'time.hourAgo': '{count} {count, plural, one {hour} other {hours}} ago',
  'time.yesterday': 'yesterday',
  'time.daysAgo': '{count} days ago',
  'git.history': 'History',
  'git.changes': 'Changes',
  'git.loadingStatus': 'Loading git status…',
  'git.noChanges': 'No changes to commit',
  'git.unstagedCount': '{count} unstaged',
  'git.stageAll': 'Stage All',
  'git.agentChanged': 'Agent Changed',
  'git.showAllChanges': 'Show all changes',
  'git.conflicts': 'Conflicts',
  'git.staged': 'Staged',
  'git.untracked': 'Untracked',
  'git.commitPlaceholder': 'Enter commit message',
  'git.generateCommitMessage': 'Generate commit message from staged diff',
  'git.syncing': 'Syncing…',
  'git.syncRemote': 'Sync remote',
  'git.fetch': 'Fetch',
  'git.pull': 'Pull',
  'git.pullRebase': 'Pull (Rebase)',
  'git.push': 'Push',
  'git.commitOptions': 'Commit options',
  'git.committing': 'Committing…',
  'git.amendStaged': 'Amend Staged',
  'git.commitStaged': 'Commit Staged',
  'git.commitAndPush': 'Commit and push',
} as const

const zhCN: Record<keyof typeof en, string> = {
  'app.name': 'OpenPi',
  'app.tagline': 'Pi coding agent 桌面工作台',
  'common.loading': '加载中…',
  'common.saved': '已保存',
  'common.copied': '已复制',
  'common.resetToDefault': '恢复默认',
  'common.system': '跟随系统',
  'common.english': 'English',
  'common.simplifiedChinese': '简体中文',
  'settings.general': '通用',
  'settings.appearance': '外观',
  'settings.language': '语言',
  'settings.languageDescription': '选择界面语言。跟随系统会使用系统或浏览器语言。',
  'welcome.description': '本地优先的会话、模型控制和可恢复的 Agent 状态。',
  'welcome.gettingStartedLabel': '快速开始：',
  'welcome.gettingStartedIntro':
    '打开一个工作区目录即可启动 Pi 会话。Pi 会读取你的项目文件、回答问题并编辑代码，同时保留完整的仓库上下文。',
  'welcome.stepOpenWorkspace': '点击打开工作区并选择你的项目文件夹',
  'welcome.stepSetGoal': '输入 /goal 设置目标，或直接开始对话',
  'welcome.stepReviewChanges': '在 Git 面板中检查变更，然后暂存并提交',
  'welcome.piRepo': 'Pi 仓库',
  'welcome.openPiSource': 'OpenPi 源码',
  'welcome.openWorkspace': '打开工作区',
  'welcome.openingWorkspace': '正在打开工作区…',
  'composer.inWorkspace': '位于 {name}',
  'topbar.renameSession': '点击重命名会话',
  'topbar.in': '位于',
  'topbar.changeWorkspace': '切换工作区',
  'topbar.switchBranch': '切换分支',
  'topbar.changedFiles': '变更文件',
  'topbar.customize': '自定义 OpenPi',
  'bottom.showWorkspaces': '显示工作区',
  'bottom.showStories': '显示故事',
  'bottom.showSessionMap': '显示会话地图',
  'bottom.showThreadHistory': '显示会话历史 (⌘B)',
  'bottom.whatsNew': '更新内容',
  'bottom.checkForUpdates': '检查更新',
  'bottom.updateAvailable': '有可用更新',
  'bottom.copiedBrewCommand': '已复制 brew 命令',
  'bottom.agentRunning': 'Agent 运行中',
  'bottom.running': '运行中',
  'bottom.toggleSourceControl': '切换源代码管理面板',
  'bottom.toggleFileTree': '切换文件树面板',
  'bottom.toggleTerminal': '切换终端 (⌘J)',
  'git.fetching': '正在 fetch…',
  'git.pulling': '正在 pull…',
  'git.pullingRebase': '正在 pull（rebase）…',
  'git.pushing': '正在 push…',
  'sidebar.threads': '会话',
  'sidebar.searchThreads': '搜索会话',
  'sidebar.archivedThreads': '已归档会话',
  'sidebar.newThread': '新建会话',
  'sidebar.newThreadShortcut': '新建会话 (⌘N)',
  'sidebar.archived': '已归档',
  'sidebar.restoreSession': '恢复会话',
  'sidebar.deleteSession': '永久删除会话',
  'sidebar.noArchivedSessions': '没有已归档会话',
  'sidebar.pinned': '已固定',
  'sidebar.noThreads': '还没有索引到会话。发送第一条提示即可创建 Pi 会话。',
  'sidebar.archiveAll': '全部归档',
  'sidebar.newSessionInWorkspace': '在此工作区新建会话',
  'sidebar.loadMore': '再加载 {count} 个',
  'sidebar.remaining': '剩余 {count} 个',
  'workspace.workspaces': '工作区',
  'workspace.workspace': '工作区',
  'workspace.subtitle': '项目和最近根目录',
  'workspace.openWorkspace': '打开工作区',
  'workspace.noneIndexed': '还没有索引到工作区。',
  'workspace.threadCount': '{count} 个会话',
  'workspace.newThreadIn': '在 {name} 中新建会话',
  'composer.queued': '已排队 · {count}',
  'composer.interruptTitle': '打断 — 在当前工具调用后注入',
  'composer.queueTitle': '队列 — Agent 完全停止后发送',
  'composer.shell': 'Shell',
  'composer.cancel': '取消',
  'composer.enterShellCommand': '输入 shell 命令…',
  'composer.interruptPlaceholder': '在当前工具调用后打断 Pi…',
  'composer.queuePlaceholder': '排队，等 Pi 完成后发送…',
  'composer.messagePi': '给 Pi 发消息…',
  'composer.askAbout': '询问 Pi 关于 {name}…',
  'composer.addContextFile': '添加上下文文件',
  'composer.addContextFileShortcut': '添加上下文文件 (⌘/)',
  'composer.selectModel': '选择模型',
  'composer.noModel': '未选择模型',
  'composer.searchModels': '搜索模型',
  'composer.connectProvider': '连接 Provider',
  'composer.manageModels': '管理模型',
  'composer.noModelsMatch': '没有匹配的模型',
  'composer.thinkingLevel': '思考级别',
  'composer.interrupt': '打断',
  'composer.queue': '排队',
  'composer.resetDeliveryTitle': '恢复普通提示模式（{shortcut} 可再次启用）',
  'composer.resetDelivery': '恢复普通发送模式',
  'composer.runShell': '运行 shell 命令 (Enter)',
  'composer.send': '发送 (Enter)',
  'composer.stopAgent': '停止 Agent',
  'composer.shellHint': 'enter 运行 shell · esc 取消 · ⌘⇧X shell 模式',
  'composer.steerHint': '打断模式 · 工具调用后注入 · enter 发送 · alt+enter 切换',
  'composer.followupHint': '队列模式 · Agent 停止后发送 · enter 发送 · alt+enter 切换',
  'composer.streamingHint': 'enter 发送 · alt+enter 切换发送模式',
  'composer.defaultHint':
    'enter 发送 · shift+enter 换行 · ↑ 召回上一条 · ⌘/ 添加上下文 · ⌘⇧X shell',
  'conversation.unknown': '未知',
  'conversation.noGitBranch': '无 Git 分支',
  'conversation.mainBranch': '主分支（{branch}）',
  'conversation.branch': '分支 {branch}',
  'conversation.sessionWorking': '会话运行中',
  'conversation.newSessionSummary': '新会话工作区摘要',
  'conversation.emptyTitle': '按你的方式构建任何东西',
  'conversation.changeWorkspace': '切换工作区：{path}',
  'conversation.lastModified': '上次修改',
  'conversation.loadingOlder': '正在加载更早消息…',
  'conversation.loadOlder': '加载更早消息',
  'conversation.scrollToBottom': '滚动到底部',
  'time.justNow': '刚刚',
  'time.minuteAgo': '{count} 分钟前',
  'time.hourAgo': '{count} 小时前',
  'time.yesterday': '昨天',
  'time.daysAgo': '{count} 天前',
  'git.history': '历史',
  'git.changes': '变更',
  'git.loadingStatus': '正在加载 Git 状态…',
  'git.noChanges': '没有可提交的变更',
  'git.unstagedCount': '{count} 个未暂存',
  'git.stageAll': '全部暂存',
  'git.agentChanged': 'Agent 变更',
  'git.showAllChanges': '显示全部变更',
  'git.conflicts': '冲突',
  'git.staged': '已暂存',
  'git.untracked': '未跟踪',
  'git.commitPlaceholder': '输入提交信息',
  'git.generateCommitMessage': '根据已暂存 diff 生成提交信息',
  'git.syncing': '正在同步…',
  'git.syncRemote': '同步远端',
  'git.fetch': 'Fetch',
  'git.pull': 'Pull',
  'git.pullRebase': 'Pull (Rebase)',
  'git.push': 'Push',
  'git.commitOptions': '提交选项',
  'git.committing': '正在提交…',
  'git.amendStaged': '修补已暂存提交',
  'git.commitStaged': '提交已暂存',
  'git.commitAndPush': '提交并推送',
}

const DICTIONARIES: Record<UiLanguage, Record<string, string>> = {
  en,
  'zh-CN': zhCN,
}

const [languagePreferenceSignal, setLanguagePreferenceSignal] =
  createSignal<UiLanguagePreference>('system')
const [uiLanguageSignal, setUiLanguageSignal] = createSignal<UiLanguage>(
  resolveLanguagePreference('system')
)

export const languagePreference = languagePreferenceSignal
export const uiLanguage = uiLanguageSignal

export function normalizeLanguagePreference(
  value: string | null | undefined
): UiLanguagePreference {
  return LANGUAGE_OPTIONS.includes(value as UiLanguagePreference)
    ? (value as UiLanguagePreference)
    : 'system'
}

export function resolveLanguagePreference(
  preference: string | null | undefined,
  systemLanguage = getSystemLanguage()
): UiLanguage {
  const normalized = normalizeLanguagePreference(preference)
  if (normalized !== 'system') return normalized
  return systemLanguage.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

export function translate(
  language: UiLanguage,
  key: string,
  params: TranslationParams = {}
): string {
  const template = DICTIONARIES[language][key] ?? DICTIONARIES.en[key] ?? key
  return template
    .replace(
      /\{count, plural, one \{([^{}]+)\} other \{([^{}]+)\}\}/g,
      (_match, one: string, other: string) => (Number(params.count) === 1 ? one : other)
    )
    .replace(/\{(\w+)\}/g, (_match, name: string) => String(params[name] ?? ''))
}

export function t(key: string, params?: TranslationParams): string {
  return translate(uiLanguageSignal(), key, params)
}

export async function loadLanguagePreference(): Promise<UiLanguagePreference> {
  const raw = await window.openpi.getPref(UI_LANGUAGE_PREF_KEY)
  const preference = normalizeLanguagePreference(raw)
  applyLanguagePreference(preference)
  return preference
}

export async function saveLanguagePreference(
  value: UiLanguagePreference
): Promise<UiLanguagePreference> {
  const preference = normalizeLanguagePreference(value)
  await window.openpi.setPref(UI_LANGUAGE_PREF_KEY, preference)
  applyLanguagePreference(preference)
  window.dispatchEvent(new CustomEvent(UI_LANGUAGE_CHANGED_EVENT, { detail: preference }))
  return preference
}

export function applyLanguagePreference(preference: UiLanguagePreference): UiLanguage {
  const normalized = normalizeLanguagePreference(preference)
  const resolved = resolveLanguagePreference(normalized)
  setLanguagePreferenceSignal(normalized)
  setUiLanguageSignal(resolved)
  if (typeof document !== 'undefined') {
    document.documentElement.lang = resolved
    document.documentElement.dataset.uiLanguage = resolved
  }
  return resolved
}

export function getSystemLanguage(): string {
  if (typeof navigator === 'undefined') return 'en'
  return navigator.language || navigator.languages?.[0] || 'en'
}

export function formatNumber(language: UiLanguage, value: number): string {
  return new Intl.NumberFormat(language).format(value)
}

export function formatDateTime(
  language: UiLanguage,
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(new Date(date))
}

export function formatRelativeTime(language: UiLanguage, date: Date | string | number): string {
  const deltaSeconds = Math.round((new Date(date).getTime() - Date.now()) / 1000)
  const abs = Math.abs(deltaSeconds)
  const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ]
  const [unit, seconds] = divisions.find(([, amount]) => abs >= amount) ?? ['second', 1]
  const value = Math.round(deltaSeconds / seconds)
  return new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(value, unit)
}
