# Milegi Build Order

> Start here. The 19 Aug backend/frontend plans are the file-level specs. This file is **who does what, in what order**.
>
> **Live checkboxes (Cursor + Codex):** `docs/PROGRESS.md` — tick there, not here.

**Goal:** A working public demo where Priya and Amit own a case page, not a 30-minute form.

**Architecture:** One Next.js 16 app. Route handlers are the JS backend. Domain in `src/server`. Neon Postgres in production; JSON file for tests and local dev. No Express. No second repo.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, `@neondatabase/serverless` (prod only), `node --test` via `tsx`.

**Deadline:** submit by **27 Aug 2026**. Finale **12 Sep** (official brief; the registration form and a LinkedIn recap said early September — trust the site). Submission needs a live demo link, a video of about three minutes, and a write-up covering problem, who it affects, what changed, how Codex contributed, what is mocked, and known limits. Every link must open without requesting access.

---

## Opus review (20 Aug 2026)

Read this once before Phase 0. It lists what was wrong with the 19 Aug plans and where the fix now lives.

**Structural**

1. **Backend Tasks 1–6 built a design that Tasks 8–11 deleted** (typed fee, `createApp`, `POST /api/apps`, `feeIncludesHostel`, a pre-matric income cap). An executor following the last code block would have built the discarded version. The backend plan is now **linear, nine tasks, no overrides section**: the types in Task 1 are final, the seeds in Task 2 already carry `resumeCode` and the institute master, `PATCHABLE` never contained a money field, and `createApp` does not exist anywhere.
2. **Neon could not have been bolted on at Task 11.** `read()`/`write()` were synchronous and `@neondatabase/serverless` is async, so "branch at the top of `read()`" would have forced every domain function and every test to become async on day 6. Backend Task 2 now introduces a `hydrate()` / `persist()` seam: route handlers await two functions, all domain code stays synchronous, and Task 8 fills in the Neon branch without touching `logic.ts`.
3. **`allowImportingTsExtensions` + `.ts` import specifiers was a bet on Turbopack**, and `"type": "module"` has a live Vercel `ERR_REQUIRE_ESM` history on Next 16. Both are gone: imports are extensionless, there is no `type` field, and `npm test` runs `node --import tsx --test`. One devDependency removes three unknowns.
4. **Phase B (the Cursor case page) ran before Codex built the layout and CSS**, so the product page would have shipped unstyled or been styled twice. Codex frontend Task 1 (shell, CSS, banner, home — it touches no API) now runs as **Phase A2**, before the case page. The rest of the Codex work still waits for the API.
5. **Phase B's done-check needed Amit at the institute with a 12-day wait**, but the seed starts him at `choose` and the wizard did not exist yet. Phase B now carries the exact curl sequence that drives him there.
6. **Backend Task 1 had no `src/app`, so `next dev` could not boot**, and no task proved `next build` worked until deploy day. Task 1 Step 6 now creates the layout/page stubs and runs `typecheck` + `build`.

**Correctness and honesty**

7. **`expectedAmount` was labelled as what the student will receive.** The Dashmottar benefit is fee reimbursement plus a maintenance allowance decided by the department; tuition is the input, not the answer. Every surface now reads `कॉलेज मास्टर के अनुसार गैर-वापसी योग्य शुल्क (अनुमान)` with an explicit "the department decides the sanctioned amount."
8. **`pingClerk` reset `waitingDays` to 0.** A nudge that visibly clears a 12-day wait is a lie on screen. It now records `nudgeSentAt` and leaves the wait standing.
9. **The pre-matric income cap (₹1,00,000) was unsupported.** Public 2026-27 sources disagree (₹1L in some, ₹2.5L in others) and class 9–10 is not completable here. `incomeCap` now takes only the category: SC/ST ₹2,50,000, everyone else ₹2,00,000.
10. **`gotLastYear: "पता नहीं"` was coerced to `false`,** which opened a Fresh case for a student who is actually a renewal — the exact duplicate-OTR trap the product exists to prevent. It is now a tri-state, and `dunno` resolves to the renewal with copy naming the real recovery route (high-school roll number).
11. **The duplicate persona had `otr: null` alongside two `duplicateOtrs`.** It now holds `OTR-DEMO-DUP` plus both in `duplicateOtrs`, which is what "I minted a second OTR" actually looks like.
12. **`resolveDoor` decides from three answers with no identity input.** That is a demo cheat and it now says so in a `ponytail:` comment, in a test, and on `/limitations` — so nobody "fixes" it into a database search that 404s on three synthetic students.
13. **The crash overlay covered the prototype banner** with a full-screen government-style "We Are Sorry." It now carries its own prototype line inside the sheet.
14. **`useAutosave` only wrote the phone copy when `navigator.onLine` was false.** A 502 mid-PATCH does not look like being offline, and that is the demo. It now writes `localStorage` on every keystroke batch, never throws, and updates `dirtyRef` inside `update` so an immediate flush sees the last keystroke.
15. **A blocking Google Fonts request** on a two-bar phone at 11pm was the least defensible thing on the page. Removed; the CSS uses the system stack, which already includes a Devanagari face on Android and iOS.
16. **The affiliating university was silently missing** from the Dashmottar chain. It is now a named actor that auto-forwards, plus a limitations line. No university dashboard.
17. **"Write-only until March" was wrong.** Post-lock changes happen in the department's correction window (roughly Sep–Oct for renewals, Nov–Dec for fresh). Copy fixed in the spec and the lock confirmation.
18. **A fee dispute was only possible before lock,** which is backwards: the receipt mismatch usually surfaces when the clerk compares papers. It is now allowed at `draft`, `review`, and `institute`.

