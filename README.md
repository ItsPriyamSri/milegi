# Milegi (मिलेगी)

Independent hackathon prototype of Uttar Pradesh's Saksham scholarship service. Synthetic data only.
Not a government website, not affiliated with any department.

```
स्वतंत्र हैकथॉन प्रोटोटाइप · नकली डेटा · सरकारी वेबसाइट नहीं
```

A case can never sit in a stage without a **named owner** and a **deadline**. That invariant is
enforced in code (`src/server/machine.ts`) and is the product.

A draft is written to the phone on every keystroke (`src/lib/useAutosave.ts`). Fees come from the
college's published master data — the student does not type the amount.

**Live demo:** https://milegi.vercel.app

Built for **Build What Moves India** (2026) with Cursor and OpenAI Codex.

## Stack

Next.js 16 App Router · React 19 · TypeScript · hand-written CSS (Gazette Register tokens) · self-hosted
Noto Sans / Noto Sans Devanagari · Neon Postgres in production · JSON file store locally · `node --test`
via `tsx`.

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

## Try it (reviewers)

Printed on `/` as well. All data is synthetic.

| Who | How |
|---|---|
| Student | `/pravesh` · mobile `9876543210` · OTP **prints on screen** (no SMS) · Aadhaar `000012340001` · OTR `UP26-8000100001` |
| Institute | `/sansthan` · pick any institute · PIN `1234` · fees live at `/sansthan/master` |
| DWO | `/dwo` · pick any district · PIN `1234` |

Walk the **student** path. Operator logins are optional.

Other demo Aadhaar (must start `0000`): `000012340002` (payment bounce), `000012340003` (dormant).
Valid income cert `IC-2024-771201`; expired `IC-2021-330077`. Seeded case file: `/f/MLG-26-000101`.
Public track (no login): `/t/MLG-26-000101` — case id, 15-digit registration, or OTR all work.

## Surfaces

| URL | Who |
|---|---|
| `/` | Landing |
| `/pravesh` | One door: mobile OTP or track |
| `/otr` · `/raasta` | Identity, then college + course (fees attach here) |
| `/taiyari/[id]` | Checks before the form |
| `/aavedan/[id]` | One form; local draft; fees from master data |
| `/jaanch/[id]` | Lock + 3-day hard-copy clock |
| `/f/[id]` | Case file: owner, deadline, stage ledger |
| `/t/[code]` | Public status (no form data) |
| `/shikayat/[id]` | Grievance draft if a deadline is missed |
| `/sansthan` · `/sansthan/master` · `/sansthan/kaksh` | Institute |
| `/dwo` · `/dwo/kaksh` · `/dwo/svikriti` | District welfare |
| `/mock` | Clock, upstream health, PFMS outcomes |
| `/seemayein` | What software can and cannot fix |
| `/madad` | OTR vs registration, fees, statuses |
| `/reports` | Pointer to live operator queues |

## Layout

```
src/server/   domain (clock, store, machine, preflight, fees, institute, dwo, sim) — HTTP-free
src/app/api/  thin route handlers
src/app/      student, institute, DWO, mock, help screens
src/ui/       Gazette Register primitives
src/lib/      autosave, sessions, i18n
docs/         product evidence, plans, Stage-1 packet
```

## Docs

- [`PRODUCT.md`](./PRODUCT.md) — product truth
- [`DESIGN.md`](./DESIGN.md) — Gazette Register as shipped
- [`docs/SUBMIT.md`](./docs/SUBMIT.md) — Stage-1 packet (URL, credentials, summary)
- [`docs/README.md`](./docs/README.md) — document map
- [`docs/research/2026-08-20-saksham-evidence.md`](./docs/research/2026-08-20-saksham-evidence.md) — sourced facts
