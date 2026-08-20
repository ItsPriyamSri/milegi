# Milegi — design spec

**Status:** approved 20 Aug 2026. Supersedes every plan dated 19–20 Aug 2026.
**Product truth:** `PRODUCT.md` · **Evidence + citations:** `docs/research/2026-08-20-saksham-evidence.md`

---

## 1. Thesis

The scholarship portal's real defect is not its screens. It is that **a file can be nobody's
responsibility for three months and the student cannot tell.** Intake friction (eight doors, a
30-minute form, a fee typed from a receipt, crashes that wipe drafts) is what makes people fail before
the pipeline; silence is what kills them inside it.

Milegi is therefore two products welded together:

1. **One-pass intake** — one door, one adaptive form, validation and document reality checked *before*
   typing, drafts that cannot be lost.
2. **An accountable case file** — every stage has a named owner, a deadline computed from the
   published calendar, an automatic escalation when the deadline passes, and a plain-language reason
   whenever the pipeline says no.

The invariant that makes claim 2 real, enforced in code and covered by a test:

> **A case in a non-terminal stage always has an owner and a `dueAt`.** Nothing can put a case into a
> stage without both. There is no "pending" without a clock.

## 2. Users, and what each surface owes them

| Surface | Mode | Owes the user |
|---|---|---|
| Student app (`/`) | Operate, mobile-first 360px | Am I eligible, what do I need, is my draft safe, where is my file, who has it, what do I do next, by when, how much, why was it flagged |
| Institute console (`/sansthan`) | Operate, dense desktop | What is in my queue, what is about to breach, what is missing paper, forward in bulk, return with a reason |
| DWO console (`/dwo`) | Operate, dense desktop | District queue with cross-check results already run, structured flag/verify/reject, batch sanction |
| System simulator (`/mock`) | Operate, utilitarian | Break any upstream system, move the clock, run a PFMS batch — visibly, so nothing is hidden |

## 3. Architecture

One Next.js 16 App Router application. Route handlers under `src/app/api/**` are the JS backend. All
domain logic lives in `src/server/**` and is **synchronous and HTTP-free**, so it is unit-testable with
`node --test`.

```
browser ──► route handler ──► await hydrate()  (load store snapshot)
                            ├─ sync domain call (logic.ts / preflight.ts / alerts.ts …)
                            └─ await persist() (write dirty records)
```

`hydrate()` / `persist()` exist from the first commit because the production store (Neon) is async and
the domain is not. This seam is the one architectural decision carried over from the previous plan; it
was correct.

### Modules

| Path | Responsibility |
|---|---|
| `src/server/types.ts` | Every domain type. No logic. |
| `src/server/config/schemes.ts` | The four tracks: labels, eligible classes, income caps (with source + confidence), which form sections apply, whether marks/fee apply. |
| `src/server/config/calendar.ts` | 2026-27 dates per track × cycle, each with `source` and `confidence`. |
| `src/server/config/rates.ts` | Fee-reimbursement groups and maintenance-allowance bands, with citation and "department decides" flag. |
| `src/server/config/reasons.ts` | Institute return codes and DWO suspect codes: id, Hindi/English text, who can fix it, how, and whether the correction window applies. |
| `src/server/clock.ts` | `now()` — real time plus the simulator's day offset. **Nothing else may call `Date.now()`.** |
| `src/server/fields.ts` | Field specs (label, type, required-when, validator). Single source shared by client and server. |
| `src/server/route.ts` | Three-question router → `{track, cycle, reason, recovery}`. Never returns "not found". |
| `src/server/otr.ts` | Mock e-KYC/DigiLocker profile mint, duplicate detection and recovery. |
| `src/server/preflight.ts` | The pre-typing checklist. |
| `src/server/fees.ts` | Fee heads from institute master data; estimate assembly. |
| `src/server/machine.ts` | Stages, transitions, owners, `dueAt` computation, the ownership invariant. |
| `src/server/alerts.ts` | `deriveAlerts(case, now)` — breaches, hard-copy clocks, window openings, escalations. |
| `src/server/grievance.ts` | Grievance draft text generator. |
| `src/server/notify.ts` | Notification outbox writer (mock SMS/WhatsApp). |
| `src/server/external/*.ts` | Mock adapters: `ekyc`, `digilocker`, `edistrict`, `boards`, `npci`, `pfms`. All read simulator config. |
| `src/server/store.ts` | `hydrate`/`persist`, JSON file store (dev/test) and Neon store (prod), seeds. |
| `src/server/errors.ts` | `AppError` + the error envelope. |
| `src/lib/**` | Client-side: API client, autosave hook, i18n, formatters. |
| `src/ui/**` | Design-system primitives (no feature logic). |
| `src/app/**` | Routes and feature components. |

