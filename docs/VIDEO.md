# Video Walkthrough Plan — Two-Minute Citizen Cut (120s)

**Format & Viewport:**
- Record the **Citizen Journey (0:00–1:35)** at a crisp **360px width** (mobile Android emulation).
- Switch to **Desktop View (1:35–2:00)** for the Operator Consoles and Simulation Panel.
- **Voiceover:** Hindi-first or bilingual; concise, technical, and empathetic.
- **Strict Rule:** No background music over speech. Banner must be readable in the very first frame.

---

## Chronological Script & Cue Sheet

| Time | Duration | Segment | Screen & Interaction | Voiceover Cue / What to Say |
|---|---|---|---|---|
| **0:00–0:15** | 15s | **The Problem & The One Door** | `https://milegi.vercel.app`<br>Show the landing hero at 360px. Highlight the 8-door problem card and synthetic case strip. Point to the banner. | *“UP Scholarship portal par 8 alag login gates hain aur 3-3 mahine file rukne par koi SMS nahi aata. Milegi is poore chaos ko 1 single door me badalta hai. Yeh ek independent prototype hai.”* |
| **0:15–0:35** | 20s | **Intake & Zero-Trap Routing** | `/pravesh` → `/otr` → `/raasta`<br>Enter demo phone → 6-box OTP auto-advances (no captcha). Enter demo Aadhaar (`0000 8123 4567`) twice → show duplicate recovery hero. In router, select **"पता नहीं"** → resolves safely to renewal. | *“Pravesh me koi captcha nahi — OTP screen par hai. OTR duplicate hone par student debar nahi hota, balki purana number turant recover hota hai. ‘Pata nahi’ chune par bhi safe route milta hai.”* |
| **0:35–0:55** | 20s | **Pre-flight & The One Form** | `/taiyari/[caseId]` → `/aavedan/[caseId]`<br>Show pre-flight check flagging an income certificate expiring before disbursement. Fix certificate → open form. Type marks; show live `SaveChip` in bottom bar (`इस फ़ोन पर सुरक्षित` → `सर्वर पर सुरक्षित`). Show struck-through non-refundable fee heads. | *“Taiyari jaanch form bharne se pehle income certificate ki validity check karti hai. Aavedan page par har keystroke phone par autosave hota hai. Fee college master data se aati hai — non-refundable heads strike-through dikhte hain.”* |
| **0:55–1:15** | 20s | **Lock & The Gazette Register** | `/jaanch/[caseId]` → `/f/[caseId]`<br>Show `/jaanch` with 3-day hard copy deadline at `--step-3`. Click "फ़ॉर्म लॉक करें". Instant registration number. Show the case file: sticky `DutyStrip`, `OwnerStamp` naming the institute clerk, and `StageLedger`. | *“Jaanch page par 3 din ki hard-copy deadline saaf dikhti hai. Lock karte hi registration number milta hai aur file Gazette Register ban jaati hai — jisme har stage ka ek naam wala clerk aur due date hoti hai.”* |
| **1:15–1:35** | 20s | **Public Track & Grievance** | `/t/[code]` → `/shikayat/[caseId]`<br>Open `/t/[code]` in incognito without logging in — parent sees status and deadline with zero private form data. Return to `/f/[caseId]` → click `/shikayat` → show one-click Jan Sunwai grievance draft naming officer and days waited. | *“Public track link se parents bina login ya captcha ke file ki status dekh sakte hain. Agar file rukti hai, to ek click me Jan Sunwai grievance draft taiyar hota hai — jisme afsar ka naam aur deri darj hoti hai.”* |
| **1:35–1:50** | 15s | **Operator Consoles & Clock Sim** | `/sansthan/kaksh` → `/mock`<br>Switch to Desktop. Log in with PIN `1234`. Show attendance check (under 75% blocked). Open `/mock` and advance clock by **+15 days**. Return to student file: show SLA breach badge, escalation log, and active grievance. | *“Sansthan portal par 75% attendance rule strictly enforce hota hai. Mock engine me 15 din aage badhane par SLA breach trigger hota hai aur file automatically escalate ho jaati hai.”* |
| **1:50–2:00** | 10s | **Disbursement Receipt & Boundaries** | `/f/[caseId]` (Paid) → `/seemayein`<br>Show PFMS batch credit with hero money amount and UPI-receipt paid stamp. End on `/seemayein` table defining the boundary of what software can and cannot fix. | *“PFMS credit ke baad student ko milti hai definitive payment receipt. Milegi wo software hai jo har citizen file ko accountability deta hai. Live link: milegi.vercel.app.”* |

---

## Pre-Recording Checklist

- [ ] **Disclaimer Banner:** Clearly visible in top 8px on all routes.
- [ ] **Mobile Frame:** Browser width locked to 360px for citizen journey.
- [ ] **Demo Aadhaar:** Starts with `0000` (e.g. `0000 8123 4567`).
- [ ] **Autosave Chip:** Visibly transition state while typing on `/aavedan`.
- [ ] **Public Track URL:** Opened without session / cookies to prove open visibility.
- [ ] **Grievance Text:** Copy button clicked and feedback toast triggered.
- [ ] **Simulator Offset:** Demonstrated advancing clock by +15 days to prove SLA escalation.
- [ ] **Time Limit:** Final cut strictly within **120 seconds**.