**Smaller**

19. `class10Roll?` existed on the design doc's resolve contract and nowhere in the resolver. Dropped from the contract; the high-school-roll recovery route is named in door copy and limitations instead.
20. `schema.sql` was to be read from disk at runtime — a `.sql` file is not reliably traced into a Vercel function bundle. The two `CREATE TABLE IF NOT EXISTS` statements are now literals in `store.ts`, and both tables are `(id, payload JSONB)`; every request loads all rows, which is two round trips for five rows.
21. `useNeon()` had no stated precedence and no failure mode. Now: production always Neon; on Vercel without `DATABASE_URL` the API returns 503 with a readable message rather than silently serving a per-instance memory store; `MILEGI_ALLOW_EPHEMERAL=1` is the deliberate opt-out for a first smoke deploy.
22. The JSON store defaulted to `.data/store.json` inside the repo, which retriggers the `next dev` compiler on every autosave. It now defaults to a path under `os.tmpdir()`.
23. `stream`, `hostState`, `feeIncludesHostel` and their blockers were dead weight for a Dashmottar-only prototype. Deleted.
24. `POST /api/apps/[id]/fee-dispute` had its own route file; it is now one branch of the `[action]` handler.
25. `ApiError.body` was typed as a full `Envelope` when error bodies never contain an app. Separate `ErrorBody` type.
26. README moved to the last backend task, and no phase's done-check depends on it.

**Deliberately left alone:** the public `POST /api/seed` and guessable `MLG-PRIYA` codes (the threat model already accepts this for a synthetic demo), the `We Are Sorry` homage, and the cheap English toggle.

---

## Who builds what (ChatGPT Go quota)

Codex is **mandatory** for this hackathon and has to be a meaningful part of how the build happened, not a garnish. It writes the entire intake surface — shell, CSS, door, pre-flight, short form, review, crash overlay, limitations — which is most of the code the judge will look at. The write-up names the split and points at the commit trail.

Cursor (this session) owns the parts that **kill the demo if they are wrong**:

- Types, state machine, pre-flight, PATCH whitelist, fee master, door resolver, resume codes
- All `/api/*` routes
- Neon store + JSON test store
- **Case page** (`/status/[id]`, `/r/[code]`) and **clerk page** (`/institute/[id]`)
- Local-first `useAutosave` (the 502 problem)

Codex (ChatGPT Go) owns **volume UI** from the frontend plan, against a live API:

- `globals.css`, layout, banner, home, `i18n.ts`
- Door (`ChooseStep`), pre-flight, short form, review, crash overlay, limitations, `error.tsx`

Do **not** spend Codex on the state machine, SQL, or the case page. Those are the product. A pretty wizard with a silent status screen is a 4.

Paste into Codex from `docs/PROGRESS.md` (one frontend task at a time). After each task, tick that file. Generic fallback:

> Implement Task N from `docs/superpowers/plans/2026-08-19-milegi-frontend.md`. Tick the row in `docs/PROGRESS.md`. Do not change anything under `src/server`, `src/lib/api.ts`, `src/lib/useAutosave.ts`, `src/app/status`, `src/app/institute`, or `src/app/r`. Do not add a chatbot, Tailwind, a fee input, a bank/IFSC field, or `NewTrack.tsx`. Do not add a Google Fonts link.

Sign into Codex with the ChatGPT account, not an API key. When Go quota runs out, Cursor finishes the remaining frontend tasks and the write-up discloses exactly that.

## Global Constraints

From `docs/milegi-plan.md`: Dashmottar Fresh + Renewal only as completable journeys; fee from master data; the case page is the product; no student-typed tuition; no bank or IFSC field; no runtime LLM; synthetic data; the banner on every screen; money on screen labelled as an estimate.

---

### Phase 0 — you, 10 minutes

- [x] **Step 1: Decide Neon now or at deploy** (skip until deploy, 20 Aug)

