# Milegi Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all four surfaces — student app, institute console, DWO console, system simulator — on the Civic Ink design system, against the live API, and ship the demo.

**Architecture:** Server components render everything readable; client components exist only where interaction demands them (form autosave, console selection, simulator toggles). One hand-written token file plus small per-surface stylesheets. No UI kit, no Tailwind, no client data library, no web fonts.

**Tech Stack:** Next.js 16 App Router, React 19 server components, plain CSS with custom properties, `fetch`.

**Spec:** `docs/superpowers/specs/2026-08-20-milegi-design.md`
**Depends on:** `docs/superpowers/plans/2026-08-20-milegi-backend.md` (all 17 tasks green: `npm test`, `npm run typecheck`, `npm run build`, `bash scripts/smoke.sh`)

## Global Constraints

- Banner on **every** route including errors and the simulator, verbatim:
  `स्वतंत्र हैकथॉन प्रोटोटाइप · नकली डेटा · सरकारी वेबसाइट नहीं`
- Hindi is the default language; English is a complete parallel translation via `src/lib/i18n.ts`. No
  visible string literals in components — every word comes from the dictionary or from an API field.
- **Zero font requests.** No `next/font`, no font `<link>`, no `@import`. System stack only.
- Student surfaces work at 360px, 44px minimum touch targets, 16px inputs (no iOS zoom).
- No component may render a raw status code, stack trace, or upstream string. Errors render `ErrorNote`
  from the API's `{ code, hi, en, retryable, ref }`.
- Status is never colour alone: every state carries a glyph and a word.
- No money is displayed without its `basisHi` in the same block (enforced by the `Money` component).
- No `<div onClick>`: interactive elements are `button`, `a`, or a real form control.
- `prefers-reduced-motion` and `prefers-color-scheme` are both honoured.
- No new dependency without a line in the write-up.

---

### Task 1: Civic Ink tokens, primitives, shell, i18n, landing

**Files:**
- Create: `src/app/globals.css`, `src/ui/tokens.css`, `src/ui/primitives.css`
- Create: `src/ui/Banner.tsx`, `src/ui/Stack.tsx`, `src/ui/Field.tsx`, `src/ui/Button.tsx`, `src/ui/StatusChip.tsx`, `src/ui/DataRow.tsx`, `src/ui/Money.tsx`, `src/ui/Callout.tsx`, `src/ui/ErrorNote.tsx`, `src/ui/LangToggle.tsx`, `src/ui/ThemeToggle.tsx`
- Create: `src/lib/i18n.ts`, `src/lib/format.ts`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/app/error.tsx`, `src/app/not-found.tsx`

**Interfaces:**
- Produces: `t(key, lang)`, `fmtDate(iso, lang)`, `fmtMoney(n)`, `fmtDays(n, lang)`, `fmtWeekday(iso, lang)`; the primitives with the props in Step 4.

- [ ] **Step 1: Write the direction contract into the root layout**

First child of `<body>` in `src/app/layout.tsx`, as an HTML comment that survives the production build:

```
THESIS: This surface owns the sentence "your file has an owner and a deadline". It refuses the
government-portal arrangement where a citizen screen is a menu of logins plus a status word with no
clock, and it refuses the SaaS arrangement where everything is a rounded card.
OWN-WORLD: Ink on cool paper. Rules only where a boundary is real. One indigo action accent; waiting,
breach, verified and paid each carry a glyph plus a word. Tabular numerals, right-aligned money and
dates. Signature device: the stage ledger, a vertical rule with stage nodes carrying owner, date and
elapsed days. System type stack, no font request, Devanagari at 1.6 line-height.
STORY: The visitor learns this is independent and synthetic, sees what is checked before they type,
fills one form once, and leaves holding a page naming who has their file and until when.
FIRST VIEWPORT: banner; one line of what this is; the two real doors at full width; then the three
things this fixes, each one line with a number.
FORM: single-column civic record on mobile, dense ledger tables on operator surfaces. Direction pinned
by the builder (Civic Ink); no concept roll was run because a pinned direction beats the roll.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
```

- [ ] **Step 2: Write `src/ui/tokens.css`**

```css
:root {
  --paper: #F5F6F4;      --surface: #FFFFFF;     --surface-sunk: #EFF1EE;
  --ink: #14171A;        --ink-muted: #585F66;   --ink-faint: #7C848B;
  --rule: #DFE3DE;       --rule-strong: #C4CAC3;
  --action: #22357A;     --action-ink: #FFFFFF;  --action-hover: #1A2A63;
  --focus: #3355D1;
  --waiting: #8A5A00;    --waiting-bg: #FBF3E2;
  --breach: #A32219;     --breach-bg: #FCEEEC;
  --verified: #1C6B3F;   --verified-bg: #EAF4EE;
  --paid: #12513A;       --paid-bg: #E6F2EC;

  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px; --s5: 24px; --s6: 32px; --s7: 48px; --s8: 64px;
  --radius: 3px;                     /* records are cut, not rounded */
  --measure: 62ch;
  --font: ui-sans-serif, "Noto Sans Devanagari", "Nirmala UI", system-ui, -apple-system,
          "Segoe UI", Roboto, sans-serif;
  --mono: ui-monospace, "Cascadia Mono", "Roboto Mono", monospace;
  --step-s: 0.8125rem; --step-0: 0.9375rem; --step-1: 1.0625rem;
  --step-2: 1.25rem;   --step-3: 1.5rem;    --step-4: 1.9375rem;
  --motion: 150ms cubic-bezier(0.2, 0, 0.2, 1);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper: #14171A;    --surface: #1B1F23;     --surface-sunk: #111518;
    --ink: #ECEFF1;      --ink-muted: #A8B0B7;   --ink-faint: #7E868D;
    --rule: #2C3238;     --rule-strong: #3D444B;
    --action: #93A7EE;   --action-ink: #111518;  --action-hover: #AEBEF5;
    --focus: #93A7EE;
    --waiting: #E7B44F;  --waiting-bg: #2A2213;
    --breach: #F0837A;   --breach-bg: #2C1715;
    --verified: #74C795; --verified-bg: #13251B;
    --paid: #8FD6B0;     --paid-bg: #10251C;
  }
}
:root[data-theme="dark"] { /* repeat the dark values so the toggle wins in both directions */ }

