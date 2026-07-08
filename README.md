# Ywitter — speak like Ye

**English** · [简体中文](./README.zh-CN.md)

Pick a year, throw it a topic, and it types back a post in the tweeting style Ye actually used that year — the capitalization, the run-ons, the mood. Then it renders a "Ywitter" mockup card you can export as a PNG.

It's a parody toy. Every generated post is machine-made and fake. Nothing here was written by any real person.

## What it does

- **Style by era** — style samples are grouped by year (and month), pulled from a public archive of ~6,000 old posts. The all-caps tendency is measured per year from the real data, so 2013 shouts and 2018 mostly doesn't.
- **Bring your own key (any provider)** — Anthropic (Claude), OpenAI, Google Gemini, DeepSeek, Kimi, Qwen, MiniMax, or any OpenAI-compatible endpoint. Keys live only in your browser (localStorage) and go straight to the provider you choose.
- **Free offline mode** — no key? It falls back to an on-device remix of that era's real posts. Lower coherence, higher chaos.
- **Era-accurate mockup** — four UI eras (early / classic / modern / dark), matched profile photo and display name per year, and a set of Ye-flavored fonts (Helvetica, Times, Impact, mono). Every card carries a **Parody** label so exports can't be passed off as real.
- **Content safety** — abusive/slur input is blocked before generating, and slurs that surface from the raw archive are masked in output.

## Run it locally

Requires Node 18+.

```bash
npm install
npm run dev       # http://localhost:5173
```

Build the static site:

```bash
npm run build     # outputs to dist/
```

## How to use

1. Choose a **Year** (or *Overall* for all years) and optionally a **Month**.
2. Type a **Theme** (max 280 chars) — e.g. "Monday mornings", "sushi".
3. Pick a **UI era** and **Font** for the mockup.
4. (Optional) Click **add API key**, choose a provider, paste your key, and hit
   **Save & Test** to confirm it works from your browser.
5. Hit **Generate**, then **Export PNG**.

No key? Skip step 4 — it runs the free offline generator.

## Data

- `npm run scrape` — re-fetches the full archive into `data/raw/*.json` (kept on
  your machine only; git-ignored).
- `npm run build:corpus` — compacts `data/raw` into the small, shipped
  `src/data/corpus.json` (text-only, grouped by year/month, capped per month,
  with per-year caps ratios).

Style samples come from the public archive at
[yzy-twts.com](https://yzy-twts.com). This project is a non-commercial parody and is not affiliated with any person or platform.

## Deploy (GitHub Pages)

A workflow is included at `.github/workflows/deploy.yml`. Push to `main`, then in the repo go to **Settings → Pages → Source: GitHub Actions**. It builds and publishes `dist/` automatically. The build uses a relative base path, so it works from a project subpath without extra config.

## Tech

Vite + React + TypeScript + Tailwind, `html-to-image` for PNG export. Fully static — no backend, no server-side secrets.

## License

[MIT](./LICENSE) © 2026 yiding
