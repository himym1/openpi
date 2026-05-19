import { describe, expect, it, vi } from 'vitest'
import {
  formatDateTime,
  formatNumber,
  formatRelativeTime,
  resolveLanguagePreference,
  translate,
  type UiLanguage,
  type UiLanguagePreference,
} from '../src/lib/i18n'

describe('i18n', () => {
  it.each([
    ['system', 'zh-CN', 'zh-CN'],
    ['system', 'zh-Hans-US', 'zh-CN'],
    ['system', 'en-US', 'en'],
    ['en', 'zh-CN', 'en'],
    ['zh-CN', 'en-US', 'zh-CN'],
    ['invalid', 'zh-CN', 'zh-CN'],
  ] satisfies Array<
    [UiLanguagePreference | string, string, UiLanguage]
  >)('resolves preference %s with system %s', (preference, systemLanguage, expected) => {
    expect(resolveLanguagePreference(preference, systemLanguage)).toBe(expected)
  })

  it('translates known UI keys and falls back to English', () => {
    expect(translate('zh-CN', 'welcome.openWorkspace')).toBe('打开工作区')
    expect(translate('zh-CN', 'welcome.stepOpenWorkspace')).toBe(
      '点击打开工作区并选择你的项目文件夹'
    )
    expect(translate('zh-CN', 'missing.key')).toBe('missing.key')
    expect(translate('zh-CN', 'app.name')).toBe('OpenPi')
  })

  it('interpolates named params without translating data', () => {
    expect(translate('zh-CN', 'composer.inWorkspace', { name: 'control-app' })).toBe(
      '位于 control-app'
    )
    expect(translate('en', 'composer.inWorkspace', { name: 'control-app' })).toBe('in control-app')
  })

  it('formats UI numbers and dates with the active locale', () => {
    const date = new Date('2026-05-18T09:30:00.000Z')
    expect(formatNumber('zh-CN', 1234567)).toBe('1,234,567')
    expect(formatDateTime('zh-CN', date, { timeZone: 'UTC' })).toContain('2026')
  })

  it('formats relative time in the active locale', () => {
    vi.setSystemTime(new Date('2026-05-18T10:00:00.000Z'))
    expect(formatRelativeTime('en', new Date('2026-05-18T09:59:00.000Z'))).toBe('1 minute ago')
    expect(formatRelativeTime('zh-CN', new Date('2026-05-18T09:59:00.000Z'))).toBe('1分钟前')
    vi.useRealTimers()
  })
})
