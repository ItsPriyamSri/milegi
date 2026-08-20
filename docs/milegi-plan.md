# Milegi — product spec (Saksham flow + prototype)

Independent hackathon prototype of UP Scholarship (`scholarship.up.gov.in`, Saksham). Not official. Synthetic data only.

The student's job is not “submit the form.” It is: **will the money arrive, when, how much, and what do I do so it does not die in silence.** The wizard is intake. **The case page is the product.**

Implementation:

- Progress (Cursor + Codex): `docs/PROGRESS.md`
- Enhancement (hub, one-page form, official OTR shape): `docs/superpowers/plans/2026-08-20-milegi-enhancement.md`
- Who builds what: `docs/superpowers/plans/2026-08-20-milegi-build-order.md`
- Backend: `docs/superpowers/plans/2026-08-19-milegi-backend.md`
- Frontend: `docs/superpowers/plans/2026-08-19-milegi-frontend.md`
- Design: `docs/design/milegi.md`

Research method (19–20 Aug 2026): the public homepage, student walkthrough guides, and GO 91/2026/1941 (20 Jul 2026) as quoted by those guides. We did **not** log into a live student account and did not touch any authenticated page. Sources at the bottom of this file.

---

## Winning bar (re-read before every UI change)

This is how we lose a judging round: a screen that dumps mock fields, a government-portal clone, or a generic hackathon dashboard. SIH taught the same lesson — evaluators do not score “we have data.” They score whether a real person could finish a job, and whether the product looks finished.

The brief’s hammer: **a cleaner screen over the same broken process is not a fix.** Winning is both, not either:

1. **The process actually changes**, and every change is demoable. One door instead of eight logins. Papers checked *before* the long form. The student never types the fee. A crash does not wipe the draft. After lock, a named clerk, a Friday clock, and an amount labelled as an estimate. If a feature cannot be used in the video, it does not exist.
2. **The surface feels like a tool a student would trust at 11pm on a cheap Android with two bars.** Hindi first. 360px is the design size. Taps ≥48px. **Independent civic tool** (white surface, cool atmosphere, teal actions, honest prototype banner). Not a government portal clone (no NIC navy, no emblem). Not a notebook/exam-copy costume. Not cream/terracotta civic-AI. Not Tailwind cards of JSON.

A viewport is not done until it answers **one student question above the fold in Hindi** (which login am I, which paper is blocking me, will the draft survive, where is the file, what do I do by when, how much — as an estimate). If we stripped the persona names and the screen still felt like a form dump, it is not done.

Stay inside the civic-tool world. Do not add a second aesthetic to “look impressive.” Impressive here is: short, named, honest, finishable. Do not add a chatbot, extra languages, badges, web fonts, a fee box, or bank/IFSC fields.

The public hub may look like a student dashboard (cases, resume by OTR/registration, links to schemes/circulars/grievance) **without cloning NIC chrome**. Those extra menus are honest stubs unless a later wave completes them. Scope is not capped at seven days of Dashmottar-only work.

**Codex:** ChatGPT Go wrote the shell and the wizard host (frontend Tasks 1–2), then quota ended. Cursor finishes the remaining intake UI. The submission write-up must say that split. Do not fake Codex usage.

Agents: re-read this section before changing `src/app`, `src/components`, or `globals.css`. `docs/PROGRESS.md` points here. The live check is a 360px walk of Priya and Amit, not `npm test` alone.

---

## How the real portal works

### Eight doors (why students get “No Record Found”)

| Cycle | Prematric 9–10 | Postmatric Inter 11–12 | Postmatric Other than Inter (Dashmottar) | Outside State |
|---|---|---|---|---|
| Fresh | `LoginStudentPreFresh.aspx` | `LoginStudentPostInter.aspx` | `LoginStudentPost.aspx` | `LoginStudentPostOS.aspx` |
| Renewal | `LoginStudentPreRenew.aspx` | `LoginStudentPostRenewInter.aspx` | `LoginStudentPostRenew.aspx` | `LoginStudentPostRenewOS.aspx` |

