# Milegi Gazette Register UI Overhaul

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development). Implement **one task at a time**. Check the box, run the verify command, commit, then start the next task. Do not skip ahead to operator consoles. Do not invent a second aesthetic.

**Paste this instead of improvising:** `docs/superpowers/plans/2026-08-28-milegi-ui-overhaul-AGENT.md`

**Goal:** Win Build What Moves India Stage 1 by making the **citizen journey** look and work like a trusted statewide service on a 360px Hindi-first Android — without looking official, without becoming SaaS, and without breaking the already-complete journey.

**Win condition (verifiable):** A reviewer who never reads PRODUCT.md can finish OTP → case file on a phone, see a named owner and a weekday deadline in the first viewport of `/` and of `/f/[caseId]`, and tell what is mocked (banner). `npm test` 112 pass, `typecheck` and `build` green. Video beats in spec §8 fit in 2 minutes.

**Architecture:** Next.js App Router; server pages + tiny client islands. Raise CSS tokens/primitives, then restyle citizen routes in place. No domain/API changes.

**Tech Stack:** Next.js 16, React 19, TypeScript, hand-written CSS, `next/font` Noto subset. No Tailwind, no shadcn, no new UI kit.

**Spec:** `docs/superpowers/specs/2026-08-28-milegi-ui-overhaul-design.md` (read §0 judging before §3 world)

**Product truth:** `PRODUCT.md` · **Anti-reference:** `DESIGN.md` · **Do not rewrite:** `src/server/**`, `src/app/api/**`

**Priority:** Tasks 1–6 and 8 are P0 (citizen + honesty + verify). Task 7 is P1 — skip entirely if timeboxed rather than shipping a broken `/` or `/f`.

## Global Constraints

- Banner verbatim on every route: `स्वतंत्र हैकथॉन प्रोटोटाइप · नकली डेटा · सरकारी वेबसाइट नहीं`
- Hindi default; English complete via `src/lib/i18n.ts`. No bureaucratese, no startup cheer.
- No government logo, seal, emblem, tricolor chrome, officer photos.
- Status = glyph + word. Money always with `basisHi`. Errors only via `ErrorNote`.
- Student 360px, 44px targets, 16px inputs. Operator tables stay dense.
- `prefers-reduced-motion` and `prefers-color-scheme` honoured.
- No new npm dependency without an explicit ask. Default: zero.
- After every task: `npm run typecheck` green. After Task 3+: `npm test` still 112 pass. After the last P0 task: `npm run build` green.
- After Task 3, smoke the citizen path in a browser (or curl `scripts/smoke.sh` if the dev server is up) before any operator CSS.
- Visual bans: glass, >8px shadow, 16px+ radius on records/buttons, purple glow, bento, cream+terracotta, Inter/Geist as display, Lucide CDN, Unsplash heroes.
- Reviewers test the **citizen** experience. Do not spend tokens pixel-pushing `/dwo` while `/f` still looks like the old prototype.
- If a step would change API JSON or `src/server`, stop. That is out of scope.
- Citizen-pain contract (`docs/research/2026-08-28-gov-portal-ui-pains.md`, spec §1b): `/` is a service not a notice board; student OTP has no captcha; drafts never die to a session toast; never title a page `No Record Found`; status is a named person + weekday; errors name the system not the student; OTR and registration are labelled separately.

---

## File map (locked)

