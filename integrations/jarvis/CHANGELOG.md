# Changelog

## 1.0.1

- Fix: the runner now spawns `claude -p` with `--dangerously-skip-permissions`.
  Headless runs are non-interactive, so the default permission mode silently
  denied the deliverable write — skills ran but produced no report. Required for
  any skill to write its output on a fresh install.
- Background skills now default to opus (`AGENTIC_OS_MODEL=claude-opus-4-8`) for
  the best report/research quality; onboarding offers sonnet/haiku for lower
  cost, and you can switch any time via Claude Code.
- Onboarding: new step scans your installed `~/.claude/skills` and offers to pin
  existing skills to the command deck and voice layer.
- Onboarding now runs `npm install` itself on a fresh clone — open Claude Code
  in the folder and it installs dependencies before the interview, no manual
  `npm install` needed.

## 1.0.0

Initial release.

- Jarvis-style HUD (Next.js, three.js orb, file-backed panels)
- Local voice loop: faster-whisper STT + Kokoro TTS, push-to-talk,
  optional wake word
- Three-tier intent router: rules → Claude Haiku (optional) → local
  Ollama model (optional) → rules floor
- Runner daemon executing skills via headless `claude -p`:
  morning-report, inbox-brief, plan-today, plan-tomorrow, vault-cleanup,
  voice-ask
- Claude Code onboarding: run `claude` in the repo, ONBOARD.md interview
  personalizes everything
- Starter vault with sample data — HUD renders on first boot, zero config