Plus a separate OTR popup (`Popup.aspx`) and a fresh-registration page (`RegistrationNew.aspx`) before any of those eight will let you in. So “eight logins” undercounts it.

Wrong pair → empty database. Login wants the **session registration number + mobile (or date of birth) + password + captcha** — not Aadhaar, not the OTR. Public guides disagree on mobile vs date of birth; both appear.

**OTR** is a lifetime One Time Registration, DigiLocker-mapped and mandatory for every fresh applicant, shaped like `UP25-8800385830`. The **registration number** is a session-specific 15-digit numeric code. They are different things, and mixing them up is the first place students get stuck.

### Fresh path (first year of this course)

OTR → session registration → the matching Fresh URL → शैक्षिक / निजी / शुल्क → **separate** आय एवं जात प्रमाणीकरण → draft print → **Lock** → hard copy to the institute **within 3 days** → clerk → affiliating university (for Dashmottar) → NIC → DWO → PFMS Aadhaar DBT.

Non-refundable tuition only: **not** hostel, mess, caution money, library deposit, or exam fees. Put any of those in the box and the DWO flags the file as suspect data. Income certificate is valid **exactly 3 years** from the date of issue, with no grace period, and it is verified live against e-District / e-Sathi.

### Renewal path

Do not mint a second OTR — the Aadhaar check will flag a duplicate and can block **both** applications. Log in with last year's registration number and update: result (Passed/Promoted), combined semester marks, this year's fee. Failed year = ineligible. Course or college change, or last year rejected = Fresh. A renewal still needs an unexpired income certificate. Still lock, still hard copy in 3 days.

### After lock

Student → institute clerk (files rot here, and there is no SMS) → affiliating agency → NIC → DWO → PFMS. Corrections are only possible in the department's **correction window** (roughly Sep–Oct for renewals, Nov–Dec for fresh), not on demand.

### Dates for 2026-27

School (9–12) login opened 11 Aug 2026. **Dashmottar (degree/diploma/ITI) opens 15 Sep 2026**, renewal deadline 15 Oct, fresh deadline 31 Oct. Institutions forward by 10 Nov. Attendance must be 75%+ and the institution certifies it.

---

## Demo scope

**Completable journeys: Dashmottar Fresh (Priya) and Dashmottar Renewal (Amit).** Agents can keep building beyond a one-week ceiling (hub, more tracks as honest stops, richer case dashboard). The hackathon video still has to finish Priya and Amit.

The door still asks what you study, so the eight-login pain is visible. If the answer is class 9–12 or outside state, the page says this prototype continues as college (Dashmottar) and does **not** fake a school form. `/limitations` states that out loud.

**“No Record Found” is never a terminal state.** A wrong door resolves to a named next action (here is your OTR, here is Renewal, here are the two OTRs if you double-minted, here is the college case if the prototype does not cover your track).

---

## What Milegi changes

| Official | Milegi |
|---|---|
| Eight logins plus an OTR popup | One door that **tells you** which case you are, and recovers the OTR. |
| The form is the product | **The case page is the product.** The wizard is a subpage. |
| Type the non-refundable fee | **College master data.** Hostel/mess/caution/exam shown struck through. “Receipt doesn't match” is a dispute, not a guess. |
| A crash wipes the ASPX form | Draft on the **phone** first, then sync. Survives a 502. A resume code opens the same case in another browser. |
| A separate income dashboard after 15 minutes of typing | Pre-flight **before** the long form. An expired certificate stops you at the door, not at the DWO. |
| NPCI hang | Named state. Retry. The draft stays. |
| Hard copy in 3 days with no clock | Digital attest is the happy path. **The Friday deadline still shows**, struck through once it is met. |
| “Pending verification” | Named clerk + waiting days + what **you** must do next + expected amount, labelled as an estimate. |
| Bank / IFSC confusion | Never ask. Aadhaar DBT is the payment address. |
| 30-minute form | Ask less: the institute implies district, course and fee. Target about six minutes for a Dashmottar fresh once pre-flight is green. |