| File | Responsibility |
|---|---|
| `src/ui/tokens.css` | Colour, type, space, motion, paper grain variables |
| `src/ui/primitives.css` | `.sheet` `.ledger` `.tbl` `.chip` `.btn` `.field` `.callout` `.datarow` `.money` `.duty` `.stamp` `.otp` `.savechip` `.stat` `.seg` |
| `src/app/globals.css` | Reset, shell, landing, print |
| `src/app/layout.tsx` | Direction contract comment + `next/font` variables on `<html>` |
| `src/ui/Shell.tsx` | Banner, sim badge, topbar, wrap, footer |
| `src/ui/bits.tsx` | StatusChip, Callout, DataRow, Money, ErrorNote |
| `src/ui/DutyStrip.tsx` | Sticky owner + due + action |
| `src/ui/OwnerStamp.tsx` | Clerk-stamp owner block |
| `src/ui/StageLedger.tsx` | Shared ledger (student + public track) |
| `src/ui/OtpBoxes.tsx` | Six-slot OTP |
| `src/ui/SaveChip.tsx` | Draft save state |
| `src/ui/StatSlab.tsx` | Operator header stats |
| `src/ui/PageHead.tsx` | Eyebrow + title |
| `src/lib/i18n.ts` | New landing strip strings + any new chrome |
| Route `page.tsx` files | Composition only; no new data fetching |

Do not create `src/components/`. Do not add CSS modules. Do not add Tailwind.

---

### Task 1: Direction contract, tokens, type

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/ui/tokens.css`
- Modify: `PRODUCT.md` (brand commitments only — fonts + world name)
- Create: `public/fonts/` only if using `next/font/local`; otherwise use `next/font/google` with subset

**Interfaces:**
- Produces: CSS variables listed below; `--font` points at the loaded face; `<html className={font.variable}>`

- [ ] **Step 1: Replace the direction contract** in `src/app/layout.tsx` (first child of `<body>`, HTML comment):

```
THESIS: This surface owns "your file has an owner and a deadline." It refuses a menu of logins with a status word, and it refuses a SaaS card grid.
OWN-WORLD: Gazette Register — cool mineral paper, cut-record 3px sheets, stamp-pad indigo, clerk-stamp owner block, dak-register ledger spine, UPI-receipt paid state. Noto Sans Devanagari UI, two weights, self-hosted subset. Status is glyph plus word. No emblem, no glass, no 16px radius.
STORY: The visitor sees an independent prototype, two doors, and a labelled synthetic case strip naming an owner and a weekday. They leave holding a file page with a sticky duty strip.
FIRST VIEWPORT: banner; Hindi money-question; two full-width doors; demo case strip with नकली chip; then three claims.
FORM: Gazette Register. Student = single-column record. Operator = dense ledger table. Sticky duty strip is the signature interaction.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
```

- [ ] **Step 2: Wire Noto via `next/font`**

In `src/app/layout.tsx`:

```tsx
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";

const noto = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-latin",
  adjustFontFallback: true,
});

const notoDeva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-deva",
  adjustFontFallback: true,
});
```

Put both `variable` classes on `<html>` along with `lang`. In `tokens.css` set:

```css
--font: var(--font-deva), var(--font-latin), ui-sans-serif, "Nirmala UI", system-ui, sans-serif;
```

If the production `.next` font payload is obviously huge, drop 700 for body and keep 700 only on headings via a second tiny subset. Do **not** add a `<link>` to fonts.googleapis.com.

- [ ] **Step 3: Rewrite `src/ui/tokens.css`** to this palette (names stay; values change):

```css
:root {
  --paper: #eef0eb;
  --surface: #fbfcf9;
  --surface-sunk: #e4e7e1;
  --ink: #12151a;
  --ink-muted: #4e565e;
  --ink-faint: #73808a;
  --rule: #d5dbd3;
  --rule-strong: #b7c0b6;
  --action: #1e3a8a;
  --action-ink: #f7f8f4;
  --action-hover: #172e70;
  --focus: #2f5de0;
  --waiting: #8a4b00;
  --waiting-bg: #f8eedc;
  --breach: #9b1c16;
  --breach-bg: #fbeceb;
  --verified: #145c38;
  --verified-bg: #e6f3eb;
  --paid: #0b4a36;
  --paid-bg: #def0e8;

  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px;
  --s5: 24px; --s6: 32px; --s7: 48px; --s8: 64px;
  --radius: 3px;
  --measure: 62ch;
  --step-s: 0.8125rem;
  --step-0: 1rem;
  --step-1: 1.125rem;
  --step-2: 1.375rem;
  --step-3: 1.75rem;
  --step-4: 2.25rem;
  --motion: 180ms cubic-bezier(0.2, 0, 0.2, 1);
  --shadow-stamp: 0 1px 0 color-mix(in srgb, var(--ink) 6%, transparent);
  --grain: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    color-mix(in srgb, var(--ink) 3.5%, transparent) 3px
  );
}
```

Keep the existing dark-mode blocks; retune so `--action` on dark is `#9db4ff` on `--paper: #101317`, and every chip still hits 4.5:1. Keep `prefers-reduced-motion` exactly as shipped.

