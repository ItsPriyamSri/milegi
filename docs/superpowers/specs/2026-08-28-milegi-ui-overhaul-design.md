# Milegi UI overhaul — design contract

**Status:** ready for implementation. Written 28 Aug 2026 for an implementing **AI coding agent**.
**Hackathon:** Build What Moves India · Stage 1 form closes **29 Aug 2026, 10:00 PM IST** (no grace).
**Product truth (unchanged):** `PRODUCT.md`
**Shipped visual record (anti-reference + what to keep):** `DESIGN.md`
**Domain/API (do not rewrite):** `docs/superpowers/specs/2026-08-20-milegi-design.md`
**Implementation plan:** `docs/superpowers/plans/2026-08-28-milegi-ui-overhaul.md`
**Paste-ready agent prompt:** `docs/superpowers/plans/2026-08-28-milegi-ui-overhaul-AGENT.md`
**Stage-1 packet:** `docs/SUBMIT.md`

This is a **visual and interaction overhaul of the citizen journey**. Routes, APIs, state machine, copy voice, safety rules, and the owner+deadline invariant stay. The old Civic Ink look is evidence of what the product *is*, not authority over what it *becomes*.

---

## 0. Actual goal (read this before any aesthetic choice)

This overhaul exists so the **already-working prototype wins a Stage-1 shortlist of 250**, then a path to 10 finalists. It is not a portfolio restyle. Official builder brief, quoted in spirit and used as the scoring sheet:

**The challenge:** one real problem the builder faced on an Indian public-service site. Build a simpler, clearer, more useful way to complete it.

**Milegi’s one problem (locked):** a UP scholarship file can sit with no named owner and no deadline until the student files a handwritten grievance. The builder lived this. Evidence: GOVUP/E/2026/0035742 (three-month stall; ₹6,605 after Jansunwai). Saksham makes it worse (eight doors, duplicate-OTR debarment, checks after typing, crash-wiped drafts, raw NPCI strings).

**What reviewers will do:** open the **live public link**, complete the **citizen** journey, watch a **≤2 minute** video, read **≤250 words**. They will **not** download an app. They will **not** judge an admin panel. Operator consoles (`/sansthan`, `/dwo`) prove end-to-end thinking; they are not the test.

**Official “strong build” questions — the UI must answer these without opening PRODUCT.md:**

1. Who is facing the problem?
2. What is difficult about the current experience?
3. What did you change?
4. Why is your version better?
5. What works today, and what is still mocked?
6. How could the idea work safely at a larger scale?

**Official judging axes (optimize in this order):**

| Axis | What “win” looks like on screen |
|---|---|
| Problem | Landing names a first-generation UP student and the three-month silent file, not “we redesigned a portal.” |
| Working build | OTP → OTR → route → pre-flight → form → lock → case file still works after every commit. |
| Usability | Hindi-first, 360px, 44px targets, 16px inputs, plain language, one door. Clearer than Saksham, not busier. |
| Product thinking | Pre-flight before typing, fee from master data, owner+deadline, `/seemayein` honesty. |
| End-to-end | Case file *is* the process (SLA, escalation, grievance). Simulator discloses mocks. Scaling = config, said on `/seemayein`. |
| Honesty | Banner on every route. Demo Aadhaar `0000…`. OTP on screen. No government logo. No “official” chrome. |

**Submission artifacts this UI must serve:**

- Live link, no login wall to start: `https://milegi.vercel.app` (credentials on `/` and `docs/SUBMIT.md`).
- Video: **minute 1 = citizen demo at 360px**; **minute 2 = how it was built and why**. Not a 3-minute operator tour.
- Summary: ≤250 words in `docs/SUBMIT.md`.

**Forbidden by the brief (already product law):** live government systems, real Aadhaar/PAN/OTP/payments, scraping, presenting as official, government logos as endorsement.

If a visual choice helps a Kanpur student finish the journey on a slow phone, keep it. If it only helps a designer’s screenshot of `/dwo`, cut it.

---

## 1. Why the visual overhaul

The product already solves the right problem. The screens still look like a careful prototype. Stage-1 reviewers give seconds. The citizen must see owner+deadline in the first viewport, then complete the journey without getting lost.

