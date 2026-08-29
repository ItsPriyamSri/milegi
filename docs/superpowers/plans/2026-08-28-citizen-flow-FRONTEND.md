# Frontend prompt — citizen flow + English forms

Paste this as the user message. Do not invent a new product. Do not touch `src/server/**` or `src/app/api/**` (backend is landing in parallel). Restyle the whole site to the look below — light, clean, premium — not a government portal and not a dark SaaS dashboard.

---

You are a principal frontend engineer. English is the lead language; Hindi is the complete translation under it. The citizen flow is wrong today. Fix the flow, the copy, two input bugs, and the look. Stop when a reviewer can demo: Create OTR → Apply (router picks Fresh/Renewal) → form → lock → case file, then Track by OTR, all in English, on a light premium site that feels alive.

## Look (whole site — non-negotiable)

**Light mode only.** No dark theme, no theme toggle. Paper-white / warm off-white canvas, ink text, one restrained accent. Decent spacing: room to breathe, not a cramped NIC table and not a huge marketing void.

The **wow is motion**, not decoration. Animations, transitions, hover, and micro-interactions should make the platform feel punchy and alive: doors lift and settle, buttons depress, FAQ chevrons rotate, OTP boxes fill, copy-to-clipboard ticks, status chips arrive, page changes fade/slide with a short ease. Keep it fast (≈150–250ms), `prefers-reduced-motion: reduce` disables the flourish.

**Landing `/` earns the first look:** three doors as the hero, FAQ accordion below, quiet operator links in the footer. Make this page handsome. Forms (`/otr`, `/pravesh`, `/raasta`, `/aavedan`, `/jaanch`) stay **simple and calm** — same type, same surfaces, same buttons — so filling a scholarship form does not feel like a campaign site.

**Banned everywhere:** gradients, glow, neon, glassmorphism, glossy tiles, coloured shadows, mesh backgrounds, bento-for-bento’s-sake, dark luxury, purple SaaS, Inter/Geist-as-the-brand. No CM photo, no emblem.

**Wanted:** modern, clean, expensive, premium. Flat colour, hairline borders or a single quiet shadow, sharp type, generous line-height, buttons that look like they cost money. Hand-written CSS only (no Tailwind, no new deps). Reuse existing tokens in `src/app/globals.css` if they already fit; do not invent a second palette mid-page.

## Three doors on `/` (replace the current two)

1. **Create OTR** → `/otr` (login OTP on that path if needed). When mint succeeds, **stop**. Show the OTR huge, labelled “lifetime ID — also a tracking number”. Primary action: copy + “Back to home”. Do **not** send them to `/raasta`. Duplicate OTR is a recovery hero, then the same stop.
2. **Apply** → `/pravesh` (apply mode). OTP. If `profile` is null → English: “Create an OTR first” + link to `/otr`. Do not open the OTR form as if it were part of apply. If profile exists and they already have a case → `/f/{id}`. If profile, no case → `/raasta`. After `/raasta` answers, **one** Continue button creates the case and goes to `/taiyari/{id}` then `/aavedan` → `/jaanch` → `/f/{id}?locked=1`. No extra “open this other link” steps.
3. **Track** → `/pravesh?mode=track`. One field accepts **any** of: case id `MLG-26-……`, 15-digit registration number, or OTR `UP26-……`. Submit → `/t/{code}`. Placeholder and helper text must say all three. No password, no captcha. If the API returns `kind: "otr_no_case"`, show “OTR exists, no application yet” + link to Apply — not a generic 404.

## English on every citizen form

Default lang is already English (`getLang`: cookie `mlg_lang=hi` is Hindi). Forms still hardcode Hindi. Fix:

- `OtpForm`, `OtrForm`, `RouteWizard`, `FormShell`, `PreflightActions`, `jaanch` page + `LockPanel`, `/f/[caseId]`, `/t/[code]`, taiyari copy.
- Field labels: `spec.labelEn` / `spec.labelHi` from `FIELDS` (backend is adding `hintEn` and a read-only `otr` identity field). Options: `opt.en` / `opt.hi`.
- API: use `reasonEn`, `recoveryEn`, `warnEn`, `schemeEn`, `duplicateNoteEn`, `hintEn`, `stageEn`, `trackEn`, `cycleEn`, `ids` when present; fall back to Hi only if En missing.
- Pattern: `lang === "en" ? en : hi`. Banner: English then Hindi.
- Lang toggle: if default is English, cookie `mlg_lang=hi` switches to Hindi (`document.cookie.includes("mlg_lang=hi") ? "en" : "hi"`).

## OTP paste (bug)

`src/ui/OtpBoxes.tsx`: pasting 6 digits dumps them into box 1. Fix at the input, not the wrapper:

- `onPaste` on **each** `<input>`, `preventDefault`, take digits, `onChange(pasted.slice(0, 6))`, focus the last filled box.
- If `onChange` sees more than one digit in a box, treat it as a paste of the whole string, not `val[val.length - 1]`.
- Keep auto-advance, backspace, and the printed demo OTP.

## Mobile

10 Indian digits starting **6, 7, 8, or 9**. Do not imply “starts with 9”. Strip spaces. Backend will also accept `+91` / `91` / leading `0` — send the raw string; don’t invent a second regex that rejects 7.

## Case file (video beat)

After lock, `/f/{id}?locked=1` must show **above the fold** (360 and 1280):

- Stage + named owner + due weekday (already there — keep it)
- Three labelled IDs: **OTR**, **registration number** (15-digit, or “pending” before lock), **application / case id** (`MLG-26-…`)
- Track name + Fresh/Renewal in English
- Estimate with basis
- Public track link `/t/{otr}` and `/t/{caseId}` as copyable

`/t/{code}` is the parent view: same owner + deadline + those IDs, still no form fields / certificates / Aadhaar.

## FAQs on `/` (required — ship this, do not skip)

The live portal’s FAQ is an accordion under **“Have any questions?”** (six cards, chevron, illustration on the right). Ship **that pattern** on `/` **below** the three doors: English question + English answer, Hindi under each. Native `<details>` is enough. No CM photo, no emblem, no orange stock FAQ illustration required.

Copy is locked. Do not invent income caps as a single number (sources disagree). Do not add extra questions.

1. **What is the UP Scholarship / Fee Reimbursement scheme?**  
   State maintenance + reimbursement of **approved non-refundable tuition**, not “your college fee back.” Independent prototype of Saksham; synthetic data; not a government site.

2. **Who is eligible?**  
   Studying in a mapped course; income certificate valid 3 years from issue; attendance 75%+; not holding another state/central scholarship. Income ceilings are **contested** across guides (SC/ST often ₹2.5L; OBC/General/Minority ₹1–2.5L depending on source) — say that, don’t pick one.

3. **How do I apply on Milegi?**  
   Create OTR (once) → Apply → three questions pick Fresh vs Renewal and the scheme → checks **before** typing → one form → lock → hard copy in 3 days. Not eight student logins.

4. **What is fee reimbursement, and how is the amount calculated?**  
   Tuition from the **institute master data** (hostel/mess/caution/library/exam struck out). Plus a maintenance band by course group and hosteller/day-scholar. On-screen rupees are an **estimate with a basis**, never a promise. Real grievance GOVUP/E/2026/0035742 paid ₹6,605 after a three-month stall.

5. **How do I track my application?**  
   Track door: case id `MLG-26-…`, 15-digit registration number, **or OTR**. No password, no captcha. Status is a **named owner + weekday**, not a word like “Institute Pending.”

6. **OTR vs registration vs application number?**  
   OTR = lifetime (`UP26-…`), one per student, also a tracking number here. Registration = session, 15 digits, minted at lock. Application / case id = `MLG-26-…`. Mixing them is why the real portal says `No Record Found`. Never mint a second OTR.

