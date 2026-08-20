# Evidence file — UP Saksham scholarship service

Collected 20 Aug 2026. **Method:** public pages only — hackathon brief and FAQ, third-party student
guides, journalism/activist write-ups of real grievances, and the builder's own screenshots of the
public portal. **Zero HTTP requests were made to `scholarship.up.gov.in` or any other government host
during research, and no student account was ever logged into.** The hackathon rules forbid accessing,
testing or interfering with live government systems; reading a public homepage would probably be
harmless, but "we never touched it" is a cleaner claim, and the screenshots cover what the homepage
shows.

Every fact below is tagged with a confidence level. **Aggregator sites contradict each other on income
caps and on whether a login wants mobile or date of birth** — where they do, the prototype shows the
disagreement instead of silently picking a number.

- `GO` — attributed by multiple guides to a 2026-27 government order (GO 91/2026/1941, 20 Jul 2026)
- `AGG` — aggregator/coaching-site consensus, no primary document seen
- `CIT` — first-hand citizen account (grievance record, quoted portal text)
- `SS` — builder's screenshot of the live public portal

---

## 1. Service shape

`SS` The portal is titled **छात्रवृत्ति एवं शुल्क प्रतिपूर्ति ऑनलाइन प्रणाली / Scholarship and Fee
Reimbursement Online System**, branded **Saksham**, run by NIC UP State Unit, jointly maintained by
Social Welfare, Backward Class Welfare, Minority Welfare and Tribal Development departments. The
homepage carries `Total OTR 89,89,714`, `Final Submitted Applications 84,88,216`, `Forwarded from
Institutions 77,08,644`, `Total Beneficiaries 18,64,427` for session 2025-26. Those four counters are
the funnel: **~90 lakh registrations, ~18.6 lakh beneficiaries.**

`SS` Nine login identities exist on the public menu: Students, Institutes, Universities, DIOS,
Honourable Minister Office, Directorate, Deputy Directors, DWO, plus a separate Sanskrit-scholarship
login.

### The eight student doors

`AGG` `SS` Students menu → `NEW REGISTRATION` / `LOGIN FRESH` / `LOGIN RENEWAL`, and each login fans
out to four levels:

| Cycle | Prematric 9–10 | Post-matric Inter 11–12 | Post-matric other than Inter (Dashmottar) | Outside State |
|---|---|---|---|---|
| Fresh | `LoginStudentPreFresh.aspx` | `LoginStudentPostInter.aspx` | `LoginStudentPost.aspx` | `LoginStudentPostOS.aspx` |
| Renewal | `LoginStudentPreRenew.aspx` | `LoginStudentPostRenewInter.aspx` | `LoginStudentPostRenew.aspx` | `LoginStudentPostRenewOS.aspx` |

Plus the OTR popup and `RegistrationNew.aspx`. `AGG` Choosing the wrong level returns
`No Record Found` / `Invalid Registration Number` because **each level is a separate database**.

`SS` A live renewal login form asks: application type (Renewal), course type (Dashmottar), *registration
number of session 2024-25*, OTR number, password/verification code, and a case-sensitive captcha —
six fields, two of which are identifiers students routinely mix up.

## 2. OTR vs registration number

`AGG` **OTR** = One Time Registration, lifetime, Aadhaar/DigiLocker-mapped, mandatory for every fresh
applicant since session 2025-26. Shape `UP25-8800385830` (prefix `UP` + 2-digit year + 10 digits;
guides call this "14-digit", counting characters).

`AGG` **Registration number** = session-specific, 15 numeric digits, e.g. `271370302500941`.

`AGG` OTR generation is three tabs: mobile verification (category + 10-digit Aadhaar-linked mobile +
captcha → OTP, 120-second timer) → Aadhaar e-KYC (12-digit Aadhaar + captcha → DigiLocker sign-in for
new applicants → consent → fetched demographics + photo → second OTP to the Aadhaar-linked number) →
final OTR (father's name, mother's name, email, password, captcha) → printable OTR slip.

`AGG` Hard rules students hit:
- **One OTR per student, ever.** A second one is flagged as a duplicate; guides describe permanent
  debarment from state *and* national portals, and both applications being blocked.
- Aadhaar-derived name, date of birth and gender **cannot be edited** on the portal — only at a UIDAI
  centre, followed by re-running e-KYC.
