# What citizens actually hate about government portal UIs

Collected 28 Aug 2026 for the Gazette Register overhaul. **No live government hosts were hit.** Sources: student guides that exist *because* Saksham is unusable; published grievances; journalism that quotes Reddit/X; designer rants that summarise those threads.

Reddit’s search index was not directly scrapeable from this environment (`site:reddit.com` returned empty). Pain is still grounded: NDTV quotes a Reddit EPFO post calling the portal a “Kafkaesque video game”; Medium (Jul 2025) cites “Reddit threads full of complaints” and the IRCTC meme; The Economist (via ThePrint) describes the same visual pattern millions recognise.

---

## Empathise — the jobs people are trying to do

| Scene | Job | What the portal does instead |
|---|---|---|
| 11pm, cheap Android, 2G | Finish a form / see if money is coming | Captcha, hover menu, 500, “try after 11pm” |
| Parent with the student’s printout | Check status without a password | No public track; mix OTR vs registration |
| Student who lost last year’s number | Continue as renewal | Wrong door → `No Record Found` → cyber café says “register again” |
| Anyone mid-task | Not lose work | Session expired; crash wipes draft |
| Anyone who failed | Know what to do | Raw `Status not received from NPCI server, Checked Date:-(19/11/2024 14:47:09)` |

Quora/agent economy (Medium): *“Use an agent, bro. It’s easier.”* Bad UI is a tax on people who cannot pay that tax.

---

## Define — clustered pains (frequency × harm)

Ranked by how often they show up **and** whether they kill the task.

### P1 — The homepage is a notice board, not a service

**Heard as:** pop-ups, marquees, flashing graphics, ministerial portraits, forty links, six “Pay Now” buttons, logo opens a new tab, layout explodes on phone.  
**Sources:** The Economist / ThePrint (“sadistic mix of pop-ups, moving text, flashing graphics… text-based Captchas”); Medium Karnataka One (six competing CTAs, 404, mobile exploded, logo new tab).  
**NIC / GIGW even says:** put the primary action first; don’t rely on hover menus on mobile (uxdt.nic.in). Portals ignore this.

### P2 — Captcha and session expiry *are* the product

**Heard as:** IRCTC “logged out while logging in”; warped captcha during Tatkal; Saksham OTR = captcha + OTP + second captcha; 5–10 min session timeout mid-form.  
**Sources:** Medium IRCTC meme; CitizenNest session-expired guide; IRCTC 2026 refresh *removing unnecessary captchas* (admission the old UX was the problem); Saksham OTR guides (120s OTP + case-sensitive captcha twice).

### P3 — Wrong door returns “your record does not exist”

**Heard as:** eight student logins; hover the Student menu; wrong scheme → `No Record Found` even when the file is in another database.  
**Sources:** Milegi evidence file; upscholarshiip.com status guide; student login guide (“do not register again”).

### P4 — Status is a word. Then walk to college.

**Heard as:** “Institute Pending”; status button appears weeks later; no owner, no date; parent cannot check without registration number + password + captcha.  
**Sources:** upscholarshiip.com; Buddy4Study; GOVUP/E/2026/0035742 (three-month stall).

### P5 — Errors blame the citizen for the government’s server

**Heard as:** `Status not received from NPCI server`; 500 / “We Are Sorry”; “Invalid Application ID”; advice is clear cache / incognito / come at 3am.  
**Sources:** yogi.systems grievances (NPCI seeded at bank, portal still blocked submit); NSP error guides; Saksham peak-season crash folklore.

### P6 — Two identifiers, one human

**Heard as:** OTR vs 15-digit registration; mixing them; duplicate OTR if you “just register again.”  
**Sources:** ncertbooks.net (“common mistake”); PRODUCT.md lived pains.

### P7 — Work vanishes

**Heard as:** crash wipes form; session expired; no local save.  
**Sources:** PRODUCT.md; Medium; IRCTC.

### P8 — English chrome, Hindi life; 9px links; PDFs under 100KB

**Heard as:** Times New Roman, GIFs, Java applets (EPFO), upload limits, English-first with Hindi as a toggle nobody finds.  
**Sources:** Medium; NDTV EPFO (portal down 10+ days; Reddit Kafkaesque); D91 Labs 1–3 hours / 40% drop-off on Aaple Sarkar.

### P9 — Grievance is another portal

**Heard as:** CPGRAMS “Resolved” with no action; Jansunwai handwritten.  
**Sources:** righttoinformation.wiki; GOVUP/E/2026/0035742.

---

## Ideate — How Might We (locked to Milegi)

Not “make it pretty.” Each HMW maps to a **visible UI behaviour** the implementing agent must ship.

| # | How might we | Gazette Register behaviour (must be visible) |
|---|---|---|
| 1 | …so the first screen is a service, not a ministry brochure? | Two doors. Zero marquee, zero popup, zero autoplay, zero minister photo, zero 40-link footer of departments. Logo stays in-tab. |
| 2 | …so a phone user never needs hover? | No hover-only menus. Doors and filters are links/buttons. 44px targets. |
| 3 | …so captcha is not the ritual? | **No captcha** on student OTP. Six boxes. Mock OTP on screen (honesty). |
| 4 | …so a 500 cannot steal the form? | Sticky **SaveChip**; local draft; copy “इस फोन पर सेव”. Never a session-expired dead end that loses keys. |
| 5 | …so the wrong door cannot erase you? | One `/pravesh`. Router. Duplicate OTR **recovers**. Never render `No Record Found` as the page title. |
| 6 | …so status is a person and a weekday? | Duty strip + OwnerStamp on `/f` and `/t`. Public track **without** password. |
| 7 | …so a server failure is not the student’s fault? | `ErrorNote` + sim badge. NPCI/PFMS copy names the **system** and the **next step**. `/seemayein` for what software cannot fix. |
| 8 | …so OTR ≠ registration? | Case file shows both, labelled. `/madad` definition list. Never one field named “number”. |
| 9 | …so a parent doesn’t pay an agent? | `/t/[code]` shareable. Hindi. One column. |
| 10 | …so grievance isn’t a third website? | `/shikayat` pre-filled; owner, dates, wait counter in the body. Copy button. |

---

## What we will *not* copy from “modern” gov redesigns

IRCTC’s 2026 note (fewer captchas, fewer popups, fewer flashing graphics) is the **negative space** of the old portals. Milegi should look like that lesson learned — not like a new NIC skin with a gradient.

UMANG is cited as “structured, searchable, fails with feedback.” Steal **structure and failure feedback**, not the app chrome.
