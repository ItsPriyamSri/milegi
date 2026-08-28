# Milegi — product truth

> Durable product context. Visual decisions do **not** live here (see the design spec and, after the
> first build, `DESIGN.md`). Written 20 Aug 2026.

## What this is

**Milegi** is an independent prototype of a state scholarship service: an applicant-facing
replacement for Uttar Pradesh's *Saksham* portal (`scholarship.up.gov.in`, "छात्रवृत्ति एवं शुल्क
प्रतिपूर्ति ऑनलाइन प्रणाली"), plus the two operator surfaces the money actually has to pass through.

It is built for the **Build What Moves India** hackathon (submission 27 Aug 2026, finale 12 Sep 2026,
Bengaluru). It is **not** official, **not** affiliated, and carries **synthetic data only**.

Banner text, on every screen, verbatim:

```
स्वतंत्र हैकथॉन प्रोटोटाइप · नकली डेटा · सरकारी वेबसाइट नहीं
```

## The one problem

A student's job is not "submit the form." It is:

> **Will the money arrive, how much, when, and what do I do so my file does not die in silence?**

Today the answer is unavailable. The builder lived this as a college student in UP. The public record
backs it: a 2026 citizen grievance (GOVUP/E/2026/0035742) documents applications parked at
*"Forwarded by Institution"* for over three months — university scrutiny, data verification, account
authentication, sanction and payment all silent — released only after a Jansunwai complaint was filed
by hand. ₹6,605 eventually landed. Nobody was accountable for the delay and no clock existed.

So Milegi's spine is one invariant, enforced in code:

> **A case can never sit in a stage without a named owner and a deadline.**

## Primary users

| User | Situation | Job |
|---|---|---|
| **Student applicant** | 17–23, Hindi-first, cheap Android, patchy data, often applying at 11pm because the portal 502s all day. Often first in family to reach college. Money decides whether the semester continues. | Get an eligible application in, then know where it is, who holds it, and what to do next. |
| **Institute scholarship clerk** | One person for hundreds to thousands of files. Also publishes course + fee master data. Files rot here, usually from queue chaos, not malice. | Verify and forward files fast, without hunting paper or fielding walk-ins. |
| **District Welfare Officer (DWO) cell** | Cross-checks each file against other government databases, flags "suspect data", sanctions batches. | Clear a district-sized queue with defensible reasons. |

Secondary: the affiliating university/agency (scrutiny step for degree-level files) — modelled as an
actor with an SLA, not given its own console.

## Lived pains this product exists to remove

1. **Eight separate login doors** (Prematric / Post-matric Inter / Dashmottar / Outside-State × Fresh /
   Renewal), plus a separate OTR popup and a separate registration page. Wrong door returns
   `No Record Found` or `Invalid Registration Number` — the record exists, in another database.
2. **Two identifiers students constantly confuse**: the lifetime OTR (`UP25-8800385830`) and the
   session registration number (15 digits, e.g. `271370302500941`).
3. **A duplicate OTR permanently blocks both applications.** The most common cause is a student who
   lost last year's registration number and was told at a cyber café to "just register again."
4. **Eligibility and document failures surface last.** Income/caste authentication is a *separate*
   dashboard step after the long form; an income certificate expired past its 3-year validity, or a
   course the college never published in master data, fails you after you typed everything.
5. **A crash wipes the form.** `ERROR 500: Internal Server Error` for days at peak; "We Are Sorry"
   pages; nothing is saved locally.
6. **Raw machine errors are shown to citizens**: `Status not received from NPCI server, Checked
   Date:-(19/11/2024 14:47:09)`. No cause, no owner, no retry, no next step.
7. **The student types the non-refundable fee** from a receipt, and a wrong figure (hostel, mess,
   caution money, exam fee included) becomes DWO "suspect data" months later.
8. **No owner, no clock, no notification.** "Pending at Institute Level" can mean 3 days or 3 months.
   There is no SMS, so a stalled file is invisible until the deadline has passed and it is auto-cancelled.
9. **Correction windows are short, dated, and unannounced**, and every correction restarts a 3-day
   physical hard-copy obligation that nobody tells you about.
10. **Payment failures live on a different website** (PFMS) with bank-side causes (Aadhaar not seeded
    for DBT, UID disabled for DBT, dormant account, transaction limit) that read as gibberish.
11. **Bank/IFSC confusion**, even though payment now routes through the Aadhaar–NPCI mapper and the
    portal no longer needs an account number.

## What Milegi does about it

- **One door.** Mobile + OTP, one identity, one dashboard. Three plain questions route the applicant to
  the right scheme and cycle; no answer is ever a dead end, including "पता नहीं".
- **One adaptive application.** All four tracks and both cycles are configuration over the *same*
  single-page form. Renewal arrives prefilled; only what genuinely changed is editable.
