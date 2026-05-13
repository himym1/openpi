export type SoundPreferenceKey = 'soundAgentStatus' | 'soundErrors'

type OneToSix = 1 | 2 | 3 | 4 | 5 | 6
type OneToSeven = OneToSix | 7
type OneToTen = OneToSeven | 8 | 9 | 10
type OneToTwelve = OneToTen | 11 | 12

export type SoundEffectId =
  | 'none'
  | `alert-${OneToTen}`
  | `bip-bop-${OneToTen}`
  | `staplebops-${OneToSeven}`
  | `nope-${OneToTwelve}`
  | `yup-${OneToSix}`

export type SoundPreferences = Record<SoundPreferenceKey, SoundEffectId>

export type SoundEffectOption = {
  value: SoundEffectId
  label: string
  description: string
}

export type SoundPreferenceMeta = {
  key: SoundPreferenceKey
  storageKey: string
  label: string
  description: string
  defaultValue: SoundEffectId
}

function numberedOptions(
  prefix: 'alert' | 'bip-bop' | 'staplebops' | 'nope' | 'yup',
  label: string,
  count: number,
  description: string
): SoundEffectOption[] {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1
    return {
      value: `${prefix}-${number}` as SoundEffectId,
      label: `${label} ${number}`,
      description,
    }
  })
}

export const SOUND_EFFECT_OPTIONS: SoundEffectOption[] = [
  {
    value: 'none',
    label: 'None',
    description: 'Do not play a sound',
  },
  ...numberedOptions('alert', 'Alert', 10, 'Short attention cue'),
  ...numberedOptions('bip-bop', 'Bip-bop', 10, 'Two-step rhythmic cue'),
  ...numberedOptions('staplebops', 'Staplebops', 7, 'Fast multi-tap cue'),
  ...numberedOptions('nope', 'Nope', 12, 'Negative or error-style cue'),
  ...numberedOptions('yup', 'Yup', 6, 'Positive confirmation cue'),
]

export const SOUND_PREFERENCES: SoundPreferenceMeta[] = [
  {
    key: 'soundAgentStatus',
    storageKey: 'sounds.agent_status',
    label: 'Agent',
    description: 'Choose the sound to play when the agent is complete or needs attention',
    defaultValue: 'none',
  },
  {
    key: 'soundErrors',
    storageKey: 'sounds.errors',
    label: 'Errors',
    description: 'Choose the sound to play when an error occurs',
    defaultValue: 'none',
  },
]

export const DEFAULT_SOUND_PREFERENCES = SOUND_PREFERENCES.reduce((acc, pref) => {
  acc[pref.key] = pref.defaultValue
  return acc
}, {} as SoundPreferences)

export function soundStorageKey(key: SoundPreferenceKey): string {
  return SOUND_PREFERENCES.find((pref) => pref.key === key)?.storageKey ?? key
}

export function sanitizeSoundEffect(value: string | null | undefined): SoundEffectId {
  if (value === 'true') return 'alert-1'
  if (value === 'false' || value == null || value === '') return 'none'
  const option = SOUND_EFFECT_OPTIONS.find((candidate) => candidate.value === value)
  return option?.value ?? 'none'
}

export async function loadSoundPreferences(): Promise<SoundPreferences> {
  const entries = await Promise.all(
    SOUND_PREFERENCES.map(async (pref) => {
      const raw = await window.openpi.getPref(pref.storageKey)
      const value = raw == null || raw === '' ? pref.defaultValue : sanitizeSoundEffect(raw)
      return [pref.key, value] as const
    })
  )

  return entries.reduce(
    (acc, [key, value]) => {
      acc[key] = value
      return acc
    },
    { ...DEFAULT_SOUND_PREFERENCES }
  )
}