Do **not** add: chatbot, LLM eligibility, OCR, eight wizard copies, DWO/district dashboards, fake DigiLocker, extra languages, badges.

---

## Case page (the product)

One URL, reopenable with a resume code (`MLG-PRIYA`), the official-shaped OTR (`UP26-##########`), or the 15-digit session registration number, plus this phone's saved copy:

- Where the file is
- Who holds it **by name**
- What the student must do next, **by when** (including the hard-copy Friday if not yet attested)
- Expected amount from master data, labelled `कॉलेज मास्टर के अनुसार गैर-वापसी योग्य शुल्क (अनुमान)` — an estimate the reimbursement is calculated from, **not** a promised sanctioned amount
- Last year's payment, if renewal
- NPCI named state + retry
- Escalate (nudge) when any actor has been waiting. A nudge is recorded; it does **not** reset the wait.

After lock, home for that persona **is this page**, not the wizard.

---

## Door (replaces the eight logins)

Questions:

1. अभी क्या पढ़ रहे हो? (9–10 / 11–12 / कॉलेज·ITI / दूसरे राज्य)
2. क्या इस कोर्स का पहला साल है?
3. पिछले साल इसी कोर्स पर छात्रवृत्ति **मिली** थी? — हाँ / नहीं / **पता नहीं**

“पता नहीं” is the honest answer for most students, so it is a real third value, not a missing one. It resolves to the **renewal** side, because minting a second OTR is the failure that blocks both applications, and the copy names how the real portal recovers a lost registration number (high-school roll number).

Resolver output: track + cycle + OTR(s) + app id + an `alt` case. Duplicate Fresh on Amit's token opens the recovery copy (`app-amit-dup`) that names both OTRs and points at Renewal.

The resolver decides from those three answers alone — there is no identity input, so it cannot look anyone up. With three synthetic students, a real search would 404, which is the exact failure this product exists to remove. That is a stated demo cheat, not a hidden one.

---

## Short form (Dashmottar)

**One scrolling page** after papers — not शैक्षिक / निजी / शुल्क tabs. The official multi-step form is the failure we beat.

**Fresh, after pre-flight:** course (read-only from the institute), year, day scholar, ration card (`0` is fine), enrollment number, counseling + number if yes, bonafide tick, photo tick. **No fee input. No bank. No district.** Lock sits at the bottom of the same page.

**Renewal:** result, marks obtained/total, both-semesters tick. Course and fee read-only. Same page, same lock.

Fee panel (both): tuition from master data, with hostel/mess/caution struck through and one Hindi sentence. Button: “रसीद मेल नहीं खाती” → `feeDispute`, allowed right up to the DWO stage, because that mismatch usually surfaces when the clerk compares papers.

---

## Local-first draft

`localStorage` key `milegi-draft-${id}` holds the dirty fields, written on every keystroke batch — not only when the browser reports itself offline, because a 502 mid-save looks nothing like being offline. UI: `इस फोन पर सेव है` / `अभी सिंक नहीं हुआ` / `सेव हो गया`. Sync PATCHes when the network allows. The crash overlay is the **video of this**, not a separate product. Cross-browser: the resume code hits Postgres.

---

## Personas

- **Priya** (`app-priya`, resume `MLG-PRIYA`) — Fresh Dashmottar, B.A. 1st year, CSJMU Kanpur. Expired income certificate, NPCI timeout, crash, recover, lock, clerk attest, paid. Tuition ₹8,500. OTR minted on KYC as `UP26-` + 10 digits.
- **Amit** (`app-amit`, resume `MLG-AMIT`, OTR `UP26-2713703025`) — Renewal Dashmottar, B.Sc. 2nd year. Prefilled. Clerk waiting 12 days. Nudge. Tuition ₹19,800, last year ₹18,500 shown.
- **Amit गलत Fresh** (`app-amit-dup`, resume `MLG-DUP`, OTR `UP26-3141592654`) — same Aadhaar token, a second OTR minted. The door must recover, not die.

