import { Check, Pin } from 'lucide-solid'
import { Show } from 'solid-js'
import type { SessionListItem } from '../../lib/ipc'
import { formatCurrency, formatRelativeTime, formatTokens } from '../../lib/sessionView'
import { Badge } from '../common/Badge'

type SessionRowProps = {
  session: SessionListItem
  active: boolean
  isPinned: boolean
  onOpen: () => void
  onPin: () => void
  onArchive: () => void
}

export function SessionRow(props: SessionRowProps) {
  return (
    <div class="session-row-wrap">
      <button
        type="button"
        class={`session-row ${props.active ? 'is-active' : ''} ${props.isPinned ? 'is-pinned' : ''}`}
        onClick={props.onOpen}
      >
        <div class="session-row-title">
          <span class="session-title-text">{props.session.title}</span>
        </div>
        <div class="session-meta-line">
          <span>{formatRelativeTime(props.session.updatedAt)}</span>
          <Show when={props.session.inputTokens + props.session.outputTokens > 0}>
            <span>·</span>
            <Badge>{formatTokens(props.session.inputTokens + props.session.outputTokens)}</Badge>
          </Show>
          <Show when={props.session.cost > 0}>
            <span>·</span>
            <Badge>{formatCurrency(props.session.cost)}</Badge>
          </Show>
        </div>
      </button>

      <div class="session-row-actions">
        <button
          type="button"
          class="session-row-action-btn"
          title="Archive session"
          onClick={(event) => {
            event.stopPropagation()
            props.onArchive()
          }}
        >
          <Check size={11} />
        </button>
        <button
          type="button"
          class={`session-row-action-btn ${props.isPinned ? 'is-pinned-active' : ''}`}
          title={props.isPinned ? 'Unpin session' : 'Pin session'}
          onClick={(event) => {
            event.stopPropagation()
            props.onPin()
          }}
        >
          <Pin size={11} />
        </button>
      </div>
    </div>
  )
}
