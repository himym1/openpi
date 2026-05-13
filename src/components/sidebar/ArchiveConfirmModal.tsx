import { Dialog } from '@kobalte/core'
import { Info, X } from 'lucide-solid'
import { createSignal } from 'solid-js'

type Props = {
  open?: boolean
  workspaceName: string
  /** Total sessions in the group (some may be skipped if active) */
  sessionCount: number
  onConfirm: (skipNext: boolean) => void
  onCancel: () => void
}

export function ArchiveConfirmModal(props: Props) {
  const [skipNext, setSkipNext] = createSignal(false)

  return (
    <Dialog.Root open={props.open ?? true} onOpenChange={(open) => !open && props.onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay class="arc-backdrop" />
        <Dialog.Content class="arc-dialog">
          <button type="button" class="arc-close" onClick={props.onCancel} aria-label="Close">
            <X size={14} />
          </button>

          <div class="arc-body">
            <div class="arc-icon">
              <Info size={17} />
            </div>
            <div class="arc-content">
              <Dialog.Title class="arc-title">
                Are you sure you want to mark {props.sessionCount} session
                {props.sessionCount !== 1 ? 's' : ''} from <strong>'{props.workspaceName}'</strong>{' '}
                as done?
              </Dialog.Title>
              <Dialog.Description class="arc-desc">
                You can restore sessions later if needed from the sessions view.
              </Dialog.Description>
            </div>
          </div>

          <div class="arc-check-row">
            <label class="arc-check-label">
              <input
                type="checkbox"
                checked={skipNext()}
                onInput={(event) => setSkipNext(event.currentTarget.checked)}
                class="arc-checkbox"
              />
              Do not ask me again
            </label>
          </div>

          <div class="arc-footer">
            <button type="button" class="arc-btn-cancel" onClick={props.onCancel}>
              Cancel
            </button>
            <button
              type="button"
              class="arc-btn-confirm"
              onClick={() => props.onConfirm(skipNext())}
            >
              Mark All as Done
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