- Parents' names cannot be edited later either, and must match the Class 10 marksheet.
- **The registered mobile is locked to the OTR.** Losing that SIM means an in-person visit to the
  District Social Welfare Office; online reset is disabled.
- Recovery of a lost OTR or registration number goes through high-school roll number + passing year +
  registered mobile.
- Common failure modes named in guides: `Invalid Aadhaar Number` (demographic mismatch),
  `Digilocker Response Failed` (timeout — advice is literally "try between 11pm and 7am"),
  `OTP Limit Exceeded` (UIDAI daily cap, 24-hour lockout), and cyber-café operators binding the wrong
  DigiLocker account or mobile number.

## 3. The application, as it exists

`AGG` Fresh path: OTR → new registration (district, college, high-school passing year, board, roll
number, password) → the matching one of eight logins (registration number + mobile *or* date of birth +
password + captcha; guides disagree on which) → `आवेदन पत्र भरें` with three sections:

- **शैक्षिक विवरण** — course type (regular/self-financed), course name, year of study, admission dates,
  board/university enrolment number, day scholar (दिवा छात्र) vs hosteller (आवासीय छात्र), previous-year marks
- **निजी विवरण** — family ration card number (`0` is accepted if none)
- **शुल्क संबंधी** — the **approved annual non-refundable fee**, typed by the student

Then, as a **separate dashboard action**, `आय एवं जात प्रमाणीकरण`: income certificate application number +
certificate number verified live against e-District / e-Sathi, then the same for caste. Aadhaar and
high-school roll number auto-verify with a green tick. Then draft print
(`जांच हेतु आवेदन प्रिंट करें`) → **Lock** (irreversible) → final print → **hard copy plus documents to the
institute**.

`AGG` Fee rule: **non-refundable tuition only.** Hostel, mess, caution money, library deposit and exam
fees are excluded, and including them is a standard cause of DWO "suspect data".

`AGG` Photo upload: JPEG, under 20KB. `AGG` Bonafide for degree students must be on college letterhead
with university enrolment number and seal, digitally signed, scanned under 200KB — a handwritten
bonafide is rejected for 2026-27.

`AGG` "My course is missing from the dropdown" is not a student-fixable problem: it means the college
never mapped that course into **master data** for the session. `SS` The public 2026-27 timetable
confirms the institute-side chain: `शिक्षण संस्था द्वारा मास्टर डाटा तैयार करना` (22 Jul – 15 Aug 2026),
`विश्वविद्यालय/एफिलियेटिंग एजेंसी द्वारा फीस आदि का सत्यापन` (23 Jul – 30 Aug 2026), `मास्टर डाटा का सत्यापन`
(25 Jul – 14 Sep 2026), NSP marking for private minority institutions (25 Jul – 14 Sep 2026), then
`छात्रों द्वारा आवेदन पत्र का नवीनीकरण करना` (15 Sep – 15 Oct 2026).

`AGG` Time cost, per the guides' own table: document preparation 1–2 weeks, OTR 10 minutes, **main
form 30 minutes**, NPCI bank mapping 3–5 days. One guide opens with a Class 11 student who tried the
Fresh login **47 times over 3 days** and finally got in at 2am.

## 4. Renewal

`AGG` Renewal = same course, next year, previously sanctioned. Rules:
- **Never mint a new OTR.** The guide's own cautionary story: a B.Sc. 2nd-year student who could not
  find her old registration number, was registered fresh at a CSC, and had *both* applications blocked
  as Aadhaar duplicates. She lost the year.
- Failed the previous year → ineligible. Promoted with back paper → eligible, must select
  "Promoted with Result".
- **Changed course or college, or last year rejected → apply as Fresh.**
- Income and caste certificates are not re-uploaded unless the certificate crossed its 3-year validity.
- Only three things actually change: result status, previous-year marks, current-year non-refundable fee.
- Still Aadhaar-OTP, still lock, still hard copy within 3 days.
- `AGG` A named recurring data error: operators entering CGPA instead of total marks, or one semester's
  marks instead of the combined yearly total → DWO rejection.

## 5. Eligibility numbers (contested — disclose, do not pick silently)

