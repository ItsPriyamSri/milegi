# DESIGN.md — Gazette Register (गजट रजिस्टर)

Recorded from the build. Direction contract pinned in `PRODUCT.md` and `src/app/layout.tsx`.

---

## 1. Direction Contract & Thesis

**Gazette Register (गजट रजिस्टर)** is the civic aesthetic designed for high-stakes public service delivery on 360px Android devices under low-bandwidth (2G) conditions.

This surface owns the single inviolable sentence:
> **“आपकी फ़ाइल का एक नाम वाला ज़िम्मेदार है, और एक तारीख़।” (Your file has a named owner and a deadline.)**

It explicitly rejects:
1. **The Government Portal Failure Mode:** A labyrinth of 8 separate login gates, captcha failures, password reset dead-ends, and unanchored status words with no clock or owner.
2. **The Generic SaaS Failure Mode:** Floating rounded cards, soft pastel gradients, framer-motion vanity animations, and English-first typography squeezed into Hindi.

---

## 2. Visual World & Physicality

- **Paper:** Cool mineral paper (`#eef0eb`), cut-record 3px radius sheets (`#fafbf9`), sunk panels (`#e3e7df`).
- **Ink:** Carbon ink (`#161a1d`), muted slate (`#4a545e`), and faint record ink (`#73808c`).
- **Stamp-Pad Indigo:** `#1e3a8a` — used strictly for primary interactive actions and authoritative focus rings.
- **Tone Vocabulary:** Every status carries a **glyph + a word** (never colour alone):
  - `waiting`: ◕ प्रतीक्षारत (`#854d0e` on `#fef9c3`)
  - `breach`: ✕ समय सीमा पार (`#b91c1c` on `#fee2e2`)
  - `verified`: ✓ सत्यापित (`#15803d` on `#dcfce7`)
  - `paid`: 🗲 जमा / UPI रसीद (`#115e59` on `#ccfbf1`)
- **Paper Grain:** Microscopic SVG noise overlay (`0.035` opacity) anchored across all viewports.

---

## 3. Tokens (`src/ui/tokens.css`)

```css
:root {
  /* Paper & Surface */
  --paper: #eef0eb;
  --surface: #fafbf9;
  --surface-sunk: #e3e7df;

  /* Ink Hierarchy */
  --ink: #161a1d;
  --ink-muted: #4a545e;
  --ink-faint: #73808c;

  /* Rules & Boundaries */
  --rule: #d4dad0;
  --rule-strong: #b8c2b2;

  /* Action & Brand */
  --brand: #1e3a8a;
  --brand-soft: #e8ecf8;

  /* State Tones */
  --waiting: #854d0e;
  --waiting-bg: #fef9c3;
  --breach: #b91c1c;
  --breach-bg: #fee2e2;
  --verified: #15803d;
  --verified-bg: #dcfce7;
  --paid: #115e59;
  --paid-bg: #ccfbf1;

  /* Geometry & Rhythm */
  --radius: 3px;
  --radius-sm: 2px;
  --grain-opacity: 0.035;
}
```

Dark mode overrides are supported via `prefers-color-scheme: dark` and `[data-theme="dark"]`.

---

## 4. Typography Scale & Hierarchy

Self-hosted Google Fonts via `next/font/google`:
- **Latin:** `Noto_Sans`
- **Devanagari:** `Noto_Sans_Devanagari`

Line-height is calibrated to `1.65` for Devanagari clarity. All numbers use `font-variant-numeric: tabular-nums` (`.tnum`).

| Token | Size | Line Height | Usage |
|---|---|---|---|
| `--step-s` | `0.8125rem` (13px) | 1.4 | Captions, kickers, timestamps, provenance hints |
| `--step-0` | `1rem` (16px) | 1.65 | Body text, form inputs, table cells |
| `--step-1` | `1.1875rem` (19px) | 1.5 | Section subheadings, list headers |
| `--step-2` | `1.4375rem` (23px) | 1.35 | Page headings (H2), OTR / Reg counters |
| `--step-3` | `1.75rem` (28px) | 1.25 | Primary H1 titles, clerk stamp owner names |
| `--step-4` | `2.125rem` (34px) | 1.2 | Hero money amount, receipt moment |

