# Cauli — Project Overview

Important bits you need to understand the codebase.

---

## The Big Picture

1. User pastes a Google Form URL
2. We parse the form and get questions
3. User talks to Cauli (Gemini Live voice agent)
4. Cauli asks each question, user answers by voice
5. User confirms → Cauli calls `submit_form` tool
6. TinyFish AI agent fills and submits the form in a real browser

---

## Main Flow

```
page.tsx (input)
    ↓ handleStart
/api/parse-form  →  form-parser.ts  (scrapes form HTML, extracts questions)
    ↓
useGeminiLive.connect(prompt, tools)
    ↓
Gemini Live WebSocket (voice in/out)
    ↓ user says "yes, submit"
submit_form tool triggered  →  page calls /api/submit-form
    ↓
TinyFish AI (fills form in browser)  →  streams SSE back
    ↓ COMPLETE
Optional: /api/user-profile (save to Firestore for memory)
```

---

## Key Files

| File | Role |
|------|------|
| `src/app/page.tsx` | Single page: form URL input, voice UI, transcript. Calls parse-form, then useGeminiLive, then submit-form on tool call. |
| `src/hooks/useGeminiLive.ts` | WebSocket to Gemini Live. Mic → PCM → base64 → Gemini. Gemini audio → playback. Handles `submit_form` tool calls → calls `onFormSubmit`. |
| `src/lib/prompts.ts` | `createFormAgentPrompt()` builds system prompt with form questions. `getFormTools()` defines the `submit_form` tool for Gemini. |
| `src/lib/form-parser.ts` | `parseGoogleForm(url)` fetches form HTML, extracts title + questions from `FB_PUBLIC_LOAD_DATA_`. |
| `src/lib/audio-utils.ts` | PCM conversions: float32↔int16, base64↔ArrayBuffer, PCM→AudioBuffer for playback. |

---

## API Routes

| Route | What it does |
|-------|--------------|
| `GET /api/gemini-token` | Returns `GOOGLE_AI_API_KEY` so the key stays server-side. |
| `POST /api/parse-form` | Takes `{ url }`, returns `{ data: FormData }` (title + questions). |
| `POST /api/submit-form` | Takes `{ formUrl, responses }`, calls TinyFish, streams SSE back. Client reads `data:` lines for COMPLETE/ERROR. |
| `GET /api/user-profile?phone=` | Loads saved profile (name, email, etc.) for memory. |
| `POST /api/user-profile` | Saves answers after form submit (optional, for memory). |

---

## Important Concepts

**Gemini Live** — Real-time voice API over WebSocket. You send PCM audio, it sends back audio + text. Supports tools (function calling).

**Tool calling** — Gemini can invoke `submit_form` with `{ answers: [{ questionTitle, answer }] }`. The hook catches that and calls `onFormSubmit`, which triggers `/api/submit-form`.

**TinyFish** — External service that runs a headless browser, fills the form, submits it. Returns SSE stream with status events.

**Profile memory** — If user gives phone number, we store common answers (name, email, etc.) in Firestore. Next time, we pass `knownResponses` into the prompt so Cauli can say "I have your name as X — is that correct?"

---

## Env Vars You Need

```
GOOGLE_AI_API_KEY=     # Gemini Live
TINYFISH_API_KEY=      # Form submission
# Optional (for profile memory):
GOOGLE_CLOUD_PROJECT=
# GCP credentials for firebase-admin (profile-store)
```

---

## Data Shapes

- **FormData**: `{ id, title, questions: Question[] }`
- **Question**: `{ id, title, type, required, options? }`
- **submit_form answers**: `[{ questionTitle: string, answer: string }]`
