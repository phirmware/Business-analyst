# Business Reality Check

A single-page web app that stress-tests a business idea before you risk real money: unit economics, sensitivity analysis, a 4-question scorecard, a reference library, and a skeptical-investor AI advisor.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- Recharts
- OpenAI SDK (points at any OpenAI-compatible endpoint — OpenAI, OpenRouter, Anthropic's OpenAI-compat endpoint, or a custom gateway)
- LocalStorage for saved analyses — no backend

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then produces dist/
npm run preview    # serve the built output locally
```

Node 20+ required (see [.nvmrc](.nvmrc)).

## Project structure

- [src/App.tsx](src/App.tsx) — top bar, sidebar, saved-analyses dropdown, dark mode, onboarding gate
- [src/calculations.ts](src/calculations.ts) — unit economics and the variance engine that fuels both Analyzer and Stress Test
- [src/framework.ts](src/framework.ts) — the full framework used as the AI advisor's system prompt
- [src/sections/Analyzer.tsx](src/sections/Analyzer.tsx) — live unit economics, donut + waterfall + breakeven charts
- [src/sections/StressTest.tsx](src/sections/StressTest.tsx) — sliders, 8 one-click scenarios, survival matrix
- [src/sections/Scorecard.tsx](src/sections/Scorecard.tsx) — 4 critical questions, auto-scoring, weighted verdict
- [src/sections/Library.tsx](src/sections/Library.tsx) — 11 searchable learning cards including the shortlet case study
- [src/sections/AIAdvisor.tsx](src/sections/AIAdvisor.tsx) — OpenAI-SDK chat, "analyze my current business" shortcut, per-business history
- [src/sections/Compare.tsx](src/sections/Compare.tsx) — two saved analyses side by side
- [src/export.ts](src/export.ts) — Markdown export + browser-print PDF

## AI provider

Provider, base URL, model, and API key are configured in Settings (stored in LocalStorage; the key is sent directly from the browser to the endpoint with `dangerouslyAllowBrowser: true`).

Presets:

- **OpenAI** — `https://api.openai.com/v1`, default model `gpt-4o`
- **OpenRouter** — `https://openrouter.ai/api/v1`, lets you pick Claude, Gemini, Llama, etc. with one key
- **Anthropic (OpenAI-compatible)** — `https://api.anthropic.com/v1/`, use your Anthropic key
- **Custom** — any OpenAI-compatible endpoint

## Deploy to Vercel

The app is static — no server, no env vars, no secrets to manage.

**Option 1 — Vercel CLI:**

```bash
npm i -g vercel
vercel             # first deploy (follow prompts)
vercel --prod      # promote to production
```

**Option 2 — connect your Git repo** at https://vercel.com/new, import the repo, and Vercel auto-detects Vite.

[vercel.json](vercel.json) pins the framework, build command, and output directory so detection can't drift.

### What to expect

- Each visitor configures their own API key in the deployed app's Settings — it never leaves their browser.
- No environment variables are required on Vercel.
- There is no auth on the app itself. If you want to restrict access, put it behind Vercel Password Protection (Pro plan) or deploy it to a private URL.
