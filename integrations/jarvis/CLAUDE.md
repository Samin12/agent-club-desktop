# Jarvis HUD — Claude Code instructions

## Onboarding trigger

**If `.jarvis-config.json` does NOT exist in the repo root**: this is a fresh
clone that has not been personalized. Before doing anything else:

1. **Install dependencies if needed.** If `node_modules/` is missing, run
   `npm install` (Node.js + the logged-in `claude` CLI are assumed present).
   This is a fresh-from-zip clone — the deps are never bundled.
2. Read `ONBOARD.md` and run the onboarding interview it describes — it walks
   the user through pointing the HUD at their vault, naming their metrics,
   picking voice options, and wiring the runner, then writes
   `.jarvis-config.json` to mark onboarding complete.

Do the install proactively without making the user ask — "set this up for me"
or simply opening Claude here should be enough. Do not skip onboarding even
for small asks; an unpersonalized clone half-works in confusing ways.

**If `.jarvis-config.json` exists**: onboarding is done. Treat its contents
as the user's choices and help with whatever they ask.

## Platform rule

Detect the user's OS and adapt every command, path, and launcher to it
without asking — .vbs launchers are Windows; Mac/Linux use the direct
commands (nohup/launchd/systemd). Voice on machines without an NVIDIA GPU
runs CPU mode (plain `onnxruntime`): slower, fully functional.

## "Spin up Jarvis" — the start-everything playbook

When the user asks to start/spin up/boot Jarvis (any phrasing), do this, in
order, skipping anything already running:

1. Voice server: probe `http://127.0.0.1:3108/health`. Down → launch
   `voice-server\start-voice-server.vbs` (Windows) or
   `voice-server/.venv/bin/python voice-server/server.py` detached. If the
   venv doesn't exist, say voice isn't set up yet (README has the section)
   and continue — the HUD runs fine silent.
2. Runner: check the heartbeat file `<vault>/system/runner-status.json`
   (stale > 2 min = down). Down → launch `runner\start-runner.vbs` or
   `node runner/runner.js` detached.
3. HUD: probe `http://localhost:3107`. Down → launch `start-hud.vbs`
   (Windows) or `npx next build && npx next start -p 3107` detached.
   IMPORTANT: launch DETACHED (the .vbs files, or Start-Process /nohup) —
   a plain background shell command dies when this Claude session closes.
4. Tell the user: open `http://localhost:3107`, hold Space to talk. Remind
   them the first audio needs one click/keypress in the tab (browser
   autoplay policy).

If the user asks to make any of this automatic at login: Windows → put
shortcuts to the three .vbs files in `shell:startup` (open with
`explorer shell:startup`); Mac → launchd plists; Linux → systemd user
units. Do the wiring for them when asked.

## Project facts

- Next.js 15 HUD on **:3107** (`npx next dev -p 3107`), Python voice-server
  on **:3108** (Kokoro TTS + faster-whisper STT), Node runner daemon in
  `runner/` that executes skills via headless `claude -p`.
- All state lives as plain files under the vault (`VAULT_ROOT`, defaults to
  `starter-vault/`). No database. The architecture one-pager is
  `docs/architecture.html`; the README has the short version.
- Quality gates: `npm test` (router sweep, no API spend) and
  `npx tsc --noEmit`. Run both after touching `lib/`.

## Load-bearing couplings (break one and voice quietly misroutes)

- `ALLOWED_SKILLS` in `lib/skills.ts` ⟷ `buildPrompt()` cases in
  `runner/runner.js` ⟷ `DECK_SKILLS` in `components/HUD.tsx` — all three
  must list the same skills.
- Offer wording in `briefingOffer()` (lib/router.ts) ⟷ `OFFER_SKILLS` keys
  ⟷ the regex in `pendingOffer()` — the spoken offer is parsed back out of
  conversation memory verbatim when the user answers "yes".
- `HUD_TZ` (lib/config.ts) ⟷ the runner's `HUD_TZ` — both default
  America/Chicago; change them TOGETHER or "today" splits across two dates.
- `.boot-stagger` CSS sections must never receive a second `animation` —
  it cancels `boot-in ... forwards` and blanks the panel.

## Editing gotchas

- After editing `runner/runner.js`, ALWAYS `node --check runner/runner.js`
  — the runner fails silently on syntax errors (stale heartbeat, no log).
- Testing `/api/voice` with a command phrase queues a REAL intent the
  runner will execute. Use tier-2 questions ("what's in the queue") for
  pipeline tests.
- Two HUD tabs = double audio. Browser autoplay needs one click/keypress.
- Next dev can hang after webpack cache corruption: kill node on 3107,
  delete `.next/`, restart.
