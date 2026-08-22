# Write-up — Milegi

Build What Moves India · submission materials · synthetic data only · not a government product.

## 1. The problem

A UP scholarship applicant’s real job is not “submit the form.” It is: **will the money arrive, how much, when, and what do I do so my file does not die in silence?**

Today that answer is unavailable. Public record: grievance **GOVUP/E/2026/0035742** — applications forwarded by the institute in December 2025, then parked through university scrutiny, verification, authentication, sanction and payment for **over three months**, with no owner and no clock. Action came only after a hand-written Jansunwai complaint; **₹6,605** eventually landed. Separate grievances document portal `ERROR 500` for days and raw NPCI strings shown to citizens as their only explanation.

The defect is process silence, not screen chrome. Eight login doors, duplicate-OTR traps, eligibility failures after thirty minutes of typing, and status words with no deadline make the silence worse.

## 2. Who it affects

Saksham’s own funnel counters (session 2025-26, public homepage): ~90 lakh OTRs → ~18.6 lakh beneficiaries. On the losing end of each failure: first-generation college students on patchy Android data; institute clerks drowning in queues; DWO cells stuck with opaque “suspect data.” Parents who cannot tell whether to wait or escalate.

## 3. What we built and what changed

| Pain | Change |
|---|---|
| Eight student doors | One OTP door; three plain questions route scheme + cycle (`/raasta`) |
| Duplicate OTR debars both apps | Same Aadhaar recovers the existing OTR and records the attempt |
| Failures after long typing | Pre-flight before the form: cert validity vs payment window, income cap, master data, DBT |
| Crash wipes the form | Per-keystroke local draft + visible save state + server PATCH |
| Student types fee | Fee from institute master data; excluded heads struck through; dispute with owner |
| Status with no owner/clock | Case file: named owner, `dueAt`, waiting/breach days, auto-escalation, grievance draft |
| Institute bottleneck | Queue, hard-copy receipt, attendance rule, bulk forward, master-data publish |
| Opaque DWO flags | Cross-check with submitted vs registry; coded reasons with student-facing fixes; sanction batch |
| Hidden mocks | `/mock` simulator + banner when an upstream is down |

Invariant enforced in `transition()`: a non-terminal stage always has an owner and a `dueAt`.

## 4. End-to-end thinking

Stage machine with SLAs from the published 2026-27 calendar; escalation after breach without resetting the wait counter; structured reason codes; institute owns master data; correction window unlocks only flagged fields; payment failure requeues without re-sanction. Scaling to another state is config (schemes, calendar, rates, reasons), not a rewrite — the SLA/escalation engine is the structural piece.

## 5. Functional versus mocked

| Capability | In Milegi | In reality |
|---|---|---|
| Aadhaar e-KYC + OTP | mock, demo numbers, on-screen OTP | UIDAI |
| DigiLocker | mock seeded assets | DigiLocker |
| Income / caste certs | mock e-District + real 3-year maths | e-District / e-Sathi |
| Board / enrolment | mock registry, real mismatch codes | boards / universities |
| NPCI DBT | seeded / KYC-only / dormant | NPCI mapper |
| PFMS | mock batch, six documented outcomes | PFMS |
| SMS | outbox table in UI | telecom gateway |
| Institute master data | real editable console | Saksham institute login |
| University scrutiny | SLA actor, auto-advances (disclosed) | university console |
| Stage machine, SLAs, escalation, forms, fees, drafts | **fully implemented** | — |

## 6. How tools contributed

This rebuild was implemented in Cursor with Composer as the primary coding agent, against researched plans in `docs/superpowers/plans/`. Domain core, HTTP layer, four surfaces, simulator, and README were landed in commits:

- `Build the domain core…`
- `Expose the domain over HTTP…`
- `Build the student surface…`
- `Build the institute console…`
- `Build the DWO console…`
- `Build the system simulator…`
- `Add boundary and help pages and ship the README`

Human work: problem framing, Saksham evidence file, product/design specs, pinned Civic Ink direction, and review of what shipped. No runtime LLM; no claim of Codex authorship beyond what this repository’s history actually shows.

## 7. Known limitations

No university console (auto-advance at SLA, disclosed on the event). Income caps contested across aggregator sources (shown as contested). Calendar AGG-sourced. Small district/institute seed set. No real document upload. Demo operator PINs printed on login pages. Store is whole-snapshot last-write-wins (demo ceiling). Local JSON store unless `DATABASE_URL` is set.

## 8. Safety

No live government calls. Demo Aadhaar must start with `0000`. No account number/IFSC fields. Mock OTPs on screen only. Outbox is not a real SMS send. Banner on every route. No government logo, seal, or officer photographs. Invented seed names only.