- [ ] **Step 4: Patch `PRODUCT.md` brand commitments**

Replace the visual bullets with:

- Visual direction: **Gazette Register** — cool mineral paper, clerk-stamp owner, dak-register ledger, UPI-receipt paid state. Still refuses NIC emblem imitation, ruled exam-copy, cream-and-terracotta, generic SaaS card grids.
- Type: self-hosted Noto Sans / Noto Sans Devanagari via `next/font`, Hindi+Latin subset, two weights, ~80KB budget, `display: swap`. System stack remains the fallback. No third-party font CDN.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`  
Expected: exit 0

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/ui/tokens.css PRODUCT.md
git commit -m "$(cat <<'EOF'
Raise Civic Ink into Gazette Register tokens and self-hosted Noto

The student surface has to look like a record of movement, not a
prototype stylesheet, without borrowing government chrome.
EOF
)"
```

---

### Task 2: Primitives — stamp, duty strip, tables, OTP, save

**Files:**
- Modify: `src/ui/primitives.css`
- Modify: `src/app/globals.css` (shell + grain on `body::before`)
- Modify: `src/ui/bits.tsx` (chip padding, money scale only)
- Create: `src/ui/DutyStrip.tsx`, `src/ui/OwnerStamp.tsx`, `src/ui/OtpBoxes.tsx`, `src/ui/SaveChip.tsx`, `src/ui/StatSlab.tsx`, `src/ui/PageHead.tsx`, `src/ui/Segmented.tsx`

**Interfaces:**

```ts
// DutyStrip
export function DutyStrip(props: {
  stageHi: string;
  tone: Tone;
  ownerNameHi: string | null;
  dueAt: string | null;      // ISO; format inside with fmtWeekday+fmtDate
  action?: { href: string; labelHi: string };
}): JSX.Element

// OwnerStamp
export function OwnerStamp(props: {
  owner: { nameHi: string; designationHi: string; orgHi: string; contactHint?: string } | null;
  dueAt: string | null;
  breachDays: number;
  waitingDays: number;
}): JSX.Element

// OtpBoxes
export function OtpBoxes(props: {
  id: string;
  value: string;             // 0–6 digits
  onChange: (digits: string) => void;
  disabled?: boolean;
}): JSX.Element

// SaveChip
export function SaveChip(props: { state: "local" | "pending" | "saved" | "error" }): JSX.Element

// StatSlab
export function StatSlab(props: { n: number; labelHi: string; tone?: Tone | "neutral" }): JSX.Element

// Segmented
export function Segmented<T extends string>(props: {
  ariaLabel: string;
  value: T;
  options: { id: T; labelHi: string; href: string }[];
}): JSX.Element

// PageHead
export function PageHead(props: { eyebrow?: string; title: string; meta?: ReactNode }): JSX.Element
```

- [ ] **Step 1: Add primitive CSS** (append to `primitives.css`; do not delete existing classes — restyle them)

Duty strip:

```css
.duty {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s3);
  padding: var(--s3) var(--s4);
  margin: 0 calc(-1 * var(--s4)) var(--s5);
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  border-bottom: 1px solid var(--rule);
  backdrop-filter: blur(8px);
}
.duty .duty-due { margin-left: auto; font-variant-numeric: tabular-nums; font-weight: 700; }
```

