# Milegi

Independent hackathon prototype of a UP Saksham scholarship **case file**. Mock data. Not a government site.

The form is intake. The product is `/status/[id]`.

## Run

    npm install
    npm test
    npm run dev

Local drafts use a JSON file under the OS temp dir. Set a pooled `DATABASE_URL` (hostname contains `-pooler`) in `.env.local` only if you want the same Neon store as production. Do not set `MILEGI_STORE_PATH` on Vercel.

## Demo

1. प्रिया (Fresh दशमोत्तर): expired income cert → NPCI retry → short form with no fee box → crash → recover → lock → case page → `/institute/app-priya` attest → pay
2. अमित (Renewal): the door recovers the OTR → marks only → lock → named clerk, 12 days → nudge
3. गलत Fresh: the door names both OTRs and points at the renewal (`MLG-DUP`)
4. Reopen in another browser: `/r/MLG-PRIYA` (needs `DATABASE_URL`)

Reset the personas: `POST /api/seed`

## Store

- `npm test` and local dev (no `DATABASE_URL`): JSON file under the OS temp dir
- Production: Neon (`DATABASE_URL`, pooled) so resume codes survive Vercel. With no `DATABASE_URL` on Vercel the API fails loudly rather than pretending to remember.

## What is mocked

OTP, DigiLocker/OTR, e-District income and caste verification, NPCI/Aadhaar-DBT, the affiliating university step, PFMS. See `/limitations`.

## Codex

ChatGPT Go wrote the shell (layout, CSS, banner, home) and the wizard host (`Wizard.tsx`, apply page). Quota ended there. Cursor wrote `src/server`, the APIs, the case page, the clerk page, autosave, and the remaining intake (door, papers, form, crash overlay, review, limitations). Do not treat later UI as Codex work. Split: `docs/superpowers/plans/2026-08-20-milegi-build-order.md`.