@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
```

Dark mode is not decoration: students apply at 11pm because the real portal 502s during the day.

- [ ] **Step 3: Write `primitives.css` and `globals.css`**

`globals.css`: reset (`box-sizing`, zero margins, `-webkit-text-size-adjust: 100%`), `body { background:
var(--paper); color: var(--ink); font: var(--step-0)/1.6 var(--font) }`, `:lang(hi) { line-height: 1.65 }`,
`:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px }`,
`input, select, textarea { font-size: 16px }`, `.tnum { font-variant-numeric: tabular-nums }`, `.skip-link`.

`primitives.css` holds exactly these classes and nothing speculative: `.sheet` (surface + 1px rule),
`.stack > * + *` (rhythm via `--gap`), `.row`, `.ledger` (the stage rail: 2px `--rule-strong` left border
with `::before` nodes), `.tbl` (dense operator table: sticky `thead`, 32px rows, right-aligned `.tnum`
cells, zebra via `--surface-sunk`), `.chip`, `.btn`, `.btn-primary`, `.btn-quiet`, `.field`,
`.field-error`, `.callout[data-tone]`.

- [ ] **Step 4: Write the primitives**

Exact props, because later tasks call them:

```tsx
Banner()                                          // top of every page; stacks at 360px
LangToggle()                                      // ?lang= plus a cookie; no client router push
ThemeToggle()                                     // sets data-theme on <html>, persisted
Stack({ gap?: 1|2|3|4|5, children })
DataRow({ labelHi, labelEn, value, hint?, provenance? })
Money({ amount, basisHi, basisEn, label })        // cannot render without the basis line
StatusChip({ tone: "waiting"|"breach"|"verified"|"paid"|"neutral", glyph, children })
Button({ variant?: "primary"|"quiet", pending?, ...buttonProps })
Field({ spec: FieldSpec, value, error?, provenance?, onChange? })
Callout({ tone: "info"|"warn"|"danger"|"ok", titleHi, children })
ErrorNote({ error: { code, hi, en, retryable, ref } })   // ref shown; retry button when retryable
```

`Money` is the mechanical guard for the honesty rule: printing an amount without its basis is impossible.

- [ ] **Step 5: Write `i18n.ts` and `format.ts`**

`i18n.ts` exports `DICT: Record<string, { hi: string; en: string }>` and `t(key, lang)`. Seed with every
string this task needs (banner, landing lines, the two doors, error copy, toggle labels). Later tasks add
keys; nobody adds a literal to a component.

`format.ts`: `fmtMoney(n)` → `₹19,800` via `toLocaleString("en-IN")`; `fmtDate(iso, lang)` → `21 नव 2026` /
`21 Nov 2026`; `fmtDays(n, lang)` → `12 दिन` / `12 days`; `fmtWeekday(iso, lang)` for deadlines.

- [ ] **Step 6: Write the landing page**

`src/app/page.tsx`, server component, no API call. In order: one line of what this is and is not; the two
doors — `नया आवेदन शुरू करें` → `/pravesh`, `अपनी फ़ाइल देखें` → `/pravesh?mode=track`; three one-line claims each
carrying a real number from the evidence file (eight login doors → one; ~30 minutes of typing before
anything is validated → validated first; a file that sat three months with no owner → every stage has an
owner and a clock); a quiet link row to `/seemayein` and `/madad`.

No hero image, no gradient, no icon tiles. The first viewport states the thesis.

- [ ] **Step 7: Write `error.tsx` and `not-found.tsx`**

`error.tsx` is a client component rendering `ErrorNote` with `code: "CLIENT_RENDER"`, a reset button, and
the banner; it never prints the thrown message. `not-found.tsx` offers `/pravesh?mode=track`.

- [ ] **Step 8: Verify**

```bash
npx next dev &
sleep 6
curl -s localhost:3000/ | grep -c 'स्वतंत्र हैकथॉन प्रोटोटाइप'
curl -s localhost:3000/ | grep -ciE 'fonts.googleapis|fonts.gstatic|next/font'
npm run build
```

Expected: `1`, then `0`, then a clean build. In a browser at 360px: banner visible, both doors reachable
by keyboard, focus ring visible, dark mode follows the OS, zero font requests in the Network tab.

- [ ] **Step 9: Commit**

```bash
git add src/app/globals.css src/ui src/lib/i18n.ts src/lib/format.ts src/app/layout.tsx src/app/page.tsx src/app/error.tsx src/app/not-found.tsx
git commit -m "feat: civic ink tokens, primitives, shell and landing"
```

---

### Task 2: API client, autosave, offline queue

**Files:**
- Create: `src/lib/api.ts`, `src/lib/useAutosave.ts`, `src/lib/queue.ts`, `src/lib/queue.test.ts`

**Interfaces:**
- Produces: `api.get/post/patch`, `ApiError`; `useAutosave({ caseId, initial })` → `{ values, update, saveState, flush, lastError, fieldErrors }`; `mergePatches(list)`, `nextBackoffMs(attempt)`, `readLocal(caseId)`, `writeLocal(caseId, values)`.

- [ ] **Step 1: Write the failing queue test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { mergePatches, nextBackoffMs } from "./queue";

test("patches merge last-write-wins per field, preserving unrelated fields", () => {
  assert.deepEqual(
    mergePatches([{ marksTotal: 600 }, { marksObtained: 410 }, { marksTotal: 1200 }]),
    { marksTotal: 1200, marksObtained: 410 },
  );
});

test("backoff grows and is capped", () => {
  assert.equal(nextBackoffMs(0), 1000);
  assert.equal(nextBackoffMs(1), 2000);
  assert.ok(nextBackoffMs(9) <= 30000);
});

test("an empty queue merges to an empty patch, not undefined", () => {
  assert.deepEqual(mergePatches([]), {});
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm test` → FAIL, `Cannot find module './queue'`.

- [ ] **Step 3: Implement `queue.ts` and `api.ts`**

`api.ts` wraps `fetch`, parses the envelope, and throws `ApiError` carrying `{ code, hi, en, retryable,
ref }` for any `ok: false`. A network failure becomes `{ code: "NETWORK", hi: "नेटवर्क नहीं मिल रहा। आपका
ड्राफ़्ट इस फ़ोन पर सुरक्षित है।", retryable: true }`. No component calls `fetch` directly.