Saksham as used today: eight student doors, OTR as a separate popup, status buried after login, English-first chrome, 500s at peak, “No Record Found” on the wrong door, no public track without credentials.

Milegi already removed those defects. This overhaul makes that fact **visible in 8 seconds** on `/`, then keeps the rest of the citizen path obvious on a 360px Android.

---

## 1b. Design thinking — UI bugs from the wild (must fix in this overhaul)

Research: `docs/research/2026-08-28-gov-portal-ui-pains.md` (Reddit/X quoted in journalism; Saksham student guides; Jansunwai/NPCI grievances; The Economist/ThePrint; Medium IRCTC meme). Direct `site:reddit.com` scrape was blocked; the same complaints are independently documented.

Citizens do not ask for “premium.” They ask to **not** be punished by the chrome. Ranked:

1. Homepage is a notice board (marquees, popups, 40 links, minister photos, six CTAs).
2. Captcha + session expiry *are* the task (IRCTC: “logged out while logging in”).
3. Wrong door → `No Record Found` (your file exists in another database).
4. Status is a word; then walk to college. No public track.
5. Errors blame the student for NPCI/500/`We Are Sorry`. Advice: come at 3am.
6. OTR vs registration mixed up; duplicate register = debarment.
7. Crash/session wipes the form.
8. Hover menus and exploded mobile layouts.
9. English chrome / 9px links / “use an agent.”
10. Grievance is another portal, often closed with no action.

**How Milegi’s UI must answer (visible, not claimed):**

| Pain | Ship this, or the overhaul failed |
|---|---|
| Notice-board home | `/` has **two doors**, one how-to-try line, one demo strip. No marquee, popup, autoplay, GIF, minister photo, or departmental link farm. Brand link stays **same tab**. |
| Captcha ritual | Student OTP: **no captcha**. Six boxes. OTP printed (mock). |
| Session / 500 | Sticky **SaveChip**. Draft copy. Never a “session expired, start over” that drops localStorage. |
| Wrong door | One `/pravesh`. Duplicate OTR is a **recovery hero**, not a red error. Never title a page `No Record Found`. |
| Status word | Duty strip + stamp: **name + weekday**. `/t/[code]` without password. |
| Blame-the-citizen errors | `ErrorNote` + sim badge. Failure names the **system** and the **next step**. |
| Two IDs | Case file labels OTR and registration separately. `/madad` definitions. |
| Agent tax | Hindi, 360px, 44px, one column, shareable track. |
| Third-website grievance | `/shikayat` filled; copy button above the fold. |

Steal UMANG’s “structured + tells you when it failed.” Steal IRCTC-2026’s *removal* of extra captchas and flashing graphics. Do not steal NIC homepage density.

---

## 2. What “premium” means here (and what it must not become)

**Premium** = the craft of a high-budget *civic service*: type that respects Devanagari, paper that feels like a record, a case file that looks like a document of movement, operator tables that feel like a treasury desk. The closest emotional references:

| Keep this feeling | From |
|---|---|
| “I can see where the file is” | IRCTC PNR / waitlist board |
| “Money actually moved” | UPI success receipt (PhonePe/GPay) — the *receipt*, not the casino |
| “This is a real proceeding” | University result gazette / court cause list |
| “Someone is accountable” | District dak register (file-movement book) |
| “I am not stupid” | GOV.UK service pages; GIGW 3.0 / UX4G *patterns* (OTP boxes, SLA language) |

**Do not clone clothes from:**

| Anti-reference | Why it loses this hackathon |
|---|---|
| NIC navy + Ashoka emblem + tricolor bar | Forbidden: looks official. Banner exists so we never do this. |
| UX4G marketing demo (indigo gradient, “My Services” tiles, emblem) | Same trap, plus every other team will land there. Steal *patterns* (6-box OTP, SLA), never the kit. |
| Linear / Vercel / shadcn dashboard | English SaaS card grid. Already rejected in `PRODUCT.md`. |
| CRED / CoinDCX dark luxury | Scholarship money is anxiety, not status. |
| Cream paper + terracotta + italic serif | Explicitly rejected. Also the default AI civic look. |
| Ruled exam-copy / notebook | Explicitly rejected. |
| Glassmorphism, 16–24px radius, purple glow, bento, 3D blobs | Reads as “AI skin,” not a statewide service. |

