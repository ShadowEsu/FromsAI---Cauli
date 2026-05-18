# Cauli — Forms AI

Voice-first assistant that turns a Google Form into a spoken conversation: paste a link, answer by voice (Gemini Live), and submit through the browser agent.

This repo ships a **Next.js** app and a **[Jac](https://docs.jaseci.org)** module under `jac/`. Form URL checks and `parse_google_form` live in **`jac/form_parser.jac`** (Jac plus a `::py::` block for the HTML / JSON scrape, matching `src/lib/form-parser.ts`).

<p align="center">
  <br />
  <a href="https://cauliform-ai-293051374734.us-west1.run.app"><strong>Live demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://cauliform-ai-293051374734.us-west1.run.app/about"><strong>About & links</strong></a>
  &nbsp;·&nbsp;
  <a href="https://docs.jaseci.org"><strong>Jac docs</strong></a>
  &nbsp;·&nbsp;
  <a href="https://youtu.be/N7ZOtOqVaf8"><strong>Demo video</strong></a>
  <br /><br />
</p>

---

Built for NEXT GEN PRODUCT LAB (7-day build) and the Gemini Live Agent Challenge.

## Demo video

[![Cauli Demo](https://img.youtube.com/vi/N7ZOtOqVaf8/maxresdefault.jpg)](https://youtu.be/N7ZOtOqVaf8)

---

## Features

- Parse a public Google Form from its URL
- Voice Q&A via Gemini Live
- Confirm answers, then submit (Tinyfish automation API)

---

## Quick start

```bash
npm install
```

Create `.env.local` in the project root (see [Environment variables](#environment-variables)), then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For a **large-type About page with prominent links**, open [http://localhost:3000/about](http://localhost:3000/about).

---

## Jac toolchain (optional)

Jac is the Jaseci-stack language used for `jac/form_parser.jac`. Use Python **3.12+** (tested with **3.13**).

```bash
python3.13 -m venv .venv-jac
./.venv-jac/bin/pip install -r requirements-jac.txt
./.venv-jac/bin/jac --version
```

After the venv exists:

```bash
npm run jac:check   # static check jac/form_parser.jac
npm run jac:smoke   # run jac/smoke.jac (no network)
```

**Project layout**

- **`jac/form_parser.jac`** — `extract_form_id`, `is_valid_google_form_url`, `map_question_type`, `parse_google_form` (heavy scraping in embedded Python).
- **`jac/smoke.jac`** — quick sanity checks for the Jac helpers.
- **`scripts/jac_parse_stdio.py`** — JSON stdin → JSON stdout bridge for Node.
- **`src/lib/jac-form-parser.ts`** — spawns the bridge when Jac parsing is enabled.

### Use Jac for `/api/parse-form`

By default the API uses TypeScript + `fetch` (fits serverless). To run the **Jac-backed** parser locally:

```bash
export CAULIFORM_USE_JAC_PARSER=true
export CAULIFORM_JAC_PYTHON="$(pwd)/.venv-jac/bin/python"   # must resolve to an absolute path
npm run dev
```

Use an absolute path for `CAULIFORM_JAC_PYTHON` so Next/Turbopack does not traverse `.venv-jac` symlinks at build time.

---

## Tests

```bash
npm test              # Vitest — URL helpers aligned with jac/form_parser.jac
npm run jac:smoke     # Jac smoke (requires `.venv-jac` + jaclang)
```

---

## Environment variables

Set these in `.env.local` (or your host’s env).

| Variable | Required | Purpose |
|----------|----------|---------|
| `GOOGLE_AI_API_KEY` | Yes (voice) | Gemini / token route |
| `TINYFISH_API_KEY` | Yes (submit) | Form submission automation |
| `NEXT_PUBLIC_APP_URL` | Recommended | App URL for client config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Optional | Defaults in code if unset |
| `CAULIFORM_USE_JAC_PARSER` | Optional | `true` / `1` to parse forms via Jac |
| `CAULIFORM_JAC_PYTHON` | If Jac parse on | Absolute path to venv `python` |

Example snippet:

```env
GOOGLE_AI_API_KEY=
TINYFISH_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```

Firebase Admin uses **Application Default Credentials** (e.g. `gcloud auth application-default login` locally, or the Cloud Run service account in production).

Optional Jac parsing:

```env
CAULIFORM_USE_JAC_PARSER=true
CAULIFORM_JAC_PYTHON=/absolute/path/to/.venv-jac/bin/python
```

---

## About

> **About Cauli**
>
> Forms automation with a conversational layer: **Jac** sources live in `jac/`; the UI and API routes are **Next.js** and React. For larger headings and link cards, open **[About on the live demo](https://cauliform-ai-293051374734.us-west1.run.app/about)** or **`http://localhost:3000/about`** when developing locally.