- [ ] **Step 4: Implement `useAutosave.ts`**

Behaviour, exactly:

1. On mount, read `localStorage["milegi:draft:" + caseId]` and merge it **over** the server `initial` —
   after a crash the phone copy is the newer one.
2. `update(name, value)` writes state **and** `localStorage` immediately, on every keystroke batch,
   unconditionally, never gated on `navigator.onLine`: a 502 mid-PATCH looks nothing like being offline,
   and that is the demo.
3. A 900ms debounce sends the merged pending patch. `dirtyRef` is updated inside `update` so an immediate
   `flush()` sees the last keystroke.
4. `saveState` ∈ `local` (`इस फोन पर सेव है`) / `pending` (`अभी सिंक नहीं हुआ`) / `saved` (`सेव हो गया`),
   rendered in an `aria-live="polite"` region.
5. On failure the patch stays queued, `saveState` stays `pending`, `lastError` is set, retry uses
   `nextBackoffMs`. It never throws into render.
6. The server's `rejected` array becomes `fieldErrors`, surfaced next to the fields — never swallowed.
7. `beforeunload` flushes via `navigator.sendBeacon` when a patch is pending.

- [ ] **Step 5: Prove the crash path by hand**

Start typing in a form, kill the dev server mid-typing, reload the page: fields still filled, indicator
reads `अभी सिंक नहीं हुआ`; restart the server and the indicator flips to `सेव हो गया` with no click.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api.ts src/lib/useAutosave.ts src/lib/queue.ts src/lib/queue.test.ts
git commit -m "feat: api client, per-keystroke local draft, retrying sync queue"
```

---

### Task 3: Entry, OTR, and the router that replaces eight doors

**Files:**
- Create: `src/app/pravesh/page.tsx`, `src/app/pravesh/OtpForm.tsx`
- Create: `src/app/otr/page.tsx`, `src/app/otr/OtrForm.tsx`
- Create: `src/app/raasta/page.tsx`, `src/app/raasta/RouteWizard.tsx`

**Interfaces:**
- Consumes: `api`, primitives, `POST /api/auth/otp`, `POST /api/auth/verify`, `POST /api/otr`, `POST /api/route`, `GET /api/institutes`, `POST /api/cases`.

- [ ] **Step 1: Build `/pravesh`**

One field (10-digit mobile), one button. The returned demo OTP is displayed in a `Callout tone="info"`
with `यह नकली OTP है — कोई SMS नहीं भेजा गया`. Second step: 6 digits, autofocus, `inputMode="numeric"`.
`?mode=track` swaps the heading to `अपनी फ़ाइल देखें` and, after verification, goes to the newest case
instead of `/raasta`. A third quiet link — `पंजीकरण नंबर से देखें` — takes a tracking code straight to
`GET /api/track/[code]` with no login at all.

- [ ] **Step 2: Build `/otr`**

Three fieldsets on one page, not three pages: **मोबाइल सत्यापन** (already done, shown complete),
**आधार e-KYC** (demo-Aadhaar field with the `0000` rule stated *above* the input, not only in the error),
**OTR विवरण** (name, father, mother, DOB, gender, category, district, address). On submit:

- Success → the minted OTR in a `sheet` with a copy button, the `नकली` chip, and one line that this is a
  lifetime id which must never be created twice.
- `duplicateOf` present → **not** an error state. Show the existing OTR, the line `आपका OTR पहले से मौजूद है
  — नया बनाने की ज़रूरत नहीं`, both OTRs when a duplicate was recorded, and a primary button to continue as
  a renewal. This is the clearest "we fixed a real trap" moment in the demo; design it as a state.
- Upstream down → `ErrorNote` with retry; typed values survive and the section is re-submittable.

- [ ] **Step 3: Build `/raasta`**

Three questions on one screen, radio groups with large targets:

1. `अभी क्या पढ़ रहे हो?` — कक्षा 9-10 / कक्षा 11-12 / कॉलेज, डिप्लोमा या आई.टी.आई.
2. `क्या यह इस कोर्स का पहला साल है?` — हाँ / नहीं
3. `पिछले साल इसी कोर्स पर छात्रवृत्ति मिली थी?` — हाँ / नहीं / **पता नहीं**

Plus the two facts students are never asked and then rejected for — `कोर्स या कॉलेज बदला है`,
`पिछले साल आवेदन अस्वीकृत हुआ था` — and one toggle, `संस्थान उत्तर प्रदेश के बाहर है`.

The result panel states the resolved track and cycle **with the reason**, always shows `recoveryHi`, and
shows `warnHi` when present. Then institute type-ahead (`GET /api/institutes`, published institutes
only), then course select — published courses selectable, unpublished ones listed greyed with
`कॉलेज ने इस सत्र में प्रकाशित नहीं किया` so the student learns the real cause — then a primary button that
creates the case and goes to `/taiyari/[caseId]`.

Nothing here may say "no record found". An empty institute search names the fix and gives the student the
sentence to say to the college nodal officer.

- [ ] **Step 4: Verify**

At 360px all three questions plus the result fit with no horizontal scroll; every radio is keyboard
reachable; `पता नहीं` yields the renewal side plus the recovery line; minting the same demo Aadhaar twice
yields the duplicate-recovery panel, not an error.

- [ ] **Step 5: Commit**

```bash
git add src/app/pravesh src/app/otr src/app/raasta
git commit -m "feat: one entry door, inline OTR with duplicate recovery, three-question router"
```

---

### Task 4: Pre-flight screen — the check that happens before typing

**Files:**
- Create: `src/app/taiyari/[caseId]/page.tsx`, `src/app/taiyari/[caseId]/PreflightList.tsx`, `src/app/taiyari/[caseId]/CertificateCheck.tsx`

**Interfaces:**
- Consumes: `POST /api/cases/[id]/preflight`, `POST /api/cases/[id]/verify-certificate`, `GET /api/cases/[id]`.

- [ ] **Step 1: Build the summary head**

Server component. Top of the page answers three things before any list: how many items are `blocked`, how
many `warn`, and what the single next action is. Copy pattern:
`3 में से 1 चीज़ रुकावट है — फ़ॉर्म भरना अभी भी शुरू कर सकते हैं, लॉक करने से पहले यह ठीक करनी होगी।`

This sentence is the product's argument in one line: a blocker stops the **lock**, never the typing.

- [ ] **Step 2: Build `PreflightList`**

One row per `PreflightItem`, in the API's order, each row rendering:

- `StatusChip` with a glyph and a word: `blocked` → `✕ रुकावट` (breach tone), `warn` → `! ध्यान दें`
  (waiting tone), `ok` → `✓ ठीक है` (verified tone), `unknown` → `? पता नहीं चला` (neutral).
- `titleHi` as the row heading, `detailHi` beneath it with the **actual numbers and dates** the API sent.
- `actionHi` as a bordered action line, prefixed by who must do it, from `fixedBy`:
  `आपको करना है` / `कॉलेज को करना है` / `बैंक में करना है` / `तहसील/ई-डिस्ट्रिक्ट से` — this is where the
  platform-versus-government boundary becomes visible per item instead of as a disclaimer.
- `etaHi` on the right as `समय: 3-5 दिन` where present.
- `source` as a superscript link when the rule is a published one.

An `unknown` row must render differently from `ok`: it says the check could not run and offers a retry
button, because a silent pass on an outage is exactly the failure this product exists to remove.

- [ ] **Step 3: Build `CertificateCheck`**

Two inline verifications (income, caste), each two fields plus a verify button. On success it prints the
issue date, the computed **expiry date**, and one of:

- `प्रमाणपत्र भुगतान अवधि (दिसंबर 2026) तक वैध है` — verified tone.
- `यह प्रमाणपत्र <date> को खत्म हो जाएगा, और भुगतान <window> में होता है — अभी नया बनवाना पड़ेगा` — breach tone,
  because this is the trap that fails students in December after they were "approved" in September.

On `not_found`, the copy says the number was not found in e-District records and asks them to re-check the
application number against the certificate — not "invalid".

- [ ] **Step 4: Bottom actions**

Primary: `फ़ॉर्म भरना शुरू करें` → `/aavedan/[caseId]` (always enabled). Quiet: `दोबारा जाँचें` (re-runs
preflight). If any blocker exists, a `Callout tone="warn"` above the primary states which item will stop
the lock, so nobody is surprised at the end.

- [ ] **Step 5: Verify**

```bash
curl -s localhost:3000/api/sim/config -X POST -H 'content-type: application/json' \
  -d '{"system":"edistrict","health":"down","failureRate":0}'