If someone could guess the aesthetic from “govtech redesign 2026” alone, the direction failed. Rebuild until it could only be Milegi.

---

## 3. Chosen world: Gazette Register (गजट रजिस्टर)

**Thesis (unchanged):** this surface owns “your file has an owner and a deadline.” It still refuses a menu of logins with a status word, and it still refuses a SaaS card grid.

**World:** a university gazette printed on cool mineral paper, bound with a dak-register spine, stamped by a clerk, with a UPI-receipt moment when money lands. Independent tool identity. Never a government website.

**Physical scene (forces light/dark):** a student on a cheap Android, tube light or phone torch, 11pm, 2G after the portal 502’d all day. Light mode is default. Dark mode exists for night use and must keep WCAG AA on every chip.

**Color strategy:** Restrained. Neutrals plus one stamp-pad indigo. Status colours are semantic fields (waiting / breach / verified / paid), not decoration. Colour owns *regions* (owner block, paid receipt, breach rail) — not scattered accents.

**Type:** Self-hosted **Noto Sans Devanagari UI** + **Noto Sans** via `next/font/local` or `next/font/google` with `adjustFontFallback`, Hindi+Latin subset, `display: swap`, two weights (400, 700). This is the one exception to the old “zero font requests” rule. GIGW 3.0 itself names Noto Sans for Devanagari; using it *without* government chrome is how Devanagari looks expensive on Android. Fallback stack remains `ui-sans-serif, "Nirmala UI", system-ui`. If the font file would exceed ~80KB compressed for the Hindi subset, drop to one weight (500) plus system fallback — never load a full Noto family.

**Materials:**

- Page = cool paper `#eef0eb` (slightly greener than shipped `#f5f6f4`).
- Record = white sheet, 1px rule, 3px radius (records are *cut*, not rounded).
- Spine = 2px ink rule on the ledger; current stage node is a filled stamp-pad disc with a 4px halo.
- Owner block = a clerk-stamp geometry: thick outer rule, name at display size, designation in muted ink, due date as tabular numerals on the right. Not a circular government seal.
- Paid state = a receipt: amount huge, basis under it, PFMS ref in mono, a single ✓ glyph + the word “जमा”.
- Optional paper grain: CSS-only repeating gradient at ≤4% opacity. No texture image, no Unsplash.

**Signature interaction:** on the case file, a **sticky duty strip** (owner name + due weekday + primary next action) that stays under the banner as the student scrolls the ledger. On lock, the registration number *ticks in* (tabular numerals, 240ms, `prefers-reduced-motion` skips). On paid, the estimate block becomes the receipt.

**Motion:** 160–220ms, opacity + transform only. One orchestrated motion per screen, not hover confetti. `prefers-reduced-motion: reduce` zeros duration.

**Radius stays 3px.** Buttons 3px. Chips pill (999px) only for status words — a chip is a *stamp*, a button is a *cut record*.

---

## 4. What must never change

Copied from product truth. The implementer does not get to “simplify” these for looks.

- Banner on **every** route including `error.tsx`, `not-found.tsx`, `/mock`:
  `स्वतंत्र हैकथॉन प्रोटोटाइप · नकली डेटा · सरकारी वेबसाइट नहीं`
- Hindi-first; English is a complete parallel via `src/lib/i18n.ts` + API `*Hi`/`*En` fields. Voice: plain, second person, no bureaucratese, no startup cheer.
- No government logo, seal, officer photo, national emblem, tricolor as chrome.
- Demo Aadhaar must start `0000`. No account number / IFSC field. No live government calls.
- Status is never colour alone: glyph + word.
- Money never without `basisHi` (`Money` component).
- Errors only through `ErrorNote` (`code`, `hi`, `en`, `retryable`, `ref`).
- Student floor **360px**, inputs **16px**, targets **44px**.
- Operator consoles dense on desktop, usable on tablet; do not hide columns the clerk needs behind “clean” cards.
- No chatbot, no runtime LLM, no new UI kit, no Tailwind unless the implementer is blocked — default is **hand-written CSS on the existing token files**.
- Domain stays in `src/server/**`. Client components stay pure of `fs` / `store`.
- `npm test` (112), `npm run typecheck`, `npm run build`, `bash scripts/smoke.sh` stay green.

