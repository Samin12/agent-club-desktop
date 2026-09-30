# Agent Club assets

`node scripts/branding/generateAssets.mjs` generates the checked-in desktop,
installer, login, and PWA icons from `resources/agent-club.svg`. Run on macOS to
also regenerate the `.icns` icon. Some old resource filenames are retained so
upstream imports keep working; their image contents use the Agent Club mark.