On mobile, `backdrop-filter` is optional; background must stay opaque enough to read. If blur looks like glassmorphism, drop it and use solid `--surface`.

Owner stamp:

```css
.stamp {
  background: var(--surface);
  border: 2px solid var(--ink);
  border-radius: var(--radius);
  padding: var(--s4);
  box-shadow: var(--shadow-stamp);
}
.stamp-kicker { font-size: var(--step-s); letter-spacing: 0.04em; color: var(--ink-muted); }
.stamp-name { font-size: var(--step-2); font-weight: 700; margin-top: var(--s2); }
```

OTP:

```css
.otp { display: flex; gap: var(--s2); }
.otp input {
  width: 2.5rem; height: 44px; text-align: center;
  font-size: var(--step-2); font-variant-numeric: tabular-nums;
  border: 1px solid var(--rule-strong); border-radius: var(--radius);
  background: var(--surface);
}
```

Restyle `.btn-primary` to use stamp-pad indigo; `.btn` min-height 44px stays. `.tbl th` letter-spacing: do **not** uppercase Hindi labels — only English `lang=en`. `.ledger > li[data-state="current"]::before` already exists; make the disc 12px and the halo `0 0 0 5px color-mix(in srgb, var(--action) 16%, transparent)`.

`.money-amount` → `var(--step-4)` on the case file receipt only (add `.money[data-hero] .money-amount`).

- [ ] **Step 2: Implement the seven components** using those classes. `OtpBoxes` must accept paste of 6 digits into the first box and move focus right. `DutyStrip` formats dates with existing `fmtDate` / `fmtWeekday` from `@/lib/format`.

- [ ] **Step 3: Paper grain** on `body` in `globals.css`:

```css
body { position: relative; background: var(--paper); }
body::before {
  content: "";
  pointer-events: none;
  position: fixed; inset: 0; z-index: 0;
  background-image: var(--grain);
  opacity: 1;
}
body > * { position: relative; z-index: 1; }
```

If grain fights Devanagari, lower the mix to 2%.

- [ ] **Step 4: Typecheck + commit**

```bash
npm run typecheck
git add src/ui src/app/globals.css
git commit -m "$(cat <<'EOF'
Add Gazette Register primitives: duty strip, stamp, OTP boxes

The case file needs a sticky owner+deadline rail and a clerk-stamp
block before any route is restyled.
EOF
)"
```

---

### Task 3: Shell, landing, demo case strip

**Files:**
- Modify: `src/ui/Shell.tsx`, `src/ui/Banner.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/lib/i18n.ts`

- [ ] **Step 1: Raise the shell**

Topbar: brand mark at `var(--step-3)` weight 700; subline stays. Banner: keep verbatim text; padding `8px var(--s4)`; background `--ink`; do not add a tricolor. Footer: quieter, same links.

- [ ] **Step 2: Add i18n keys**

```ts
demoStripKicker: { hi: "नकली फ़ाइल — ऐसा दिखता है जब किसी के पास ज़िम्मेदारी होती है", en: "Synthetic file — this is what accountability looks like" },
demoStripOwner: { hi: "श्री आर. के. वर्मा", en: "Shri R. K. Verma" },
demoStripRole: { hi: "छात्रवृत्ति लिपिक · छत्रपति शाहू जी महाराज विश्वविद्यालय, कानपुर", en: "Scholarship clerk · CSJMU Kanpur" },
demoStripDue: { hi: "समय सीमा शुक्रवार 12 सितम्बर", en: "Due Friday 12 Sep" },
demoStripWait: { hi: "14 दिन से इसी चरण पर", en: "14 days at this stage" },
```

Do not load this from the store.

- [ ] **Step 3: Rebuild `/` first viewport** per spec §5 and **§1b**. Two `.door` links stay. After the doors, a `.stamp` showing the demo strip + `StatusChip tone="waiting"`. Keep the three claims. Doors: primary filled indigo; secondary outlined. On ≥640px two columns; on 360px stacked, primary first.