```

Reload `/taiyari/<case>`: the certificate rows show `? पता नहीं चला` with a retry, **not** a green tick and
not a red failure. Restore the upstream and retry inline — the row flips without a page reload.

- [ ] **Step 6: Commit**

```bash
git add src/app/taiyari
git commit -m "feat: pre-flight screen with per-item owner, eta and honest unknown state"
```

---

### Task 5: The one adaptive form

**Files:**
- Create: `src/app/aavedan/[caseId]/page.tsx`, `src/app/aavedan/[caseId]/FormShell.tsx`, `src/app/aavedan/[caseId]/Section.tsx`, `src/app/aavedan/[caseId]/FeePanel.tsx`, `src/app/aavedan/[caseId]/SaveState.tsx`, `src/app/aavedan/[caseId]/aavedan.css`

**Interfaces:**
- Consumes: `GET /api/cases/[id]`, `PATCH /api/cases/[id]/draft`, `POST /api/cases/[id]/fee-dispute`, `fieldsFor`, `SCHEMES`, `useAutosave`.

- [ ] **Step 1: Build the section skeleton**

`page.tsx` (server) fetches the case and renders `FormShell` (client) with `initial`, the resolved section
list from `SCHEMES[track].sections`, and the field specs per section. One page; each section is a
`<section>` with an `h2`, a completion count (`4/6 भर गए`), and a jump-nav at the top that is a plain
anchor list — not a stepper, because a stepper implies you cannot skip, and here you can.

Sections render in the spec's order: पहचान → शिक्षा → पिछला परिणाम → परिवार और प्रमाणपत्र → शुल्क → घोषणा.
`पिछला परिणाम` is omitted entirely when `SCHEMES[track].sections` omits it. No empty sections, ever.

- [ ] **Step 2: Build identity with provenance**

Read-only rows via `DataRow` with a `provenance` chip: `आधार से` for name/DOB/gender,
`पिछले वर्ष से` for anything prefilled on a renewal. Under the block, one line:
`नाम या जन्मतिथि आधार से आती है। गलत है तो पहले आधार सुधारें — यहाँ बदलने से फ़ाइल बाद में रुकती है।`
That sentence replaces a field that would otherwise create a downstream rejection.

- [ ] **Step 3: Build the education and result sections**

Every input is a `Field` driven by `FieldSpec`, so labels, hints and validation come from the shared
source. Two client-side aids that map to documented failures:

- On `marksTotal` under 50 → inline hint `यह CGPA जैसा दिख रहा है` (matching the server's validator, so the
  student sees it before the round trip).
- On `enrolmentNo` → a hint that spaces and dashes are the common cause of the university mismatch code.

`hosteller` shows a live consequence line: `छात्रावास चुनने पर रखरखाव भत्ता ₹570/माह अनुमानित होगा`, recomputed
from the case's `estimate` after each save. A field that changes money must show the change.

- [ ] **Step 4: Build `FeePanel` — read-only, itemised**

Tuition from master data as the only counted figure, then each excluded head with a strike-through, its
amount, and one shared sentence: `छात्रवृत्ति में केवल गैर-वापसी योग्य शुल्क आता है — छात्रावास, मेस, कॉशन मनी,
पुस्तकालय और परीक्षा शुल्क नहीं।` Then `Money` with the estimate and its basis.

One button: `रसीद मेल नहीं खाती` → a small form (`amount`, `note`) posting `fee-dispute`. After success the
panel shows `आपत्ति दर्ज — कॉलेज लिपिक को दिखेगी` with the date. There is **no** fee input.

- [ ] **Step 5: Build `SaveState` and the sticky footer**

Footer, sticky on mobile, contains: the save state (`aria-live`), a `जाँच करें और लॉक करें` primary linking
to `/jaanch/[caseId]`, and the deadline (`अंतिम तारीख़ 31 अक्तू 2026 · 9 दिन बाकी`). The deadline is always
visible while typing, because the real portal hides it behind a timetable popup.

- [ ] **Step 6: Verify at 360px and under failure**

- Type into three sections, force-refresh mid-typing: everything is still there, state reads
  `अभी सिंक नहीं हुआ`, then `सेव हो गया`.
- `POST /api/sim/config {"system":"edistrict","health":"down"}` while typing: typing never blocks, no
  error toast storm, one `ErrorNote` with a retry.
- Send `{"nonRefundable": 1}` through the console: the field errors area shows the rejection and the
  number on screen does not move.

- [ ] **Step 7: Commit**

```bash
git add src/app/aavedan
git commit -m "feat: one adaptive single-page form with provenance, read-only fee panel, live save state"
```

---

### Task 6: Review and lock

**Files:**
- Create: `src/app/jaanch/[caseId]/page.tsx`, `src/app/jaanch/[caseId]/LockPanel.tsx`

- [ ] **Step 1: Build the review list**

Every section rendered as `DataRow`s with an `edit` anchor back to that section. Missing required fields
appear at the top as an error summary that links to each field (`#field-marksTotal`), which is also the
accessibility requirement.

