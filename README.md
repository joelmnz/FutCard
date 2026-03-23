# FutCard

FutCard is a client-side football card trading game.

The game runs entirely in the browser with local storage persistence and is designed around a simple loop:
onboard your manager, open packs, manage your collection, trade and sell cards, play matches, and grow your club value.

## Development

- `bun run dev` starts the local Bun static server.
- `bun run check` runs the TypeScript project checks.
- `bun run build` creates a static `dist/` folder for GitHub Pages.

## GitHub Pages

The GitHub Pages deployment workflow publishes the generated `dist/` folder from `.github/workflows/deploy.yml`.

Notes:

- The hosted site uses the same browser-side save system as local development.
- Save data is stored in `localStorage`, so the hosted save is separate from `localhost` saves.
- Relative asset paths are used, so the app works from a GitHub Pages project subpath.

To deploy, push to `main` or run the workflow manually from the Actions tab.