**Done check for this task (citizen-pain):** landing has exactly two primary actions (the doors). No marquee, no popup, no GIF, no hover menu. Brand click stays on the same tab. How-to-try line is visible without scrolling on 360px if possible; if not, immediately under the H1.

- [ ] **Step 4: Browser check at 360 and 1280**

Open `/`. Confirm: banner readable, H1 not truncated, doors tappable, demo strip shows owner + weekday, no horizontal scroll, grain not crushing type.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/ui/Shell.tsx src/ui/Banner.tsx src/app/globals.css src/lib/i18n.ts
git commit -m "$(cat <<'EOF'
Make the landing prove owner-and-deadline in the first viewport

A labelled synthetic case strip is the demo a judge can see before
scrolling, without touching the store.
EOF
)"
```

---

### Task 4: Intake — OTP, OTR, router

**Files:**
- Modify: `src/app/pravesh/OtpForm.tsx`, `src/app/pravesh/page.tsx`
- Modify: `src/app/otr/OtrForm.tsx`, `src/app/otr/page.tsx`
- Modify: `src/app/raasta/RouteWizard.tsx`, `src/app/raasta/page.tsx`

- [ ] **Step 1: OTP**

Replace the single OTP `<input>` with `<OtpBoxes>`. Keep mock OTP printed on screen (safety). One primary button. `PageHead` for the title. **No captcha UI, no “type the warped letters” field, no session-expired overlay that dumps the form.** IRCTC’s actual complaint was that logging in *was* the product.

- [ ] **Step 2: OTR**

When `duplicate === true`, the recovery callout is the largest block on the page (not a small error). Continue-as-renewal is the primary button. Demo Aadhaar hint stays: must start `0000`. **Never render `No Record Found` / `रिकॉर्ड नहीं मिला` as a heading.** Duplicate is a known file, not a missing one.

- [ ] **Step 3: Router**

Three questions, one per viewport on 360px (existing wizard). Result screen: track name at `step-3`, cycle chip, reason paragraph, recovery link if present. “पता नहीं” remains a real choice, visually equal to yes/no — not a faint third option.

- [ ] **Step 4: Typecheck + commit**

```bash
npm run typecheck
git add src/app/pravesh src/app/otr src/app/raasta
git commit -m "$(cat <<'EOF'
Restyle intake: six-slot OTP, duplicate-OTR recovery as the hero

The wrong-door shame of Saksham is replaced with a recovery path
that looks intentional, not like an error toast.
EOF
)"
```

---

### Task 5: Pre-flight, form, lock

**Files:**
- Modify: `src/app/taiyari/[caseId]/page.tsx`, `src/app/taiyari/[caseId]/PreflightActions.tsx`
- Modify: `src/app/aavedan/[caseId]/page.tsx`, `src/app/aavedan/[caseId]/FormShell.tsx`
- Modify: `src/app/jaanch/[caseId]/page.tsx`, `src/app/jaanch/[caseId]/LockPanel.tsx`
- Modify: `src/lib/useAutosave.ts` only if needed to feed `SaveChip`

- [ ] **Step 1: Pre-flight**

Each check is a row: label · submitted · registry · state chip · fix line. Blocked rows use `data-tone="danger"` background. Certificate form stays below the list. Primary CTA “फ़ॉर्म भरना शुरू करें” disabled-looking (not clickable) while blockers remain — keep current server logic; only the visual disabled state is CSS.

- [ ] **Step 2: Form**

Sticky `SaveChip` top-right under the topbar (`aria-live="polite"`). Copy must say the draft lives on this phone (P7: crash/session must not wipe work). Section titles via `PageHead`. Fee panel: struck heads stay `.strike`; non-refundable total uses `Money`. Correction mode: only unlocked fields look editable; locked fields look like gazette lines (no fake disabled inputs that still look active).

- [ ] **Step 3: Lock**

Hard-copy due weekday at `step-3`. Consequences as a numbered list, not a wall of paragraphs. Primary lock button full width on 360px.

- [ ] **Step 4: Commit**

```bash
git add src/app/taiyari src/app/aavedan src/app/jaanch src/lib/useAutosave.ts
git commit -m "$(cat <<'EOF'
Restyle pre-flight, the one form, and lock around a visible save state

