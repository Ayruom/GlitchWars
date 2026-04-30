# Conversation Memory

This file stores key decisions, patterns, and context from past conversations with Claude Code.
It should be read at the start of every new session to maintain continuity.

---

## Session: 2026-04-26

### Project initialized
- Created `CLAUDE.md` with architecture overview and dev commands.
- GlitchWars is a **Phaser 3 + React** retro arcade game built with Vite.
- No unit tests exist — CI only runs `npm run build`.

### Developer preferences
- User (MouryA6) wants Claude to maintain persistent memory across conversations via this file.
- Review this file at the start of every new conversation or whenever `CLAUDE.md` is read.

### Recent features merged (from git log)
- **PR #47** — Level-up particle effects (`LevelUpEffects` branch)
- **PR #46** — Issue #33 fix (merged into main)

---

## Session: 2026-04-30

### Project audit completed
- Conversation agent did a full project status review — ~30-45h estimated to demo-ready.
- 10 new GitHub issues created (#50–#59) for unlogged bugs, dead content, and feature gaps.

### Issue #17 fixed (branch: claude-edits)
Three root causes identified and fixed:
1. **Enemy boundary bug** (`EnemyManager.spawnEnemy` + `isEnemyOffscreen`): was using stale `scene.config.width/height` (initial values). Fixed to use `scene.scale.width/height` so enemies correctly track the live canvas size after resize.
2. **HUD shifts on damage** (`ScoreDisplay`, `HealthBar`): all HUD elements were missing `setScrollFactor(0)`. Camera shake on damage (every hit) caused the entire HUD to visually drift. Fixed.
3. **GameOver screen not camera-fixed** (`GameOverScreen`): container missing `setScrollFactor(0)`. Fixed.

<!-- Append new sessions below this line in the same format -->