Income caps (Dashmottar / Post-Matric): SC/ST ₹2,50,000; General, OBC and Minority ₹2,00,000. Certificate valid 3 years. Pre-matric caps are deliberately not modelled — public 2026-27 sources disagree, and class 9–10 is not a completable journey here.

---

## UI

Visitor: cheap Android, Hindi, often 11pm, two bars. **Independent civic tool** — not a clone of `scholarship.up.gov.in`, not lined exam paper. System font stack, **no web font download**. Banner on every screen: `स्वतंत्र हैकथॉन प्रोटोटाइप · नकली डेटा · सरकारी वेबसाइट नहीं`

Product map: public hub (`/` live case status + OTR/registration resume) with linked schemes / circulars (GO dates) / grievance stubs, then student journey — one door → papers → **one form** → **case page** → clerk hat → DWO hat. Sanshodhan is a named window that refuses outside it. Broader plan: `docs/superpowers/plans/2026-08-20-milegi-enhancement.md`.

Craft bar lives in **Winning bar** above. Tokens live in `src/app/globals.css`.

---

## Stack

Next.js 16 App Router = frontend **and** JS backend (route handlers). TypeScript. No Express. No UI kit. No runtime LLM.

Durable store: **Neon Postgres** (pooled `DATABASE_URL`) so status and resume survive Vercel. Tests and local dev use a JSON file under the OS temp dir. Raw SQL, two `(id, payload JSONB)` tables, no ORM. On Vercel without `DATABASE_URL` the API fails loudly instead of pretending to remember.

---

## Honesty / Codex

Mock OTP, DigiLocker/OTR, e-District, NPCI, PFMS. The affiliating-university step is shown in the chain and auto-forwards. Cursor writes domain logic, APIs, the case page and the clerk page. **Codex (ChatGPT Go) wrote the volume-UI start** — shell, banner, home, wizard host (Tasks 1–2). Quota ended there. Cursor finishes the remaining intake UI (door, pre-flight, form, crash overlay, review, limitations) against the same plan. The write-up names that split honestly. Do not invent a Codex trail that did not happen.

---

## Sources (public pages only, checked 20 Aug 2026)

- Hackathon brief and FAQ: <https://buildwhatmovesindia.com/brief>, <https://buildwhatmovesindia.com/faq> — deadline 27 Aug 2026, finale 12 Sep, Codex mandatory and meaningfully involved, mock data required, every demoed feature must work.
- Login URLs for all eight doors plus OTR/registration: <https://www.dailyprime247.com/2025/09/up-scholarship-online-form-2025-26.html>, <https://www.buddy4study.com/article/up-scholarship-login>
- OTR vs registration number, duplicate-OTR blocking, DigiLocker mapping: <https://upscholarshiip.com/otr-guide/>, <https://upscholarshiip.com/renewal/>
- Income certificate 3-year validity and e-District verification: <https://upscholarshiip.com/income-certificate-validity/>
- Non-refundable fee excludes hostel/mess/library/exam/security; hard copy within 3 days; 75% attendance; correction windows: <https://upscholarshiip.com/>, <https://upscholarshiip.com/apply-online/>
- Aadhaar DBT / NPCI mapper instead of typed bank details: <https://upscholarshiip.com/payment-status/>, <https://upscholarshiip.com/apply-online/>
- 2026-27 income limits and dates (Dashmottar opens 15 Sep 2026): <https://www.buddy4study.com/article/up-scholarship>, <https://school.careers360.com/articles/up-post-matric-scholarship-2026>
- Benefit is fee reimbursement plus a maintenance allowance in bands (₹2,500–₹13,500), not equal to tuition: <https://school.careers360.com/articles/up-post-matric-scholarship-2026>

Aggregator sites still list “bank passbook with IFSC” as a required document. That is not a contradiction: the passbook is still in the hard-copy pile, but the portal no longer asks you to type the account number, and payment routes through the Aadhaar–NPCI mapper. Milegi never asks for an account number or IFSC.