Eligibility theatre moves above the fold; the save chip is the
anti-500 promise students can see while typing.
EOF
)"
```

---

### Task 6: Case file and public track (the product)

**Files:**
- Create: `src/ui/StageLedger.tsx` (move markup from `src/app/f/[caseId]/parts.tsx`)
- Modify: `src/app/f/[caseId]/page.tsx`, `src/app/f/[caseId]/parts.tsx`, `src/app/f/[caseId]/CaseActions.tsx`
- Modify: `src/app/t/[code]/page.tsx`
- Modify: `src/app/soochnaayein/[caseId]/page.tsx`, `src/app/shikayat/[caseId]/page.tsx`

- [ ] **Step 1: Extract `StageLedger`** to `src/ui/StageLedger.tsx`. `parts.tsx` re-exports or deletes the old function. Public `/t/[code]` imports the same component.

- [ ] **Step 2: Compose `/f/[caseId]`** exactly as spec §5 (mobile order + desktop split). Replace `OwnerCard` with `OwnerStamp`. Add `DutyStrip` with the primary action from the same `actions` array already computed in the page (first action href: nudge `/api/...` is a button in `CaseActions` — DutyStrip action should be the **next student navigation**, e.g. correction → `/aavedan/...`, payment retry stays in `CaseActions` below). If there is no nav action, omit `action`.

When `c.stage === "paid"`, render `Money` with `data-hero` and a paid chip — the receipt.

When `searchParams.locked`, keep the ok callout; registration number in `.tnum` at `step-2`. **OTR and registration are two labelled rows** — never one field called “number” (P6).

- [ ] **Step 3: `/t/[code]`** uses DutyStrip + OwnerStamp + StageLedger; still no form fields. **No password, no captcha** — this is the parent-without-credentials surface (P4).

- [ ] **Step 4: Outbox and grievance**

Outbox: timeline of notices, not a dump. Grievance: draft in a sunk sheet, copy button primary, case id and owner name visible above the fold. **Do not send the citizen to a third portal** (P9).

- [ ] **Step 5: 360px check of `/f/...`** — owner stamp and duty strip visible without scrolling past the first screen. Then commit:

```bash
git add src/ui/StageLedger.tsx src/app/f src/app/t src/app/soochnaayein src/app/shikayat
git commit -m "$(cat <<'EOF'
Make the case file the Gazette Register: sticky duty strip and stamp

