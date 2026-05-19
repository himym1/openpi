# UI-only Chinese Localization Plan

## Goal

Add Simplified Chinese support for OpenPi's visible application UI while keeping AI answers, user/session content, tool output bodies, project data, and Pi runtime semantics untouched.

## Architecture

Use a lightweight renderer-owned i18n layer. The renderer owns presentation labels and date/number formatting only. Electron main remains the preference persistence authority through the existing `window.openpi.getPref/setPref` API. Pi SDK/session content stays source-of-truth and is never translated by OpenPi.

ArchitectureReviewRequired: yes — this adds a renderer presentation source-of-truth and a persisted user preference, but does not change IPC contracts or Pi SDK semantics.

## Tech Stack

Electron + SolidJS + TypeScript, existing preload preference IPC, `Intl.*` browser APIs, Vitest, Biome, TypeScript.

## Baseline/Authority Refs

- `AGENTS.md`: renderer is render-only; Electron main owns persistence and privileged APIs; Pi SDK owns agent semantics.
- `docs/decisions/2026-05-17-renderer-not-authority.md`: renderer collects intent and displays state only.
- `docs/TEST_MATRIX.md`: product behavior must map to evidence rows.
- Existing preference pattern: `src/lib/appearancePreferences.ts`, `src/lib/displayPreferences.ts`, `src/components/customizations/GeneralPane.tsx`.

## Compatibility Boundary

- In scope: visible UI labels, buttons, placeholders, empty states, menu labels, setting labels, and UI-only date/number formatting.
- Out of scope: AI answers, user messages, session JSONL contents, tool output body text, code/file contents, commit messages, branch/file names, provider/model names, Pi skill/extension/prompt contents.
- Default language mode is `system`; user can override with `en` or `zh-CN` in General settings.
- Existing English UI remains fallback. Missing translation keys must display English, not crash.
- IPC names, schemas, enum values, persisted session data, and Pi SDK calls remain English/internal.

## Verification

Run:

```bash
npm test -- tests/i18n.test.ts
npm run typecheck
./node_modules/.bin/biome check .
npm run build
```

Manual smoke after implementation:

1. Start `npm run dev`.
2. Open Customizations → General.
3. Set Language to 简体中文.
4. Confirm Welcome/main shell/sidebar/composer high-frequency UI switches to Chinese.
5. Confirm conversation/user/AI text remains unchanged.
6. Set Language to English and confirm UI returns to English.

## Plan Basis

Facts:

- There is no current i18n/localization layer.
- Preferences are already persisted via `window.openpi.getPref/setPref` and local renderer helpers.
- General settings is the existing place for app behavior preferences.

Assumptions:

- First slice should cover high-frequency UI, not every edge component.
- `navigator.language` is acceptable for system language detection in renderer.

Unknowns:

- Exact count of all hard-coded strings; implementation should migrate incrementally and keep fallback behavior.

## Files

Create:

- `src/lib/i18n.ts`
- `tests/i18n.test.ts`

Modify first slice:

- `src/App.tsx`
- `src/components/Welcome.tsx`
- `src/components/TopBar.tsx`
- `src/components/BottomBar.tsx`
- `src/components/Composer.tsx`
- `src/components/sidebar/SessionSidebar.tsx`
- `src/components/sidebar/WorkspacePane.tsx`
- `src/components/sidebar/WorkspaceRail.tsx`
- `src/components/customizations/GeneralPane.tsx`
- `docs/TEST_MATRIX.md`

Optional if touched by high-frequency labels:

- `src/components/CommandPalette.tsx`
- `src/components/conversation/ConversationPane.tsx`
- `src/components/git/GitPanel.tsx`

## Tasks

### Task 1 — Add i18n core and tests

Files:

- Create `src/lib/i18n.ts`
- Create `tests/i18n.test.ts`

Why:

Provide one renderer-owned source for UI translations and locale formatting.

Impact/Compatibility:

No UI behavior changes yet. Missing keys fall back to English. User/session content is untouched.

Steps:

- Write tests for language resolution:
  - `system` + `zh-CN` navigator resolves `zh-CN`.
  - `system` + non-Chinese navigator resolves `en`.
  - explicit `en` and `zh-CN` override system.
  - unknown/missing translation key falls back to English.
  - interpolation replaces `{name}` style params.
- Implement `LanguagePreference = 'system' | 'en' | 'zh-CN'`.
- Implement `resolveLanguagePreference(preference, systemLanguage)`.
- Implement dictionaries for the first keys used by tests.
- Implement `translate(language, key, params?)`.
- Implement Solid-friendly preference helpers:
  - `loadLanguagePreference()` using `window.openpi.getPref('ui.language')`.
  - `saveLanguagePreference(value)` using `window.openpi.setPref('ui.language', value)`.
  - `UI_LANGUAGE_CHANGED_EVENT` for same-window updates.