---

## 5. Screen contract (every route)

Each screen has one job. If the first viewport does not do that job, the overhaul failed that screen.

| Route | Visitor mode | First-viewport job | Signature moment |
|---|---|---|---|
| `/` | Persuade → Operate | Judge/student knows this is independent, what it fixes, and which of two doors to take | A **demo case strip**: named owner + due weekday + “waiting N days” — synthetic, labelled नकली |
| `/pravesh` | Operate | Send/verify OTP without captcha theatre | Six-slot OTP, mock code visible, countdown |
| `/otr` | Operate | Mint identity; duplicate recovers, never debars | Duplicate callout is the hero, not an error toast |
| `/raasta` | Operate | Three questions; “पता नहीं” is a valid door | Result names track + cycle + why, with a recovery path |
| `/taiyari/[caseId]` | Operate | See blockers *before* typing | Each check is a gazette line: submitted vs registry vs fix |
| `/aavedan/[caseId]` | Operate | Fill once; see save state always | Sticky save chip: local / pending / saved |
| `/jaanch/[caseId]` | Operate | Understand lock consequences + hard-copy clock | Hard-copy due weekday at display size |
| `/f/[caseId]` | Operate | **The product.** Who, until when, what next, how much | Sticky duty strip + stage ledger + owner stamp |
| `/t/[code]` | Read | Parent/share: stage + owner + due, no form data | Same duty strip, no actions |
| `/soochnaayein/[caseId]` | Read | Outbox is the opposite of silent portals | List of sent notices with time |
| `/shikayat/[caseId]` | Operate | Copy a grievance that names owner, dates, wait | One tap copy; body already filled |
| `/sansthan` … | Operate | Clerk clears a queue ordered by breach, not date | Breach count in the header; sticky table head |
| `/dwo` … | Operate | Cross-check evidence, coded flag, batch sanction | Submitted vs registry side-by-side |
| `/mock` | Operate | Break systems visibly | Toggles look like a control room, still Civic, never sci-fi |
| `/seemayein` | Read | Honest limits | What software cannot fix, one line each |
| `/madad` | Read | OTR vs registration, fees, statuses | Definitions, not a FAQ dump |

### Case file composition (the product)

Desktop ≥900px: **duty strip full width**, then two columns — ledger (main) | owner stamp + money + next action (side).  
Mobile 360px: duty strip → owner stamp → money → alerts → actions → ledger → details. Never hide the owner below the fold on mobile.

Duty strip contains, in this order: stage chip (glyph+word) · owner family name · “तक {weekday DD MMM}” · primary button.

### Landing composition

1. Banner  
2. Eyebrow: independent prototype  
3. H1: the money question (existing copy)  
4. **How to try** (required by the brief: mock credentials on the public link): one line — OTP prints on the next screen; demo Aadhaar `000012340001`; institute/DWO PIN `1234` in the footer, not the hero  
5. Two doors, primary filled, full width on mobile  
6. **Demo case strip** (new): fake row “श्री आर. के. वर्मा · छात्रवृत्ति लिपिक · समय सीमा शुक्रवार 12 सितम्बर · 14 दिन से प्रतीक्षा” with नकली chip  
7. Three claims with figures (keep the 8→1 / 30 मिनट / 3 महीने content)  
8. Link to `/seemayein`

### Operator composition

Keep `.tbl`. Raise it: 40px row height on touch, 32px on desktop, sticky first column (student name), breach left rail 4px, numeric columns right-aligned, filters as a segmented control not a pile of buttons. Header shows three **stat slabs**: total / breach / hard-copy due — not dashboard charts.

---

## 6. Component inventory (extend, don’t replace names)

Keep these public names so pages don’t churn:

`Banner` `Shell` `StatusChip` `Callout` `Money` `ErrorNote` `DataRow` `OperatorLogin`

