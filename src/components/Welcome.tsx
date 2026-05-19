import logoUrl from '@icons/icon.svg'
import { ExternalLink, FolderOpen, Loader2 } from 'lucide-solid'
import { createEffect, createSignal, Show } from 'solid-js'
import { t } from '../lib/i18n'

type WelcomeProps = {
  appName: string
  appVersionLabel: string | null
  error: string | null
  onOpen: () => Promise<void> | void
}

export function Welcome(props: WelcomeProps) {
  const [firstRun, setFirstRun] = createSignal(false)
  const [isOpening, setIsOpening] = createSignal(false)
  const [openError, setOpenError] = createSignal<string | null>(null)

  createEffect(() => {
    void window.openpi.getFirstRun().then((isFirst) => setFirstRun(isFirst))
  })

  const openWorkspace = async () => {
    if (isOpening()) return
    setIsOpening(true)
    setOpenError(null)
    try {
      await props.onOpen()
    } catch (err) {
      setOpenError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsOpening(false)
    }
  }

  return (
    <div class="welcome-screen">
      <div class="welcome-logo-stage">
        <img class="welcome-logo" src={logoUrl} alt="OpenPi" />
        <span class="welcome-logo-scan" aria-hidden="true" />
      </div>
      <div class="eyebrow">{props.appName}</div>
      <h1>{t('app.tagline')}</h1>
      <p>{t('welcome.description')}</p>

      <Show when={firstRun()}>
        <div class="welcome-onboarding">
          <p class="welcome-onboarding-intro">
            <strong>{t('welcome.gettingStartedLabel')}</strong> {t('welcome.gettingStartedIntro')}
          </p>
          <div class="welcome-onboarding-steps">
            <div class="welcome-step">
              <span class="welcome-step-num">1</span>
              <span>{t('welcome.stepOpenWorkspace')}</span>
            </div>
            <div class="welcome-step">
              <span class="welcome-step-num">2</span>
              <span>{t('welcome.stepSetGoal')}</span>
            </div>
            <div class="welcome-step">
              <span class="welcome-step-num">3</span>
              <span>{t('welcome.stepReviewChanges')}</span>
            </div>
          </div>
          <div class="welcome-onboarding-links">
            <a
              href="https://github.com/earendil-works/pi"
              target="_blank"
              rel="noopener noreferrer"
              class="welcome-link"
            >
              <ExternalLink size={13} /> {t('welcome.piRepo')}
            </a>
            <a
              href="https://github.com/heyhuynhgiabuu/openpi"
              target="_blank"
              rel="noopener noreferrer"
              class="welcome-link"
            >
              <ExternalLink size={13} /> {t('welcome.openPiSource')}
            </a>
          </div>
        </div>
      </Show>

      <div class="welcome-actions">
        <button
          type="button"
          class="button-primary"
          onClick={() => void openWorkspace()}
          disabled={isOpening()}
        >
          <Show when={isOpening()} fallback={<FolderOpen size={15} />}>
            <Loader2 size={15} class="spin" />
          </Show>
          {isOpening() ? t('welcome.openingWorkspace') : t('welcome.openWorkspace')}
        </button>
      </div>

      <Show when={openError() ?? props.error}>
        {(message) => <div class="error-banner">{message()}</div>}
      </Show>
      <Show when={props.appVersionLabel}>
        {(versionLabel) => <span class="welcome-version">{versionLabel()}</span>}
      </Show>
    </div>
  )
}
