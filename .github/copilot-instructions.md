<!-- Copilot / AI agent instructions for the Kontraktor Pro repo -->
# Kontraktor Pro — AI Agent Guidance

Purpose
- Help AI agents become productive quickly by describing architecture, key files, commands, and discoverable patterns.

Big picture
- Frontend single-page app built with React + TypeScript + Vite. Entry: `src/main.tsx`, primary UI in `src/App.tsx`.
- Styling: Tailwind + PostCSS (see `tailwind.config.js`, `postcss.config.js`).
- Firebase is used for auth and Firestore; Firebase initialization is in `firebase.ts` (contains a placeholder config with comment "GANTI INI").
- CI/CD: GitHub Actions deploy to Firebase Hosting (look at `.github/workflows/firebase-hosting-*.yml`).

Key commands
- `npm run dev` — start Vite dev server with HMR
- `npm run build` — run `tsc -b` then `vite build` (note: TypeScript project build is used)
- `npm run preview` — preview built output with `vite preview`
- `npm run lint` — run ESLint over the workspace

Project conventions & patterns (concrete)
- TypeScript: multiple tsconfig files exist (`tsconfig.app.json`, `tsconfig.node.json`). Builds use `tsc -b` before `vite build`.
- Firebase: `firebase.ts` exports `auth`, `googleProvider`, and `db`. The file currently holds a client API key/config; the inline Indonesian comment indicates maintainers expect replacement with environment-specific config. Do not delete these exports—other modules import them.
- Files to inspect for UI/data flow: `src/main.tsx` (app bootstrap), `src/App.tsx` (main app component), and any modules under `src/assets` for static assets.
- ESLint: repo includes `eslint.config.js`; use the `lint` script. Keep rule changes scoped to this project by editing `eslint.config.js` only.

Integrations & important locations
- Firebase initialization: `firebase.ts`
- Hosting CI workflows: `.github/workflows/firebase-hosting-pull-request.yml` and `firebase-hosting-merge.yml`
- Vite config: `vite.config.ts`
- Packaging & scripts: `package.json`

Diagnostic & debugging notes
- To reproduce builds locally: run `npm run build` — if TypeScript errors occur, run `tsc -b` directly to get full diagnostics.
- Devflow: use `npm run dev` for fast feedback; changes to `firebase.ts` are client-side and reflected immediately in dev.

What to avoid / preserve
- Do not remove or hide the exported Firebase helpers (`auth`, `googleProvider`, `db`) — they are referenced by UI/auth flows.
- The repository stores a client-side Firebase config (API key). Treat it as discoverable in code; if you update it, preserve the inline instructional comment so maintainers know to replace it.

Examples (use these patterns when writing code or PRs)
- Importing Firebase helpers:

  import { auth, googleProvider, db } from './firebase'

- Start dev server for local changes:

  npm run dev

Where to look next
- Inspect `src/` to find feature components; use the CI workflows in `.github/workflows` to understand deploy triggers.

Questions for maintainers (ask if unclear)
- Should sensitive Firebase config be moved to environment variables or left in repo for now? The code contains a placeholder comment — confirm preferred handling.
- Are there any undocumented conventions for feature branches or commit messages tied to CI workflows?

If you need more, tell me which area to expand (auth flows, routing, build, or CI) and I will update this file.