A parent opening the public track sees the same owner and weekday
the student sees, with no form data attached.
EOF
)"
```

---

### Task 7: Institute and DWO consoles (P1 — skip if timeboxed)

**Skip rule:** If Stage-1 time is short, **do not start this task**. Operator screens already work. Reviewers will not test them. Go to Task 8.

**Files:**
- Modify: `src/app/sansthan/**`, `src/app/dwo/**`, `src/ui/OperatorLogin.tsx`

- [ ] **Step 1: Login pages**

`OperatorLogin` as a centered stamp-width sheet (max 420px). Demo PIN remains printed on the page (prototype honesty). No fake security chrome.

- [ ] **Step 2: Institute queue**

Replace the header counts with three `StatSlab`s (total, breach, hard-copy due). Replace filter `btn` pile with `Segmented`. Keep `QueueTable`; restyle rows: 32px desktop / min 44px on coarse pointer (`@media (pointer: coarse)`). Sticky thead stays. Breach rail 4px.

- [ ] **Step 3: Institute file + master**

File: OwnerStamp for the student file’s current owner is wrong — show **student identity** as PageHead and **actions** in a right rail on desktop. Keep reason-coded return. Master table: same `.tbl` language; publish/unpublish buttons `btn-sm`.

- [ ] **Step 4: DWO queue, file, sanction**

Queue: StatSlabs for pending / flagged / ready-to-sanction. File: submitted vs registry as a two-column `.datarow` list (already the point of `ReviewActions`); give the mismatch rows `data-tone="danger"`. Sanction batch: confirmation sheet with amount + `AMOUNT_DISCLAIMER_HI` basis; never show a total without that sentence.

- [ ] **Step 5: Commit**

```bash
git add src/app/sansthan src/app/dwo src/ui/OperatorLogin.tsx
git commit -m "$(cat <<'EOF'
Restyle operator consoles as dense gazette tables with breach stats

Clerks keep every column; the header now states how many files are
about to die, which is the actual job.
EOF
)"
```

---

### Task 8: Simulator, help, errors, polish pass

**Files:**
- Modify: `src/app/mock/**`, `src/app/seemayein/page.tsx`, `src/app/madad/page.tsx`
- Modify: `src/app/error.tsx`, `src/app/not-found.tsx`
- Rewrite: `docs/VIDEO.md` to the 2-minute citizen-first cut in spec §8 (replace the 3-minute operator tour)
- Modify: `docs/SUBMIT.md` only if landing credentials copy drifted
- Rewrite: `DESIGN.md` from what actually shipped (after screenshots)

- [ ] **Step 1: `/mock`**

Control-room but still paper: upstream rows as `.tbl`, health as chips, clock advance as a field+button. No terminal font wallpaper, no scanlines, no neon. Sim badge in the shell stays the only “a system is down” surface on other routes.

- [ ] **Step 2: Help + limits**

`/madad`: definition list (OTR vs registration, fee heads, statuses). `/seemayein`: two columns on desktop — software can / cannot — using existing copy.

- [ ] **Step 3: error/not-found**

Banner on both. `ErrorNote` + draft-safe sentence. Primary retry. **Failure names the system and the next step** — never a raw `NPCI`/`PFMS`/`ERROR 500` string, never “try at 3am” (P5). `not-found` is not titled `No Record Found`.

- [ ] **Step 4: Verification gate**

```bash
npm test          # 112 pass
npm run typecheck
npm run build
```

Open in a browser: `/` `/pravesh` `/f/<id>` `/sansthan/kaksh` `/dwo/kaksh` `/mock` at 360 and 1280. Check contrast of chips on paper. Tab through OTP and a form. `prefers-reduced-motion`: no sticky-strip animation.

- [ ] **Step 5: Rewrite `DESIGN.md`** from the built tokens (hex as shipped). Replace `docs/VIDEO.md` with spec §8’s 2-minute table. Confirm `docs/SUBMIT.md` credentials still match the UI.

- [ ] **Step 6: Commit**

```bash
git add src/app/mock src/app/seemayein src/app/madad src/app/error.tsx src/app/not-found.tsx DESIGN.md docs/VIDEO.md
git commit -m "$(cat <<'EOF'
Finish Gazette Register on mock, help, and error surfaces

Record DESIGN.md from the built world and point the video's first
seconds at the landing case strip.
EOF
)"
```

---

## Self-review

**Spec coverage:** World/tokens (T1), primitives (T2), landing proof (T3), intake (T4), preflight/form/lock (T5), case file (T6), operators (T7), mock/help/DESIGN.md (T8). Invariant, banner, safety, no-server-rewrite all in Global Constraints.

**Placeholder scan:** none.

**Type consistency:** `DutyStrip`, `OwnerStamp`, `OtpBoxes`, `SaveChip`, `StatSlab`, `Segmented`, `PageHead` signatures in Task 2 match later tasks.

**Handoff:** Use `docs/superpowers/plans/2026-08-28-milegi-ui-overhaul-AGENT.md` as the system prompt. Do not invent a second aesthetic. If a change would look at home on Linear, UX4G’s marketing page, or scholarship.up.gov.in, it is wrong. Cut Task 7 before you cut Task 6.
