# ONBOARD.md — make this HUD yours

This file is an interview script for Claude Code. When a user runs `claude`
in a fresh clone (no `.jarvis-config.json`), Claude reads this and walks
them through personalization — one question at a time, applying edits as
answers land. A human can also follow it manually; every touchpoint is
listed in the Edit Manifest below.

## How to run the interview (instructions for Claude)

**Step 0 — detect the platform silently.** Check the OS before the first
question and adapt EVERYTHING to it without asking: shell commands, paths,
launcher choices (.vbs vs nohup/launchd/systemd), the voice-server pip set
(Windows/Linux + NVIDIA → `onnxruntime-gpu` + `nvidia-*` wheels; Mac or no
NVIDIA GPU → plain `onnxruntime`, mention voice runs CPU and is slower but
works). Never show a Windows command to a Mac user or vice versa. On Mac,
note the HUD/runner/onboarding are identical — only voice speed differs.

**Step 0.5 — install dependencies.** If `node_modules/` is missing (it is, on
a fresh unzip — deps are never bundled), run `npm install` now, before the
questions. Tell the user you're installing while you start the interview. The
`claude` CLI is assumed already installed and logged in.

Ask ONE question at a time. After each answer, apply the edit immediately
(env line or file edit per the manifest), confirm in one short sentence,
and move on. Recommend a default for every question. At the end, run the
acceptance checks, then write `.jarvis-config.json` (shape at the bottom)
and tell the user how to start everything.

### The questions, in order

1. **Vault location.** "Where should your vault live — the folder of plain
   files everything reads and writes? Default: keep using the bundled
   `starter-vault/` for now (you can move later). If you already use an
   Obsidian vault, point at it." → Set `VAULT_ROOT` in `~/.claude/.env`.
   If they point at an existing vault, create `system/queue`, `system/runs`,
   `system/metrics`, `daily-notes`, `inbox/reports/morning` inside it and
   copy `starter-vault/system/schemas/daily-note.md` over.
2. **Timezone.** "What timezone is 'today' for you?" (IANA name, e.g.
   Europe/London). → `HUD_TZ` in `~/.claude/.env`. Warn: the HUD and runner
   read the same var; never set them differently.
3. **Your name.** "How should the voice layer refer to you in its own
   notes?" → `HUD_USER_NAME` in `~/.claude/.env`.
4. **Obsidian.** "Do you use Obsidian on this vault? If yes, what's the
   vault name (folder name as Obsidian shows it)?" → If yes:
   `NEXT_PUBLIC_OBSIDIAN_VAULT=<name>` in `.env.local` in the repo root
   (build-time var). If no: skip — the deep link stays hidden.
5. **Vitals metrics.** "The Vitals panel reads `system/metrics/metrics.csv`
   (columns: timestamp,source,metric,value,status,error). The starter data
   is fake. What do you actually want on the wall — YouTube subs? GitHub
   stars? Sales? Anything you can script into that CSV works." → Help them
   sketch a small script (cron/Task Scheduler) appending rows; offer to
   write it. Update `SOCIAL_DEFS` in `components/HUD.tsx` if their sources
   aren't youtube/instagram.
6. **Morning report focus.** "The morning-report skill researches your
   field each day. What's your beat?" → Edit the `morning-report` prompt in
   `runner/runner.js` (the research scope sentence). `node --check` after.
7. **Email triage.** "Want the inbox-brief skill? It needs the Anthropic
   Gmail connector enabled in your Claude account." → If no, remove
   `inbox-brief` from `ALLOWED_SKILLS` (lib/skills.ts), `DECK_SKILLS`
   (components/HUD.tsx), and the runner case — all three, see couplings.
8. **Calendar.** "Want plan-today to pull your Google Calendar? Needs the
   Anthropic Google Calendar connector." → If no, note that plan-today
   still works, just without the schedule.
9. **Voice.** "Voice needs a local Python server (free, offline, ~400MB of
   models). Set it up now or later?" → If now: walk through the voice-server
   setup section in README.md (venv, pip installs, model downloads), then
   the voice audition (`voice-server/make_samples.py` → `audition.html` →
   `KOKORO_VOICE`/`KOKORO_SPEED`). If later: the HUD runs fine silent.
10. **Router brain.** "For sharper voice intent routing you can add an
    Anthropic API key (~$0.002 per ambiguous ask) and/or run a small local
    model via Ollama (free, offline). Rules-only also works." →
    `ANTHROPIC_API_KEY` in `~/.claude/.env` — **the FILE, never a Windows
    env var**, or every interactive `claude` session flips from
    subscription to API billing. Ollama: install + `ollama pull qwen3.5:4b`.
11. **Runner model.** "Which Claude model should background skills run on?
    Default opus — the best output for reports and research. Want it cheaper?
    Pick sonnet (good, much cheaper) or haiku (fastest, cheapest). You can also
    just tell Claude Code to switch it any time." → `AGENTIC_OS_MODEL` in
    `~/.claude/.env` (`claude-opus-4-8` / `claude-sonnet-4-6` /
    `claude-haiku-4-5-20251001`).
