import {
  ArrowUpCircle,
  BookOpen,
  FileText,
  Folder,
  FolderTree,
  GitBranch,
  GitFork,
  MessageSquareText,
  SquareTerminal,
} from 'lucide-solid'
import { createSignal, Show } from 'solid-js'
import { t } from '../lib/i18n'
import type { AppUpdateStatus } from '../lib/ipc'
import { ChangelogModal } from './ChangelogModal'

export type LeftDrawerMode = 'threads' | 'workspace' | 'stories' | 'tree'

const HOMEBREW_UPGRADE_COMMAND = 'brew update && brew upgrade --cask openpi'

type BottomBarProps = {
  leftDrawerOpen: boolean
  leftDrawerMode: LeftDrawerMode
  onToggleThreads: () => void
  onToggleWorkspace: () => void
  onToggleStories: () => void
  onToggleTree: () => void
  gitPanelOpen: boolean
  onToggleGitPanel: () => void
  filePanelOpen: boolean
  onToggleFilePanel: () => void
  terminalOpen: boolean
  onToggleTerminal: () => void
  /** OpenPi version string e.g. "0.1.12" */
  appVersion?: string
  isStreaming: boolean
  /** Current git sync operation in progress, or null when idle. */
  gitSyncAction?: string | null
  /** Last git sync result message (e.g. "Already up to date."). */
  gitSyncMessage?: string | null
}

export function BottomBar(props: BottomBarProps) {
  const [changelogOpen, setChangelogOpen] = createSignal(false)
  const [updateStatus, setUpdateStatus] = createSignal<AppUpdateStatus | null>(null)
  const [updateCommandCopied, setUpdateCommandCopied] = createSignal(false)

  const updateAvailable = () => updateStatus()?.state === 'available'

  const copyUpgradeCommand = async () => {
    try {
      await navigator.clipboard.writeText(HOMEBREW_UPGRADE_COMMAND)
      setUpdateCommandCopied(true)
      setTimeout(() => setUpdateCommandCopied(false), 2000)
    } catch {
      const url = updateStatus()?.releaseUrl
      if (url) window.open(url, '_blank')
    }
  }

  const syncActionLabel = () => {
    switch (props.gitSyncAction) {
      case 'fetch':
        return t('git.fetching')
      case 'pull':
        return t('git.pulling')
      case 'pull-rebase':
        return t('git.pullingRebase')
      case 'push':
        return t('git.pushing')
      default:
        return null
    }
  }

  const syncResultSnippet = () => {
    const msg = props.gitSyncMessage
    if (!msg) return null
    const first = msg.split('\n').find((l) => l.trim()) ?? ''
    return first.length > 48 ? `${first.slice(0, 45)}…` : first
  }

  return (
    <>
      <footer class="bottom-bar no-drag">
        {/* Left: workspace + thread + changelog toggles */}
        <div class="bottom-bar-left">
          <button
            type="button"
            class={`bottom-bar-btn${props.leftDrawerOpen && props.leftDrawerMode === 'workspace' ? ' is-active' : ''}`}
            onClick={props.onToggleWorkspace}
            title={t('bottom.showWorkspaces')}
            aria-pressed={props.leftDrawerOpen && props.leftDrawerMode === 'workspace'}
          >
            <Folder size={13} />
          </button>
          <button
            type="button"
            class={`bottom-bar-btn${props.leftDrawerOpen && props.leftDrawerMode === 'stories' ? ' is-active' : ''}`}
            onClick={props.onToggleStories}
            title={t('bottom.showStories')}
            aria-pressed={props.leftDrawerOpen && props.leftDrawerMode === 'stories'}
          >
            <BookOpen size={13} />
          </button>
          <button
            type="button"
            class={`bottom-bar-btn${props.leftDrawerOpen && props.leftDrawerMode === 'tree' ? ' is-active' : ''}`}
            onClick={props.onToggleTree}
            title={t('bottom.showSessionMap')}
            aria-label={t('bottom.showSessionMap')}
            aria-pressed={props.leftDrawerOpen && props.leftDrawerMode === 'tree'}
          >
            <GitFork size={13} />
          </button>
          <button
            type="button"
            class={`bottom-bar-btn${props.leftDrawerOpen && props.leftDrawerMode === 'threads' ? ' is-active' : ''}`}
            onClick={props.onToggleThreads}
            title={t('bottom.showThreadHistory')}
            aria-pressed={props.leftDrawerOpen && props.leftDrawerMode === 'threads'}
          >
            <MessageSquareText size={13} />
          </button>
          <button
            type="button"
            class="bottom-bar-btn"
            title={t('bottom.whatsNew')}
            onClick={() => setChangelogOpen(true)}
          >
            <FileText size={13} />
          </button>
        </div>

        {/* Center: OpenPi version (or update chip, or git sync status) */}
        <div class="bottom-bar-center">
          <Show
            when={syncActionLabel() || syncResultSnippet()}
            fallback={
              <Show
                when={updateAvailable()}
                fallback={
                  <button
                    type="button"
                    class="bottom-bar-version"
                    title={t('bottom.checkForUpdates')}
                    onClick={() => {
                      void window.openpi.appUpdate.check().then(setUpdateStatus)
                    }}
                  >
                    {props.appVersion ? `v${props.appVersion}` : '…'}
                  </button>
                }
              >
                <button
                  type="button"
                  class="bottom-bar-update-chip"
                  title={`OpenPi ${updateStatus()?.latestVersion} is available — click to copy: ${HOMEBREW_UPGRADE_COMMAND}`}
                  onClick={() => void copyUpgradeCommand()}
                >
                  <ArrowUpCircle size={11} />
                  {updateCommandCopied()
                    ? t('bottom.copiedBrewCommand')
                    : (updateStatus()?.latestVersion ?? t('bottom.updateAvailable'))}
                </button>
              </Show>
            }
          >
            <Show
              when={syncActionLabel()}
              fallback={<span class="bottom-bar-git-result">{syncResultSnippet()}</span>}
            >
              <span class="bottom-bar-git-pulse" aria-hidden="true">
                ●
              </span>
              <span class="bottom-bar-git-action">{syncActionLabel()}</span>
            </Show>
          </Show>
        </div>

        {/* Right: panel toggles — git, file tree, terminal */}
        <div class="bottom-bar-right">
          <Show when={props.isStreaming}>
            <span class="bottom-bar-status-pill is-live" title={t('bottom.agentRunning')}>
              {t('bottom.running')}
            </span>
          </Show>
          <button
            type="button"
            class={`bottom-bar-btn${props.gitPanelOpen ? ' is-active' : ''}`}
            onClick={props.onToggleGitPanel}
            title={t('bottom.toggleSourceControl')}
            aria-pressed={props.gitPanelOpen}
          >
            <GitBranch size={13} />
          </button>
          <button
            type="button"
            class={`bottom-bar-btn${props.filePanelOpen ? ' is-active' : ''}`}
            onClick={props.onToggleFilePanel}
            title={t('bottom.toggleFileTree')}
            aria-pressed={props.filePanelOpen}
          >
            <FolderTree size={13} />
          </button>
          <button
            type="button"
            class={`bottom-bar-btn${props.terminalOpen ? ' is-active' : ''}`}
            onClick={props.onToggleTerminal}
            title={t('bottom.toggleTerminal')}
            aria-pressed={props.terminalOpen}
          >
            <SquareTerminal size={13} />
          </button>
        </div>
      </footer>

      <ChangelogModal open={changelogOpen()} onClose={() => setChangelogOpen(false)} />
    </>
  )
}
