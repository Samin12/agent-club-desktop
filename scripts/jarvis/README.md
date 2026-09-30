# Jarvis build

`bun run jarvis:build` installs the pinned HUD dependencies and prepares a cached,
self-contained Next.js server in `resources/bundled-jarvis`. Desktop development
and production builds run this automatically. The installer includes the server;
end users do not need Node.js or npm to open Jarvis.

The desktop main process launches the server with Electron's utility process on
an ephemeral loopback port. Each launch uses a random API capability. Closing the
app stops the server. Jarvis's optional Python voice server and Claude runner are
configured separately; see `docs/agent-club.md`.