- [ ] **Step 2: Build the pre-lock consequence panel**

Before the lock button, state plainly what lock means, using the case's own dates:

- `लॉक के बाद ऑनलाइन बदलाव सिर्फ़ सुधार विंडो में होता है — इस वर्ग के लिए 21 नव से 20 दिस 2026 तक।`
- `हार्ड कॉपी 3 दिन में कॉलेज में जमा करनी होगी: <weekday, date>।`
- `संस्थान को <date> तक अग्रसारित करना है, वरना फ़ॉर्म स्वतः निरस्त हो जाता है।`

The third line is the auto-cancellation rule that students discover only after it happens.

- [ ] **Step 3: Build the lock action**

`POST /api/cases/[id]/lock`. On `422` (`FORM_INCOMPLETE` or `PREFLIGHT_BLOCKED`), render the returned
Hindi text as an `ErrorNote` and scroll to the error summary — never a generic "please check the form".
On success, show the minted 15-digit registration number, a print link (`window.print()` with a print
stylesheet), and route to `/f/[caseId]`.

- [ ] **Step 4: Print stylesheet**

`@media print`: hide nav, toggles and buttons; show the banner, the registration number, the case id, the
form values as a two-column record, and a footer line `यह नकली प्रोटोटाइप प्रिंट है — सरकारी दस्तावेज़ नहीं`.
The printout is part of the real process, so it gets designed, not defaulted.

- [ ] **Step 5: Verify**

Lock with a missing declaration → the error summary names it. Fix and lock → registration number appears,
`/f/<case>` shows `institute_review` with the clerk's name and the hard-copy clock running.

- [ ] **Step 6: Commit**

```bash
git add src/app/jaanch
git commit -m "feat: review, consequence-stating lock, and a designed printout"
```

---

### Task 7: The case file — the product

**Files:**
- Create: `src/app/f/[caseId]/page.tsx`, `src/app/f/[caseId]/StageLedger.tsx`, `src/app/f/[caseId]/AlertList.tsx`, `src/app/f/[caseId]/OwnerCard.tsx`, `src/app/f/[caseId]/CorrectionTasks.tsx`, `src/app/f/[caseId]/Timeline.tsx`, `src/app/f/[caseId]/f.css`
- Create: `src/app/soochnaayein/[caseId]/page.tsx`, `src/app/shikayat/[caseId]/page.tsx`
- Create: `src/app/t/[code]/page.tsx` (public tracking view)

**Interfaces:**
- Consumes: `GET /api/cases/[id]`, `GET /api/track/[code]`, `POST /api/cases/[id]/nudge`, `POST /api/cases/[id]/grievance`.

- [ ] **Step 1: Build the head — the four answers, above the fold**

In this order, at 360px, before any scroll:

1. `StatusChip` + the stage in Hindi + `12 दिन से इसी चरण पर` .
2. `OwnerCard`: who holds it — name, designation, organisation, and `contactHint` (a room or cell, never a
   phone number we invented). Deadline line: `समय सीमा 7 नव 2026 · 4 दिन पार`.
3. Your next action, or the honest absence of one: `अभी आपको कुछ नहीं करना है — फ़ाइल कॉलेज के पास है`.
4. `Money` with the estimate and its basis.

- [ ] **Step 2: Build `StageLedger`**

The signature device. A vertical rule with one node per stage of this track's chain (school files skip
university scrutiny), each node carrying: stage name, actor, entered date, days spent, and for the
current node the deadline and days remaining or overdue. Past nodes are ink; the current node is filled
and accented; future nodes are `--rule-strong` outlines with no invented dates — a future stage shows the
published window, not a prediction.

- [ ] **Step 3: Build `AlertList`**

Renders `deriveAlerts` output verbatim: title, detail, action. Two behaviours that matter:

- A `stage_breach` alert shows the wait in days and, when an escalation exists, the line
  `स्वतः अनुरोध <date> को <authority> को भेजा गया — प्रतीक्षा गिनती वहीं से जारी है`. The counter must visibly
  **not** reset; that is the difference between accountability and theatre.
- `hardcopy_due` shows the weekday, because "by Friday" is how the deadline is actually understood.

Nudge button posts `nudge` and appends to the timeline without changing any clock.

- [ ] **Step 4: Build `CorrectionTasks`**

When `stage === "correction_required"`, the page becomes a task list, one card per flag:

- The reason in Hindi from `REASONS`, the fix (`fixHi`), who fixes it (`fixedBy`), and whether the
  correction window can fix it at all.
- For `correctable: false` codes (duplicate income certificate, directorate block, attendance), the card
  says explicitly that the online window will not help and names the real route — this is the honest
  answer the real portal never gives.
- Window dates: if it has not opened, `सुधार विंडो 21 नव को खुलेगी — तब तक ये कागज़ तैयार रखें`; if open,
  a primary button to `/aavedan/[caseId]` plus the 3-day re-submission warning.

- [ ] **Step 5: Build `Timeline`**

Every `CaseEvent`, newest first: date, actor with role, `summaryHi`. Auto-forward and escalation events
are visually marked as machine actions. This is where "why" lives, and it is also the audit trail a judge
will click.

- [ ] **Step 6: Build the outbox and the grievance page**

`/soochnaayein/[caseId]`: the notification table (date, channel, text) with a header line stating these
are recorded, not sent, because this is a prototype. It is the answer to "the portal never tells you
anything".

