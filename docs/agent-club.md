# Agent Club and Jarvis

## Run and build

Use Node.js 22–24 and Bun. `bun install` installs the desktop dependencies;
`bun start` prepares the Jarvis standalone bundle and launches the desktop app.
The first build downloads Jarvis's npm dependencies. Subsequent launches reuse
the bundle until its source changes. `bun run package` compiles both apps, and
the platform-specific `dist:*` commands create installers. The standard backend
prerequisites in [development.md](contributing/development.md) still apply.

The repository's application ID is `club.agent.desktop`, product name is
**Agent Club**, executable is **AgentClub**, and deep-link scheme is
`agentclub://`. Update manifests and downloads come from
`Samin12/agent-club-desktop` releases. Publish matching platform manifests with
installers before expecting update checks to find a release. This fork does not
inherit upstream signing credentials or release artifacts.

## Jarvis tab

Open **Jarvis** in the left sidebar. The desktop main process starts the bundled
HUD on an automatically selected loopback port. It has no Electron/Node access
in its iframe, and API calls require a random capability for that app launch.
The app owns and stops the process on exit. Reload retries startup after a
failure. The browser WebUI displays a desktop requirement instead of trying to
reach the browser user's localhost.

The original HUD is English. Navigation and startup/error states are translated
into all 13 desktop languages. The supplied visualizations, report overlay,
directives, status panels, text/voice interface, and local vault API are retained.

## Vault and optional services

On first open, the bundled starter vault is copied into
`<Agent Club userData>/jarvis/vault`. On macOS the release user-data directory is
normally `~/Library/Application Support/Agent Club`. Development may use a
separate directory. Setting `VAULT_ROOT` before launch selects an existing vault.
Jarvis uses the system timezone unless `HUD_TZ` is supplied. Starter metrics and
sample reports are demonstration data, not connected personal accounts.

The HUD starts automatically. The following services are optional and separate:

- **Voice:** start the supplied Python service on `127.0.0.1:3108` after installing
  its dependencies and local speech models. See
  [the imported voice instructions](../integrations/jarvis/README.md#voice-server-setup).
  The microphone requires the usual OS permission. CPU inference is supported.
- **Background work:** run `node integrations/jarvis/runner/runner.js` with
  `VAULT_ROOT` pointing at the same vault. It requires a configured Claude CLI.
  Review the supplied skill roster before dispatching jobs.
- **Configuration:** desktop Jarvis reads its `.env` from
  `<Agent Club userData>/jarvis/.env`; it does not read another app's credentials.
  Standalone development uses `~/.agentclub/jarvis.env` or `JARVIS_HOME_ENV`.
  Environment variables take precedence. Never commit keys or a personal vault.

Without those services, Jarvis displays offline status and the vault remains
usable. `bun run jarvis:dev` runs the HUD alone at `http://127.0.0.1:3107` for local
development. Do not expose that development server to a network.

## Provenance and compatibility

The desktop starts from AionUi's Apache-2.0 source. Its license, copyright
headers, git history, and third-party notices remain intact. AionCore is the
underlying runtime dependency. Internal backend API keys, crate names, package
imports, and compatibility identifiers retain their original names where
renaming would break the runtime. They are not the product's public identity.

Jarvis was imported from the user-provided `jarvis-hud-1.0.1.zip`, without its
embedded `.git` repository. The archive did not include a separate license file;
the root desktop license is not a claim to relicense that supplied material.
Agent Club changes add standalone packaging, lifecycle control, capability
authentication, isolated configuration, and product labeling. Its original
README and onboarding files are retained as source documentation.

Historical upstream screenshots and development documents remain in the source
history. They are not used as Agent Club marketing or app branding.
