# Cauli — Forms AI

Meet **Cauli**, your friendly voice bot that turns any Google Form into a conversation. Paste a form link, talk through the questions, and Cauli submits it for you. No typing required.

**Demo:** [https://cauliform-ai-293051374734.us-west1.run.app](https://cauliform-ai-293051374734.us-west1.run.app)

Built for NEXT GEN PRODUCT LAB hackathon (7-day build).

## Demo video

[![Cauli Demo](https://img.youtube.com/vi/N7ZOtOqVaf8/maxresdefault.jpg)](https://youtu.be/N7ZOtOqVaf8)

## What Cauli does

- Parses any Google Form URL
- Asks questions by voice (powered by Gemini Live)
- Confirms your answers before submitting
- Submits the form for you

## Status

- Core flow works (parse → converse → submit)
- UI is minimal; more polish planned

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`

## Needed env vars

```env
GOOGLE_AI_API_KEY=
GOOGLE_CLOUD_PROJECT=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## About

Cauli is a forms AI — voice-first, friendly, and hands-free. Built for the Gemini Live Agent Challenge.
