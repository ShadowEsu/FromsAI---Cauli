# FORMSAI --- Cauli

NEXT GEN PRODUCT LAB Hackathon project (7-day build).

Turn a Google Form into a voice conversation and submit it.

## Demo video

[![Cauliform Demo](https://img.youtube.com/vi/N7ZOtOqVaf8/maxresdefault.jpg)](https://youtu.be/N7ZOtOqVaf8)

## Current build

- Parse a Google Form URL
- Ask questions with Gemini Live
- Confirm before submit
- Submit answers to the form

## Not polished yet

- UI still rough
- Error states are basic
- Some pages are placeholders

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

## Notes

- Built for the Gemini Live Agent Challenge.
- More cleanup and features after hackathon demo.