### Store

Postgres, one table, JSON payloads. Raw SQL, no ORM.

```sql
CREATE TABLE IF NOT EXISTS records (
  kind    text NOT NULL,
  id      text NOT NULL,
  payload jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  PRIMARY KEY (kind, id)
);
```

Kinds: `profile`, `case`, `institute`, `notification`, `config` (simulator + clock offset).
`hydrate()` loads all rows into memory; `persist()` upserts dirty ones.

> `ponytail:` whole-table load per request, last-write-wins. Ceiling is a few thousand rows and a
> handful of concurrent users, which is the demo. Upgrade path: load by id, add a version check on
> upsert (the `version` column already exists), then optimistic-concurrency 409s.

Local dev and tests use a JSON file under `os.tmpdir()` (never inside the repo — an autosave that
rewrites a repo file retriggers the dev compiler on every keystroke). Production requires
`DATABASE_URL`; without it the API returns **503 with a readable message** rather than pretending to
remember. `MILEGI_ALLOW_EPHEMERAL=1` is the deliberate opt-out for a first smoke deploy.

## 4. Data model

```ts
type TrackId = "pre_9_10" | "post_inter" | "dashmottar" | "outside_state";
type Cycle   = "fresh" | "renewal";
type Category = "sc" | "st" | "obc" | "general" | "minority";

type Profile = {
  id: string;                    // "prf_8f2c19a4"
  otr: string;                    // "UP26-8xxxxxxxxx" — mock, always rendered with a नकली chip
  mobile: string;                 // 10 digits
  aadhaarDemo: string;            // 12 digits, MUST start "0000" (see §9 safety)
  nameHi: string; nameEn: string;
  fatherNameHi: string; motherNameHi: string;
  dob: string;                    // ISO date
  gender: "f" | "m" | "o";
  category: Category;
  districtCode: string;
  addressHi: string;
  photoRef: string;               // mock DigiLocker asset id
  ekycAt: string;
  duplicateOtrs: string[];        // populated when a second OTR was minted for the same aadhaarDemo
  createdAt: string;
};

type Stage =
  | "draft" | "institute_review" | "university_scrutiny" | "dwo_review"
  | "correction_required" | "sanctioned" | "pfms_processing"
  | "paid" | "rejected" | "returned_to_student" | "payment_failed" | "lapsed";

type ActorRef = {
  role: "student" | "institute" | "university" | "dwo" | "treasury" | "bank";
  nameHi: string;                 // "श्री आर. के. वर्मा"
  designationHi: string;          // "छात्रवृत्ति लिपिक"
  orgHi: string;                  // "छत्रपति शाहू जी महाराज विश्वविद्यालय, कानपुर"
  contactHint?: string;           // "कॉलेज छात्रवृत्ति प्रकोष्ठ, कक्ष 12" — never a real phone number
};

type Case = {
  id: string;                     // "MLG-26-000137" — also the public tracking code
  session: "2026-27";
  profileId: string;
  track: TrackId; cycle: Cycle;
  registrationNo: string;         // 15 digits, minted at lock (mirrors the real session number)
  instituteId: string; courseCode: string;
  stage: Stage;
  stageEnteredAt: string;
  owner: ActorRef | null;         // null only in terminal stages
  dueAt: string | null;           // null only in terminal stages
  form: Record<string, string | number | boolean | null>;
  preflight: PreflightItem[];
  certificates: {
    income?: { applicationNo: string; certNo: string; issuedOn: string; expiresOn: string;
               annualIncome: number; verifiedAt?: string; state: "ok" | "expired" | "not_found" };
    caste?:  { applicationNo: string; certNo: string; issuedOn: string;
               verifiedAt?: string; state: "ok" | "not_found" };
  };
  fee: { heads: FeeHeads; nonRefundable: number; disputed?: { note: string; at: string } };
  estimate: { feeReimbursement: number; maintenancePerMonth: number; months: number;
              total: number; basisHi: string };
  hardCopy: { dueAt: string | null; receivedAt: string | null };
  attendancePercent: number | null;   // set by the institute, gate at 75
  flags: { code: string; at: string; by: ActorRef; note?: string }[];
  correction: { openAt: string; closeAt: string; usedAt: string | null; fields: string[] } | null;
  payment: { pfmsRef?: string; status?: PfmsStatus; failureCode?: string;
             amount?: number; at?: string };
  escalations: { at: string; stage: Stage; breachDays: number; to: ActorRef }[];
  grievanceDraftAt: string | null;
  events: CaseEvent[];            // append-only, never edited
  updatedAt: string;
};

type CaseEvent = {
  at: string;
  type: string;                   // "locked" | "institute_forwarded" | "dwo_flagged" | …
  actor: ActorRef;
  summaryHi: string; summaryEn: string;
  data?: Record<string, unknown>;
};
```

