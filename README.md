# Milegi

Independent hackathon prototype of a UP Saksham scholarship **case file**. Mock data. Not a government site.

The form is intake. The product is `/status/[id]`. Home is a student hub with linked stubs for official menus this prototype does not fake.

**Live demo:** https://milegi.vercel.app

## Run

    npm install
    npm test
    npm run dev

Local drafts use a JSON file under the OS temp dir. Set a pooled `DATABASE_URL` (hostname contains `-pooler`) in `.env.local` only if you want the same Neon store as production. Do not set `MILEGI_STORE_PATH` on Vercel.

## Demo

1. प्रिया (Fresh दशमोत्तर): expired income cert → NPCI retry → one scrolling form (no fee box, no Next tabs) → crash → recover → lock → case page → `/institute/app-priya` attest → pay
2. अमित (Renewal): the door recovers the OTR `UP26-2713703025` → marks on the same page → lock → named clerk, 12 days → nudge
3. गलत Fresh: the door names both OTRs (`UP26-2713703025`, `UP26-3141592654`) and points at the renewal (`MLG-DUP`)
4. Reopen: `/r/MLG-PRIYA`, `/r/UP26-2713703025`, or the 15-digit registration number (needs `DATABASE_URL`)

Reset the personas (required on production after OTR-shape change): `POST /api/seed`

## Store

- `npm test` and local dev (no `DATABASE_URL`): JSON file under the OS temp dir
- Production: Neon (`DATABASE_URL`, pooled) so resume codes survive Vercel. With no `DATABASE_URL` on Vercel the API fails loudly rather than pretending to remember.

## What is mocked

OTP, DigiLocker/OTR, e-District income and caste verification, NPCI/Aadhaar-DBT, the affiliating university step, PFMS. See `/limitations`.

See `docs/WRITEUP.md` (judges) and `docs/VIDEO.md` (shot list). Codex split is named there.
