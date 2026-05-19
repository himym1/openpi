# OpenPi Skill Command Parity Plan

## Goal

Make OpenPi surface existing Pi skills as slash commands in the composer while preserving Pi SDK ownership of skill expansion and model-visible skill metadata.

## Architecture

OpenPi should follow the Pi SDK path rather than reimplementing skill behavior. The sidecar should pass ordinary prompt text to `session.prompt()` so the SDK handles extension commands, input transforms, `/skill:name`, prompt templates, and system prompt skill index. The renderer should improve discoverability by listing enabled skills as `/skill:<name>` entries in the slash menu, similar to the referenced `pi-gui` implementation.

## Tech Stack

Electron + SolidJS + TypeScript, Pi SDK `@earendil-works/pi-coding-agent`, Vitest, Biome, TypeScript.

## Baseline/Authority Refs

- `AGENTS.md`: Pi SDK owns agent semantics; renderer is not authority.
- `docs/HARNESS.md`: prefer one safe action and update test matrix.
- `docs/stories/skill-command-parity.md`: story packet for this slice.
- Reference repo `/tmp/pi-gui-reference`: `composer-commands.ts`, `session-supervisor.ts`, `runtime-types.ts`.

## Compatibility Boundary

- Keep `/goal` special handling.
- Keep `/skill:name` explicit invocation.
- Keep prompt template expansion working.
- Do not inject all skill bodies into every prompt.
- Do not move privileged resource loading into renderer.

## Verification

Run:

```bash
npm run typecheck
npm run lint
npm test
bash scripts/harness-lint.sh --quiet
```

## Tasks

### Task 1 — Add story/test matrix records

Files:

- `docs/stories/skill-command-parity.md`
- `docs/TEST_MATRIX.md`

Steps:

- Add story packet with acceptance criteria.
- Add test matrix rows for slash menu skill commands and SDK-owned prompt handling.
- Verify harness lint remains pass-with-warnings only for existing evidence-column warnings.

### Task 2 — Let SDK own prompt expansion in sidecar

Files:

- `electron/piSidecar.ts`

Steps:

- Remove duplicate manual `/skill:name` and prompt-template expansion from `buildSidecarPromptText` for ordinary prompts.
- Keep `/goal` expansion because it is OpenPi-specific.
- Combine `contextPrefix` with text after `/goal` handling, then call `session.prompt()` / `steer()` / `followUp()` with the resulting text.
- Preserve explicit `/skill:name` because SDK handles it.
- Verify typecheck.

### Task 3 — Surface skills in slash menu

Files:

- `src/components/Composer.tsx`
- `src/lib/ipc.ts` if schema needs fields.

Steps:

- Reuse `listSkills()` already available to the renderer.
- Load skills when slash menu opens, not only skill picker.
- Merge enabled skill commands into slash command list as `/skill:<name>` entries.
- Ensure `/skill:<query>` still opens the skill picker first.
- Selecting a skill slash command pre-fills `/skill:<name> `.
- Verify relevant tests and typecheck.

### Task 4 — Add regression tests

Files:

- `tests/sessionPrompt.test.ts` or a focused new test file.

Steps:

- Add test coverage for command formatting and prompt payload behavior if helper-level functions are exposed.
- Avoid brittle UI tests unless necessary for this slice.
- Run full verification.

## Risks

- Over-eager skill loading can bloat renderer state; only metadata should load.
- Sidecar manual expansion may currently compensate for SDK path uncertainty; verify SDK `session.prompt()` handles `/skill:name` and prompt templates before removing manual logic.
- Existing harness lint warnings are baseline warnings, not introduced by this change.

## Retirement

Retire duplicate sidecar prompt expansion for `/skill:name` and prompt templates if SDK path is verified. Keep `/goal` as OpenPi-owned behavior.