`Institute` carries published master data — this is the record whose absence makes a course
un-selectable in real life:

```ts
type Institute = {
  id: string; nameHi: string; nameEn: string;
  districtCode: string; kind: "school" | "college" | "iti" | "university";
  affiliatedTo: string | null;    // affiliating university/agency, drives university_scrutiny
  clerk: ActorRef;                // the named human on the student's case file
  masterDataPublishedAt: string | null;
  courses: {
    code: string; nameHi: string; nameEn: string; group: "prof" | "tech" | "general" | "school";
    years: number;
    feeHeads: FeeHeads;           // tuition + the excluded heads, all present
    publishedAt: string | null;   // null → the student cannot pick it, and preflight says why
  }[];
};

type FeeHeads = { tuition: number; exam: number; hostel: number; mess: number;
                  caution: number; library: number; other: number };
```

## 5. State machine

```
                    ┌────────────── returned_to_student ◄──┐
                    ▼                                      │ institute returns with a code
draft ──lock──► institute_review ──forward──► [university_scrutiny]* ──► dwo_review
                    │                                                      │
                    │ hard copy not received by dueAt → alert + escalation │
                    │                                                      ├─flag──► correction_required ──resubmit──► dwo_review
                    │                                                      ├─verify─► sanctioned ──batch──► pfms_processing ──► paid
                    │                                                      └─reject─► rejected
student deadline passed while in draft ──► lapsed        pfms failure ──► payment_failed ──retry batch──► pfms_processing
```

`*` `university_scrutiny` applies only where the institute has an `affiliatedTo` (degree/diploma), and
auto-advances when its SLA elapses, because there is no university console. That auto-advance is
disclosed on `/seemayein` (the boundary page) and in the write-up.

### Owners and deadlines

| Stage | Owner | `dueAt` |
|---|---|---|
| `draft` | student | track/cycle student deadline from the calendar |
| `institute_review` | institute clerk (named) | `min(instituteForwardDeadline, enteredAt + 7d)`; **plus** a separate `hardCopy.dueAt = lockedAt + 3d` on the student |
| `university_scrutiny` | affiliating university | `min(masterVerifyEnd, enteredAt + 10d)` |
| `dwo_review` | DWO cell | `min(dwoWindowEnd, enteredAt + 15d)` |
| `correction_required` | student | `correction.closeAt`; if the window has not opened, the file says "opens on …" and the clock runs on the window, not the student |
| `sanctioned` | treasury | disbursement window end |
| `pfms_processing` | PFMS / bank | `enteredAt + 7d` |
| `payment_failed` | student (bank visit) | `enteredAt + 15d` |
| `paid` `rejected` `lapsed` | — | — (terminal, `owner` and `dueAt` null) |

`transition()` is the only function allowed to write `stage`. It refuses any transition not in the
table, and asserts the ownership invariant before returning.

### Alerts (pure function of case + now)

`hardcopy_due` · `hardcopy_overdue` · `stage_breach` (owner missed `dueAt`) · `escalated`
(breach ≥ 3 days → an escalation event addressed to the next authority up, plus an outbox notification;
**the wait counter never resets**) · `deadline_soon` (student deadline within 7 days while in draft) ·
`correction_opens` / `correction_closing` · `payment_action_needed` · `estimate_note` (always).

