# Operator flows on the live Saksham nav (Institutes, Departments, Reports)

Collected 28 Aug 2026. **Method:** builder screenshots of the public homepage menus (same rule as the 20 Aug evidence file: no HTTP to `scholarship.up.gov.in`). Confidence: `SS` = screenshot; `AGG` = aggregator guides already in `2026-08-20-saksham-evidence.md`.

This is the rest of the site the student FAQ does not describe. Milegi does **not** clone the nine-login farm.

---

## Institutes (`SS`, 28 Aug 2026)

Four public items under **INSTITUTES**:

| Menu item | What it is on Saksham | What students actually hit |
|---|---|---|
| **New registration** | College/school signs up as an institution on the portal | Students never use this. A missing course in the student dropdown is **not** a student signup problem — the college never published **master data** for that course (`AGG`). |
| **Login** | Scholarship-cell login (screenshot shows a further submenu; nested items not captured) | After lock, the file sits here until hard copy + attendance + forward. Status the student sees: “Pending at Institute Level.” Phone calls are ignored; visit the cell (`AGG`). Miss the forward window → **auto-cancel, no reversal** (`AGG`). |
| **Check registration status** | Institute asks “did our signup go through?” | Not a student tracking tool. Student tracking is a different door (registration number + password + captcha). |
| **University / affiliating agencies login** | University uploads enrolment master and verifies fee heads | Degree/diploma only. Calendar: fee verification 23 Jul – 30 Aug 2026 (`SS` timetable). Enrolment mismatch is a named DWO reason: typed number ≠ university list (`AGG`). The 2026 grievance stalled here for months with no owner (`CIT` GOVUP/E/2026/0035742). |

Homepage funnel counter `SS`: **Forwarded from Institutions 77,08,644** (session 2025-26) — the public “report” of this stage.

**Milegi mapping (locked):** `/sansthan` PIN `1234` = institute login (queue, hard copy, attendance, forward, master data). No fake institute signup. University is an **SLA auto-advance**, not a console (`/seemayein`).

---

## Departments (`SS`, 28 Aug 2026)

Nine public items under **DEPARTMENTS**. The 20 Aug capture listed a shorter set (Minister, Directorate, Deputy Directors, DWO, DIOS). The 28 Aug dropdown is the fuller public menu:

| Menu item | Likely job in the real pipeline | In Milegi? |
|---|---|---|
| **Hon’ble Minister login** | Political/oversight console, not a processing step | No. Name on `/seemayein` / FAQ only. |
| **District Welfare** (chevron → submenu, nested items not captured) | District Social Welfare Office: suspect-data codes, sanction batch, 15–30 day bulk (`AGG`). Student statuses: “Pending at District Scholarship Committee”, “Verified / Recommended by DWO.” Lost SIM / second OTR is an **in-person DWO visit** (`AGG`). | **Yes:** `/dwo` PIN `1234`. |
| **Administrator** | Statewide portal admin | No. |
| **Auditor** | Audit of sanctions/payments | No. |
| **Deputy Director** | Regional supervisory layer above DWO | No. Named as a process step, not a door. |
| **Directorate** | Lucknow directorate. Can **block** a college (enrolment limit exceeded / affiliation pending) — **not student-fixable** (`AGG` reason code). Phone `0522-3538700` exists as a real channel (`AGG`). | No login. The block is a coded flag the DWO console can raise. |
| **DIOS login** | District Inspector of Schools — school (9–12) inspection/verification layer | No. Pre-matric / inter still go student → institute → DWO in this prototype. |
| **Other-state administrator** | Outside-UP institute track (`LoginStudentPostOS`) has a matching admin | No. Outside-state is a **student scheme**, not a ninth operator. |
| **Higher Education Divisional Officer** | Divisional higher-ed supervision | No. |

Do not invent submenu items we did not see. District Welfare’s nested list is unknown; DWO is the only district role this prototype implements.

---

## Reports (`SS`, 28 Aug 2026)

One public item: **All session reports**.

The homepage already *is* a report: four session counters (`SS`, 20 Aug) — Total OTR, Final Submitted Applications, Forwarded from Institutions, Total Beneficiaries. Those numbers are a funnel (~90 lakh OTR → ~18.6 lakh beneficiaries for 2025-26), not a student-facing case file.

Payment “reports” live on a **different site** (`pfms.nic.in`) (`AGG`). Mixing Saksham status with PFMS is why parents see `No Record Found`.

**Milegi mapping (locked):** do not invent statewide lakh dashboards. After operator login, the StatSlabs on `/sansthan/kaksh` and `/dwo/kaksh` **are** the report (file count, SLA breach, hard-copy pending, flagged). Optional public `/reports` may say that and link those two logins.

---

## What not to build

- Hover mega-menu of nine department logins
- Institute “new registration” / “check registration status” as student doors
- University console, Minister/Admin/Auditor/DD/Directorate/DIOS/HEDO logins
- Fake beneficiary counters
- CM portrait, emblem, Digital India lockup, Hindi-first chrome on those menus