`/shikayat/[caseId]`: fetch the generated draft, render it in a `<pre>` with a copy button, plus a line
naming the real escalation routes generically (Jansunwai, the district office) with no invented numbers,
plus one honest sentence that a prototype cannot file anything on the student's behalf.

- [ ] **Step 7: Build the public tracking view `/t/[code]`**

Same head and ledger, no form data, no certificate numbers, and a note that this link is shareable. This
is the "check status without logging in" that the real portal hides behind a login and a captcha.

- [ ] **Step 8: Verify with the simulator**

```bash
curl -s localhost:3000/api/sim/advance -X POST -H 'content-type: application/json' -d '{"days":12}'
```

Reload `/f/<case>`: the breach alert appears, an escalation event is in the timeline, the wait reads 12
days (not zero), and a notification exists in the outbox. Press nudge: a new timeline row, same 12 days.

- [ ] **Step 9: Commit**

```bash
git add src/app/f src/app/soochnaayein src/app/shikayat src/app/t
git commit -m "feat: case file with stage ledger, SLA alerts, correction tasks, outbox, grievance draft"
```

---

### Task 8: Institute console

**Files:**
- Create: `src/app/sansthan/page.tsx` (login), `src/app/sansthan/kaksh/page.tsx` (queue), `src/app/sansthan/kaksh/[caseId]/page.tsx`, `src/app/sansthan/master/page.tsx`, `src/app/sansthan/sansthan.css`
- Create: `src/ui/QueueTable.tsx`, `src/ui/BulkBar.tsx`

**Interfaces:**
- Consumes: `POST /api/auth/operator`, `GET /api/institute/queue`, `POST /api/institute/cases/[id]/{hardcopy,attendance,forward,return}`, `POST /api/institute/bulk-forward`, `POST /api/institute/master`.

- [ ] **Step 1: Build the login**

Two fields (institute code, PIN) and the demo credentials printed on the page under a line saying they are
demo credentials on purpose. Do not hide what a judge is allowed to use.

- [ ] **Step 2: Build the queue — density on purpose**

`QueueTable` using `.tbl`: sticky header, 32px rows, columns
`चुनें | आवेदन | छात्र | कोर्स | चरण | प्रतीक्षा | समय सीमा | हार्ड कॉपी | उपस्थिति | आपत्ति`.
Numbers right-aligned and tabular. Default sort: breach days descending, so the files that are about to
be auto-cancelled are on top — the queue's job is triage, not chronology.

Above the table, three counters as one line: `कुल 42 · समय सीमा पार 6 · हार्ड कॉपी बाकी 11`, each a filter.
Row-level state uses `StatusChip`; a breached row also gets a left border in `--breach`.

Keyboard: `j`/`k` move, `space` selects, `f` forwards the selection. Document the keys on the page — an
operator surface that cannot be driven from the keyboard is not finished.

- [ ] **Step 3: Build the single-file view**

Left: the student's submitted record, read-only, with the fee panel and any dispute. Right: the actions —
mark hard copy received (date picker defaulting to today), attendance percent (with the 75% rule shown and
a refusal explained inline if below), forward, or return with a reason code from a `select` populated from
`REASONS` where `raisedBy: "institute"`. Returning requires a code; the note is optional.

After forwarding, show what happens next and when, from the API's fresh case: the next owner and the next
deadline. The clerk should see the consequence of their click.

- [ ] **Step 4: Build bulk forward**

`BulkBar` appears when a selection exists: `6 चुने गए` + `अग्रसारित करें`. The response's partial success is
rendered as two lists — forwarded ids, and refused ids each with the Hindi reason. A bulk action that
silently drops failures would recreate the exact silence this product is against.

- [ ] **Step 5: Build the master-data page**

The screen that fixes `COURSE_NOT_PUBLISHED`. A table of courses with tuition and the excluded heads, an
edit row, and a publish button per course. Publishing shows `प्रकाशित — अब छात्र इसे चुन सकते हैं` with the
timestamp. A one-line note explains that an unpublished course is invisible to students, which is why a
student's "my course is missing" is really this page's problem.

- [ ] **Step 6: Verify**

Log in, try to forward a file with no hard copy → refusal with the Hindi reason. Mark hard copy, set
attendance 68 → refusal naming the 75% rule. Set 82 → forwards, and the destination differs for a degree
file (university scrutiny) versus a school file (DWO). Publish `BED`, then re-run a student's pre-flight →
the blocker is gone.

- [ ] **Step 7: Commit**

```bash
git add src/app/sansthan src/ui/QueueTable.tsx src/ui/BulkBar.tsx
git commit -m "feat: institute console — triage queue, hard copy, attendance, bulk forward, master data"
```

---

### Task 9: DWO console

**Files:**
- Create: `src/app/dwo/page.tsx` (login), `src/app/dwo/kaksh/page.tsx`, `src/app/dwo/kaksh/[caseId]/page.tsx`, `src/app/dwo/svikriti/page.tsx`, `src/app/dwo/dwo.css`

**Interfaces:**
- Consumes: `GET /api/dwo/queue`, `POST /api/dwo/cases/[id]/{crosscheck,verify,flag,reject}`, `POST /api/dwo/sanction`.

- [ ] **Step 1: Build the district queue**

`.tbl` again, columns `चुनें | आवेदन | संस्थान | कोर्स | वर्ग | प्रतीक्षा | जाँच परिणाम | अनुमानित राशि`.
The `जाँच परिणाम` cell is the differentiator: a compact run of glyphs, one per cross-check
(board, enrolment, income, duplicate, attendance, intake), each with a tooltip and an accessible label.
Filters: `सभी` / `जाँच में आपत्ति` / `समय सीमा पार` / `सत्यापित`.

- [ ] **Step 2: Build the single-file review**

Cross-check results as rows, each with the registry value beside the submitted value so a mismatch is
visible rather than asserted — this is what makes a "suspect data" verdict defensible instead of opaque.
An upstream failure renders as `जाँच नहीं हो सकी` with the outage note, never as a mismatch.