Each alert renders as one line with a date and, where the student can act, one action.

## 6. Pre-flight

Runs before the form, again at lock, and is re-runnable from the case file. Each item:

```ts
type PreflightItem = {
  id: string; state: "ok" | "warn" | "blocked" | "unknown";
  titleHi: string; titleEn: string;
  detailHi: string; detailEn: string;      // what is actually true, with numbers/dates
  actionHi: string | null;                 // exactly one next step, or null when nothing to do
  etaHi: string | null;                    // "3–5 दिन" — how long the fix realistically takes
  fixedBy: "student" | "institute" | "bank" | "revenue_office" | "none";
  source?: string;                          // citation when the rule is a published one
};
```

Items: `otr_identity` · `duplicate_otr` · `category_income_cap` (income vs the cap for this category and
track, with the source disagreement shown) · `income_certificate` (issue date + 3 years, compared
against the *disbursement* window, not today — an expiry in December fails a form filed in September) ·
`caste_certificate` · `institute_registered` · `course_published` (blocked when the college never
published the course; `fixedBy: "institute"`, with the exact sentence to say to the scholarship cell) ·
`fee_heads_published` · `dbt_seeding` (mock NPCI: `seeded` / `kyc_only` / `dormant`) · `attendance_rule`
(informational, 75%) · `bonafide_format` (degree tracks) · `previous_result` (renewal) ·
`cycle_conflict` (changed course / rejected last year → this is a Fresh, not a Renewal) ·
`window_open` (is the portal window even open for this track today).

`blocked` items stop `lock`, never data entry: the student can still fill and save everything while a
certificate is being renewed. That is the whole point of doing this first.

## 7. The form

**One page, sections, no wizard.** Sections are driven by `schemes[track].sections`, so all four tracks
and both cycles are the same component tree with different config:

1. **पहचान** — from OTR, read-only, each field carrying a provenance chip (`आधार से`, `पिछले वर्ष से`).
   Editing routes to the real-world fix, it does not silently accept a different name.
2. **शिक्षा** — institute (searchable, published-only) → district, affiliating university, course list
   and fee heads all derive from it. Year of study, admission date, enrolment number, day scholar vs
   hosteller, board + high-school roll number.
3. **पिछला परिणाम** — renewal, or fresh where the track needs previous-year marks: result status
   (passed / promoted with back paper), marks obtained, marks total, "combined both semesters" tick.
   Client-side arithmetic warns on the CGPA-vs-marks and one-semester-vs-year mistakes.
4. **परिवार और प्रमाणपत्र** — annual family income, ration card (`0` allowed), income and caste
   certificate numbers verified inline against the mock e-District.
5. **शुल्क** — read-only. Tuition from master data; hostel, mess, caution, library and exam shown
   struck through with one sentence of why. `रसीद मेल नहीं खाती` opens a dispute (allowed up to
   `dwo_review`) which becomes an institute task, not a student guess.
6. **घोषणा** — attendance, no-other-scholarship, and information-correct declarations, each a real
   checkbox with the consequence stated.

**Saving.** Every keystroke batch writes `localStorage["milegi:draft:<caseId>"]` unconditionally — not
only when `navigator.onLine` is false, because a 502 mid-PATCH looks nothing like being offline. A
debounced `PATCH` syncs. Three states, always visible and `aria-live`:
`इस फोन पर सेव है` → `अभी सिंक नहीं हुआ` → `सेव हो गया`. Failed syncs queue and replay; the queue
survives reload; `PATCH` is idempotent per field and carries the client's last-known `version`.

**PATCH whitelist.** The server accepts only fields that are (a) in `fields.ts`, (b) allowed for this
track/cycle, and (c) editable in the case's current stage. Money, stage, owner, `dueAt`, `otr`,
`registrationNo`, `estimate`, `flags`, `attendancePercent` and `payment` are never patchable by a
student.

## 8. Error contract

Every non-2xx response body:

```ts
type ApiErrorBody = { ok: false; prototype: true; error: {
  code: string;        // "CERT_EXPIRED", "UPSTREAM_DOWN", "STAGE_LOCKED", "RATE_LIMITED"
  hi: string;          // one plain sentence, no jargon, no upstream string
  en: string;
  retryable: boolean;
  ref: string;         // "ERR-7QK2M" — shown to the user, logged server-side
  retryAfterSec?: number;
} };
```

Success: `{ ok: true, prototype: true, data: … }`.

Rules: the UI has no code path that can render a stack, a bare status number, or an upstream string.
An upstream failure becomes `UPSTREAM_DOWN` with the *system's* name in Hindi, whether it is retryable,
and what the student can do meanwhile (usually "your draft is safe, try again in a few minutes").
`app/error.tsx` and every fetch site render the same component. The demo shows the real portal's
`ERROR 500: Internal Server Error` beside ours.

## 9. Safety of synthetic data

- **Aadhaar-shaped input must start `0000`.** UIDAI never issues such a number, so a demo user
  physically cannot enter a real Aadhaar: the field rejects it with
  `यह प्रोटोटाइप असली आधार नंबर स्वीकार नहीं करता — 0000 से शुरू होने वाला डेमो नंबर डालें`.
- OTPs are generated, displayed on screen with a mock label, and never sent anywhere.
- No account number or IFSC field exists anywhere in the product.
- Mobile numbers are stored as typed but never used to send anything; the outbox is a table in the
  database and says so on screen.
- No government logo, seal, emblem, or officer photograph. Officer names in seeds are invented and
  visibly generic.
- The banner is in the root layout, on every route including error and simulator screens.
- Operator consoles are gated by demo credentials printed on their own login page — visible, not secret,
  and stated as such.

## 10. Mocked vs real (the write-up's table, decided now)

| Capability | In Milegi | In reality |
|---|---|---|
| Aadhaar e-KYC + OTP | mock adapter, demo numbers, on-screen OTP | UIDAI |
| DigiLocker photo/demographic pull | mock adapter, seeded assets | DigiLocker |
| Income / caste certificate verification | mock e-District: seeded certificate registry, real 3-year arithmetic | e-District / e-Sathi |
| Board roll + university enrolment cross-check | mock registry, real mismatch codes | UP Board / CBSE / university master data |
| NPCI DBT seeding check | mock states: seeded / KYC-only / dormant | NPCI mapper |
| PFMS disbursement | mock batch runner with the six documented outcomes | PFMS |
| SMS / WhatsApp | outbox table, rendered in the UI | telecom gateway |
| Institute master data | real editable console, seeded | institute login on Saksham |
| University scrutiny | actor with an SLA, auto-advances | affiliating university console |
| Stage machine, SLAs, escalation, grievance draft, correction cycle, fee logic, forms, validation, drafts | **fully implemented** | — |

## 11. Boundary page (`/seemayein`)

A two-column table shipped as a route, not an appendix. Left: what a platform can fix and where in the
product it is fixed (linked). Right: what it cannot, and Milegi's honest answer.