---

## 5. Shipped Component Inventory

| Component | File | Physical Metaphor & Responsibility |
|---|---|---|
| `DutyStrip` | `src/ui/DutyStrip.tsx` | Sticky top banner showing current stage, tone, owner, and due date |
| `OwnerStamp` | `src/ui/OwnerStamp.tsx` | Clerk-stamp rectangle naming the responsible officer, designation, and SLA breach counter |
| `OtpBoxes` | `src/ui/OtpBoxes.tsx` | 6 separate 48px input boxes with auto-advance and paste handler; no captcha |
| `SaveChip` | `src/ui/SaveChip.tsx` | Live persistent indicator: `इस फ़ोन पर सुरक्षित` → `सहेजा जा रहा है…` → `सर्वर पर सुरक्षित` |
| `StatSlab` | `src/ui/StatSlab.tsx` | Dense tabular metric slab for operator dashboards |
| `Segmented` | `src/ui/Segmented.tsx` | Gazette filter control with sliding background and high-contrast active state |
| `PageHead` | `src/ui/PageHead.tsx` | Standardized page header with eyebrow kicker, title, and metadata rail |
| `StageLedger` | `src/ui/StageLedger.tsx` | Vertical spine track with completed, current (with breach clock), and future SLA milestones |
| `Money` | `src/ui/bits.tsx` | Hero and standard currency display; **always requires a basis string** |
| `Callout` | `src/ui/bits.tsx` | Bordered callout boxes for info, warn, danger, and ok alerts |
| `StatusChip` | `src/ui/bits.tsx` | Status pill pairing colored background, glyph, and Hindi status string |

---

## 6. Citizen Journey Layouts

1. **Intake (`/pravesh`, `/otr`, `/raasta`):**
   - Single-column centered narrow layout (`max-width: 540px`).
   - Mock OTP displayed directly on screen; duplicate OTR is a prominent recovery hero, not an error.
   - Router treats "पता नहीं" as a first-class safe choice.
2. **Pre-flight & Form (`/taiyari`, `/aavedan`, `/jaanch`):**
   - Eligibility blockers surface *before* typing.
   - Single adaptive form with persistent `SaveChip` bottom bar.
   - Struck-through non-applicable fee heads (`.strike`).
   - Lock screen displays 3-day hard copy submission deadline at `--step-3`.
3. **The Case File (`/f/[caseId]` & `/t/[code]`):**
   - Desktop (≥900px): Two-column split (`StageLedger` main | `OwnerStamp` + `Money` side rail).
   - Mobile (360px): `DutyStrip` → `OwnerStamp` → `Money` → Alerts → Actions → `StageLedger` → File history.
   - Paid state displays UPI-receipt paid stamp and `--step-4` hero amount.
   - Public track `/t/[code]` exposes timeline, owner, and due date without private form fields, password, or captcha.

---

## 7. Hard Non-Negotiables Shipped

- **Verbatim Disclaimer Banner:** Displayed on every single route including errors and simulator: `स्वतंत्र हैकथॉन प्रोटोटाइप · नकली डेटा · सरकारी वेबसाइट नहीं`
- **Zero Hallucinated Credentials:** Demo Aadhaar must start with `0000`; demo operator PIN is always printed on the page (`1234`).
- **No Bank Account/IFSC Trap:** Banking is handled strictly via Aadhaar-DBT mapping; no bank account numbers are collected.
- **No Government Seals or Portraits:** Professional civic paper engineering without decorative state emblems.
- **Accessibility Floor:** 44px minimum tap targets on coarse pointers; 16px minimum font size on inputs to prevent iOS zoom.