12. **Existing skills.** Scan the user's installed skills directory
    (`~/.claude/skills/` on Mac/Linux, `%USERPROFILE%\.claude\skills\` on
    Windows). If any exist, list them by name + their SKILL.md `description`
    and ask: "I found these skills already on your machine — want any pinned
    to the command deck and voice layer?" For each they pick, wire ALL the
    coupling points (see the Skill roster row in the Edit Manifest):
    add the name to `ALLOWED_SKILLS` (lib/skills.ts) and `DECK_SKILLS`
    (components/HUD.tsx), a `deliverablePathFor()` path
    (`inbox/reports/<skill>/<date>-<id8>.md` is a safe default), and a
    `buildPrompt()` case whose prompt is `${AUTONOMOUS_PREFIX}` + "Run the
    /<skill> skill. Write the result at exactly ${deliverable} ... End your
    reply with: SAVED ${deliverable}" (let their installed skill do the
    work — headless `claude -p` can invoke it). `node --check runner/runner.js`
    after. **Warn for each:** the deck flow (Documents panel, doc callouts,
    spoken summary) only works if the skill writes a markdown artifact to its
    vault path and its first reply line is one conversational sentence — a
    skill that depends on local scripts, private APIs, or external state may
    queue but no-op. If no skills are found, skip this question silently.
13. **Autostart.** "Want Jarvis to start at login — HUD, runner, and
    voice-server?" → Windows: shortcuts to `start-hud.vbs`,
    `runner/start-runner.vbs`, `voice-server/start-voice-server.vbs` in
    `shell:startup` (run `npx next build` first so the HUD launcher uses
    the fast production server). Mac/Linux: offer launchd plists / systemd
    units. If they decline: tell them "spin up Jarvis" in any `claude`
    session here starts everything on demand.

### Acceptance checks (run these, show results)

```
npm test                      # 16-case router sweep — must be 16/16
npx tsc --noEmit              # clean
npx next dev -p 3107          # then:
curl http://localhost:3107/api/state           # 200 JSON, metrics present
curl http://localhost:3107/api/speak           # {"ok":true,"engine":"kokoro"} if voice up,
                                               # {"ok":false} (graceful) if not
node --check runner/runner.js                  # after ANY runner edit
node runner/runner.js  (separate terminal)     # heartbeat: vault system/runner-status.json
```

Voice round trip (if voice set up): hold Space in the HUD, say "what's in
the queue" — spoken reply within ~1s. NEVER test with a command phrase
("run the inbox brief") — that queues a real run.

### Finish

Write `.jarvis-config.json` in the repo root:

```json
{
  "onboarded": "<ISO date>",
  "vault": "<VAULT_ROOT value>",
  "timezone": "<HUD_TZ>",
  "voice": true,
  "router": "rules|haiku|local|auto",
  "skills": ["morning-report", "inbox-brief", "plan-today", "plan-tomorrow", "vault-cleanup", "voice-ask"]
}
```

Then tell the user: `npx next dev -p 3107` for the HUD,
`node runner/runner.js` for the runner, voice-server per README. Done.

---

## Edit Manifest — every personalization touchpoint

| What | File · symbol | How |
|---|---|---|
| Vault path | `lib/config.ts` `VAULT_ROOT` (reads env) | `VAULT_ROOT` in `~/.claude/.env` |
| Timezone | `lib/config.ts` `HUD_TZ` + `runner/runner.js` `HUD_TZ` | `HUD_TZ` in `~/.claude/.env` (one var, both read it) |
| Your name | `lib/config.ts` `USER_NAME` | `HUD_USER_NAME` env |
| Voice server URL | `lib/config.ts` `VOICE_SERVER_URL`; client WS in `lib/voiceClient.ts` | `VOICE_SERVER_URL` env + `NEXT_PUBLIC_VOICE_WS` in `.env.local` |
| Obsidian deep link | `components/ReportOverlay.tsx` `OBSIDIAN_VAULT` | `NEXT_PUBLIC_OBSIDIAN_VAULT` in `.env.local` |
| Skill roster | `lib/skills.ts` `ALLOWED_SKILLS` ⟷ `runner/runner.js` `buildPrompt()`+`deliverablePathFor()` ⟷ `components/HUD.tsx` `DECK_SKILLS` | edit all three together |
| Voice aliases for skills | `lib/router.ts` `SKILL_ALIASES` | regex per skill |
| Spoken offers (**load-bearing**) | `lib/router.ts` `briefingOffer()` ⟷ `OFFER_SKILLS` keys ⟷ `pendingOffer()` regex | the offer sentence is parsed back verbatim when the user says "yes" — change all three together or "yes" stops working |
| Morning-report beat | `runner/runner.js` `morning-report` case | edit the research-scope sentence; `node --check` after |
| Vitals panels | `components/HUD.tsx` `SOCIAL_DEFS` | match your metrics.csv sources |
| TTS voice | `voice-server/server.py` via `KOKORO_VOICE`, `KOKORO_SPEED` | audition first |
| STT vocab bias | `voice-server/server.py` `WHISPER_PROMPT` | list YOUR acronyms + skill names |
| Wake word | `voice-server/start-voice-server.vbs` `WAKE_WORD` | off by default (speaker bleed); headphones recommended |
| Runner model | `runner/runner.js` `CLAUDE_MODEL` | `AGENTIC_OS_MODEL` env; per-ask override allowlist in `MODEL_ALLOWLIST` |
| Rundown trigger phrases | `lib/router.ts` `BRIEFING_RE` | whole-utterance anchored — keep it that way |

**Hard rules that survive every customization**
- The runner spawns `claude -p` with `--dangerously-skip-permissions` — headless
  runs are non-interactive, so the default permission mode would silently DENY the
  deliverable write. The runner only executes self-contained skill prompts against
  the user's own vault on localhost. Do not remove it or skills produce no report.
- `ANTHROPIC_API_KEY` lives in `~/.claude/.env` as a FILE entry only.
- Runner spawns always pass explicit `--model`.
- `node --check runner/runner.js` after every runner edit.
- HUD and runner must agree on `VAULT_ROOT` and `HUD_TZ`.
- localhost only — never bind the HUD or voice-server to 0.0.0.0; the
  mutation endpoints have no auth by design.
