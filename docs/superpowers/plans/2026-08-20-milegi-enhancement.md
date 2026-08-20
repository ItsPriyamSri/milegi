# Milegi Enhancement Implementation Plan

> **For agentic workers:** implement wave by wave. Checkboxes live here. Live board: `docs/PROGRESS.md`.

**Goal:** A connected student scholarship product that is easier to finish than Saksham — one hub, one door, papers first, one scrolling form, a named case file — without pretending to be the government site.

**Architecture:** Keep the existing Next.js 16 app, `/api/*`, and `src/server` domain. Expand the **public hub** (homepage + linked sections) and collapse intake UI. Placeholders for official-site areas we will not fake this week. Completable journeys stay Dashmottar Fresh (Priya) + Renewal (Amit).

**Tech Stack:** Next.js 16.3, React 19, TypeScript, CSS in `globals.css` only. No Tailwind, no Google Fonts, no fee/bank inputs, no chatbot.

## Global Constraints

- Hindi-first, 360px design size, taps ≥48px, system font stack.
- Independent civic tool (white / cool atmosphere `#d5e0eb` / teal `#0b5f56`). Do not clone NIC navy or the emblem.
- Prototype banner on every screen. Mock data only. Never a real Aadhaar.
- Fee still comes from college master data. Money labelled as an estimate.
- Completable: Dashmottar Fresh + Renewal. Other official menus exist as honest stubs.
- Scope is **not** capped at seven days. Waves below can continue with Cursor / Claude Code / Codex. Wave 1 is the UX the live site is missing now.

---

## What is actually wrong with Saksham (research, 20 Aug 2026)

