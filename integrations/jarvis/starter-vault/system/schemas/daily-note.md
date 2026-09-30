---
schema: daily-note
schema_version: 1
status: frozen
---

# Daily Note Schema

Frozen contract shared by the HUD parser (`lib/vault.ts`), the runner's
plan-today / plan-tomorrow prompts, and anything else that writes daily
notes. Breaking changes bump `schema_version`; parsers refuse unknown
versions rather than silently coercing.

## File conventions

- **Location:** `daily-notes/`
- **Filename:** `YYYY-MM-DD.md` (ISO 8601)
- **Idempotency:** planners MUST NOT overwrite an existing note — merge
  into empty slots only.

## Frontmatter (YAML)

```yaml
---
date: 2026-06-01      # required, matches filename
schema_version: 1     # required
focus: ""             # optional, one line
---
```

## Body sections (exact order, exact headings)

```markdown
# YYYY-MM-DD

## Top 3 Priorities

1. [ ] First priority
2. [ ] Second priority
3. [ ] Third priority

## Schedule

- 09:00 — Block title
- 13:00 — Block title

## Current Focus

One line. The HUD speaks this in the daily rundown.

## Notes

Freeform — not parsed.
```

Parser specifics the HUD relies on:
- Top 3 items are NUMBERED checkboxes (`1. [ ]` / `1. [x]`) — the
  Directives panel toggles them via `/api/daily`.
- Schedule bullets are `- HH:MM — title` (em/en dash or hyphen).
- `## Current Focus` first non-empty line = the focus string.
