# Milegi — judge write-up

Independent hackathon prototype of UP Saksham (`scholarship.up.gov.in`). Mock data. Not a government site. Live: https://milegi.vercel.app

## What we changed (process, not chrome)

Saksham fails students with eight logins, a 30-minute form before papers, a crash that wipes the draft, and a status button that often appears only in January. A prettier clone of that process is not a fix.

Milegi:

1. **One door.** Three questions. “No Record Found” is never terminal. Class 9–12 / outside-state get the official login name, dates, and how to recover a lost 15-digit registration (class-10 board + pass year + roll) — then an honest stop, or continue as Dashmottar.
2. **Papers before the long form.** Expired income (exactly 3 years) and NPCI hang stop you at the door.
3. **The student never types the fee.** College master data. Hostel/mess/caution struck through. Amount labelled as an **estimate**.
4. **One scrolling form.** Not शैक्षिक / निजी / शुल्क Next-Next. Lock sits at the bottom.
5. **A crash keeps the draft** on the phone, then syncs.
6. **The case page is the product.** Named clerk, Friday hard-copy clock, nudge that does **not** reset the wait. Status is always this URL — not a green button in January.
7. **Sanshodhan is a named window**, not an edit button. On 20 Aug 2026 the Dashmottar window is closed (renewal 21 Nov–20 Dec 2026; fresh 16 Dec 2026–10 Jan 2027). The prototype refuses edits and says so.
8. **Payment is Aadhaar DBT.** No account number, no IFSC.

## Codes (official shape, synthetic values)

- **OTR** lifetime: `UP26-` + 10 digits. Amit `UP26-2713703025`. Duplicate `UP26-3141592654`. Priya minted on KYC.
- **Registration** session: 15 digits. Login on the real site uses this, not the OTR.
- Demo shortcuts still work: `MLG-PRIYA`, `MLG-AMIT`, `MLG-DUP`.

## Who built what (Codex honesty)

ChatGPT Go (Codex) wrote the shell and the wizard host (layout, CSS, banner, home start, `Wizard.tsx` + apply page), then **quota ended**. Cursor wrote `src/server`, the APIs, autosave, door, papers, one-page form, crash overlay, case page, clerk hat, DWO hat, hub, sanshodhan, and this write-up. Do not treat later UI as Codex work.

## Limits

`/limitations`. No live Aadhaar, DigiLocker, e-District, NPCI, or PFMS. Completable journeys: Dashmottar Fresh (Priya) and Renewal (Amit) only.

## Demo (3 minutes)

Shot list: `docs/VIDEO.md`.
