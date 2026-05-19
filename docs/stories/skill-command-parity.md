# Story: Skill Command Parity

Status: in_progress


## User Story

As an OpenPi user with many existing Pi skills, I want the composer slash menu and session prompt path to surface skills the same way Pi exposes `/skill:name`, so I can discover and invoke my skills without manually opening the Skills pane.

## Background

Current OpenPi behavior supports:

- `/goal` hard-coded expansion.
- Prompt templates in the slash menu.
- A separate `/skill:<query>` picker.
- Explicit `/skill:name` expansion in the sidecar.

Observed gap: typing `/` does not surface skills as slash commands, so users with many skills perceive that OpenPi did not load or route them.

Reference: `https://github.com/minghinmatthewlam/pi-gui` exposes skills as runtime commands named `skill:<name>` and merges them into the slash command menu when skill commands are enabled.

## Acceptance Criteria

- [ ] Composer `/` slash menu includes enabled skills as `/skill:<name>` entries.
- [ ] Typing `/skill` or `/skill:<partial>` still opens the skill picker.
- [ ] Selecting a skill slash entry pre-fills `/skill:<name> `, preserving explicit invocation.
- [ ] Sidecar still sends ordinary prompts through `session.prompt()` so Pi SDK handles input events, extension commands, skill expansion, prompt templates, and system prompt skill index.
- [ ] Add tests for skill command formatting / prompt behavior where practical.

## Non-goals

- Do not auto-prepend all `SKILL.md` files into every prompt.
- Do not reimplement Pi SDK skill expansion semantics in the renderer.
- Do not remove the dedicated skill picker or Skills pane.
