# DESIGN.md — Civic Ink (as shipped)

Recorded from the build, not from intention. Direction pinned in `PRODUCT.md` and the root layout thesis comment.

## Thesis

This surface owns the sentence **“your file has an owner and a deadline.”** It refuses the government-portal arrangement (a menu of logins + a status word with no clock) and the SaaS arrangement (everything a rounded card).

## World

Ink on cool paper. Rules only where a boundary is real. One indigo action accent. Waiting / breach / verified / paid each carry a **glyph + a word** (never colour alone). Tabular numerals; money and dates right-aligned. Signature device: the **stage ledger** — a vertical rule with stage nodes carrying owner, date, and elapsed days.

## Tokens (`src/ui/tokens.css`)

| Role | Light | Notes |
|---|---|---|
| Paper / surface / sunk | `#f5f6f4` / `#ffffff` / `#eef0ed` | Page, sheet, inset |
| Ink / muted / faint | `#14171a` / `#585f66` / `#7c848b` | Body hierarchy |
| Rule / strong | `#dfe3de` / `#c4cac3` | Borders only |
| Action / focus | `#22357a` / `#3355d1` | Primary CTA + focus ring |
| Waiting / breach / verified / paid | `#8a5a00` / `#a32219` / `#1c6b3f` / `#0f4c37` | + matching `*-bg` |

Dark mode: `prefers-color-scheme` plus `[data-theme="light"|"dark"]` override. Radius `3px`. Spatial scale 4px. Motion ~150ms, transform/opacity; `prefers-reduced-motion` zeros duration.

## Type

System stack only — **no web fonts**:

`ui-sans-serif, "Noto Sans Devanagari", "Nirmala UI", system-ui, …`

Devanagari line-height ~1.65. Inputs 16px on mobile. Numerals `font-variant-numeric: tabular-nums`.

## Density

- **Student:** single-column civic record, one decision per viewport, breathe.
- **Operator:** dense `.tbl` — sticky head, ~32px rows, breach left border, right-aligned numbers.

## Component inventory (shipped)

| Primitive | File / class | Use |
|---|---|---|
| Banner | `Banner` | Independent / synthetic disclaimer every route |
| Shell | `Shell` | Banner + optional sim badge + topbar + footer |
| StatusChip | `bits` | Glyph + word; tones waiting/breach/verified/paid |
| Callout | `bits` | info / warn / danger / ok |
| Money | `bits` | Amount **requires** basis string |
| ErrorNote | `bits` | Citizen Hindi/English + ref; never upstream leak |
| DataRow / sheet / ledger / tbl | `primitives.css` | Record layout |
| OperatorLogin | `OperatorLogin` | Demo PIN printed on page |

## Screens

Landing → OTP → OTR → router → pre-flight → form → lock → case file; institute queue/file/master; DWO queue/file/sanction; `/mock`; `/seemayein`; `/madad`; public `/t/[code]`.

## Status vocabulary

Stage labels live in `src/server/config/schemes.ts` (`STAGE_LABELS_HI` / `_EN`). Alerts and chips reuse waiting / breach / verified / paid tones from tokens.

## Non-negotiables that shipped

- Banner on every route including errors and simulator.
- No government logo/seal; demo Aadhaar must start `0000`.
- No account number / IFSC field.
- Save indicator on the form: local / pending / saved.
- Amount never shown without its estimate basis.
