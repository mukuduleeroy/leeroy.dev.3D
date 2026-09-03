# Leeroy.dev Interactive 3D Portfolio

A TypeScript-powered static portfolio site with a fixed full-screen canvas that scrubs through PNG frames as the user scrolls or moves their pointer. The visual direction uses `DESIGN.md`, `variables.css`, `theme.css`, and `tokens.js`.

## Hero Sequence

The current PNG sequence lives here:

```text
assets/hero-sequence/frame_000.png
assets/hero-sequence/frame_001.png
assets/hero-sequence/frame_002.png
...
assets/hero-sequence/frame_060.png
```

The original full frame folder was removed to keep the repo deployable. This project now uses a curated 61-frame hero sequence that preloads into memory and scrubs with scroll plus pointer movement. To use a different sequence, drop files into `assets/hero-sequence` and update `frameCount` plus `framePath` in `src/main.ts`.

## Run locally

Install dependencies once, then build the TypeScript:

```bash
npm install
npm run build
```

Open `index.html` directly in a browser, or serve the folder with any static server:

```bash
npx serve .
```

## Deploy to Vercel

This repo includes `vercel.json` for deployment.

Use these Vercel project settings:

```text
Framework Preset: Other
Install Command: npm install
Build Command: npm run build
Output Directory: .
```

Vercel will compile `src/main.ts` into `dist/main.js` during deployment, then serve `index.html` from the project root.