Add (small, one file each in `src/ui/`):

| Component | Job |
|---|---|
| `DutyStrip` | Sticky owner + due + primary action. Used on `/f/*` and `/t/*`. |
| `OwnerStamp` | Raised `OwnerCard`. Clerk-stamp geometry. |
| `StageLedger` | Move from `src/app/f/[caseId]/parts.tsx` into `src/ui/StageLedger.tsx` so public track can share it. |
| `OtpBoxes` | Six inputs, one paste, digits only. Used by `OtpForm`. |
| `SaveChip` | local / pending / saved / error. Used by form shell. |
| `StatSlab` | Operator header number + label + optional tone. |
| `Segmented` | Filter control for queues. |
| `PageHead` | Eyebrow + h1 + optional meta line. Kills inline heading styles. |

Do not add a generic `<Card>`. Sheets stay `.sheet`.

---

## 7. Accessibility, Hindi, performance

- WCAG 2.1 AA contrast on paper/ink, action/action-ink, every status chip (glyph+word already helps colour-blind use).
- `:lang(hi)` line-height ≥ 1.65; do not letter-space Devanagari; do not `text-transform: uppercase` on Hindi.
- Focus ring 2px `--focus` offset 2px on every control.
- `aria-live="polite"` on save chip and sim badge.
- Skip link stays.
- No horizontal scroll at 360px except operator tables, which scroll inside `.tbl-wrap` with a shadow hint.
- LCP: landing H1 + doors. Fonts optional; banner must not shift layout (reserve height).
- No Google Fonts CDN. Self-host or `next/font` with subset. Zero third-party scripts.
- Images: none required. If a grain is added, CSS only.

---

## 8. Hackathon proof (video is two minutes, citizen-first)

Rewrite `docs/VIDEO.md` to **120 seconds**, not three minutes.

| Time | Beat | Show |
|---|---|---|
| 0:00–0:12 | Problem | `/` banner + H1 + demo strip (owner + weekday). Say GOVUP/E/2026/0035742 in one line. |
| 0:12–0:35 | One door | `/pravesh` mock OTP on screen → `/otr` `000012340001` → duplicate recover if shown → `/raasta` “पता नहीं” |
| 0:35–0:55 | Checks then form | `/taiyari` expired cert blocker → valid cert → `/aavedan` save chip |
| 0:55–1:00 | The product | `/f/…` duty strip: name, deadline, next action |
| 1:00–1:25 | How built | Stack: Next.js + domain invariant in `transition()`; JSON local / Neon prod; no live gov calls |
| 1:25–1:50 | Why these choices | Pre-flight before typing; owner+`dueAt` in code; mocks labelled because production access is unsafe |
| 1:50–2:00 | Honesty + scale | `/seemayein` + “another state is config.” End card: URL + “independent prototype” |

Do **not** spend minute 1 on `/sansthan` or `/dwo`. If process must appear, show it on the **case file** (escalation, grievance draft), which is what a citizen sees.

Update `DESIGN.md` at finish from the built world. Update `PRODUCT.md` brand commitments: Noto self-host rule; world name **Gazette Register**.

---

## 9. Boundaries

- ✅ Always: citizen path (`/` → case file) is P0; banner; Hindi; 360px; tests/build/smoke; mocks labelled.
- ⚠️ Ask first: any new npm dependency; skipping a P0 task to polish `/dwo`.
- 🚫 Never: government marks; chatbot; rewriting `src/server` or `src/app/api`; breaking the working journey; presenting as official; real PII; admin-panel-first demo.

## 10. Open decisions (pinned so the implementer does not invent)

1. **World** = Gazette Register, as specified. Not a second concept tournament.
2. **CSS** = existing `tokens.css` + `primitives.css` + `globals.css`. No Tailwind.
3. **Fonts** = self-hosted Noto subset, two weights, 80KB budget.
4. **Demo case strip** on `/` is static synthetic copy in `i18n.ts`, not a live case from the store (avoids leaking demo state into the landing).
5. **Icons** = existing glyphs (◕ ▲ ✓ ₹ •) plus a handful of inline SVG in the world’s line weight (1.75px, square caps). No icon font, no Lucide CDN.
