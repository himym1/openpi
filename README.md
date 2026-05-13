# OpenPi

OpenPi is a native desktop workbench for the Pi coding agent. It wraps Pi sessions, tool events, customizations, Git review, file search, and terminals in an Electron + SolidJS app.

## Current beta surface

- Secure Electron main/preload boundary with typed IPC and Zod validation.
- Pi SDK session host in Electron main; renderer remains render-only.
- Workspace/session sidebar, new-session hero, model selector, conversation stream, and tool cards.
- OpenCode-style command palette (`Shift+Cmd+P`) for commands, files, and sessions.
- Customizations modal for Extensions, Skills, Prompts, Themes, Packages, Models, General, Notifications, Keybindings, Updates, and About.
- Main-owned Git/source-control panel, file tree/search, diff viewer, and file viewer.
- Bottom terminal/output panel using `node-pty` from Electron main.
- OpenPi runtime branding, app icons, and beta release workflows.

## Development

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
```

## Release process

Prepare a verified release commit and annotated `v*` tag:

```bash
npm run release:patch -- --notes "Short release note"
npm run release:prerelease -- --preid beta --notes-file RELEASE_NOTES.md
npm run release:version -- 0.2.0 --notes-file RELEASE_NOTES.md
```

Push the generated tag with `git push origin main --follow-tags` to trigger the beta release workflow.

## Packaging

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false OPENPI_RELEASE_CHANNEL=beta \
  npx electron-builder --config electron-builder.json --dir --publish never
```

Tagged releases (`v*`) run `.github/workflows/release.yml` and create draft beta releases. Signing/notarization secrets are intentionally not included yet.

## Beta caveats

- macOS notarization and Windows code signing still need release credentials.
- Permission gates, workspace trust hardening, and keychain-backed secrets remain beta blockers before broad distribution.
- Some custom-widget accessibility rules are warning-level while the desktop UI matures; concrete label/button checks remain enforced.

See `ROADMAP.md` for the full roadmap and `AGENTS.md` for project architecture rules.

## License

MIT — see `LICENSE`.