| Source | SC/ST | General | OBC | Minority |
|---|---|---|---|---|
| `AGG` guide A (upscholarshiip) | ₹2,50,000 | ₹2,50,000 | ₹2,00,000 | ₹1,00,000–₹2,00,000 "depends on scheme" |
| `AGG` guide B (buddy4study, post-matric) | ₹2,50,000 | ₹2,00,000 | ₹2,00,000 | ₹2,00,000 |

`AGG` Income certificate validity is **exactly 3 years** from issue, no grace period, verified against
e-District. `AGG` Pre-matric caps are reported inconsistently (₹1L in some, ₹2.5L in others).
`AGG` Attendance must be **75%+**, certified by the institution. `AGG` A student may not hold another
state or central scholarship simultaneously. `AGG` Management-quota admissions (no state counselling)
are typically ineligible for full fee reimbursement but may keep the maintenance allowance.
`AGG` Inter-state migrants must prove ancestral caste with land records plus a Vanshavali attested by a
revenue officer, or the portal defaults them to General.

### Benefit shape

`AGG` The benefit is **fee reimbursement of approved non-refundable fees + a maintenance allowance**,
not "your tuition back". Reported ranges: professional courses (MBBS/BTech/MCA/MBA) ₹30,000–₹50,000+;
technical diploma/B.Ed/B.Pharma ₹15,000–₹30,000; general degree (BA/BSc/BCom) ₹5,000–₹10,000; school
level ₹2,000–₹3,500. Maintenance allowance is a monthly band (roughly ₹230–₹1,200) varying by course
group and hosteller/day-scholar status; pre-matric 9–10 was raised to ₹3,000/year for 2026-27, with
post-matric school-level ₹3,500/year day scholar and up to ₹8,000/year hosteller.

**Consequence for the product:** an on-screen amount is an *estimate with a basis*, never a promise.
Guides state plainly that a private college's full fee is not necessarily reimbursed — the government
rate and verification decide. `CIT` The real grievance case ended in a payment of **₹6,605**, which is
what "your tuition is ₹19,800" does not tell you.

## 6. 2026-27 calendar

`GO` `AGG` As published in the 2026-27 schedule and repeated across guides:

| Milestone | School (9–12) | Degree / Diploma / ITI (Dashmottar) |
|---|---|---|
| Institute master data prepared | 22 Jul – 15 Aug 2026 `SS` | 22 Jul – 15 Aug 2026 `SS` |
| University / affiliating agency fee verification | — | 23 Jul – 30 Aug 2026 `SS` |
| Master data verification | 25 Jul – 14 Sep 2026 `SS` | 25 Jul – 14 Sep 2026 `SS` |
| Registration opens | 11 Aug 2026 | 15 Sep 2026 |
| Renewal last date | 25 Aug 2026 (15-day window) | 15 Oct 2026 |
| Fresh last date | 21 Sep 2026 | 31 Oct 2026 |
| OTR final deadline | 21 Sep 2026 | 31 Oct 2026 |
| Institutional verification / forwarding | 12 Aug – 26 Sep 2026 | 16 Sep – 7 Nov 2026 |
| Scrutiny / suspect list | 17 Sep – 10 Oct 2026 | 16 Nov – 5 Dec 2026 |
| DWO verification window | 27 Sep – 20 Oct 2026 | 8 Nov – 15 Dec 2026 |
| Correction (Sanshodhan) — renewal | 17 Sep – 10 Oct 2026 | 21 Nov – 20 Dec 2026 |
| Correction (Sanshodhan) — fresh | 16 Nov – 14 Dec 2026 | 6 Dec – 31 Dec 2026 |
| Payment — renewal | 29 Sep – 5 Oct 2026 | 1 – 10 Dec 2026 |
| Payment — fresh | 25 – 31 Jan 2027 | 21 – 31 Dec 2026 |
| Phase 2 (suspect/corrected) payment | 16 – 31 Jan 2027 | 16 – 31 Jan 2027 |

`AGG` Institutional forwarding is a hard gate: miss it and the form is **auto-cancelled with no
reversal**. `AGG` Every correction restarts a **3-day hard-copy** obligation, and a corrected form that
is not re-submitted physically is ignored — "the correction hard-copy trap".

## 7. Status vocabulary (what the pipeline says today)

`AGG` The dashboard's green "Check Current Status" button only appears **after** the institute forwards,
so the most dangerous stage is the one with the least visibility. Documented statuses:

| Status | Stage | Action the student must take |
|---|---|---|
| Pending at Institute Level | college | Visit the scholarship cell in person; phone calls are ignored |
| Forwarded by Institution | college → DWO | Wait |
| Pending at College for DWO Forwarding | college | Same as pending |
| Rejected at Institution Level | college | Fix immediately |
| Pending at District Scholarship Committee | DWO | Wait (15–30 days, processed in bulk) |
| Suspect Data / Enrollment Mismatch | DWO | Wait for the Sanshodhan window, then correct |
| Data Level After Scrutiny with Reason | DWO | Read the reason code |
| Verified / Recommended by DWO | DWO ✓ | Switch to tracking PFMS |
| Rejected: Pass Marks Below 50% | DWO | Unfixable |
| Disbursement Failed: Unavailability of Fund | treasury | File a grievance |
| Aadhaar Authentication Failed | system | Update Aadhaar |
| NPCI Mapper Not Updated | bank | Visit the bank branch |
| Duplicate Aadhaar Detected | system | Contact the DWO |

### DWO "suspect data" reason codes

`AGG` The real, named ones — this list is the backbone of Milegi's structured rejection model:

1. **UP Board / ICSE / CBSE roll number mismatch** — board name or high-school roll number does not
   match the board's database. Fixable in the correction window.
2. **Enrolment number not matched with university data** — typed enrolment differs from the
   university's uploaded master enrolment list. Fixable.
3. **Duplicate income certificate number** — a sibling used the same parent's certificate. Fixed by a
   sibling affidavit plus the sibling's application copy, verified by the college. *Not* fixed by
   changing the number.
4. **Blocked by directorate — enrolment limit exceeded / affiliation pending** — the college over-admitted
   beyond sanctioned intake, or its affiliation lapsed. **Not student-fixable at all**; the college
   registrar must file proof with the department in Lucknow.
5. **Attendance below 75%** — uploaded by the college. Not online-fixable; requires signed physical
   attendance logs and a re-upload by the college.

Correction is **one shot**: the portal unlocks only the flagged fields, for a window of a few days, and
a second final-submit re-locks it permanently.

## 8. Payment (PFMS / NPCI)

`AGG` Payment tracking lives on a **different website** (`pfms.nic.in`). `AGG` "Know Your Payments"
searches by bank account, which often returns `No Record Found` for Aadhaar-DBT payments; the working
route is "Track DBT Details" → "Any Other External Systems" → Payment → registration number.

`AGG` Documented PFMS/NPCI outcomes and their real causes:

| Message | Cause | Fix |
|---|---|---|
| Under Processing with Bank | released, in clearing | wait 3–7 working days |
| Payment Successful / Credited | delivered | check whether fee reimbursement and maintenance came as separate credits |
| Student Beneficiary Response Pending from PFMS | Saksham↔PFMS sync lag, or bank returned "verification pending" | wait 10–15 working days, then re-KYC at the bank |
| Rejected by Bank / UID is Disabled for DBT | account has Aadhaar KYC but **not** NPCI-DBT seeding | branch visit, NPCI Aadhaar seeding / DBT mapping form |
| Rejected by Bank — Account Closed / Dormant | no transactions for 12–24 months | reactivate, then re-check seeding |
| Transaction Limit Exceeded | ₹30–50k credit into a basic savings account with a lower per-transaction cap; joint/minor accounts also bounce | upgrade the account or raise the limit |

`AGG` Aadhaar-DBT is why the portal no longer needs a typed account number, even though aggregator
document checklists still list "bank passbook" — the passbook is in the physical file, not the form.

## 9. Failure and silence — first-hand

`CIT` **Grievance GOVUP/E/2026/0035742, filed 21 Mar 2026** (Post-matric 2025-26, two students).
Applications were submitted, verified at institute level, attendance/result/fee recorded, and forwarded
by the institution in **December 2025**. Then nothing: "university/affiliating body scrutiny, data
verification, account authentication, sanction approval, payment processing — all remained pending"
for over three months. The portal showed the stage and no reason, no owner, and no expected date. Only
after a Jansunwai (`jansunwai.up.nic.in`) complaint did the department act; **₹6,605** was paid by
Aadhaar DBT and the grievance was closed. The author's recommendations, verbatim in substance:
automated alerts for stalled applications, **enforced per-stage timelines with consequences**,
inter-agency coordination, and real-time stage updates by SMS/email.