Public homepage/guides only — no live student login. Sources: `scholarship.up.gov.in` (timeout from this environment), [upscholarshiip.com](https://upscholarshiip.com/), [OTR guide](https://upscholarshiip.com/otr-guide/), [student login](https://upscholarshiip.com/student-login/), [status check](https://upscholarshiip.com/application-status-check/), [Buddy4Study portal](https://www.buddy4study.com/article/up-scholarship-portal), [Financial Express status](https://www.financialexpress.com/jobs-career/education-up-scholarship-2026-how-to-check-application-and-payment-status-online-at-scholarship-upgovin-all-you-need-to-know-4165182/).

Official **homepage IA** (what a student sees before any case):

| Menu | What it is | Milegi |
|---|---|---|
| Student → Fresh / Renewal × 4 tracks | Eight logins + OTR popup + RegistrationNew | One door. Keep. |
| OTR पंजीकरण करें | Lifetime profile via Aadhaar + DigiLocker | Mock KYC on papers, official-shaped number |
| Status | Separate hunt; often hidden until Jan | Case page is always the status |
| Institute login | College clerk portal | Clerk hat on the case (demo) |
| Circulars / Downloads / OtherInformation | PDFs, GO schedule | Stub |
| Grievance | Complaint form | Stub |
| Blacklisted institutes | List | Stub later |
| Sanshodhan | Correction window only | Named on lock; no fake window |

**Process failures (these are the product, not chrome):**

1. **Eight doors + OTR popup.** Wrong pair → “No Record Found” / “Invalid Registration Number” even when the student exists in another database.
2. **OTR ≠ registration number.** OTR is lifetime `UP25-8800385830` (UP + year + hyphen + 10 digits). Login wants a **15-digit session registration** (e.g. `271370302500941`). Mixing them is the first lockout. Guides also say “14-digit OTR” — the printable shape is the `UPyy-` form.
3. **Second OTR on the same Aadhaar** can block **both** applications. Recovery is high-school roll number, not a new Fresh.
4. **30–45 minute form before papers.** Income certificate is valid exactly 3 years; NPCI hang; fee typed by the student (hostel/mess/caution must not go in the box).
5. **Crash = “We Are Sorry” + empty ASPX postback.** Draft dies.
6. **After lock, silence.** Status button often missing until the college forwards (often January). No named clerk, no Friday clock, no nudge that does not lie.
7. **Payment is Aadhaar DBT**, but older guides still tell students to type IFSC. PFMS “No Record Found” if they search by account number.

**UI failures:** hover menus, captcha walls, NIC navy chrome, no back from a case, form split across शैक्षिक / निजी / शुल्क with “Next” between them, hub pages that do not lead into *this student’s file*.

Milegi already fixes 1, 3 (door), 4 (papers + master fee), 5 (autosave), 6 (case page). This plan connects the hub, stops copying the tabbed form, uses official-shaped codes, and leaves non-student portals as honest stubs.

---

## Product map (broader, still honest)

```
Public hub (/)
  ├─ Student cases (Priya / Amit / dup) → /apply/[id]
  ├─ Resume by OTR, 15-digit registration, or MLG- shortcut → /r/[code]
  ├─ योजनाएँ (/schemes)           stub
  ├─ परिपत्र (/circulars)         stub
  ├─ शिकायत (/grievance)         stub
  └─ सीमाएँ (/limitations)        real

Student file
  door → papers → **one scrolling form** → lock → /status/[id]
                                              └─ clerk hat /institute/[id]
```

Do **not** build DWO dashboards, institute portals, live DigiLocker, or extra languages.

Visual: still civic tool. Premium = quiet type, linked nav, obvious back, one question per viewport. Not a ministry clone.

---

## Wave 1 — connected UX (this session)

Files:

- Create: `src/components/SiteNav.tsx`, `src/components/BackLink.tsx`, `src/components/HubStub.tsx`
- Create: `src/app/schemes/page.tsx`, `src/app/circulars/page.tsx`, `src/app/grievance/page.tsx`
- Edit: `layout.tsx`, `page.tsx`, `globals.css`, `i18n.ts`, `FormStep.tsx`, `Wizard.tsx`, `CaseFile.tsx`
- Edit: `store.ts` (OTR shape + resume lookup), `logic.ts` (`completeKyc`), `logic.test.ts`

### Task 1: Official-shaped codes

OTR = `UP26-` + 10 digits. Registration = existing 15-digit `sessionReg`. Resume lookup matches `resumeCode` **or** `otr` **or** `registrationNo`. Keep `MLG-PRIYA` as a demo shortcut. KYC mints `UP26-…`, never `OTR-DEMO-`.

- [x] **Step 1:** Seed Amit `UP26-2713703025`, dup `UP26-3141592654`. `completeKyc` uses `mintOtr(id)`.
- [x] **Step 2:** `getAppByResume` matches all three identifiers. Test KYC shape + lookup by OTR.
- [x] **Step 3:** `npm test`

### Task 2: Hub, nav, back

Persistent nav on every screen. Back link: inner pages → home; clerk → case. Home is a student dashboard (cases + resume), not three unlabeled buttons. Stubs name the official feature and say this prototype does not fake it.

- [x] **Step 1:** Nav + BackLink in the shell.
- [x] **Step 2:** Restyle `/` as the hub. Stub routes.
- [x] **Step 3:** Case page prints OTR + 15-digit registration.

### Task 3: Single-page form

No शैक्षिक / निजी / शुल्क tabs. One scroll. Lock lives on the same page (review action + confirm + lock). Papers-first stays — that is the process win, not a government tab.

- [x] **Step 1:** Flatten `FormStep`. Wizard treats `draft|review` as that page.
- [x] **Step 2:** Primary button locks. Crash still flushes first.

### Task 4: Verify

- [x] **Step 1:** `npm test` (24/24) && `npm run typecheck` && `npm run build`
- [ ] **Step 2:** 360px hub / nav / stubs / back verified locally. Full Priya form walk needs a live store (`POST /api/seed` after deploy). Lock-on-same-page is in `FormStep` + domain tests.

---

## Later waves

- **Wave 2 — dashboard depth:** live envelopes on the hub, correction-window copy, sanshodhan that refuses outside the window.
- **Wave 3 — more journeys:** honest Inter / Prematric / outside stop with official login name, dates, class-10 recovery.
- **Wave 4 — DWO hat:** `/dwo/[id]` for the judge path; student case does not pay itself.
- **Wave 5 — ship:** write-up + video shot list. Recording still needs a human.

### Wave 2

- [x] Live hub status from `/api/apps/:id` (fallback to static meta if the store is down)
- [x] `correctionWindow` + `POST .../correct` + `/sanshodhan/[id]`
- [x] Circulars page lists 2026-27 GO dates

### Wave 3

- [x] School / outside door names the official login, dates, and high-school roll recovery
- [x] ChooseStep lists board / year / roll when the journey is not completable

### Wave 4

- [x] `/dwo/[id]` pay/reject. Case page links the hat. Back from DWO/sanshodhan to the case.

### Wave 5

- [x] `docs/WRITEUP.md` + `docs/VIDEO.md` (Codex split named)
- [ ] Human records the 3-minute video

### Verify

- [x] `npm test` 26/26, typecheck, build (`/dwo`, `/sanshodhan`)

---

## Self-review

- Broader IA, not a Saksham skin. Stubs are linked, not hidden.
- Form is one page; papers remain a gate.
- Codes look like Saksham’s; they are still synthetic.
- No fee box, no IFSC, no Google Fonts, no Tailwind, no chatbot.