7. **Institute, department, and reports logins?**  
   The real site’s nav is a dropdown farm (Institutes / Departments / Reports — see table below). Milegi ships **two working operator doors**: institute cell `/sansthan` (PIN `1234`) and district welfare `/dwo` (PIN `1234`). University scrutiny is an SLA, not a console. “All session reports” are the operator queue counts, not invented lakh counters. Minister, Directorate, DIOS, Auditor, Administrator, Deputy Director, Other-state admin, HEDO are **named on `/seemayein`**, not extra logins.

Link “read more” to `/madad` and `/seemayein`. Keep `/madad` English-first too if you touch it.

## Institutes, Departments, Reports (do not clone the dropdown farm)

Research: `docs/research/2026-08-28-operator-flows.md` (screenshots 28 Aug 2026 + 20 Aug evidence). The live nav is **not** student-only.

**Institutes** (four items): New registration · Login (further submenu, items not captured) · Check registration status · University / affiliating agencies login.

What that means in the pipeline: colleges publish **master data** first (22 Jul–15 Aug). A missing course in the student list means the college never mapped it — not a student signup. After lock, the file waits at the scholarship cell until **hard copy + 75% attendance + forward**. Miss the forward window → auto-cancel, no reversal. University login is enrolment-master + fee verification (degree/diploma, 23 Jul–30 Aug); enrolment mismatch is a named DWO objection. Students never use “new registration” or “check registration status.”

**Departments** (nine items): Hon’ble Minister · District Welfare (submenu, nested items not captured) · Administrator · Auditor · Deputy Director · Directorate · DIOS · Other-state administrator · Higher Education Divisional Officer.

What that means: **District Welfare / DWO** is the only district role that sanctions (suspect-data codes, 15–30 day bulk). Directorate can **block a college** (intake/affiliation) — not student-fixable. DIOS is the school-inspector layer for 9–12. Other-state administrator matches the outside-UP student track. Minister / Admin / Auditor / DD / HEDO are oversight. We did **not** see District Welfare’s nested submenu; do not invent it.

**Reports:** one item, **All session reports**. The homepage already publishes a funnel (OTR → submitted → forwarded by institutes → beneficiaries). Payment status lives on **pfms.nic.in**, a different site.

Milegi’s product decision (locked): **two working operator doors**, not nine. On `/`, a quieter row under the student doors (or in the footer — not a hover mega-menu):

| Real portal item | What you ship |
|---|---|
| Institute Login | `/sansthan` — PIN printed `1234`. Queue, hard copy, attendance, forward, master data. |
| Institute New registration / Check status | Do **not** add fake sign-up. One FAQ line: colleges already exist in demo master data; a missing course means the college has not published it (`/sansthan/master`). |
| University / affiliating login | No console. University scrutiny **auto-advances at SLA** (see `/seemayein`). Link there. |
| District Welfare | `/dwo` — PIN `1234`. Cross-check, coded flags, sanction batch. |
| Minister / Admin / Auditor / DD / Directorate / DIOS / Other-state / HEDO | Do **not** build logins. One honest line on `/seemayein` or the FAQ: those roles exist on Saksham; this prototype names them as process steps, not extra doors. |
| All session reports | Do **not** invent statewide dashboards. After operator login, StatSlabs on `/sansthan/kaksh` and `/dwo/kaksh` **are** the report. Optional read page `/reports` that says so and links those two logins. No made-up lakh counters. |

English on `/sansthan` and `/dwo` login chrome (title, PIN hint, buttons). Operator tables can stay dense; bilingual headers if cheap.

No dropdown of 9 logins. No officer photographs.

## Don’t

- Tailwind, new npm deps, `src/server`, `src/app/api`
- Dark mode, gradients, glow, glossy/glowy tiles
- Government logos
- Change the domain state machine
- Skip `npm run typecheck` / `npm test` (112 must stay green)

Start at `/` (light, spaced, three doors that react on hover), then OTR stop, then Apply happy path in English, then paste OTP, then Track by OTR, then confirm the FAQ accordion is on `/` with all seven items and a motion that feels alive.