Actions: `सत्यापित करें`, `आपत्ति दर्ज करें` (multi-select of `REASONS` where `raisedBy: "dwo"`, with each
code's student-facing fix shown so the officer sees what the student will be told), `अस्वीकृत करें`
(requires a code). Flagging shows the correction window dates that the student will get.

- [ ] **Step 3: Build the sanction batch**

Select verified files → `स्वीकृति जारी करें`. Shows the batch total with `Money` and its basis, then posts.
Partial refusals are listed with reasons. After sanction, each case's next stage and window are shown.

- [ ] **Step 4: Verify**

Break a case's enrolment number through the student form, run cross-check → `ENROLMENT_MISMATCH` with both
values side by side. Flag it → the student's case file becomes a task list with the same code and its fix.
Verify another → sanction batch → `POST /api/sim/pfms` → one case `paid`, one `payment_failed` with
`NPCI_NOT_SEEDED`, both visible on the student side with the bank action.

- [ ] **Step 5: Commit**

```bash
git add src/app/dwo
git commit -m "feat: DWO console — cross-check evidence, coded flags, sanction batch"
```

---

### Task 10: System simulator

**Files:**
- Create: `src/app/mock/page.tsx`, `src/app/mock/SimPanel.tsx`, `src/app/mock/mock.css`
- Create: `src/ui/SimBadge.tsx` (global banner addition when an upstream is down)

**Interfaces:**
- Consumes: `GET /api/sim/state`, `POST /api/sim/config`, `POST /api/sim/advance`, `POST /api/sim/pfms`, `POST /api/sim/reset`.

- [ ] **Step 1: Build the panel**

Four blocks, utilitarian and dense:

1. **उपस्थित प्रणालियाँ** — six rows (e-KYC, DigiLocker, e-District, बोर्ड/विश्वविद्यालय, NPCI, PFMS), each
   with `up / slow / down` radio buttons and a failure-rate number input. Changing one is instant.
2. **घड़ी** — current simulated date, offset in days, buttons `+1 दिन`, `+7 दिन`, `+30 दिन`, and a custom
   field. Each advance prints its `SweepReport`: what escalated, what auto-advanced, what lapsed.
3. **भुगतान** — forced PFMS outcome select (the six documented outcomes) plus `बैच चलाएँ`, showing each
   case's result row.
4. **रीसेट** — reseed with a confirm.

Plus a live counter strip by stage, so a judge can see the whole pipeline's population at once.

- [ ] **Step 2: Add the global degradation badge**

`SimBadge` reads `/api/sim/state` in the root layout (server component, no cache) and, when any upstream is
`down`, renders one line under the banner: `<प्रणाली> अभी बंद है (मॉक) — जाँच वाले चरण रुक सकते हैं, आपका ड्राफ़्ट
सुरक्षित है`. Real portals go down silently; this is the opposite behaviour, demonstrated.

- [ ] **Step 3: Label everything**

The page header states that this panel exists because every government integration here is a mock, lists
what each mock stands in for, and links `/seemayein`. Every simulator response already carries
`simulated: true`; the UI shows a persistent `मॉक पैनल` chip.

- [ ] **Step 4: Verify**

Take NPCI down → a student pre-flight shows `? पता नहीं चला` for DBT and the badge appears. Advance 12 days
→ escalations appear on the case files. Force `limit_exceeded` and run the batch → the student's file shows
the transaction-limit cause and the bank action.

- [ ] **Step 5: Commit**

```bash
git add src/app/mock src/ui/SimBadge.tsx
git commit -m "feat: system simulator — upstream health, clock travel, payment outcomes, degradation badge"
```

---

### Task 11: Boundary page, help, accessibility and performance pass

**Files:**
- Create: `src/app/seemayein/page.tsx`, `src/app/madad/page.tsx`
- Modify: whichever components the audit turns up

- [ ] **Step 1: Build `/seemayein` — what a platform can and cannot fix**

Two columns from spec §11, as a real table (not cards). Left rows link to the exact screen that fixes the
thing. Right rows state the honest answer and, where relevant, name the real-world route. Below the table,
the mocked-versus-real table from spec §10, and a short paragraph on how this would work at scale: the SLA
and escalation engine is the only structural change, everything else is configuration per state.

This page is a judging asset. Write it as prose a reviewer can quote, not as bullet soup.

- [ ] **Step 2: Build `/madad`**

The five things students get wrong, each answered in three lines: OTR versus registration number; never
mint a second OTR and how to recover instead; which fee counts; the 3-year certificate rule; what each
status word actually means (the table from the evidence file, in Hindi, with the action per status).

- [ ] **Step 3: Run the mechanical design detector**

```bash
node /home/mrstark/.claude/plugins/cache/impeccable/impeccable/4.0.4/skills/impeccable/scripts/detect.mjs \
  --json src/app src/ui
```

Fix everything mechanical it reports. Run it once, not in a loop.

- [ ] **Step 4: Accessibility pass**

- Every input has a `<label for>`; hints are wired with `aria-describedby`; errors with
  `aria-invalid` + `role="alert"`.
- One `h1` per page, headings in order, `main` landmark, a working skip link.
- Keyboard-only run of both consoles, including bulk actions and the reason-code selects.
- `lang="hi"` on `<html>` with `lang="en"` on the English strings when the toggle is set.
- Contrast check every token pair actually used (ink on paper, chip text on chip background, action ink on
  action) in both themes; fix tokens, not individual components.
- Zoom to 200% at 360px: no clipped content, no horizontal scroll on student surfaces.

- [ ] **Step 5: Performance pass**

- Confirm zero font requests and no client-side data library in the production bundle.
- Student routes: check the JS payload per route (`next build` output) and cut any accidental client
  component — the target is under 60KB per student route.
- Throttle to slow 3G in devtools and walk the student journey: nothing should be unusable, and the save
  indicator must remain truthful throughout.
- Operator tables must stay usable at 200 rows (seed enough cases via the smoke script to check).

- [ ] **Step 6: Commit**

```bash
git add src/app/seemayein src/app/madad src/ui src/app
git commit -m "feat: boundary and help pages; accessibility and performance pass"
```

---

### Task 12: Ship — deploy, review, video, write-up

**Files:**
- Create: `README.md`, `docs/WRITEUP.md`, `docs/VIDEO.md`, `DESIGN.md` (written at the end, from the build)

- [ ] **Step 1: Deploy**

```bash
npx vercel link
npx vercel env add DATABASE_URL production      # pooled Neon string, hostname contains -pooler
npx vercel env add MILEGI_SESSION_SECRET production
npx vercel --prod
```

Confirm `MILEGI_STORE_PATH` is **not** set in production, and that removing `DATABASE_URL` produces the
503 `STORE_UNCONFIGURED` body rather than a silently forgetful demo.

- [ ] **Step 2: Cold-path QA on the deployed URL**

In a fresh browser profile, in this order: landing → OTP → OTR → duplicate OTR → router with `पता नहीं` →
pre-flight with an expired certificate → form with a forced 502 mid-typing → lock → institute console
(hard copy, attendance refusal, forward) → simulator advance 12 days → case file breach and escalation →
DWO cross-check and flag → correction window → verify → sanction → PFMS failure → bank action → retry →
paid. Then open `/t/<code>` in a second browser with no session.

Every step must work without a console error. Anything that only works on localhost is not shipped.

- [ ] **Step 3: Run the finish review**

Capture desktop and mobile screenshots of the landing page, pre-flight, form, case file, institute queue,
DWO review and simulator. Then spawn the `impeccable:impeccable-finish-reviewer` agent with: the original
request, the artifact paths, the screenshot paths, the direction contract from the root layout, the
detector findings, and `reference/craft-floor.md`. Apply its material fixes in one batch, recapture, and
send back for a verdict. Two rounds maximum.

- [ ] **Step 4: Write `DESIGN.md` from the shipped build**

Spawn `impeccable:impeccable-documenter` with the project root, the artifact paths, the direction contract
and `PRODUCT.md`. DESIGN.md records what shipped — tokens, type scale, component inventory, density rules,
status vocabulary — not what was intended.

- [ ] **Step 5: Write `docs/WRITEUP.md`**

Sections, in the brief's own order, each answerable in under a minute of reading:

1. **The problem**, with the citation: three months at one stage, no owner, no clock, released only after
   a Jansunwai complaint; ₹6,605 paid; plus the `ERROR 500` and raw NPCI-string screenshots.
2. **Who it affects** — the funnel from the portal's own counters (~90 lakh OTRs, ~18.6 lakh beneficiaries)
   and who is on the losing end of each documented failure.
3. **What we built and what changed**, feature by feature, each tied to the pain it removes.
4. **End-to-end thinking** — the invariant, the SLA table, escalation, structured reason codes, master
   data ownership, the correction cycle, and what it would take to run this for real.
5. **Functional versus mocked** — spec §10's table verbatim.
6. **How Codex contributed** — written from what actually happened in this repository, with commits named.
   If Codex wrote three components, it says three components. Honesty is a judged criterion and a false
   attribution is the cheapest way to lose it.
7. **Known limitations** — no university console (auto-advance disclosed), income caps contested across
   sources, aggregator-sourced calendar, single district set, no real document upload, demo credentials
   printed on operator logins, `resolveDoor`-style routing decides from answers rather than an identity
   lookup, and the store's last-write-wins ceiling.
8. **Safety** — no live government call, demo-Aadhaar enforcement, no account numbers, mock OTPs, no
   government branding.

- [ ] **Step 6: Write `docs/VIDEO.md` — the three-minute cut**

Beat order, timed, matching the judging rubric:

| Time | Beat |
|---|---|
| 0:00–0:20 | The problem in the real portal's own words: eight login doors, `ERROR 500`, the raw NPCI string, the three-month stall |
| 0:20–0:40 | One door: three questions, `पता नहीं` resolves safely, duplicate OTR recovers instead of debarring |
| 0:40–1:05 | Pre-flight catches the expired certificate against the December payment window — before any typing |
| 1:05–1:30 | One form: prefilled renewal, read-only fee with excluded heads struck through, forced 502 mid-typing, reload, nothing lost |
| 1:30–1:50 | Lock: consequences stated, hard copy clock, registration number |
| 1:50–2:20 | The other side: institute queue refuses to forward without paper, attendance rule, forward; simulator advances 12 days; breach, auto-escalation, prefilled grievance draft, wait counter unchanged |
| 2:20–2:45 | DWO cross-check with both values side by side, coded flag, the student's file becomes a task list with the real fix |
| 2:45–3:00 | Sanction, PFMS failure with the bank cause, then paid — and close on `/seemayein`: what software cannot fix |

Record at 360px for the student half and desktop for the consoles. No slides, no music bed over speech.

- [ ] **Step 7: Write `README.md`**

Run instructions, the environment variables, `npm test`, `bash scripts/smoke.sh`, the four surface URLs with
their demo credentials, and one paragraph stating plainly that this is an independent prototype with
synthetic data and no affiliation.

- [ ] **Step 8: Final gate**

```bash
npm test && npm run typecheck && npm run build && bash scripts/smoke.sh
```

All four green, on the deployed URL as well as locally. Then submit: demo link, video, write-up, repo.

- [ ] **Step 9: Commit and tag**

```bash
git add README.md DESIGN.md docs/WRITEUP.md docs/VIDEO.md
git commit -m "docs: write-up, video plan, design system record, readme"
git tag submission-2026-08-27
```

---

## Self-review

- **Spec coverage:** every screen in spec §12 has a task — student (1, 3, 4, 5, 6, 7, 11), institute (8),
  DWO (9), simulator (10), ship (12). The design system in §13 is Task 1; the boundary page in §11 is
  Task 11; the mocked/real table in §10 lands in both Task 11 and the write-up.
- **Honesty mechanics are components, not promises:** `Money` cannot print without a basis, `ErrorNote` is
  the only error surface, `unknown` pre-flight rows are visually distinct from `ok`, the breach counter is
  asserted not to reset, and `SimBadge` announces degradation instead of hiding it.
- **No placeholders:** every task names its files, its exact copy patterns, and a verification that fails
  if the behaviour is wrong. UI tasks verify by browser and curl rather than unit tests, deliberately —
  the logic they exercise is already covered by the backend plan's ~70 assertions.
- **Type consistency:** components consume `PreflightItem`, `Alert`, `CaseEvent`, `FieldSpec` and
  `ReasonCode` exactly as the backend plan defines them; nothing is redeclared client-side.
- **Deliberate gap:** no automated browser test suite. At this timeline the smoke script plus the cold-path
  QA list in Task 12 Step 2 is the honest trade; if the build lands early, a Playwright run of the student
  journey is the first thing to add.
