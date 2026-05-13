export type NotificationPreferenceKey = 'notifyAgentStatus' | 'notifyErrors'

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>

export type NotificationPreferenceMeta = {
  key: NotificationPreferenceKey
  storageKey: string
  label: string
  description: string
  defaultValue: boolean
}

export const NOTIFICATION_PREFERENCES: NotificationPreferenceMeta[] = [
  {
    key: 'notifyAgentStatus',
    storageKey: 'notifications.agent_status',
    label: 'Agent',
    description: 'Show a system notification when the agent is complete or needs attention',
    defaultValue: false,
  },
  {
    key: 'notifyErrors',
    storageKey: 'notifications.errors',
    label: 'Errors',
    description: 'Show a system notification when an error occurs',
    defaultValue: false,
  },
]

export const DEFAULT_NOTIFICATION_PREFERENCES = NOTIFICATION_PREFERENCES.reduce((acc, pref) => {
  acc[pref.key] = pref.defaultValue
  return acc
}, {} as NotificationPreferences)

export function notificationStorageKey(key: NotificationPreferenceKey): string {
  return NOTIFICATION_PREFERENCES.find((pref) => pref.key === key)?.storageKey ?? key
}

export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  const entries = await Promise.all(
    NOTIFICATION_PREFERENCES.map(async (pref) => {
      const raw = await window.openpi.getPref(pref.storageKey)
      return [pref.key, raw == null || raw === '' ? pref.defaultValue : raw === 'true'] as const
    })
  )

  return entries.reduce(
    (acc, [key, value]) => {
      acc[key] = value
      return acc
    },
    { ...DEFAULT_NOTIFICATION_PREFERENCES }
  )
}