`CIT` **Grievance filed 21 Nov 2024**: `scholarship.up.gov.in` "dysfunctional for weeks", showing
`"This page is not working… ERROR 500: Internal Server Error."` A comment on the same post:
*"Third grade website of the Government of Uttar Pradesh. Disfunctional for 15 days."*

`CIT` **Grievance filed 2 Nov 2024**: the NPCI-side status had read
`Status not received from NPCI server, Checked Date:-(19/11/2024 14:47:09)` since 23 Oct 2024 — a raw
machine string, with a timestamp, shown to a citizen as their only explanation. An earlier grievance
`GOVUP/E/2024/0078702` was closed "without providing an appropriate solution".

`AGG` The pattern is institutional, not incidental: guides advise students to use the portal between
11pm and 4am, and to expect crashes on deadline dates.

## 10. Support channels (real, for realistic copy)

`AGG` Toll-free `18004190001`; Kalyan Saathi `14568`; Backward Class `18001805131`; directorate
`0522-3538700`; WhatsApp `6391114568`; CM Helpline `1076`; grievances at `jansunwai.up.nic.in`.
District DWO offices sit in Vikas Bhawan / Kalyan Bhawan. Milegi's copy references *the existence* of
these routes generically and never dials or impersonates them.

## 11. Hackathon rules (verbatim points that bind the build)

From `buildwhatmovesindia.com/brief` and `/faq`, fetched 20 Aug 2026:

- "Pick **one real problem you have faced** on an Indian public-service website or digital service."
- "your prototype should be **built with Codex or powered by an OpenAI model**. Codex should be a
  meaningful part of how you build it, not something added only for the submission."
- "Your prototype should solve the real problem, **not just redesign the interface**, by accounting for
  the backend, infrastructure and processes required to make the solution work."
- "Let us complete the main journey from start to finish." · "Be designed for real Indian users,
  including people on mobile devices, slower connections or with limited digital experience." · "Use
  mock or synthetic data wherever personal information, payments, OTPs or government systems would
  normally be involved."
- "**A cleaner screen over the same broken process is not a fix.**"
- "**Every feature you demo must work.** If you present it on stage, show it working; do not rely on an
  explanation."
- Forbidden: touching live government systems, reverse-engineering private systems, scraping personal
  data, real Aadhaar/PAN/passwords/OTPs/payment/health data, presenting the build as official, using
  government logos to imply approval, resubmitting an old project.
- "You can study it to understand the problem. You **cannot** copy its code, build on its
  infrastructure or reverse-engineer its private systems."
- Submit by **27 Aug 2026**: live demo link, video ideally ≤3 minutes, write-up (problem, who it
  affects, solution, what changed and why, tools used and how Codex contributed, what is functional vs
  mocked, known limitations), optional repo link. Every link must open without requesting access.
- Judged on: Problem · Working build · Usability · Product thinking · End-to-end thinking · Honesty.
- Solo or team up to four; 10 finalists; finale **12 Sep 2026**; no promise of adoption; prizes are
  ChatGPT/Codex Pro for a year, credits, goodies.
- "Is a Figma design enough? **No.**" · "Will visual design alone win? Good design matters, but it is
  not enough."

---

## Sources

Hackathon: <https://buildwhatmovesindia.com/brief>, <https://buildwhatmovesindia.com/faq>

Student guides (aggregators — treat as `AGG`):
<https://upscholarshiip.com/otr-guide/>, <https://upscholarshiip.com/apply-online/>,
<https://upscholarshiip.com/renewal/>, <https://upscholarshiip.com/application-status-check/>,
<https://upscholarshiip.com/payment-status/>, <https://upscholarshiip.com/correction/>,
<https://www.buddy4study.com/article/up-scholarship>,
<https://www.buddy4study.com/article/up-scholarship-login>,
<https://school.careers360.com/articles/up-post-matric-scholarship-2026>

Citizen grievance records (`CIT`):
<https://yogi.systems/2026/04/12/scholarship-delay-to-delivery-in-up-a-case-study/>,
<https://yogi.systems/2024/11/21/resolving-500-errors-on-up-scholarship-application-website/>

Grievance channel: <https://jansunwai.up.nic.in>

Screenshots (`SS`): builder's own captures of the public `scholarship.up.gov.in` homepage, the
Students and Institutes menus, and a public renewal login page, 20 Aug 2026.