| Cannot be fixed by software | Milegi's answer |
|---|---|
| Officer/clerk throughput and staffing | measure it per stage, name the owner, escalate on breach, show the district's aging queue |
| Bank Aadhaar-DBT seeding | detect before applying, name the exact branch form, keep the case open with a clock |
| Treasury and budget release timing | show the published disbursement window and the file's position, never a fake ETA |
| Statutory income caps, 75% attendance, 50% pass marks | state the rule with its source, check it before typing |
| A college that never publishes master data | block early, name it as the institute's task, give the student the sentence to say |
| Deadlines that lapse during an outage | record the outage against the case (the simulator's downtime is logged) so the escalation has evidence |

## 12. Screens

**Student:** `/` landing (what this is, honest, one action) · `/pravesh` mobile+OTP · `/otr` inline OTR ·
`/raasta` three-question router · `/taiyari/[caseId]` pre-flight · `/aavedan/[caseId]` the form ·
`/jaanch/[caseId]` review + lock · `/f/[caseId]` **the case file** (also the public tracking URL) ·
`/soochnaayein/[caseId]` notification outbox · `/shikayat/[caseId]` grievance draft ·
`/seemayein` boundary · `/madad` help (identifiers explained, fee rules, calendar).

**Institute:** `/sansthan` login · `/sansthan/kaksh` queue (filters, aging, breach banner) ·
`/sansthan/kaksh/[caseId]` one file · `/sansthan/master` course + fee publishing.

**DWO:** `/dwo` login · `/dwo/kaksh` district queue with cross-check column · `/dwo/kaksh/[caseId]` ·
`/dwo/svikriti` sanction batch.

**Simulator:** `/mock` — upstream health toggles, latency/failure injection, clock advance, PFMS batch
run, reseed, and a live event feed.

## 13. Visual system — Civic Ink

User-pinned direction; no concept roll. Rejected: NIC navy + emblem imitation, ruled exam-copy,
cream-and-terracotta, generic SaaS cards, dark-with-neon.

- **World:** the *record* — Indian public-record craft, read the way a good ledger or a railway
  timetable is read. Ink on cool paper. Rules that mean something (a rule separates a real boundary,
  never decorates). Tabular numerals, right-aligned money and dates. The signature device is the
  **stage ledger**: a vertical rule with stage nodes, each node carrying owner, date, and elapsed days.
- **Colour, restrained:** paper `#F5F6F4`, surface `#FFFFFF`, ink `#14171A`, muted `#585F66`, rule
  `#DFE3DE`; one action accent, indigo `#22357A`, with focus `#3355D1`; semantic — waiting `#8A5A00`,
  breach `#A32219`, verified `#1C6B3F`, paid `#12513A`. Status is never colour alone: every state
  carries a glyph and a word.
- **Type:** system stack only, no web font. `ui-sans-serif, "Noto Sans Devanagari", system-ui, …`.
  Devanagari gets `line-height: 1.6` minimum and larger optical sizes than Latin would need. Inputs are
  16px on mobile (no iOS zoom). Numerals `font-variant-numeric: tabular-nums`.
- **Density:** 4px spatial scale. Student surfaces breathe (one decision per viewport); operator
  surfaces are deliberately dense tables with sticky headers, 32px rows, and keyboard selection. Density
  is a per-surface decision, not a global taste.
- **Dark mode:** real, via `prefers-color-scheme` and a toggle — students apply at 11pm because the
  portal 502s in the daytime.
- **Motion:** 120–180ms, transform/opacity only, and never on state that matters; `prefers-reduced-motion`
  honoured.
- **Accessibility floor:** AA contrast, 44px targets, visible focus, labels not placeholders, an error
  summary that links to fields, `aria-live` for save state and alerts, `lang` switching per language,
  full keyboard operation of both consoles.
- **Performance floor:** no web fonts, no UI library, no client-side data library. Target under 60KB of
  JS per student route and a usable first paint on a throttled 3G profile. Server-render everything the
  student reads; client JS only where interaction demands it.

DESIGN.md is written **after** the first build, from what shipped.

## 14. Verification

- `npm test` — `node --test` over `src/server/**/*.test.ts` via `tsx`. Domain logic is TDD: machine,
  alerts, preflight, fees, router, fields, grievance, errors, store round-trip.
- `npm run typecheck`, `npm run build` — must pass at the end of every plan.
- Curl transcripts in each plan's done-check: they prove a route works without a browser.
- Manual matrix before submission: 360px student flow, throttled 3G, dark mode, keyboard-only console
  pass, one cold reload mid-form after a forced upstream 500, both languages.

## 15. Non-goals (restated so nobody "helps")

No chatbot. No runtime LLM. No OCR. No document upload beyond a mock photo reference. No account
number or IFSC field. No student-typed tuition. No web fonts. No Tailwind or UI kit. No second repo.
No live government call. No official styling. No extra languages beyond Hindi and English. No
gamification, no badges, no streaks. No persona theatre in the demo: the operator types mock data.

## 16. Risks

| Risk | Mitigation |
|---|---|
| Scope is four surfaces | Plans are ordered so each ends in something demonstrable; the student path is complete before consoles start |
| Judges read "dashboard" as clone | The boundary page, the simulator, and the SLA/escalation engine are the differentiators and lead the video |
| Aggregator data is wrong somewhere | Every number carries `source` + `confidence` and the UI shows disagreement rather than inventing certainty |
| Codex requirement with no quota | Write-up states exactly what Codex did; nothing is attributed falsely |
| Neon cold start on demo day | Deploy early, warm before the demo, keep the JSON store path working for a local fallback |
