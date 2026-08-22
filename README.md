# Milegi (मिलेगी)

Independent hackathon prototype of Uttar Pradesh's Saksham scholarship service. Synthetic data only.
Not a government website, not affiliated with any department.

```
स्वतंत्र हैकथॉन प्रोटोटाइप · नकली डेटा · सरकारी वेबसाइट नहीं
```

A case can never sit in a stage without a **named owner** and a **deadline**. That invariant is
enforced in code (`src/server/machine.ts`) and is the product.

## Stack

Next.js 16 App Router · React 19 · TypeScript · hand-written CSS (Civic Ink tokens) · Neon Postgres
in production · JSON file store locally · `node --test` via `tsx`.

## Setup

```bash
npm install
cp .env.example .env.local   # optional locally; leave DATABASE_URL empty for the JSON store
npm run dev                  # http://localhost:3000
```

### Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled connection (`-pooler` host). Empty locally → JSON store in `.data/` (or `MILEGI_STORE_PATH`). |
| `MILEGI_SESSION_SECRET` | HMAC key for session cookies. Change in production. |
| `MILEGI_STORE_PATH` | Optional override for the local JSON file. |
| `MILEGI_ALLOW_EPHEMERAL` | Set `1` only for deliberate Vercel smoke deploys without a database. Otherwise a missing `DATABASE_URL` on Vercel returns `STORE_UNCONFIGURED`. |

## Commands

```bash
npm test                 # domain tests (node:test)
npm run typecheck
npm run build
bash scripts/smoke.sh    # full pipeline via curl (needs `npm run dev`)
```

## Surfaces

| URL | Who | Demo credentials |
|---|---|---|
| `/` | Landing | — |
| `/pravesh` | Student OTP / track by case id | OTP is printed on screen (no SMS) |
| `/sansthan` | Institute console | institute code from the select · PIN `1234` |
| `/dwo` | District welfare console | district code from the select · PIN `1234` |
| `/mock` | System simulator | clock, upstream health, PFMS outcomes |
| `/seemayein` | What software can and cannot fix | — |
| `/madad` | Help: OTR vs registration, fees, statuses | — |
| `/t/<caseId>` | Public shareable status (no form data) | — |

Useful demo Aadhaar numbers (must start with `0000`): `000012340001` (DBT seeded), `000012340002`
(KYC only — payment bounces), `000012340003` (dormant). Valid income cert `IC-2024-771201`; expired
`IC-2021-330077`.

## Layout

```
src/server/   domain (clock, store, machine, preflight, fees, institute, dwo, sim) — HTTP-free
src/app/api/  thin route handlers
src/app/      student, institute, DWO, mock, help screens
src/ui/       Civic Ink primitives
docs/         product evidence + implementation plans
```

## Docs

- [`PRODUCT.md`](./PRODUCT.md) — product truth
- [`docs/research/2026-08-20-saksham-evidence.md`](./docs/research/2026-08-20-saksham-evidence.md) — sourced facts
- [`docs/superpowers/plans/`](./docs/superpowers/plans/) — backend and frontend build plans

Built for **Build What Moves India** (2026).

**Live demo:** https://milegi.vercel.app
