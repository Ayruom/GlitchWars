# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## On every new conversation

**Always read [`CONVERSATION_MEMORY.md`](./CONVERSATION_MEMORY.md) first.** It stores key decisions, preferences, and context from past sessions. After each session where something noteworthy happened (design decision, preference expressed, feature shipped), append a new dated entry to that file.

## Commands

```bash
npm run dev       # Start Vite dev server with hot reload
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

There are no automated tests beyond the CI build check (`.github/workflows/node.js.yml` runs `npm install` + `npm run build` on Node 18/20/22).

## Architecture

GlitchWars is a browser-based retro arcade game. The stack is **React + React Router** for the shell/landing page and **Phaser 3** (Arcade physics) for the actual game, embedded in a React component.

### Navigation flow

```
/ (landing)  →  /select-gender  →  /select-hero  →  /game
```

Hero/gender selection is stored in React state and passed into the Phaser game instance via `Game.jsx`, which manages Phaser lifecycle (create/destroy on mount/unmount) and debounced canvas resizing (16:9 aspect ratio, 320×240 min, 1920×1080 max).

### Phaser game (`src/game/`)

Three scenes run in sequence: **BootScene** (asset preload) → **MenuScene** → **PlayScene** (main loop).

**Managers** own distinct subsystems and are instantiated by PlayScene:
- `EnemyManager` — spawn rate, movement, health bars, wave-scaled stats
- `LevelManager` — score → level → wave progression; difficulty timer fires every 10s to tighten spawn intervals
- `InputManager` — Arrow keys + WASD
- `CollisionManager` — registers Arcade physics overlaps between player, enemies, and weapons

**Entities** are Phaser GameObjects extended with game logic:
- `Player` — movement, invulnerability window after damage, stat scaling per wave
- `Enemy` — health/speed driven by `(wave × multiplier) + (level × multiplier)`, destruction VFX on death

**UI** (`src/game/ui/`) — in-game HUD (HealthBar, ScoreDisplay, GameOverScreen) built with Phaser text/graphics, not React.

**Utils** (`src/game/utils/`) — `EffectsHelper` for level-up/wave/screen-flash effects; `ScreenUtils` for responsive UI positioning.

### Scoring & difficulty

- Score threshold per level: `200 × 1.5^(level-1)` (exponential)
- Every 5 levels = new wave; waves buff enemy health, speed, and damage
- Difficulty timer fires every 10s independent of wave progression

### Styling

Tailwind CSS 4 with a retro pixel theme: "Press Start 2P" font, black/green/cyan palette, scanline overlay. Custom animations (`glitch`, `flicker`, `wiggle`, `bounceGlow`) are defined in `tailwind.config.js`.