Either create a free Neon project and save the **pooled** connection string (hostname contains `-pooler`) as `DATABASE_URL`, or say "skip Neon until deploy" and we run the JSON store locally until Vercel. Do not commit the string. Backend Task 8 works either way; only the cross-browser resume demo needs it.

- [x] **Step 2: Confirm Codex login** (user signing in with ChatGPT, 20 Aug)

ChatGPT Go, Codex in the IDE or CLI, signed in with ChatGPT — **not** an API key. Quota is for frontend tasks only.

- [x] **Step 3: Confirm the hackathon registration form was actually submitted** (20 Aug)

`https://forms.gle/szFiESzejRUmfbow5`. Registering is an expression of interest, not a place, but the submission still has to be attached to a registration.

---

### Phase A — Cursor, backend (do this first)

Backend plan **Tasks 1–8, in order**. Task 9 (README) waits.

Done when:

```bash
npm test
npm run typecheck
npm run build
npx next dev
curl -s localhost:3000/api/seed -X POST >/dev/null
curl -s localhost:3000/api/apps/app-priya | grep -o 'MLG-PRIYA'
curl -s localhost:3000/api/apps/app-priya | grep -o 'income_expired'
curl -s localhost:3000/api/resolve -H 'content-type: application/json' \
  -d '{"studying":"college","firstYear":false,"gotLastYear":"yes"}'
```

Priya's JSON carries the expired-income and NPCI blockers and `MLG-PRIYA`. The college+renewal resolve returns `app-amit`, not a not-found. `npm run build` passes — do not carry a broken build into Phase B.

---

### Phase A2 — Codex, shell only (one Go session)

Frontend plan **Task 1 only**: `globals.css`, `layout.tsx`, `Banner`, `LangToggle`, `i18n.ts`, home. It calls no API, so it cannot invent routes, and it means the case page in Phase B is born styled instead of being restyled later.

Done when: home renders at 360px, the banner is on every route, and the Network tab shows zero font requests.

---

### Phase B — Cursor, case page + client API (the product)

Do this **before** the rest of Codex. Otherwise Codex invents `fetch` shapes.

1. Frontend Task 2, `src/lib/api.ts` only (not the Wizard yet).
2. Frontend Task 6, `useAutosave` (labels can be ugly; Phase D polishes).
3. Frontend Task 7b: case page, clerk page, `/r/[code]`.

The case page's done-check needs Amit sitting at the institute with a 12-day wait, and the wizard does not exist yet. Drive him there with the API:

```bash
curl -s localhost:3000/api/seed -X POST >/dev/null
curl -s localhost:3000/api/apps/app-amit/draft -X PATCH \
  -H 'content-type: application/json' \
  -d '{"resultStatus":"passed","marksObtained":410,"marksTotal":600,"semesterCombined":true}' >/dev/null
curl -s localhost:3000/api/apps/app-amit/open   -X POST >/dev/null
curl -s localhost:3000/api/apps/app-amit/review -X POST >/dev/null
curl -s localhost:3000/api/apps/app-amit/lock   -X POST | grep -o '"waitingDays":12'
```

Done when: `/status/app-amit` says who holds the file, for how many days, what Amit must do next, ₹19,800 labelled as an estimate, last year's ₹18,500, and a nudge button that records a reminder without resetting the wait. `/r/MLG-AMIT` opens the same case. `POST /api/seed` puts him back to `choose` for the video.

---

### Phase C — Codex, intake UI

One task per Go session. Cursor reviews the diff before the next paste.

Order: **2 (`Wizard.tsx` only) → 3 → 4 → 5 → CrashOverlay (6) → 7a → 8.** Skip `api.ts`, `useAutosave`, and Task 7b — Cursor already wrote them. Task 1 is already done in Phase A2.

Done when: Priya's door → pre-flight (expired income, NPCI) → short form with **no fee box** → crash → reload still filled → review → lock → lands on the case page.

---

### Phase D — Cursor, glue + ship

- Local-first labels (`इस फोन पर सेव है` / `अभी सिंक नहीं हुआ` / `सेव हो गया`)
- Backend Task 9: README
- `DATABASE_URL` (pooled) on Vercel; confirm `MILEGI_STORE_PATH` is **not** set there
- Deploy, then cold-click Priya, Amit, the duplicate, and `/r/MLG-PRIYA` in a second browser
- Public URL + the three-minute video from `docs/milegi-plan.md`, and the write-up: problem, who, what changed, Codex contribution, functional vs mocked, limits

Video order that matches the judging rubric: the eight-door problem, the door resolving it, pre-flight catching the expired certificate **before** the long form, the short form with no fee box, the crash and recovery, lock, then the case page with a named clerk, a Friday clock and a nudge. End on `/limitations`.

---

## Do not start in parallel

Backend first, then the Codex shell, then the case page. Codex pointed at a missing API will invent routes. If Go quota dies mid-Phase C, Cursor finishes the remaining frontend tasks and the write-up says so.
