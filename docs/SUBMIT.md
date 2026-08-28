# Stage-1 submission packet

Form: 28 Aug 2026 8:00 PM IST → **29 Aug 2026 10:00 PM IST**. No grace. Latest form response wins.
Live demo: **https://milegi.vercel.app** (must open with no access request).

## Mock credentials (print on `/` as well)

| Who | How |
|---|---|
| Student | `/pravesh` — OTP is **printed on screen** (no SMS). Demo Aadhaar `000012340001` (DBT seeded), `000012340002` (payment bounce), `000012340003` (dormant). Must start `0000`. |
| Institute | `/sansthan` — pick any institute in the select · PIN `1234` |
| DWO | `/dwo` — pick any district in the select · PIN `1234` |

Reviewers should complete the **student** journey. Operator logins are optional.

## Project summary (≤250 words) — paste into the form

Milegi is an independent prototype of Uttar Pradesh’s Saksham scholarship service, built because the builder lived the real failure: after you submit, the file can sit at “Forwarded by Institution” for months with nobody named and no deadline. Public grievance GOVUP/E/2026/0035742 documents a three-month stall; ₹6,605 arrived only after a handwritten Jansunwai complaint.

Saksham makes that silence worse. Eight login doors return “No Record Found” when the record exists elsewhere. A duplicate OTR blocks both applications. Eligibility is checked after a long form. A 500 wipes the draft. Payment failures appear as raw NPCI strings.

Milegi is one mobile OTP door, three plain questions that never dead-end (including “I don’t know”), checks before typing, a draft that survives a crash, fees taken from college master data, and a case file that cannot enter a stage without a named owner and a due date. If the deadline passes, escalation fires and a grievance draft is ready. Institute and DWO consoles exist so the pipeline is real; they are not the demo.

Government systems are mocked and labelled: Aadhaar must start 0000, OTPs print on screen, no live government calls, a banner on every page. Another state is configuration (schemes, calendar, rates), not a rewrite. This is not an official product.

## Video (≤2:00)

Follow the table in `docs/superpowers/specs/2026-08-28-milegi-ui-overhaul-design.md` §8. Minute 1 = citizen at 360px. Minute 2 = how/why + honesty. No operator tour in minute 1.

## Six questions (must be obvious on `/` + `/f` + `/seemayein`)

Who: first-generation UP college student, cheap Android. Hard: silent file, eight doors. Change: one door + owner+deadline. Better: you know who holds it and until when. Mocked: KYC, certs, NPCI, PFMS, SMS. Scale: config, not a rewrite.
