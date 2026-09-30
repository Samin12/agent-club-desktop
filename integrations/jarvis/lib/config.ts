import path from "path";
import os from "os";
import { homeEnv } from "./homeEnv";

// ---------------------------------------------------------------------------
// Personal-machine config — ALL of it, in one place. Every value reads an env
// var (process.env first, then the Jarvis env file) and falls back to a default
// that works on a fresh clone. ONBOARD.md walks through each one.
// Client components can't import this (server-only via homeEnv/fs); the two
// client-side values use NEXT_PUBLIC_ vars — see lib/voiceClient.ts and
// components/ReportOverlay.tsx.
// ---------------------------------------------------------------------------

/** A personal vault starts empty. Bundled examples are never account data. */
export const VAULT_ROOT =
  homeEnv("VAULT_ROOT") ?? path.join(os.homedir(), ".agentclub", "jarvis-vault");

/** IANA timezone for "today" — daily notes, schedules, and the runner must
 *  all agree on this or dates flip near midnight UTC. */
export const HUD_TZ = homeEnv("HUD_TZ") ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Local voice-server (Kokoro TTS + faster-whisper STT). */
export const VOICE_SERVER_URL = homeEnv("VOICE_SERVER_URL") ?? "http://127.0.0.1:3108";

/** How the voice prompts refer to you ("<name>: <what you said>"). */
export const USER_NAME = homeEnv("HUD_USER_NAME") ?? "User";
