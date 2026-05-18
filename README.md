# Cauli — Forms AI (**Jac** + Next.js)

Meet **Cauli**, your friendly voice bot that turns any Google Form into a conversation. Paste a form link, talk through the questions, and Cauli submits it for you.

This repo highlights the **[Jac programming language](https://docs.jaseci.org)** from the Jaseci stack: form URL validation and the public `parse_google_form` API live in **`jac/form_parser.jac`** (Jac syntax + embedded Python for the HTML/JSON scrape — same algorithm as the TypeScript fallback in `src/lib/form-parser.ts`).

**Demo:** [https://cauliform-ai-293051374734.us-west1.run.app](https://cauliform-ai-293051374734.us-west1.run.app)

Built for NEXT GEN PRODUCT LAB hackathon (7-day build).

## Demo video

[![Cauli Demo](https://img.youtube.com/vi/N7ZOtOqVaf8/maxresdefault.jpg)](https://youtu.be/N7ZOtOqVaf8)

## What Cauli does

- Parses any Google Form URL
- Asks questions by voice (powered by Gemini Live)
- Confirms your answers before submitting
- Submits the form for you

## Jac in this project

| Path | Role |
|------|------|
| `jac/form_parser.jac` | **Jac** module: `extract_form_id`, `is_valid_google_form_url`, `map_question_type`, and `parse_google_form` (delegates HTML parsing to a `::py::` block). |
| `jac/smoke.jac` | Quick Jac runtime checks (`npm run jac:smoke`). |
| `scripts/jac_parse_stdio.py` | stdin/stdout bridge so Next.js can call the Jac module via Python’s Jac import hook. |
| `src/lib/jac-form-parser.ts` | Spawns the bridge when Jac parsing is enabled. |

Install the Jac toolchain into a local venv (Python **3.12+** recommended; tested with **3.13**):

```bash
python3.13 -m venv .venv-jac
./.venv-jac/bin/pip install -r requirements-jac.txt
./.venv-jac/bin/jac --version
npm run jac:check    # static check jac/form_parser.jac
npm run jac:smoke    # run jac/smoke.jac
```

## Quick start (web app)

```bash
npm install
cp .env.example .env.local   # if present
npm run dev
```

Open `http://localhost:3000`.

### Optional: serve `/api/parse-form` with the Jac parser

Default behavior uses fast TypeScript + Node `fetch` (good for serverless).

To run the **same route through Jac + Python** (needs a local Jac venv):

```bash
export CAULIFORM_USE_JAC_PARSER=true
export CAULIFORM_JAC_PYTHON="$(pwd)/.venv-jac/bin/python"
npm run dev
```

`CAULIFORM_JAC_PYTHON` must be an **absolute** path so the Next.js bundler does not follow `.venv-jac` symlinks at build time.

## Tests

```bash
npm test                 # Vitest (TS helpers aligned with jac/form_parser.jac)
npm run jac:smoke        # Jac smoke tests
```

## Needed env vars

```env
GOOGLE_AI_API_KEY=
GOOGLE_CLOUD_PROJECT=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Optional:

```env
CAULIFORM_USE_JAC_PARSER=true
CAULIFORM_JAC_PYTHON=/absolute/path/to/.venv-jac/bin/python
```

## About

Cauli is a forms AI — voice-first, friendly, and hands-free. Built for the Gemini Live Agent Challenge. **Jac** sources live under `jac/`; the UI remains Next.js + React.
