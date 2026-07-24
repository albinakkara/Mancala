# Online Mancala

Play three Mancala variants — Kalah, Avalanche, and Oware/Awale — against CPU AI or a local friend. Free, no registration required.

![CI](https://github.com/user/repo/actions/workflows/ci.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Variants

| Variant | Description |
| :--- | :--- |
| **Kalah** | Classic 6-pit, 2-store game with fixed opening layout and a large store on each end. |
| **Avalanche** | Sowing empties one's own pits in turn; a player who sows into an empty pit captures nothing and the turn passes immediately. |
| **Oware / Awale** | Traditional Ghanaian rules: captures require at least one seed already in the target pit; if all opponent pits are empty the game ends. |

## Features

- 3 Mancala variants with variant-specific rule enforcement
- 3 CPU AI difficulties (Easy, Medium, Hard) running in a Web Worker
- 2-player pass & play on the same screen
- Animated sowing and capture effects
- Move history and per-session statistics
- Sound effects and responsive layout

## Getting Started

**Prerequisites:** Node.js >= 22.12.0

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:4321`. Run it in background mode with:

```bash
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run check`           | Run Astro type checking                         |
| `npm run lint`            | Run ESLint                                       |
| `npm run format`          | Run Prettier                                     |
| `npm run test`            | Run tests with Vitest                           |
| `npm run test:watch`      | Run tests in watch mode                         |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Tech Stack

- [Astro](https://astro.build)
- [React](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Vitest](https://vitest.dev)

## Project Structure

```
src/
├── assets/            # Static images, fonts, etc.
├── components/        # React UI components
├── layouts/           # Shared Astro layout
├── lib/               # Game logic, AI engine, sound, stats
├── middleware.ts      # Astro middleware
├── pages/             # Astro file-based routes
├── styles/            # Global CSS
└── workers/           # Web Worker for CPU AI
tests/                  # Vitest unit tests
public/                 # Static assets served as-is
```

## License

MIT
