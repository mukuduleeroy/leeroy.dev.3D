# Leeroy.dev Interactive 3D Portfolio

A TypeScript-powered static portfolio site with a fixed full-screen canvas that scrubs through PNG frames as the user scrolls or moves their pointer. The visual direction uses `DESIGN.md`, `variables.css`, `theme.css`, and `tokens.js`.

## Frame folder

The current PNG sequence has already been extracted here:

```text
assets/frames/ezgif-frame-001.png
assets/frames/ezgif-frame-005.png
assets/frames/ezgif-frame-009.png
...
assets/frames/ezgif-frame-290.png
```

The repository keeps a sampled 74-frame sequence to reduce GitHub repo size. To use a different sequence, drop the PNG files into `assets/frames` and update `heroFrameNumbers` plus `framePath` in `src/main.ts`.

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
