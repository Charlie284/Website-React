# Installation & Quick Start

## Prerequisites
- **Node.js** (>=20.19.0) and **npm** installed.
- **Git** for version control.

## Clone the repository
```bash
git clone https://github.com/Charlie284/Website-React.git
cd Website-React
```

## Install dependencies
```bash
npm ci
```

## Development server
```bash
npm run dev
```
This starts a Vite dev server at `http://localhost:5173`. Hot Module Replacement (HMR) is enabled, so any change to the source code refreshes automatically.

This is the source of Charlie Harper's personal site, not a generic portfolio
template. Before deploying a fork, replace the personal content and media
listed in [`LICENSING.md`](../LICENSING.md), the `clh.lol` URLs, and the Kit
newsletter form ID.

## Build for production
```bash
npm run build
```
The compiled static assets are placed in the `dist/` folder, ready to be served by any static web server (e.g., Vercel, Netlify, Nginx, your own homelab).

## Deploy
Upload the contents of `dist/` to your hosting platform of choice. For Vercel:
```bash
npm i -g vercel
vercel
```
Follow the prompts to link the project.

---

### Scripts reference
| Script | Description |
|--------|-------------|
| `dev` | Starts the Vite development server with HMR |
| `build` | Produces a production‑ready static bundle |
| `preview` | Serves the built `dist/` locally for quick checks |
