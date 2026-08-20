# Milegi

## Objective

A student in UP can finish a Dashmottar scholarship case without losing the draft, walking into the wrong login, typing a fee the college already knows, or sitting in silence after lock. The form is intake. The product is the case page.

Judging bar (UI + process, not a mock dump): `docs/milegi-plan.md` **Winning bar**. Re-read it before changing the surface.

## Data model

Postgres (Neon) when `DATABASE_URL` is set; a JSON file under the OS temp dir for `npm test` and local dev.

```sql
apps       (id TEXT PRIMARY KEY, payload JSONB NOT NULL)
institutes (id TEXT PRIMARY KEY, payload JSONB NOT NULL)
```

`payload` is the `Application` / `Institute` object. No ORM, no migrations, no `.sql` file — the two `CREATE TABLE IF NOT EXISTS` statements are literals in `store.ts`, because a `.sql` file read at runtime is not reliably traced into a Vercel function bundle.

No indexes and no lookup columns: **every request loads all rows** and looks up by id, resume code or Aadhaar token in memory. That is two round trips for five rows, and it is what lets the whole domain layer stay synchronous.

ponytail: whole-table load per request, last-write-wins on concurrent writes. Ceiling is a few hundred rows and tens of users, which is exactly this demo. Upgrade path: select by id and add a version column.

## Store seam

Neon is async and the domain code is not. Rather than making `preflight`, `patchDraft`, `lock` and every test async, the store exposes two awaited functions and everything between them is synchronous:

```ts
await hydrate();        // JSON: read file + seed. Neon: SELECT all rows into memory.
const app = lock(id);   // synchronous domain code
await persist();        // JSON: no-op. Neon: upsert dirty rows.
```

Precedence: Neon whenever `DATABASE_URL` is set and `MILEGI_STORE_PATH` is not. Production is **always** Neon. On Vercel without `DATABASE_URL`, `hydrate()` throws a 503 with a readable message rather than serving a per-instance memory store that silently forgets resume codes; `MILEGI_ALLOW_EPHEMERAL=1` is the deliberate opt-out for a first smoke deploy.

`store.ts` must not import `logic.ts`. Lookups (`getApp`, `getAppByResume`, `getInstitute`, `findByAadhaarToken`) live in the store; rules live in `logic.ts`.

## API contract

- `GET /api/apps/:id` → envelope
- `PATCH /api/apps/:id/draft` → envelope. Whitelisted fields only; no money field is patchable.
- `POST /api/apps/:id/:action` for `kyc`, `open`, `review`, `lock`, `npci`, `attest`, `pay`, `reject`, `crash`, `ping`, and `fee-dispute` (the only one with a body, `{ note }`)
- `POST /api/resolve` `{ studying, firstYear, gotLastYear }` where `gotLastYear` is `"yes" | "no" | "dunno"` → never a terminal “not found”; returns `completable`, `track`, `cycle`, `appId`, `resumeCode`, `otrs[]`, `alt`, `messageHi`, `messageEn`
- `GET /api/resume/:code` → same envelope as GET app
- `POST /api/seed` → reset the three personas and two institutes

Envelope: `{ ok, prototype: true, app, blockers, missing, preflightOk, institute }`. `blockers` is pre-flight; `missing` is `reviewGaps` (pre-flight plus form gaps). Errors: `{ ok: false, prototype: true, error, blockers? }` — no `app`.

`alt` is the recovery slot: `{ appId, resumeCode, labelHi, labelEn }` or null. It carries the other case the student might actually be — the real renewal after a duplicate Fresh, the fresh case when they answered “पता नहीं”, the college case when they picked a track this prototype does not complete. Without it the UI has to hardcode persona ids.

No auth. Public prototype. `prototype: true` on every JSON body.

## Non-functional

Hackathon demo, tens of concurrent users. The draft must survive a Vercel cold start (hence Postgres, not in-memory). The phone draft is local-first: `localStorage` is written on every keystroke batch and cleared only after a successful PATCH, because a 502 mid-save does not look like being offline.

## Threat model

Anyone with a resume code can read and write that synthetic case. Codes are guessable by design for the demo (`MLG-PRIYA`). No real Aadhaar in any payload — tokens are `AADHAAR-DEMO-*`. `track` and `cycle` are not patchable, so a case cannot be flipped into a journey this prototype does not complete. No SSRF, no file upload, no LLM, no bank details anywhere in the schema.

## Boundaries

- Always: Dashmottar Fresh + one Renewal as the completable journeys. Fee from master data. The case page is the product. Money on screen labelled as an estimate.
- Ask first: creating a real Neon project (needs your account).
- Never: chatbot, OCR, live gov calls, eight wizard copies, extra languages, student-typed tuition, bank account or IFSC fields.

## Open questions

None that block coding. The Neon project can be created at deploy time; tests and local dev use the JSON store either way.