- **OTR created inline** with duplicate detection that helps ("you already have one — continue as
  renewal") instead of debarring.
- **Pre-flight before typing.** Certificate validity arithmetic, income vs category cap, course/fee
  present in the institute's master data, DBT seeding, attendance and bonafide rules — each with a
  named fix and how long the fix takes.
- **Fee from the institute's published master data**, non-refundable heads only, ineligible heads shown
  struck through. A receipt mismatch is a dispute with an owner, not a typing guess.
- **Drafts survive everything**: per-keystroke local save, visible save state, resume on any device, an
  offline queue that replays. A 502 cannot lose data or corrupt a draft.
- **Human-readable failure, always.** Every error carries a code, a plain-Hindi cause, whether it is
  retryable, and a reference id. No stack traces, no raw upstream strings.
- **A case file with accountability**: stage timeline with named owner and designation, per-stage SLA
  clock against the real published calendar, your next action with its date, hard-copy clock, amount
  estimate with its basis, notification outbox, nudge, automatic escalation on breach, and a
  **pre-filled grievance draft** — the escalation the real citizen had to compose by hand.
- **Operator surfaces that fix the actual bottleneck**: an institute console with master data, queue,
  attendance, hard-copy receipt, bulk forward, and return-for-correction *with a reason code*; a DWO
  console with automated cross-check results, structured suspect codes, and batch sanction.
- **An honest simulator** for every government system Milegi touches, with fault injection and a
  clock, so the whole pipeline is demonstrable and the mocks are visible rather than hidden.

## Boundary — what a platform cannot fix

Stated in the product, not buried in a write-up. Milegi can fix intake, data loss, error legibility,
visibility, ownership, SLA measurement, escalation, pre-validation, fee correctness, guided correction,
and grievance drafting. Milegi **cannot** fix officer throughput and staffing, bank Aadhaar-DBT
seeding, treasury/budget release timing, statutory income caps and attendance rules, or a college that
refuses to publish master data. For each of those the product's honest answer is measurement plus
escalation plus a named next step — not a pretence of control.

## Scope of the prototype

- **One state, one session**: Uttar Pradesh, 2026-27. Scheme, calendar and rate data are config, so a
  second state or the central portal is a config exercise, not a rewrite. That is the scale story.
- **All four tracks are completable** (Prematric 9–10, Post-matric Inter 11–12, Dashmottar
  degree/diploma/ITI, Outside State), fresh and renewal, because collapsing eight forms into one is
  the headline claim and a claim has to be demonstrable.
- **Four surfaces**: student app, institute console, DWO console, system simulator.
- Every government integration is a mock adapter: Aadhaar e-KYC, DigiLocker, e-District/e-Sathi
  certificate verification, NPCI DBT mapper, PFMS disbursement, SMS.

## Non-goals

No chatbot. No LLM at runtime. No OCR. No real Aadhaar/PAN/OTP/payment data. No live call to any
government system. No government logo, seal, or officer photograph. No claim of endorsement. No login
to any real student account, ever. No accessibility-hostile "clean" minimalism that hides state the
operator needs.

## Voice

Hindi-first, plain, second person, no bureaucratese and no startup cheer. Every screen answers: what is
true right now, who holds it, what you do next, by when. English is a complete parallel translation
(judging and accessibility), not a fallback stub. Numbers are rupee-formatted Indian style; dates are
`DD MMM YYYY` with the weekday when a deadline matters.

## Brand commitments (user-pinned)

- Name **Milegi** ("मिलेगी" — *you will get it*). Independent tool identity, never official-looking.
- Visual direction: **Gazette Register** — cool mineral paper, clerk-stamp owner, dak-register ledger, UPI-receipt paid state. Still refuses NIC emblem imitation, ruled exam-copy, cream-and-terracotta, generic SaaS card grids.
- Type: self-hosted Noto Sans / Noto Sans Devanagari via `next/font`, Hindi+Latin subset, two weights, ~80KB budget, `display: swap`. System stack remains the fallback. No third-party font CDN.
- Mobile floor 360px for the student app; operator consoles are desktop-dense but must not break on a
  tablet.

## Stack

Decided with the builder: **Next.js 16 App Router (TypeScript)** as both frontend and JS backend via
route handlers; hand-written CSS with design tokens (no Tailwind, no UI kit — density needs direct
control); **Postgres (Neon, pooled)** in production with a JSON file store for local dev and tests;
raw SQL, no ORM; `node --test` via `tsx`; deployed on Vercel. No runtime LLM.

## Build attribution

Codex is a hackathon requirement and the builder's ChatGPT Go quota is currently exhausted. The
submission write-up states exactly what Codex did and did not do, based on what actually happens in the
repository. Nothing is attributed to a tool that did not write it.
