export type UpdatePreferenceKey = 'checkUpdatesOnStartup' | 'showReleaseNotesAfterUpdate'

export type UpdatePreferences = Record<UpdatePreferenceKey, boolean>

export type UpdatePreferenceMeta = {
  key: UpdatePreferenceKey
  storageKey: string
  label: string
  description: string
  defaultValue: boolean
}

export const UPDATE_PREFERENCES: UpdatePreferenceMeta[] = [
  {
    key: 'checkUpdatesOnStartup',
    storageKey: 'updates.check_on_startup',
    label: 'Check for updates on startup',
    description: 'Automatically check for updates when Pi coding agent launches',
    defaultValue: true,
  },
  {
    key: 'showReleaseNotesAfterUpdate',
    storageKey: 'updates.show_release_notes_after_update',
    label: 'Release notes',
    description: "Show What's New popups after updates",
    defaultValue: true,
  },
]

export const DEFAULT_UPDATE_PREFERENCES = UPDATE_PREFERENCES.reduce((acc, pref) => {
  acc[pref.key] = pref.defaultValue
  return acc
}, {} as UpdatePreferences)

export async function loadUpdatePreferences(): Promise<UpdatePreferences> {
  const entries = await Promise.all(
    UPDATE_PREFERENCES.map(async (pref) => {
      const raw = await window.openpi.getPref(pref.storageKey)
      return [pref.key, raw == null || raw === '' ? pref.defaultValue : raw === 'true'] as const
    })
  )

  return entries.reduce(
    (acc, [key, value]) => {
      acc[key] = value
      return acc
    },
    { ...DEFAULT_UPDATE_PREFERENCES }
  )
}
