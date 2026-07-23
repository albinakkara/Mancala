# Online Mancala

Play Kalah, Avalanche Mancala, and Oware / Awale online with 3 AI difficulties or 2-player pass & play. Free, no registration.

## Features

- 3 Mancala variants (Kalah, Avalanche, Oware / Awale)
- 3 CPU AI difficulties (Easy, Medium, Hard)
- 2-player pass & play mode
- Animated sowing and capture effects
- Move history and statistics tracking
- Sound effects and responsive design

## Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run check`           | Run Astro type checking                         |
| `npm run lint`            | Run ESLint                                       |
| `npm run format`          | Run Prettier                                     |
| `npm run test`            | Run tests with Vitest                           |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Tech Stack

- [Astro](https://astro.build)
- [React](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Vitest](https://vitest.dev)

## Project Structure

```
src/
├── components/       # React UI components
├── lib/              # Game logic, AI engine, sound, stats
├── pages/            # Astro routes
├── layouts/          # Shared layout
├── workers/          # Web Worker for CPU AI
├── styles/           # Global CSS
tests/                # Unit tests
```

## License

MIT