- Implement `formatNumber`, `formatDate`, and `formatRelativeTime` helpers backed by `Intl`.
- Run `npm test -- tests/i18n.test.ts` and verify RED before implementation, then GREEN after implementation.

### Task 2 — Wire language preference into app shell

Files:

- Modify `src/App.tsx`
- Modify `src/components/customizations/GeneralPane.tsx`

Why:

Make language selection persistent, default to system, and allow immediate UI switching.

Impact/Compatibility:

Renderer-only presentation state. Existing settings layout remains. No main/preload IPC changes.

Steps:

- In `App.tsx`, load language preference on mount via `loadLanguagePreference()`.
- Store resolved UI language in a signal and provide it to migrated components as props, or use a small module-level signal accessor if simpler.
- Listen for `UI_LANGUAGE_CHANGED_EVENT` to update the app shell immediately.
- In `GeneralPane.tsx`, add a `Language` row near Appearance:
  - label: Language / 语言
  - options: System, English, 简体中文
  - save through `saveLanguagePreference()`.
- Mark saved state using the existing saved indicator pattern.
- Run typecheck.

### Task 3 — Translate Welcome and shell navigation

Files:

- `src/components/Welcome.tsx`
- `src/components/TopBar.tsx`
- `src/components/BottomBar.tsx`
- Possibly `src/App.tsx` for inline labels/title attributes around panels.

Why:

Welcome and shell controls are the first visible UI surfaces.

Impact/Compatibility:

Only static UI text changes. Links, app names, paths, and version labels remain as-is.

Steps:

- Replace Welcome strings with i18n keys:
  - app tagline
  - onboarding intro
  - step labels
  - link labels
  - Open workspace button and loading text
- Replace TopBar/BottomBar navigation labels/tooltips with i18n keys.
- Translate inline shell tooltips such as drag-panel labels where straightforward.
- Run a component-level or smoke test if an existing test covers Welcome; update `tests/welcome.test.tsx` expected text using English fallback.

### Task 4 — Translate sidebar and composer high-frequency UI

Files:

- `src/components/sidebar/SessionSidebar.tsx`
- `src/components/sidebar/WorkspacePane.tsx`
- `src/components/sidebar/WorkspaceRail.tsx`
- `src/components/Composer.tsx`
- Optional: `src/components/CommandPalette.tsx`

Why:

These surfaces define daily interaction: sessions, workspace selection, prompt input, send hints, and command discovery.

Impact/Compatibility:

Do not translate session titles, workspace paths, workspace display names, prompt history, slash command names, skill names, file names, or model names.

Steps:

- Replace empty states and section headers with i18n keys.
- Replace composer placeholder/help hints with i18n keys.
- Keep command identifiers like `/goal`, `/skill:name`, provider/model labels unchanged.
- Replace command palette static UI labels if touched.
- Run typecheck.

### Task 5 — Translate selected Git panel and timeline chrome

Files:

- `src/components/git/GitPanel.tsx`
- `src/components/conversation/ConversationPane.tsx`
- `src/components/conversation/ToolCardView.tsx` only for chrome labels if small.

Why:

Git panel and conversation chrome are high-frequency UI. This task should remain bounded and skip raw dynamic content.

Impact/Compatibility:

Do not translate git output, commit messages, branch/file names, diff contents, or tool result bodies.

Steps:

- Translate Git tab labels and common buttons: Changes, Files, Stage, Unstage, Commit, Push/Pull/Sync labels when they are static UI.
- Translate empty states and loading states.
- Translate tool-card chrome labels only if clearly static, such as Running/Done/Error, without touching body text.
- Run typecheck.

### Task 6 — Update evidence docs and run full verification

Files:

- `docs/TEST_MATRIX.md`

Why:

Keep product behavior mapped to proof.

Impact/Compatibility:

Documentation only.

Steps:

- Add a row: `Localization | UI language follows system and can be overridden in General settings | implemented | tests + files`.
- Add a row: `Localization | AI/session/tool body content is not translated by UI localization | implemented | manual smoke / code boundary`.
- Run:

```bash
npm test -- tests/i18n.test.ts
npm test -- tests/welcome.test.tsx
npm run typecheck
./node_modules/.bin/biome check .
npm run build
```

## Risks

- Large string migration can create noisy diffs. Mitigation: first slice covers high-frequency UI only.
- Some strings are dynamic or user/project data. Mitigation: only translate static chrome; keep data unchanged.
- Passing language through props can become noisy. Mitigation: central helper/signal is acceptable as renderer-only presentation state.
- System locale detection may differ across Chromium/macOS. Mitigation: explicit settings override is available.

## Retirement

No old runtime owner is retired. English hard-coded strings should shrink as components migrate to i18n keys. Existing English text remains fallback until fully migrated.

## Self-review

- Scope matches approved UI-only requirement.
- AI answers and session content are explicitly excluded.
- Renderer authority boundary is preserved.
- No new dependency is required.
- Verification commands are concrete.
- Plan is incremental and compatible with existing preference patterns.
