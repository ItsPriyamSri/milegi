# Milegi progress

**Shared board for Cursor and Codex.** Specs stay in the plans. This file is the only place that says what is done.

**Now:** Enhancement / submission leftovers — 3-minute video and judge write-up. Phase D build (labels, README, Neon project) is in. Vercel public URL: see board.  
**Deadline:** submit 27 Aug 2026.

**Map (locked):** student journey only — not a full UP scholarship website clone. **Look (locked):** independent civic tool — not exam-copy, not NIC navy.

**Winning bar:** [milegi-plan.md — Winning bar](milegi-plan.md#winning-bar-re-read-before-every-ui-change)

How to update: tick `[x]`, set **Now** to the next open row, one-line note if something failed. Do not rewrite the plans here.

Plans: [build order](superpowers/plans/2026-08-20-milegi-build-order.md) · [backend](superpowers/plans/2026-08-19-milegi-backend.md) · [frontend](superpowers/plans/2026-08-19-milegi-frontend.md)

---

## Board

| Done | Who | Step | Notes |
|---|---|---|---|
| [x] | you | Phase 0 — skip Neon until deploy | 20 Aug |
| [x] | you | Phase 0 — Codex = ChatGPT login, not API key | signing in |
| [x] | you | Phase 0 — Google registration form submitted | confirmed |
| [x] | Cursor | Phase A — backend Tasks 1–8 | 20 Aug. `npm test` 22/22. typecheck + build green. Neon branch present, unused until `DATABASE_URL`. README (backend Task 9) waits for Phase D. |
| [x] | **Codex** | **Phase A2 — frontend Task 1** | shell, CSS, banner, home. Touches no API. Prompt below. |
| [x] | Cursor | Phase B — `src/lib/api.ts` | 20 Aug. Fetch wrappers only. |
| [x] | Cursor | Phase B — `useAutosave` | localStorage every batch; flush never throws. |
| [x] | Cursor | Phase B — case page, clerk page, `/r/[code]` | 20 Aug. Locked Amit: clerk + 12 days + ₹19,800 estimate + last year ₹18,500; ping keeps wait; `/r/MLG-AMIT` → status; unknown code `यह कोड नहीं मिला`. Seed reset after check so video starts at `choose`. |
| [x] | Codex | Phase C — Task 2 Wizard.tsx + apply page only | `api.ts` already exists; do not edit it |
| [x] | Cursor | Phase C — Task 3 ChooseStep | Codex quota gone. Door: college+first+नहीं → Fresh दशमोत्तर → papers. |
| [x] | Cursor | Phase C — Task 4 PreflightStep | Priya blocked on OTR + expired income + NPCI; open-form disabled until green. |
| [x] | Cursor | Phase C — Task 5 FormStep | no fee `<input>` |
| [x] | Cursor | Phase C — Task 6 CrashOverlay only | overlay repeats prototype line; `useAutosave` untouched |
| [x] | Cursor | Phase C — Task 7a ReviewStep | lock → `/status/[id]` |
| [x] | Cursor | Phase C — Task 8 limitations + error.tsx + 360px | civic-tool restyle (no notebook rules) |
| [x] | Cursor | E2E — Priya + Amit student flow | 20 Aug. Home→door→papers→form→crash recover→lock→case→clerk attest→mock pay. Amit wait stays 12 after ping. 9–10 honest stop. Two OTRs on dup. `/r/NOPE` → `यह कोड नहीं मिला`. `npm test` 22/22, typecheck + build green. |
| [x] | Cursor | Phase D — save labels + README + Neon | 20 Aug. Phone/sync/saved labels. Judge README. Neon project `little-glade-85479553` (pooled `DATABASE_URL` in `.env.local`, not committed). |
| [ ] | Cursor | Phase D — Vercel deploy + cold-click | in progress |
| [ ] | Cursor | Enhancement — video + write-up | not started |

---

## Codex paste (copy the matching block)

Footer on every paste:

```
After you finish, tick your row in docs/PROGRESS.md ([ ] → [x]) and set **Now** to the next open row.
Do not change anything under src/server, src/lib/api.ts, src/lib/useAutosave.ts, src/app/status, src/app/institute, or src/app/r.
Do not add a chatbot, Tailwind, a fee input, a bank/IFSC field, NewTrack.tsx, or a Google Fonts link.
```

**A2 / Task 1 (do this now):**

```
Implement Task 1 only from docs/superpowers/plans/2026-08-19-milegi-frontend.md.
Do not create /status, /institute, or /r pages.
Stop when home renders with the prototype banner and the Network tab shows zero font requests.
After you finish, tick your row in docs/PROGRESS.md ([ ] → [x]) and set **Now** to the next open row.
Do not change anything under src/server, src/lib/api.ts, src/lib/useAutosave.ts, src/app/status, src/app/institute, or src/app/r.
Do not add a chatbot, Tailwind, a fee input, a bank/IFSC field, NewTrack.tsx, or a Google Fonts link.
```

**C / Task 2 (Wizard only):**

```
Implement Task 2 from docs/superpowers/plans/2026-08-19-milegi-frontend.md, but only Wizard.tsx and src/app/apply/[id]/page.tsx.
src/lib/api.ts already exists. Do not change it.
After you finish, tick your row in docs/PROGRESS.md ([ ] → [x]) and set **Now** to the next open row.
Do not change anything under src/server, src/lib/api.ts, src/lib/useAutosave.ts, src/app/status, src/app/institute, or src/app/r.
Do not add a chatbot, Tailwind, a fee input, a bank/IFSC field, NewTrack.tsx, or a Google Fonts link.
```

**C / Task 3:**

```
Implement Task 3 only from docs/superpowers/plans/2026-08-19-milegi-frontend.md (ChooseStep).
Call resolveDoor from src/lib/api.ts. Do not invent new API routes.
After you finish, tick your row in docs/PROGRESS.md ([ ] → [x]) and set **Now** to the next open row.
Do not change anything under src/server, src/lib/api.ts, src/lib/useAutosave.ts, src/app/status, src/app/institute, or src/app/r.
Do not add a chatbot, Tailwind, a fee input, a bank/IFSC field, NewTrack.tsx, or a Google Fonts link.
```

**C / Task 4:**

```
Implement Task 4 only from docs/superpowers/plans/2026-08-19-milegi-frontend.md (PreflightStep).
After you finish, tick your row in docs/PROGRESS.md ([ ] → [x]) and set **Now** to the next open row.
Do not change anything under src/server, src/lib/api.ts, src/lib/useAutosave.ts, src/app/status, src/app/institute, or src/app/r.
Do not add a chatbot, Tailwind, a fee input, a bank/IFSC field, NewTrack.tsx, or a Google Fonts link.
```

**C / Task 5:**

```
Implement Task 5 only from docs/superpowers/plans/2026-08-19-milegi-frontend.md (FormStep).
There must be no tuition/fee number input. Course and fee are read-only from college master data.
After you finish, tick your row in docs/PROGRESS.md ([ ] → [x]) and set **Now** to the next open row.
Do not change anything under src/server, src/lib/api.ts, src/lib/useAutosave.ts, src/app/status, src/app/institute, or src/app/r.
Do not add a chatbot, Tailwind, a bank/IFSC field, NewTrack.tsx, or a Google Fonts link.
```

**C / Task 6 (overlay only):**

```
Implement only the CrashOverlay part of Task 6 from docs/superpowers/plans/2026-08-19-milegi-frontend.md.
Do not edit src/lib/useAutosave.ts. Wire the overlay to the existing hook.
The overlay must repeat the prototype banner inside the sheet.
After you finish, tick your row in docs/PROGRESS.md ([ ] → [x]) and set **Now** to the next open row.
Do not change anything under src/server, src/lib/api.ts, src/app/status, src/app/institute, or src/app/r.
Do not add a chatbot, Tailwind, a fee input, a bank/IFSC field, NewTrack.tsx, or a Google Fonts link.
```

**C / Task 7a:**

```
Implement Task 7a only from docs/superpowers/plans/2026-08-19-milegi-frontend.md (ReviewStep).
After lock, go to /status/[id]. Do not create or edit the status/institute/resume pages.
After you finish, tick your row in docs/PROGRESS.md ([ ] → [x]) and set **Now** to the next open row.
Do not change anything under src/server, src/lib/api.ts, src/lib/useAutosave.ts, src/app/status, src/app/institute, or src/app/r.
Do not add a chatbot, Tailwind, a fee input, a bank/IFSC field, NewTrack.tsx, or a Google Fonts link.
```

**C / Task 8:**

```
Implement Task 8 only from docs/superpowers/plans/2026-08-19-milegi-frontend.md (limitations + error.tsx + 360px polish).
After you finish, tick your row in docs/PROGRESS.md ([ ] → [x]) and set **Now** to the next open row.
Do not change anything under src/server, src/lib/api.ts, src/lib/useAutosave.ts, src/app/status, src/app/institute, or src/app/r.
Do not add a chatbot, Tailwind, a fee input, a bank/IFSC field, NewTrack.tsx, or a Google Fonts link.
```
