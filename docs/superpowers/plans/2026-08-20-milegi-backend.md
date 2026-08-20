# Milegi Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal (Part A, tasks 1-10):** Build the HTTP-free domain core — config, clock, store, state machine, pre-flight, fees, router, alerts, validation, mock upstreams — with tests, so every later plan builds on proven logic.

**Architecture:** Everything in `src/server/**` is synchronous and knows nothing about HTTP or React. A store snapshot is loaded by `hydrate()` before domain calls and written by `persist()` after; the domain itself only touches in-memory records. All time reads go through `now()` so the simulator can move the clock.

**Tech Stack:** TypeScript, Next.js 16 project layout (no routes yet), `node --test` via `tsx`, no runtime dependencies beyond React/Next.

**Spec:** `docs/superpowers/specs/2026-08-20-milegi-design.md`

## Global Constraints

- Synthetic data only. Aadhaar-shaped input **must** start `0000`; any other value is rejected.
- No account number or IFSC field anywhere. No student-typed tuition. No runtime LLM.
- `now()` from `src/server/clock.ts` is the only time source. `Date.now()` and `new Date()` (without an argument) are banned outside `clock.ts`.
- A case in a non-terminal stage always has `owner` and `dueAt`. `transition()` asserts this.
- Every published rule carries `source` and `confidence: "GO" | "AGG" | "CIT"`.
- Money on screen is an estimate; `estimate.basisHi` always states the basis.
- No `"type": "module"` in `package.json`; no `.ts` extensions in import specifiers; tests run `node --import tsx --test`.
- Store JSON path defaults under `os.tmpdir()`, never inside the repo.
- Sessions 2026-27 only. Tracks: `pre_9_10`, `post_inter`, `dashmottar`, `outside_state`.

---

### Task 1: Scaffold, types, clock

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `.env.example`
- Create: `src/server/types.ts`, `src/server/clock.ts`, `src/server/clock.test.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx` (stubs so `next build` works)

**Interfaces:**
- Consumes: nothing.
- Produces: every type in §4 of the spec; `now(): Date`, `today(): string`, `addDays(iso, n): string`, `daysBetween(a, b): number`, `setClockOffset(days: number)`, `getClockOffset(): number`, `iso(d: Date): string`.

- [ ] **Step 1: Create the project files**

```json
{
  "name": "milegi",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "test": "node --import tsx --test \"src/server/**/*.test.ts\""
  },
  "dependencies": { "next": "16.3.0", "react": "19.2.0", "react-dom": "19.2.0" },
  "devDependencies": {
    "@types/node": "22.14.0", "@types/react": "19.2.0", "@types/react-dom": "19.2.0",
    "tsx": "4.19.2", "typescript": "5.7.2"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022", "lib": ["dom", "dom.iterable", "ES2022"],
    "strict": true, "noUncheckedIndexedAccess": true, "exactOptionalPropertyTypes": false,
    "module": "esnext", "moduleResolution": "bundler", "jsx": "preserve",
    "allowJs": false, "skipLibCheck": true, "esModuleInterop": true,
    "incremental": true, "noEmit": true, "resolveJsonModule": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }, "baseUrl": "."
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.ts`: `import type { NextConfig } from "next"; const config: NextConfig = {}; export default config;`

`.gitignore`: `node_modules`, `.next`, `.env*.local`, `*.log`.

`.env.example`:

```
DATABASE_URL=
MILEGI_SESSION_SECRET=dev-only-change-me
MILEGI_STORE_PATH=
MILEGI_ALLOW_EPHEMERAL=
```

- [ ] **Step 2: Write the failing clock test**

`src/server/clock.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, daysBetween, getClockOffset, iso, now, setClockOffset } from "./clock";

test("clock offset moves now() forward in whole days", () => {
  setClockOffset(0);
  const base = now().getTime();
  setClockOffset(10);
  const moved = now().getTime();
  assert.equal(Math.round((moved - base) / 86400000), 10);
  assert.equal(getClockOffset(), 10);
  setClockOffset(0);
});

test("addDays and daysBetween are inverse on ISO dates", () => {
  assert.equal(addDays("2026-09-15T00:00:00.000Z", 3).slice(0, 10), "2026-09-18");
  assert.equal(daysBetween("2026-09-15T00:00:00.000Z", "2026-09-22T00:00:00.000Z"), 7);
  assert.equal(daysBetween("2026-09-22T00:00:00.000Z", "2026-09-15T00:00:00.000Z"), -7);
});

test("iso is stable and second-precision safe", () => {
  assert.equal(iso(new Date("2026-10-01T05:30:00.000Z")), "2026-10-01T05:30:00.000Z");
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './clock'`.

- [ ] **Step 4: Implement the clock**

`src/server/clock.ts`:

```ts
// The ONLY place in the codebase allowed to read wall-clock time.
// The simulator moves `offsetDays` so the whole app can time-travel.
let offsetDays = 0;

export function setClockOffset(days: number): void {
  offsetDays = Math.trunc(days);
}

export function getClockOffset(): number {
  return offsetDays;
}

export function now(): Date {
  return new Date(Date.now() + offsetDays * 86400000);
}

export function iso(d: Date = now()): string {
  return d.toISOString();
}

export function today(): string {
  return iso().slice(0, 10);
}

export function addDays(isoStamp: string, days: number): string {
  return new Date(new Date(isoStamp).getTime() + days * 86400000).toISOString();
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86400000);
}

export function isBefore(a: string, b: string): boolean {
  return new Date(a).getTime() < new Date(b).getTime();
}

export function earliest(...stamps: (string | null | undefined)[]): string {
  const valid = stamps.filter((s): s is string => typeof s === "string" && s.length > 0);
  if (valid.length === 0) throw new Error("earliest() needs at least one timestamp");
  return valid.reduce((a, b) => (isBefore(a, b) ? a : b));
}
```

- [ ] **Step 5: Write `src/server/types.ts`**

Copy every type from spec §4 verbatim (`TrackId`, `Cycle`, `Category`, `Profile`, `Stage`, `ActorRef`,
`Case`, `CaseEvent`, `Institute`, `FeeHeads`, `PreflightItem`, `PfmsStatus`), and add:

```ts
export type Confidence = "GO" | "AGG" | "CIT";
export type Sourced<T> = T & { source: string; confidence: Confidence };
export type PfmsStatus =
  | "processing_with_bank" | "credited" | "beneficiary_pending"
  | "rejected_not_seeded" | "rejected_dormant" | "limit_exceeded";
export type Alert = {
  id: string; kind: string; severity: "info" | "warn" | "danger";
  titleHi: string; titleEn: string; detailHi: string; detailEn: string;
  actionHi: string | null; actionHref: string | null; dueAt: string | null;
};
export type Notification = {
  id: string; caseId: string; channel: "sms" | "whatsapp";
  to: string; textHi: string; reason: string; createdAt: string;
};
export type SimConfig = {
  clockOffsetDays: number;
  upstream: Record<"ekyc" | "digilocker" | "edistrict" | "boards" | "npci" | "pfms",
    { health: "up" | "slow" | "down"; failureRate: number }>;
  forcedPfmsOutcome: PfmsStatus | null;
  outageLog: { system: string; from: string; to: string | null }[];
};
```

- [ ] **Step 6: Stub the app so the build passes**

`src/app/layout.tsx` returns `<html lang="hi"><body>{children}</body></html>`; `src/app/page.tsx`
returns a single `<main>मिलेगी</main>`. Real shell arrives in plan 03.

- [ ] **Step 7: Run everything**

Run: `npm install && npm test && npm run typecheck && npm run build`
Expected: 3 clock tests pass; typecheck clean; build succeeds.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts .gitignore .env.example src
git commit -m "feat: scaffold Milegi with domain types and a single time source"
```

---

### Task 2: Config — schemes, calendar, rates, reason codes

**Files:**
- Create: `src/server/config/schemes.ts`, `src/server/config/calendar.ts`, `src/server/config/rates.ts`, `src/server/config/reasons.ts`, `src/server/config/districts.ts`
- Create: `src/server/config/config.test.ts`

**Interfaces:**
- Consumes: `types.ts`.
- Produces: `SCHEMES: Record<TrackId, Scheme>`, `calendarFor(track, cycle): Calendar`, `incomeCapFor(track, category): Sourced<{ cap: number; note: string }>`, `maintenanceFor(group, hosteller): Sourced<{ perMonth: number; months: number }>`, `REASONS: Record<string, ReasonCode>`, `DISTRICTS`.

- [ ] **Step 1: Write the failing config test**

`src/server/config/config.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { SCHEMES } from "./schemes";
import { calendarFor } from "./calendar";
import { incomeCapFor, maintenanceFor } from "./rates";
import { REASONS } from "./reasons";

const TRACKS = ["pre_9_10", "post_inter", "dashmottar", "outside_state"] as const;

test("every track has a scheme, both cycles have a calendar, dates are ordered", () => {
  for (const track of TRACKS) {
    assert.ok(SCHEMES[track], `missing scheme ${track}`);
    for (const cycle of ["fresh", "renewal"] as const) {
      const c = calendarFor(track, cycle);
      assert.ok(c.registrationOpen < c.studentDeadline, `${track}/${cycle} window inverted`);
      assert.ok(c.studentDeadline < c.instituteForwardDeadline);
      assert.ok(c.instituteForwardDeadline <= c.dwoWindowEnd);
      assert.ok(c.correctionOpen < c.correctionClose);
      assert.ok(c.disbursementFrom < c.disbursementTo);
      assert.ok(c.source.length > 0 && c.confidence);
    }
  }
});

test("income caps are sourced and never silently equal across categories", () => {
  const sc = incomeCapFor("dashmottar", "sc");
  const obc = incomeCapFor("dashmottar", "obc");
  assert.equal(sc.cap, 250000);
  assert.equal(obc.cap, 200000);
  assert.match(sc.source, /http/);
  assert.ok(obc.note.length > 0, "a contested cap must carry a note");
});

test("maintenance bands exist for every course group and both residence types", () => {
  for (const group of ["prof", "tech", "general", "school"] as const) {
    for (const hosteller of [true, false]) {
      const m = maintenanceFor(group, hosteller);
      assert.ok(m.perMonth > 0 && m.months > 0);
      assert.ok(m.source.length > 0);
    }
  }
});

test("every reason code says who fixes it and whether the correction window applies", () => {
  const codes = Object.values(REASONS);
  assert.ok(codes.length >= 8);
  for (const r of codes) {
    assert.ok(r.hi.length > 0 && r.en.length > 0);
    assert.ok(["student", "institute", "bank", "revenue_office", "none"].includes(r.fixedBy));
    assert.equal(typeof r.correctable, "boolean");
    assert.ok(r.fixHi.length > 0);
  }
});

test("BLOCKED_BY_DIRECTORATE is explicitly not student-fixable", () => {
  assert.equal(REASONS.BLOCKED_BY_DIRECTORATE.fixedBy, "institute");
  assert.equal(REASONS.BLOCKED_BY_DIRECTORATE.correctable, false);
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './schemes'`.

- [ ] **Step 3: Write `schemes.ts`**

```ts
import type { Category, TrackId } from "../types";

export type SectionId = "identity" | "education" | "previous_result" | "family_docs" | "fee" | "declaration";

export type Scheme = {
  id: TrackId;
  nameHi: string; nameEn: string;
  classesHi: string;
  sections: SectionId[];
  needsMarks: boolean;          // previous-year marks required
  feeReimbursement: boolean;    // false where only maintenance applies
  needsBonafide: boolean;
  needsUniversityScrutiny: boolean;
  completable: true;            // all four tracks are completable in this prototype
};

export const SCHEMES: Record<TrackId, Scheme> = {
  pre_9_10: {
    id: "pre_9_10", nameHi: "पूर्वदशम (कक्षा 9-10)", nameEn: "Pre-Matric (Class 9-10)",
    classesHi: "कक्षा 9 और 10",
    sections: ["identity", "education", "previous_result", "family_docs", "fee", "declaration"],
    needsMarks: true, feeReimbursement: false, needsBonafide: false,
    needsUniversityScrutiny: false, completable: true,
  },
  post_inter: {
    id: "post_inter", nameHi: "दशमोत्तर इंटर (कक्षा 11-12)", nameEn: "Post-Matric Inter (Class 11-12)",
    classesHi: "कक्षा 11 और 12",
    sections: ["identity", "education", "previous_result", "family_docs", "fee", "declaration"],
    needsMarks: true, feeReimbursement: true, needsBonafide: false,
    needsUniversityScrutiny: false, completable: true,
  },
  dashmottar: {
    id: "dashmottar", nameHi: "दशमोत्तर (इंटर के अतिरिक्त)", nameEn: "Post-Matric other than Inter",
    classesHi: "डिग्री, डिप्लोमा, आई.टी.आई.",
    sections: ["identity", "education", "previous_result", "family_docs", "fee", "declaration"],
    needsMarks: true, feeReimbursement: true, needsBonafide: true,
    needsUniversityScrutiny: true, completable: true,
  },
  outside_state: {
    id: "outside_state", nameHi: "उत्तर प्रदेश के बाहर अध्ययनरत", nameEn: "Studying outside UP",
    classesHi: "दूसरे राज्य का संस्थान",
    sections: ["identity", "education", "previous_result", "family_docs", "fee", "declaration"],
    needsMarks: true, feeReimbursement: true, needsBonafide: true,
    needsUniversityScrutiny: false, completable: true,
  },
};

export const CATEGORIES: { id: Category; hi: string; en: string }[] = [
  { id: "sc", hi: "अनुसूचित जाति", en: "SC" },
  { id: "st", hi: "अनुसूचित जनजाति", en: "ST" },
  { id: "obc", hi: "अन्य पिछड़ा वर्ग", en: "OBC" },
  { id: "general", hi: "सामान्य", en: "General" },
  { id: "minority", hi: "अल्पसंख्यक", en: "Minority" },
];
```

- [ ] **Step 4: Write `calendar.ts`**

Dates from the evidence file §6. Every entry carries its source.

```ts
import type { Confidence, Cycle, TrackId } from "../types";

export type Calendar = {
  registrationOpen: string; studentDeadline: string;
  instituteForwardFrom: string; instituteForwardDeadline: string;
  dwoWindowFrom: string; dwoWindowEnd: string;
  correctionOpen: string; correctionClose: string;
  disbursementFrom: string; disbursementTo: string;
  source: string; confidence: Confidence;
};

const SRC = "https://upscholarshiip.com/apply-online/ (2026-27 schedule, attributed to GO 91/2026/1941)";
const d = (s: string) => `${s}T00:00:00.000Z`;

const SCHOOL_FRESH: Calendar = {
  registrationOpen: d("2026-08-11"), studentDeadline: d("2026-09-21"),
  instituteForwardFrom: d("2026-08-12"), instituteForwardDeadline: d("2026-09-26"),
  dwoWindowFrom: d("2026-09-27"), dwoWindowEnd: d("2026-10-20"),
  correctionOpen: d("2026-11-16"), correctionClose: d("2026-12-14"),
  disbursementFrom: d("2027-01-25"), disbursementTo: d("2027-01-31"),
  source: SRC, confidence: "AGG",
};

const SCHOOL_RENEWAL: Calendar = {
  ...SCHOOL_FRESH,
  studentDeadline: d("2026-08-25"),
  correctionOpen: d("2026-09-17"), correctionClose: d("2026-10-10"),
  disbursementFrom: d("2026-09-29"), disbursementTo: d("2026-10-05"),
};

const DEGREE_FRESH: Calendar = {
  registrationOpen: d("2026-09-15"), studentDeadline: d("2026-10-31"),
  instituteForwardFrom: d("2026-09-16"), instituteForwardDeadline: d("2026-11-07"),
  dwoWindowFrom: d("2026-11-08"), dwoWindowEnd: d("2026-12-15"),
  correctionOpen: d("2026-12-06"), correctionClose: d("2026-12-31"),
  disbursementFrom: d("2026-12-21"), disbursementTo: d("2026-12-31"),
  source: SRC, confidence: "AGG",
};

const DEGREE_RENEWAL: Calendar = {
  ...DEGREE_FRESH,
  studentDeadline: d("2026-10-15"),
  correctionOpen: d("2026-11-21"), correctionClose: d("2026-12-20"),
  disbursementFrom: d("2026-12-01"), disbursementTo: d("2026-12-10"),
};

const TABLE: Record<TrackId, Record<Cycle, Calendar>> = {
  pre_9_10: { fresh: SCHOOL_FRESH, renewal: SCHOOL_RENEWAL },
  post_inter: { fresh: SCHOOL_FRESH, renewal: SCHOOL_RENEWAL },
  dashmottar: { fresh: DEGREE_FRESH, renewal: DEGREE_RENEWAL },
  outside_state: { fresh: DEGREE_FRESH, renewal: DEGREE_RENEWAL },
};

export function calendarFor(track: TrackId, cycle: Cycle): Calendar {
  return TABLE[track][cycle];
}

export const PHASE_TWO_PAYMENT = {
  from: d("2027-01-16"), to: d("2027-01-31"),
  labelHi: "सुधार के बाद (फेज़ 2) भुगतान", source: SRC, confidence: "AGG" as Confidence,
};
```

- [ ] **Step 5: Write `rates.ts`**

```ts
import type { Category, Confidence, TrackId } from "../types";

export type CourseGroup = "prof" | "tech" | "general" | "school";

const CAP_SRC_A = "https://upscholarshiip.com/apply-online/";
const CAP_SRC_B = "https://www.buddy4study.com/article/up-scholarship";
const RATE_SRC = "https://www.buddy4study.com/article/up-scholarship (2026-27 benefit ranges)";

export function incomeCapFor(track: TrackId, category: Category):
  { cap: number; note: string; source: string; confidence: Confidence } {
  const contested =
    "स्रोत आपस में मेल नहीं खाते — कुछ गाइड सामान्य वर्ग के लिए ₹2,50,000 बताते हैं, कुछ ₹2,00,000। " +
    "अंतिम सीमा आपके वर्ग की शासनादेश-अधिसूचना से तय होती है।";
  if (category === "sc" || category === "st") {
    return { cap: 250000, note: "", source: `${CAP_SRC_A} · ${CAP_SRC_B}`, confidence: "AGG" };
  }
  if (category === "minority") {
    return {
      cap: 200000,
      note: "अल्पसंख्यक योजनाओं में सीमा ₹1,00,000 से ₹2,00,000 तक बताई जाती है; यहाँ ऊपरी सीमा ली गई है।",
      source: `${CAP_SRC_A} · ${CAP_SRC_B}`, confidence: "AGG",
    };
  }
  return { cap: 200000, note: contested, source: `${CAP_SRC_A} · ${CAP_SRC_B}`, confidence: "AGG" };
}

// Maintenance allowance bands. Monthly figures are the mid-point of publicly reported ranges and are
// labelled as estimates everywhere they are shown.
export function maintenanceFor(group: CourseGroup, hosteller: boolean):
  { perMonth: number; months: number; source: string; confidence: Confidence } {
  const table: Record<CourseGroup, { day: number; hostel: number }> = {
    prof:    { day: 750, hostel: 1200 },
    tech:    { day: 550, hostel: 820 },
    general: { day: 300, hostel: 570 },
    school:  { day: 290, hostel: 660 },
  };
  const row = table[group];
  return {
    perMonth: hosteller ? row.hostel : row.day,
    months: 10,
    source: RATE_SRC, confidence: "AGG",
  };
}

export const AMOUNT_DISCLAIMER_HI =
  "यह अनुमान है। स्वीकृत राशि विभाग तय करता है — निजी संस्थान का पूरा शुल्क वापस मिलना ज़रूरी नहीं है।";
```

- [ ] **Step 6: Write `reasons.ts`**

```ts
export type ReasonCode = {
  id: string;
  hi: string; en: string;
  fixHi: string;
  fixedBy: "student" | "institute" | "bank" | "revenue_office" | "none";
  correctable: boolean;      // can be fixed in the Sanshodhan window
  raisedBy: "institute" | "dwo" | "system";
  source: string;
};

const SRC = "https://upscholarshiip.com/correction/";

export const REASONS: Record<string, ReasonCode> = {
  BOARD_ROLL_MISMATCH: {
    id: "BOARD_ROLL_MISMATCH",
    hi: "हाई स्कूल रोल नंबर या बोर्ड का नाम बोर्ड के डेटाबेस से मेल नहीं खा रहा",
    en: "High-school roll number or board name does not match the board database",
    fixHi: "सुधार विंडो में सही बोर्ड चुनें और मार्कशीट पर छपा रोल नंबर वैसे ही भरें।",
    fixedBy: "student", correctable: true, raisedBy: "dwo", source: SRC,
  },
  ENROLMENT_MISMATCH: {
    id: "ENROLMENT_MISMATCH",
    hi: "नामांकन संख्या विश्वविद्यालय के मास्टर डेटा से मेल नहीं खा रही",
    en: "Enrolment number does not match university master data",
    fixHi: "कॉलेज की नामांकन पर्ची से संख्या मिलाएँ और सुधार विंडो में दोबारा भरें (स्पेस या डैश न डालें)।",
    fixedBy: "student", correctable: true, raisedBy: "dwo", source: SRC,
  },
  DUPLICATE_INCOME_CERT: {
    id: "DUPLICATE_INCOME_CERT",
    hi: "यही आय प्रमाणपत्र किसी और आवेदन में भी लगा है (अक्सर भाई-बहन)",
    en: "The same income certificate is used on another application (usually a sibling)",
    fixHi: "नंबर बदलने की ज़रूरत नहीं। भाई-बहन का शपथ-पत्र और उनके आवेदन की कॉपी कॉलेज लिपिक को दें।",
    fixedBy: "student", correctable: false, raisedBy: "dwo", source: SRC,
  },
  BLOCKED_BY_DIRECTORATE: {
    id: "BLOCKED_BY_DIRECTORATE",
    hi: "निदेशालय स्तर पर रोक — कॉलेज की स्वीकृत सीट सीमा या सम्बद्धता का मामला",
    en: "Blocked by directorate — sanctioned intake exceeded or affiliation pending",
    fixHi: "यह छात्र के स्तर पर ठीक नहीं होता। कॉलेज प्रशासन को सम्बद्धता/सीट का प्रमाण विभाग को भेजना होगा।",
    fixedBy: "institute", correctable: false, raisedBy: "dwo", source: SRC,
  },
  ATTENDANCE_BELOW_75: {
    id: "ATTENDANCE_BELOW_75",
    hi: "उपस्थिति 75% से कम दर्ज है",
    en: "Attendance recorded below 75%",
    fixHi: "ऑनलाइन ठीक नहीं होगा। विभागाध्यक्ष से हस्ताक्षरित उपस्थिति विवरण लेकर कॉलेज से दोबारा अपलोड कराएँ।",
    fixedBy: "institute", correctable: false, raisedBy: "institute", source: SRC,
  },
  INCOME_CERT_EXPIRED: {
    id: "INCOME_CERT_EXPIRED",
    hi: "आय प्रमाणपत्र की 3 साल की वैधता पूरी हो गई है",
    en: "Income certificate is past its 3-year validity",
    fixHi: "ई-डिस्ट्रिक्ट से नया आय प्रमाणपत्र बनवाएँ (आम तौर पर 7-15 दिन), फिर प्रमाणीकरण दोबारा चलाएँ।",
    fixedBy: "revenue_office", correctable: true, raisedBy: "system", source: SRC,
  },
  HARDCOPY_NOT_RECEIVED: {
    id: "HARDCOPY_NOT_RECEIVED",
    hi: "लॉक की गई प्रति कॉलेज में जमा नहीं हुई",
    en: "The locked printout never reached the institute",
    fixHi: "अंतिम प्रिंट, शुल्क रसीद और मार्कशीट कॉलेज छात्रवृत्ति प्रकोष्ठ में जमा करें और रसीद लें।",
    fixedBy: "student", correctable: true, raisedBy: "institute", source: SRC,
  },
  FEE_MISMATCH: {
    id: "FEE_MISMATCH",
    hi: "फॉर्म का गैर-वापसी योग्य शुल्क कॉलेज की रसीद से मेल नहीं खा रहा",
    en: "Non-refundable fee does not match the institute receipt",
    fixHi: "रसीद कॉलेज लिपिक को दिखाएँ — मास्टर डेटा का शुल्क कॉलेज ही ठीक कर सकता है।",
    fixedBy: "institute", correctable: true, raisedBy: "institute", source: SRC,
  },
  NPCI_NOT_SEEDED: {
    id: "NPCI_NOT_SEEDED",
    hi: "बैंक खाता आधार-DBT (NPCI) से जुड़ा नहीं है, इसलिए भुगतान वापस लौट आया",
    en: "Bank account is not NPCI/Aadhaar-DBT seeded, so the payment bounced",
    fixHi: "बैंक शाखा जाकर 'NPCI Aadhaar Seeding / DBT Mapping' फॉर्म भरें। 'KYC हो चुका है' पर्याप्त नहीं है।",
    fixedBy: "bank", correctable: false, raisedBy: "system", source: "https://upscholarshiip.com/payment-status/",
  },
  COURSE_NOT_PUBLISHED: {
    id: "COURSE_NOT_PUBLISHED",
    hi: "आपका कोर्स कॉलेज के मास्टर डेटा में इस सत्र के लिए नहीं है",
    en: "Your course is missing from the institute's master data for this session",
    fixHi: "कॉलेज के छात्रवृत्ति नोडल अधिकारी से कहें: 'कृपया मास्टर डेटा में यह कोर्स और शुल्क प्रकाशित करें।'",
    fixedBy: "institute", correctable: false, raisedBy: "system", source: "https://upscholarshiip.com/apply-online/",
  },
};
```

`districts.ts`: a plain list of ~12 UP districts with `{ code, hi, en }`, enough for seeds and the DWO
console (`70` Kanpur Nagar, `72` Lucknow, `50` Prayagraj, `67` Varanasi, `55` Meerut, `13` Gorakhpur,
`06` Hathras, `18` Mathura, `31` Jhansi, `44` Bareilly, `28` Aligarh, `61` Ayodhya).

- [ ] **Step 7: Run the tests**

Run: `npm test`
Expected: all config tests pass (5 new tests).

- [ ] **Step 8: Commit**

```bash
git add src/server/config
git commit -m "feat: scheme, calendar, rate and reason-code config with sources"
```

---

### Task 3: Store, seeds, external registries

**Files:**
- Create: `src/server/store.ts`, `src/server/seeds.ts`, `src/server/store.test.ts`

**Interfaces:**
- Consumes: `types.ts`, `clock.ts`, `config/*`.
- Produces: `hydrate(): Promise<void>`, `persist(): Promise<void>`, `getCase(id)`, `putCase(c)`, `allCases()`, `getProfile(id)`, `findProfileByMobile(m)`, `findProfileByAadhaar(a)`, `putProfile(p)`, `getInstitute(id)`, `allInstitutes()`, `putInstitute(i)`, `putNotification(n)`, `notificationsFor(caseId)`, `getSim(): SimConfig`, `putSim(s)`, `reseed(): void`, `nextCaseId(): string`, and the seeded registries `CERT_REGISTRY`, `BOARD_REGISTRY`, `ENROLMENT_REGISTRY`, `DBT_REGISTRY`.

- [ ] **Step 1: Write the failing store test**

`src/server/store.test.ts`:

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { allInstitutes, getInstitute, getSim, hydrate, persist, putSim, reseed } from "./store";

beforeEach(async () => { await hydrate(); reseed(); });

test("seeds include a college with published courses and a college with an unpublished course", () => {
  const list = allInstitutes();
  assert.ok(list.length >= 4);
  const withPublished = list.find((i) => i.courses.some((c) => c.publishedAt !== null));
  const withUnpublished = list.find((i) => i.courses.some((c) => c.publishedAt === null));
  assert.ok(withPublished, "need at least one publishable course");
  assert.ok(withUnpublished, "need the master-data failure case for preflight");
});

test("fee heads always carry the excluded heads so the UI can strike them through", () => {
  for (const inst of allInstitutes()) {
    for (const course of inst.courses) {
      for (const head of ["tuition", "exam", "hostel", "mess", "caution", "library", "other"] as const) {
        assert.equal(typeof course.feeHeads[head], "number", `${inst.id}/${course.code}/${head}`);
      }
    }
  }
});

test("every institute has a named clerk with a designation", () => {
  for (const inst of allInstitutes()) {
    assert.ok(inst.clerk.nameHi.length > 0);
    assert.ok(inst.clerk.designationHi.length > 0);
    assert.equal(inst.clerk.role, "institute");
  }
});

test("sim config round-trips through persist and hydrate", async () => {
  const sim = getSim();
  sim.upstream.npci.health = "down";
  putSim(sim);
  await persist();
  await hydrate();
  assert.equal(getSim().upstream.npci.health, "down");
});

test("getInstitute returns undefined for an unknown id rather than throwing", () => {
  assert.equal(getInstitute("nope"), undefined);
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './store'`.

- [ ] **Step 3: Write `seeds.ts`**

Seed content (invented names, no real people, no real officers):

```ts
import type { Institute } from "./types";

export const SEED_INSTITUTES: Institute[] = [
  {
    id: "inst-csjmu-arts", nameHi: "राजकीय महाविद्यालय, कल्याणपुर", nameEn: "Government Degree College, Kalyanpur",
    districtCode: "70", kind: "college", affiliatedTo: "छत्रपति शाहू जी महाराज विश्वविद्यालय, कानपुर",
    clerk: { role: "institute", nameHi: "श्री आर. के. वर्मा", designationHi: "छात्रवृत्ति लिपिक",
             orgHi: "राजकीय महाविद्यालय, कल्याणपुर", contactHint: "छात्रवृत्ति प्रकोष्ठ, कक्ष 12" },
    masterDataPublishedAt: "2026-08-10T00:00:00.000Z",
    courses: [
      { code: "BA", nameHi: "बी.ए.", nameEn: "B.A.", group: "general", years: 3,
        feeHeads: { tuition: 8500, exam: 1200, hostel: 0, mess: 0, caution: 500, library: 300, other: 0 },
        publishedAt: "2026-08-10T00:00:00.000Z" },
      { code: "BSC", nameHi: "बी.एस-सी.", nameEn: "B.Sc.", group: "general", years: 3,
        feeHeads: { tuition: 19800, exam: 1500, hostel: 12000, mess: 9000, caution: 1000, library: 400, other: 0 },
        publishedAt: "2026-08-10T00:00:00.000Z" },
      { code: "BED", nameHi: "बी.एड.", nameEn: "B.Ed.", group: "tech", years: 2,
        feeHeads: { tuition: 51250, exam: 2000, hostel: 0, mess: 0, caution: 2000, library: 500, other: 0 },
        publishedAt: null },   // the master-data failure the student cannot fix
    ],
  },
  // …plus: a private engineering college (prof group, hostel heads, affiliated to a technical
  // university), an inter college for post_inter (district 72), a school for pre_9_10 (district 13),
  // and one out-of-state institute (kind "college", affiliatedTo null, districtCode "OS").
];
```

Registries (all synthetic, keyed so the demo has both success and failure rows):

```ts
export const CERT_REGISTRY: Record<string, {
  kind: "income" | "caste"; applicationNo: string; certNo: string;
  issuedOn: string; annualIncome?: number; holderDob: string;
}> = {
  "IC-2024-771201": { kind: "income", applicationNo: "APP-2024-771201", certNo: "IC-2024-771201",
                      issuedOn: "2023-07-12T00:00:00.000Z", annualIncome: 96000, holderDob: "2007-04-11" },
  "IC-2021-330077": { kind: "income", applicationNo: "APP-2021-330077", certNo: "IC-2021-330077",
                      issuedOn: "2021-09-02T00:00:00.000Z", annualIncome: 84000, holderDob: "2006-01-20" },
  "CC-2019-118834": { kind: "caste", applicationNo: "APP-2019-118834", certNo: "CC-2019-118834",
                      issuedOn: "2019-05-30T00:00:00.000Z", holderDob: "2007-04-11" },
};

export const BOARD_REGISTRY: Record<string, { board: "upmsp" | "cbse" | "icse"; rollNo: string; year: number }> = {
  "upmsp:2404771201": { board: "upmsp", rollNo: "2404771201", year: 2024 },
  "cbse:9911220044": { board: "cbse", rollNo: "9911220044", year: 2024 },
};

export const ENROLMENT_REGISTRY: Record<string, { instituteId: string; enrolmentNo: string }> = {
  "inst-csjmu-arts:CSJM2426BA0917": { instituteId: "inst-csjmu-arts", enrolmentNo: "CSJM2426BA0917" },
};

export const DBT_REGISTRY: Record<string, "seeded" | "kyc_only" | "dormant"> = {
  "000012340001": "seeded",
  "000012340002": "kyc_only",
  "000012340003": "dormant",
};
```

Note in a comment: the registry is deliberately incomplete, so a typed enrolment number that is not in
it produces `ENROLMENT_MISMATCH` — the real failure, reproducible on demand.

- [ ] **Step 4: Write `store.ts`**

Shape (JSON backend now; the Neon branch lands in plan 02, Task 6, without touching this file's API):

```ts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Case, Institute, Notification, Profile, SimConfig } from "./types";
import { setClockOffset } from "./clock";
import { SEED_INSTITUTES } from "./seeds";

type Snapshot = {
  profiles: Record<string, Profile>;
  cases: Record<string, Case>;
  institutes: Record<string, Institute>;
  notifications: Record<string, Notification>;
  sim: SimConfig;
  seq: number;
};

let snap: Snapshot | null = null;
let dirty = false;

export const DEFAULT_SIM: SimConfig = {
  clockOffsetDays: 0,
  upstream: {
    ekyc: { health: "up", failureRate: 0 }, digilocker: { health: "up", failureRate: 0 },
    edistrict: { health: "up", failureRate: 0 }, boards: { health: "up", failureRate: 0 },
    npci: { health: "up", failureRate: 0 }, pfms: { health: "up", failureRate: 0 },
  },
  forcedPfmsOutcome: null,
  outageLog: [],
};

function storePath(): string {
  return process.env.MILEGI_STORE_PATH || path.join(os.tmpdir(), "milegi-store.json");
}

function emptySnapshot(): Snapshot {
  return { profiles: {}, cases: {}, institutes: {}, notifications: {},
           sim: structuredClone(DEFAULT_SIM), seq: 136 };
}

export function reseed(): void {
  const s = emptySnapshot();
  for (const inst of SEED_INSTITUTES) s.institutes[inst.id] = structuredClone(inst);
  snap = s;
  setClockOffset(0);
  dirty = true;
}

export async function hydrate(): Promise<void> {
  if (snap) { setClockOffset(snap.sim.clockOffsetDays); return; }
  try {
    snap = JSON.parse(fs.readFileSync(storePath(), "utf8")) as Snapshot;
  } catch {
    reseed();
  }
  setClockOffset(snap!.sim.clockOffsetDays);
}

export async function persist(): Promise<void> {
  if (!snap || !dirty) return;
  snap.sim.clockOffsetDays = snap.sim.clockOffsetDays;
  fs.writeFileSync(storePath(), JSON.stringify(snap), "utf8");
  dirty = false;
}

function db(): Snapshot {
  if (!snap) throw new Error("store not hydrated — call await hydrate() first");
  return snap;
}

export function getCase(id: string): Case | undefined { return db().cases[id]; }
export function putCase(c: Case): void { db().cases[c.id] = c; dirty = true; }
export function allCases(): Case[] { return Object.values(db().cases); }
export function getProfile(id: string): Profile | undefined { return db().profiles[id]; }
export function putProfile(p: Profile): void { db().profiles[p.id] = p; dirty = true; }
export function findProfileByMobile(mobile: string): Profile | undefined {
  return Object.values(db().profiles).find((p) => p.mobile === mobile);
}
export function findProfileByAadhaar(aadhaarDemo: string): Profile | undefined {
  return Object.values(db().profiles).find((p) => p.aadhaarDemo === aadhaarDemo);
}
export function getInstitute(id: string): Institute | undefined { return db().institutes[id]; }
export function allInstitutes(): Institute[] { return Object.values(db().institutes); }
export function putInstitute(i: Institute): void { db().institutes[i.id] = i; dirty = true; }
export function putNotification(n: Notification): void { db().notifications[n.id] = n; dirty = true; }
export function notificationsFor(caseId: string): Notification[] {
  return Object.values(db().notifications).filter((n) => n.caseId === caseId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export function getSim(): SimConfig { return db().sim; }
export function putSim(s: SimConfig): void { db().sim = s; dirty = true; }
export function nextCaseId(): string {
  const s = db(); s.seq += 1; dirty = true;
  return `MLG-26-${String(s.seq).padStart(6, "0")}`;
}
```

> `ponytail:` synchronous `fs` and whole-snapshot rewrite. Ceiling is a demo-sized store; the Neon
> branch in plan 02 replaces the IO, not the API.

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: 5 store tests pass. If `persist`/`hydrate` round-trip fails, the cached `snap` is being reused
— `hydrate()` must re-read when the module-level cache was cleared by the test's `beforeEach`; expose a
test-only `__resetForTests()` that nulls `snap` and call it from `beforeEach`.

- [ ] **Step 6: Commit**

```bash
git add src/server/store.ts src/server/seeds.ts src/server/store.test.ts
git commit -m "feat: json store with hydrate/persist seam and synthetic registries"
```

---

### Task 4: State machine

**Files:**
- Create: `src/server/machine.ts`, `src/server/machine.test.ts`

**Interfaces:**
- Consumes: `types.ts`, `clock.ts`, `config/calendar.ts`, `store.ts` (for the institute's clerk).
- Produces: `TRANSITIONS`, `ownerFor(caseRec, stage): ActorRef | null`, `dueAtFor(caseRec, stage): string | null`, `transition(caseRec, to, actor, opts): Case`, `assertOwned(caseRec): void`, `isTerminal(stage): boolean`, `appendEvent(caseRec, event): void`.

- [ ] **Step 1: Write the failing machine test**

`src/server/machine.test.ts`:

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { hydrate, reseed } from "./store";
import { isTerminal, transition } from "./machine";
import { makeDraftCase } from "./testkit";   // created in this task's Step 4

beforeEach(async () => { await hydrate(); reseed(); });

test("a locked case is owned by the named institute clerk with a deadline", () => {
  const c = transition(makeDraftCase(), "institute_review", { role: "student", nameHi: "छात्र",
    designationHi: "आवेदक", orgHi: "—" });
  assert.equal(c.stage, "institute_review");
  assert.equal(c.owner?.role, "institute");
  assert.equal(c.owner?.nameHi, "श्री आर. के. वर्मा");
  assert.ok(c.dueAt, "institute_review must have a deadline");
  assert.ok(c.hardCopy.dueAt, "locking starts the 3-day hard-copy clock");
});

test("terminal stages have no owner and no deadline", () => {
  let c = makeDraftCase();
  c = transition(c, "institute_review", c.owner!);
  c = transition(c, "university_scrutiny", c.owner!);
  c = transition(c, "dwo_review", c.owner!);
  c = transition(c, "rejected", c.owner!, { reasonCode: "ATTENDANCE_BELOW_75" });
  assert.equal(c.stage, "rejected");
  assert.equal(c.owner, null);
  assert.equal(c.dueAt, null);
  assert.ok(isTerminal("rejected"));
});

test("an illegal transition throws instead of silently moving the file", () => {
  assert.throws(() => transition(makeDraftCase(), "paid", { role: "dwo", nameHi: "x",
    designationHi: "y", orgHi: "z" }), /not allowed/);
});

test("every transition appends exactly one event with an actor and a Hindi summary", () => {
  const c = transition(makeDraftCase(), "institute_review", { role: "student", nameHi: "छात्र",
    designationHi: "आवेदक", orgHi: "—" });
  const last = c.events[c.events.length - 1];
  assert.equal(c.events.length, 2);           // created + locked
  assert.equal(last.type, "locked");
  assert.ok(last.summaryHi.length > 0);
  assert.ok(last.actor.nameHi.length > 0);
});

test("non-terminal stages can never be produced without owner and dueAt", () => {
  let c = makeDraftCase();
  for (const to of ["institute_review", "university_scrutiny", "dwo_review"] as const) {
    c = transition(c, to, c.owner ?? { role: "system" as never, nameHi: "तंत्र",
      designationHi: "—", orgHi: "—" });
    assert.ok(c.owner && c.dueAt, `${to} left the case unowned`);
  }
});

test("dwo_review deadline never runs past the published DWO window end", () => {
  let c = makeDraftCase();
  c = transition(c, "institute_review", c.owner!);
  c = transition(c, "university_scrutiny", c.owner!);
  c = transition(c, "dwo_review", c.owner!);
  assert.ok(c.dueAt! <= "2026-12-15T00:00:00.000Z");
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './machine'`.

- [ ] **Step 3: Implement `machine.ts`**

```ts
import type { ActorRef, Case, CaseEvent, Stage } from "./types";
import { addDays, earliest, iso } from "./clock";
import { calendarFor } from "./config/calendar";
import { getInstitute } from "./store";
import { REASONS } from "./config/reasons";

export const TRANSITIONS: Record<Stage, Stage[]> = {
  draft: ["institute_review", "lapsed"],
  institute_review: ["university_scrutiny", "dwo_review", "returned_to_student"],
  returned_to_student: ["institute_review", "lapsed"],
  university_scrutiny: ["dwo_review"],
  dwo_review: ["sanctioned", "correction_required", "rejected"],
  correction_required: ["dwo_review", "lapsed"],
  sanctioned: ["pfms_processing"],
  pfms_processing: ["paid", "payment_failed"],
  payment_failed: ["pfms_processing"],
  paid: [], rejected: [], lapsed: [],
};

const TERMINAL: Stage[] = ["paid", "rejected", "lapsed"];
export function isTerminal(stage: Stage): boolean { return TERMINAL.includes(stage); }

const SYSTEM: ActorRef = { role: "treasury", nameHi: "कोषागार / भुगतान प्रणाली",
  designationHi: "स्वचालित चरण", orgHi: "PFMS (नकली)" };

export function ownerFor(c: Case, stage: Stage): ActorRef | null {
  const inst = getInstitute(c.instituteId);
  switch (stage) {
    case "draft": case "correction_required": case "returned_to_student": case "payment_failed":
      return { role: "student", nameHi: "आप", designationHi: "आवेदक", orgHi: "—" };
    case "institute_review":
      return inst?.clerk ?? { role: "institute", nameHi: "संस्थान लिपिक",
        designationHi: "छात्रवृत्ति लिपिक", orgHi: "—" };
    case "university_scrutiny":
      return { role: "university", nameHi: "सम्बद्धता अनुभाग", designationHi: "शुल्क सत्यापन",
        orgHi: inst?.affiliatedTo ?? "सम्बद्ध विश्वविद्यालय" };
    case "dwo_review":
      return { role: "dwo", nameHi: "जिला समाज कल्याण कार्यालय", designationHi: "जिला छात्रवृत्ति समिति",
        orgHi: `जिला कोड ${c.form.districtCode ?? "—"}` };
    case "sanctioned": case "pfms_processing":
      return SYSTEM;
    default:
      return null;
  }
}

export function dueAtFor(c: Case, stage: Stage, at: string): string | null {
  const cal = calendarFor(c.track, c.cycle);
  switch (stage) {
    case "draft": return cal.studentDeadline;
    case "institute_review": return earliest(cal.instituteForwardDeadline, addDays(at, 7));
    case "returned_to_student": return earliest(cal.studentDeadline, addDays(at, 5));
    case "university_scrutiny": return earliest(cal.dwoWindowFrom, addDays(at, 10));
    case "dwo_review": return earliest(cal.dwoWindowEnd, addDays(at, 15));
    case "correction_required": return cal.correctionClose;
    case "sanctioned": return cal.disbursementTo;
    case "pfms_processing": return addDays(at, 7);
    case "payment_failed": return addDays(at, 15);
    default: return null;
  }
}

export function appendEvent(c: Case, event: CaseEvent): void {
  c.events.push(event);
  c.updatedAt = event.at;
}

export function assertOwned(c: Case): void {
  if (isTerminal(c.stage)) {
    if (c.owner !== null || c.dueAt !== null) {
      throw new Error(`invariant: terminal stage ${c.stage} must have no owner or dueAt`);
    }
    return;
  }
  if (!c.owner || !c.dueAt) {
    throw new Error(`invariant: stage ${c.stage} has no ${!c.owner ? "owner" : "dueAt"}`);
  }
}

const SUMMARY: Record<Stage, { hi: string; en: string }> = {
  draft: { hi: "आवेदन शुरू हुआ", en: "Application started" },
  institute_review: { hi: "आवेदन लॉक हुआ और संस्थान के पास पहुँचा", en: "Locked and sent to the institute" },
  returned_to_student: { hi: "संस्थान ने सुधार के लिए वापस भेजा", en: "Returned by the institute" },
  university_scrutiny: { hi: "संस्थान ने अग्रसारित किया; सम्बद्ध विश्वविद्यालय में शुल्क सत्यापन",
    en: "Forwarded; fee scrutiny at the affiliating university" },
  dwo_review: { hi: "जिला समाज कल्याण कार्यालय में सत्यापन", en: "With the district welfare office" },
  correction_required: { hi: "जाँच में आपत्ति — सुधार आवश्यक", en: "Flagged in scrutiny — correction required" },
  sanctioned: { hi: "स्वीकृत — भुगतान के लिए भेजा गया", en: "Sanctioned for payment" },
  pfms_processing: { hi: "PFMS/बैंक में भुगतान प्रक्रिया", en: "Payment processing at PFMS/bank" },
  payment_failed: { hi: "भुगतान बैंक स्तर पर लौटा", en: "Payment returned by the bank" },
  paid: { hi: "भुगतान खाते में पहुँचा", en: "Paid" },
  rejected: { hi: "आवेदन अस्वीकृत", en: "Rejected" },
  lapsed: { hi: "समय सीमा बीत गई", en: "Deadline lapsed" },
};

export function transition(
  input: Case, to: Stage, actor: ActorRef,
  opts: { reasonCode?: string; note?: string; at?: string } = {},
): Case {
  const c: Case = structuredClone(input);
  const at = opts.at ?? iso();
  if (!TRANSITIONS[c.stage].includes(to)) {
    throw new Error(`transition ${c.stage} → ${to} is not allowed`);
  }
  const eventType =
    to === "institute_review" && c.stage === "draft" ? "locked" :
    to === "university_scrutiny" ? "institute_forwarded" :
    to === "dwo_review" && c.stage === "correction_required" ? "correction_submitted" :
    to === "correction_required" ? "dwo_flagged" :
    to === "returned_to_student" ? "institute_returned" :
    `entered_${to}`;

  if (to === "institute_review" && c.stage === "draft") {
    c.hardCopy.dueAt = addDays(at, 3);
  }
  if (to === "correction_required") {
    const cal = calendarFor(c.track, c.cycle);
    c.correction = { openAt: cal.correctionOpen, closeAt: cal.correctionClose, usedAt: null,
      fields: c.flags.map((f) => f.code) };
  }
  if (to === "rejected" && opts.reasonCode) {
    c.flags.push({ code: opts.reasonCode, at, by: actor, note: opts.note });
  }

  c.stage = to;
  c.stageEnteredAt = at;
  c.owner = ownerFor(c, to);
  c.dueAt = dueAtFor(c, to, at);

  const reason = opts.reasonCode ? ` — ${REASONS[opts.reasonCode]?.hi ?? opts.reasonCode}` : "";
  appendEvent(c, { at, type: eventType, actor,
    summaryHi: SUMMARY[to].hi + reason, summaryEn: SUMMARY[to].en,
    data: opts.reasonCode ? { reasonCode: opts.reasonCode } : undefined });

  assertOwned(c);
  return c;
}
```

- [ ] **Step 4: Add `src/server/testkit.ts`**

Test-only factory so every later test file builds the same shaped case:

```ts
import type { Case } from "./types";
import { iso } from "./clock";
import { getInstitute, nextCaseId } from "./store";
import { ownerFor, dueAtFor } from "./machine";
import { feeFor, estimateFor } from "./fees";   // arrives in Task 5; import lazily until then

export function makeDraftCase(over: Partial<Case> = {}): Case {
  const at = iso();
  const instituteId = over.instituteId ?? "inst-csjmu-arts";
  const courseCode = over.courseCode ?? "BSC";
  const base: Case = {
    id: nextCaseId(), session: "2026-27", profileId: "prf_test0001",
    track: "dashmottar", cycle: "renewal",
    registrationNo: "", instituteId, courseCode,
    stage: "draft", stageEnteredAt: at, owner: null, dueAt: null,
    form: { districtCode: "70", yearOfStudy: 2, hosteller: false },
    preflight: [], certificates: {},
    fee: { heads: getInstitute(instituteId)!.courses.find((c) => c.code === courseCode)!.feeHeads,
           nonRefundable: 19800 },
    estimate: { feeReimbursement: 19800, maintenancePerMonth: 300, months: 10,
                total: 22800, basisHi: "कॉलेज मास्टर डेटा" },
    hardCopy: { dueAt: null, receivedAt: null },
    attendancePercent: null, flags: [], correction: null, payment: {},
    escalations: [], grievanceDraftAt: null,
    events: [{ at, type: "created", actor: { role: "student", nameHi: "आप",
      designationHi: "आवेदक", orgHi: "—" }, summaryHi: "आवेदन शुरू हुआ",
      summaryEn: "Application started" }],
    updatedAt: at,
    ...over,
  };
  base.owner = ownerFor(base, base.stage);
  base.dueAt = dueAtFor(base, base.stage, at);
  return base;
}
```

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: 6 machine tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/server/machine.ts src/server/machine.test.ts src/server/testkit.ts
git commit -m "feat: stage machine with owner+deadline invariant and event log"
```

---

### Task 5: Fees, estimate, and the fee dispute

**Files:**
- Create: `src/server/fees.ts`, `src/server/fees.test.ts`

**Interfaces:**
- Consumes: `types.ts`, `store.ts`, `config/rates.ts`, `config/schemes.ts`.
- Produces: `feeFor(instituteId, courseCode): { heads: FeeHeads; nonRefundable: number; excluded: {key,label,amount}[] }`, `estimateFor(caseRec): Case["estimate"]`, `raiseFeeDispute(caseRec, note, actor): Case`, `DISPUTABLE_STAGES`.

- [ ] **Step 1: Write the failing fee test**

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { hydrate, reseed } from "./store";
import { DISPUTABLE_STAGES, estimateFor, feeFor, raiseFeeDispute } from "./fees";
import { makeDraftCase } from "./testkit";

beforeEach(async () => { await hydrate(); reseed(); });

test("non-refundable fee is tuition only, and every excluded head is itemised", () => {
  const f = feeFor("inst-csjmu-arts", "BSC");
  assert.equal(f.nonRefundable, 19800);
  const keys = f.excluded.map((e) => e.key).sort();
  assert.deepEqual(keys, ["caution", "exam", "hostel", "library", "mess"]);
  assert.ok(f.excluded.every((e) => e.label.length > 0));
});

test("an unpublished course cannot produce a fee", () => {
  assert.throws(() => feeFor("inst-csjmu-arts", "BED"), /not published/);
});

test("estimate is fee reimbursement plus a maintenance band, and states its basis", () => {
  const e = estimateFor(makeDraftCase());
  assert.equal(e.feeReimbursement, 19800);
  assert.equal(e.maintenancePerMonth, 300);
  assert.equal(e.months, 10);
  assert.equal(e.total, 19800 + 300 * 10);
  assert.match(e.basisHi, /अनुमान/);
});

test("hosteller gets the hosteller band", () => {
  const e = estimateFor(makeDraftCase({ form: { districtCode: "70", yearOfStudy: 2, hosteller: true } }));
  assert.equal(e.maintenancePerMonth, 570);
});

test("pre-matric has no fee reimbursement, only maintenance", () => {
  const e = estimateFor(makeDraftCase({ track: "pre_9_10", instituteId: "inst-school-gkp",
    courseCode: "CLASS9" }));
  assert.equal(e.feeReimbursement, 0);
  assert.ok(e.total > 0);
});

test("a fee dispute is allowed up to dwo_review and records who raised it", () => {
  assert.deepEqual(DISPUTABLE_STAGES, ["draft", "institute_review", "university_scrutiny", "dwo_review"]);
  const c = raiseFeeDispute(makeDraftCase(), "रसीद में ₹21,300 लिखा है", { role: "student",
    nameHi: "आप", designationHi: "आवेदक", orgHi: "—" });
  assert.equal(c.fee.disputed?.note, "रसीद में ₹21,300 लिखा है");
  assert.equal(c.events[c.events.length - 1].type, "fee_disputed");
});

test("a fee dispute after sanction is refused", () => {
  const c = makeDraftCase({ stage: "sanctioned" });
  assert.throws(() => raiseFeeDispute(c, "देर से", { role: "student", nameHi: "आप",
    designationHi: "आवेदक", orgHi: "—" }), /नहीं/);
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm test` → FAIL, `Cannot find module './fees'`.

- [ ] **Step 3: Implement `fees.ts`**

```ts
import type { ActorRef, Case, FeeHeads, Stage } from "./types";
import { iso } from "./clock";
import { getInstitute } from "./store";
import { AMOUNT_DISCLAIMER_HI, maintenanceFor } from "./config/rates";
import { SCHEMES } from "./config/schemes";
import { appendEvent } from "./machine";

const EXCLUDED_LABELS: Record<keyof Omit<FeeHeads, "tuition" | "other">, string> = {
  exam: "परीक्षा शुल्क", hostel: "छात्रावास", mess: "मेस", caution: "कॉशन मनी", library: "पुस्तकालय जमानत",
};

export const DISPUTABLE_STAGES: Stage[] = ["draft", "institute_review", "university_scrutiny", "dwo_review"];

export function feeFor(instituteId: string, courseCode: string) {
  const inst = getInstitute(instituteId);
  if (!inst) throw new Error(`institute ${instituteId} not found`);
  const course = inst.courses.find((c) => c.code === courseCode);
  if (!course) throw new Error(`course ${courseCode} not found at ${instituteId}`);
  if (!course.publishedAt) {
    throw new Error(`course ${courseCode} is not published in master data`);
  }
  const excluded = (Object.keys(EXCLUDED_LABELS) as (keyof typeof EXCLUDED_LABELS)[])
    .filter((k) => course.feeHeads[k] > 0)
    .map((k) => ({ key: k, label: EXCLUDED_LABELS[k], amount: course.feeHeads[k] }));
  return { heads: course.feeHeads, nonRefundable: course.feeHeads.tuition, excluded };
}

export function estimateFor(c: Case): Case["estimate"] {
  const inst = getInstitute(c.instituteId);
  const course = inst?.courses.find((x) => x.code === c.courseCode);
  const scheme = SCHEMES[c.track];
  const group = course?.group ?? "general";
  const hosteller = c.form.hosteller === true;
  const band = maintenanceFor(group, hosteller);
  const feeReimbursement = scheme.feeReimbursement && course?.publishedAt ? course.feeHeads.tuition : 0;
  return {
    feeReimbursement,
    maintenancePerMonth: band.perMonth,
    months: band.months,
    total: feeReimbursement + band.perMonth * band.months,
    basisHi:
      (feeReimbursement > 0
        ? `कॉलेज मास्टर डेटा के अनुसार गैर-वापसी योग्य शुल्क ₹${feeReimbursement.toLocaleString("en-IN")} + `
        : "") +
      `रखरखाव भत्ता ₹${band.perMonth}/माह × ${band.months} माह। ${AMOUNT_DISCLAIMER_HI}`,
  };
}

export function raiseFeeDispute(input: Case, note: string, actor: ActorRef): Case {
  if (!DISPUTABLE_STAGES.includes(input.stage)) {
    throw new Error("इस चरण पर शुल्क आपत्ति दर्ज नहीं की जा सकती");
  }
  const c: Case = structuredClone(input);
  const at = iso();
  c.fee.disputed = { note, at };
  appendEvent(c, { at, type: "fee_disputed", actor,
    summaryHi: `शुल्क आपत्ति दर्ज: ${note}`, summaryEn: `Fee dispute raised: ${note}` });
  return c;
}
```

- [ ] **Step 4: Extend seeds for the school track**

Add `inst-school-gkp` (district 13, `kind: "school"`, `affiliatedTo: null`) with course `CLASS9`
(`group: "school"`, `years: 1`, `feeHeads` all zero except `exam: 300`, published) so the pre-matric
estimate test has a home.

- [ ] **Step 5: Run the tests**

Run: `npm test` → 7 fee tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/server/fees.ts src/server/fees.test.ts src/server/seeds.ts
git commit -m "feat: master-data fees, benefit estimate with basis, fee dispute"
```

---

### Task 6: Router and OTR

**Files:**
- Create: `src/server/route.ts`, `src/server/otr.ts`, `src/server/route.test.ts`, `src/server/otr.test.ts`

**Interfaces:**
- Consumes: `types.ts`, `clock.ts`, `store.ts`, `config/*`, `external/ekyc`, `external/digilocker`.
- Produces: `routeStudent(answers): RouteResult`, `mintOtr(input): { profile: Profile; duplicateOf?: Profile }`, `recoverIdentity(input): { profile?: Profile; hintHi: string }`, `isDemoAadhaar(v): boolean`.

- [ ] **Step 1: Write the failing router test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { routeStudent } from "./route";

test("college + not first year + got it last year = dashmottar renewal", () => {
  const r = routeStudent({ studying: "college", firstYear: false, gotLastYear: "yes",
    changedCourse: false, rejectedLastYear: false, inUp: true });
  assert.equal(r.track, "dashmottar");
  assert.equal(r.cycle, "renewal");
  assert.match(r.reasonHi, /नवीनीकरण/);
});

test("\"पता नहीं\" never coerces to fresh — it resolves to the safe side with a recovery route", () => {
  const r = routeStudent({ studying: "college", firstYear: false, gotLastYear: "dunno",
    changedCourse: false, rejectedLastYear: false, inUp: true });
  assert.equal(r.cycle, "renewal");
  assert.ok(r.recoveryHi.includes("हाई स्कूल रोल"));
});

test("changed course beats renewal — a course change is always a fresh application", () => {
  const r = routeStudent({ studying: "college", firstYear: false, gotLastYear: "yes",
    changedCourse: true, rejectedLastYear: false, inUp: true });
  assert.equal(r.cycle, "fresh");
  assert.match(r.reasonHi, /कोर्स बदला/);
});

test("rejected last year is a fresh application, not a renewal", () => {
  const r = routeStudent({ studying: "college", firstYear: false, gotLastYear: "no",
    changedCourse: false, rejectedLastYear: true, inUp: true });
  assert.equal(r.cycle, "fresh");
});

test("class 9-10 and 11-12 map to their own tracks", () => {
  assert.equal(routeStudent({ studying: "class_9_10", firstYear: true, gotLastYear: "no",
    changedCourse: false, rejectedLastYear: false, inUp: true }).track, "pre_9_10");
  assert.equal(routeStudent({ studying: "class_11_12", firstYear: true, gotLastYear: "no",
    changedCourse: false, rejectedLastYear: false, inUp: true }).track, "post_inter");
});

test("studying outside UP overrides the level and never dead-ends", () => {
  const r = routeStudent({ studying: "college", firstYear: true, gotLastYear: "no",
    changedCourse: false, rejectedLastYear: false, inUp: false });
  assert.equal(r.track, "outside_state");
  assert.ok(r.reasonHi.length > 0);
});

test("the router always returns a track and a cycle — there is no not-found result", () => {
  const combos = ["class_9_10", "class_11_12", "college"] as const;
  for (const studying of combos) {
    for (const firstYear of [true, false]) {
      for (const gotLastYear of ["yes", "no", "dunno"] as const) {
        const r = routeStudent({ studying, firstYear, gotLastYear, changedCourse: false,
          rejectedLastYear: false, inUp: true });
        assert.ok(r.track && r.cycle, `${studying}/${firstYear}/${gotLastYear} produced nothing`);
      }
    }
  }
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm test` → FAIL, `Cannot find module './route'`.

- [ ] **Step 3: Implement `route.ts`**

```ts
import type { Cycle, TrackId } from "./types";

export type RouteAnswers = {
  studying: "class_9_10" | "class_11_12" | "college";
  firstYear: boolean;
  gotLastYear: "yes" | "no" | "dunno";
  changedCourse: boolean;
  rejectedLastYear: boolean;
  inUp: boolean;
};

export type RouteResult = {
  track: TrackId; cycle: Cycle;
  reasonHi: string; reasonEn: string;
  recoveryHi: string;      // always present: how to recover an old registration number
  warnHi: string | null;   // duplicate-OTR warning where relevant
};

const RECOVERY_HI =
  "पिछले साल का पंजीकरण नंबर भूल गए? हाई स्कूल रोल नंबर, पासिंग ईयर और पंजीकृत मोबाइल से वह वापस मिल जाता है — " +
  "नया OTR कभी न बनाएँ।";

export function routeStudent(a: RouteAnswers): RouteResult {
  const track: TrackId = !a.inUp ? "outside_state"
    : a.studying === "class_9_10" ? "pre_9_10"
    : a.studying === "class_11_12" ? "post_inter"
    : "dashmottar";

  // Fresh-forcing facts, in priority order. Each one is a real rule from the portal.
  if (a.changedCourse) {
    return { track, cycle: "fresh", recoveryHi: RECOVERY_HI, warnHi: null,
      reasonHi: "कोर्स बदला है — इसलिए यह नया (Fresh) आवेदन है, नवीनीकरण नहीं।",
      reasonEn: "Course changed, so this is a Fresh application, not a Renewal." };
  }
  if (a.rejectedLastYear) {
    return { track, cycle: "fresh", recoveryHi: RECOVERY_HI, warnHi: null,
      reasonHi: "पिछले साल आवेदन अस्वीकृत हुआ था — नियम के मुताबिक यह नया आवेदन है।",
      reasonEn: "Last year was rejected, so this is a Fresh application." };
  }
  if (a.firstYear) {
    return { track, cycle: "fresh", recoveryHi: RECOVERY_HI, warnHi: null,
      reasonHi: "इस कोर्स का पहला साल — नया (Fresh) आवेदन।",
      reasonEn: "First year of this course — Fresh application." };
  }
  if (a.gotLastYear === "yes") {
    return { track, cycle: "renewal", recoveryHi: RECOVERY_HI,
      warnHi: "नवीनीकरण में दूसरा OTR बनाना सबसे बड़ी गलती है — इससे दोनों आवेदन ब्लॉक हो सकते हैं।",
      reasonHi: "पिछले साल इसी कोर्स पर छात्रवृत्ति मिली थी — यह नवीनीकरण (Renewal) है।",
      reasonEn: "Scholarship received last year on the same course — this is a Renewal." };
  }
  // "no" without a rejection, and "dunno", both resolve to the renewal side: minting a second OTR is
  // the failure that blocks BOTH applications, so the safe default is to look for the old file first.
  return {
    track, cycle: "renewal", recoveryHi: RECOVERY_HI,
    warnHi: "अगर पिछला आवेदन मौजूद है और आप नया OTR बना लेते हैं, तो दोनों आवेदन ब्लॉक हो सकते हैं।",
    reasonHi: a.gotLastYear === "dunno"
      ? "पक्का याद नहीं — इसलिए पहले पुराना आवेदन खोजा जाएगा (यही सुरक्षित रास्ता है)।"
      : "पहला साल नहीं है — पहले पुराना आवेदन खोजा जाएगा, तभी तय होगा कि नवीनीकरण है या नया आवेदन।",
    reasonEn: "Not the first year — the old file is looked up first before deciding Fresh vs Renewal.",
  };
}
```

- [ ] **Step 4: Write the failing OTR test**

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { hydrate, reseed } from "./store";
import { isDemoAadhaar, mintOtr, recoverIdentity } from "./otr";

const INPUT = { aadhaarDemo: "000012340001", mobile: "9876500001", dob: "2006-04-11",
  category: "obc" as const, nameHi: "अंकित सिंह", nameEn: "Ankit Singh",
  fatherNameHi: "राम सिंह", motherNameHi: "सीता देवी", districtCode: "70",
  addressHi: "कल्याणपुर, कानपुर नगर", gender: "m" as const };

beforeEach(async () => { await hydrate(); reseed(); });

test("only demo Aadhaar numbers are accepted", () => {
  assert.equal(isDemoAadhaar("000012340001"), true);
  assert.equal(isDemoAadhaar("234512340001"), false);
  assert.throws(() => mintOtr({ ...INPUT, aadhaarDemo: "234512340001" }), /डेमो नंबर/);
});

test("a minted OTR looks like the real thing and is stable for the profile", () => {
  const { profile } = mintOtr(INPUT);
  assert.match(profile.otr, /^UP26-\d{10}$/);
  assert.equal(profile.duplicateOtrs.length, 0);
});

test("minting twice for the same Aadhaar returns the existing profile and records the duplicate", () => {
  const first = mintOtr(INPUT).profile;
  const second = mintOtr({ ...INPUT, mobile: "9876500099" });
  assert.equal(second.profile.id, first.id, "must not create a second identity");
  assert.ok(second.duplicateOf, "the duplicate attempt must be reported back");
  assert.ok(second.profile.duplicateOtrs.length >= 1);
});

test("recovery finds an existing profile from the high-school roll number route", () => {
  const created = mintOtr(INPUT).profile;
  const found = recoverIdentity({ mobile: created.mobile, boardRollNo: "2404771201", passingYear: 2024 });
  assert.equal(found.profile?.id, created.id);
  assert.ok(found.hintHi.length > 0);
});

test("recovery with nothing matching still returns a next step, never an empty failure", () => {
  const found = recoverIdentity({ mobile: "9000000000", boardRollNo: "0000000000", passingYear: 2020 });
  assert.equal(found.profile, undefined);
  assert.match(found.hintHi, /जिला समाज कल्याण|OTR/);
});
```

- [ ] **Step 5: Implement `otr.ts`**

```ts
import type { Category, Profile } from "./types";
import { iso } from "./clock";
import { findProfileByAadhaar, findProfileByMobile, putProfile } from "./store";
import { fetchDigilockerProfile } from "./external/digilocker";
import { verifyEkyc } from "./external/ekyc";

export function isDemoAadhaar(v: string): boolean {
  return /^0000\d{8}$/.test(v.replace(/\s/g, ""));
}

export type MintInput = {
  aadhaarDemo: string; mobile: string; dob: string; category: Category;
  nameHi: string; nameEn: string; fatherNameHi: string; motherNameHi: string;
  districtCode: string; addressHi: string; gender: "f" | "m" | "o";
};

function newOtr(): string {
  return `UP26-${String(8_000_000_000 + Math.floor(Math.random() * 999_999_999))}`;
}

export function mintOtr(input: MintInput): { profile: Profile; duplicateOf?: Profile } {
  const aadhaarDemo = input.aadhaarDemo.replace(/\s/g, "");
  if (!isDemoAadhaar(aadhaarDemo)) {
    throw new Error("यह प्रोटोटाइप असली आधार नंबर स्वीकार नहीं करता — 0000 से शुरू होने वाला डेमो नंबर डालें");
  }
  verifyEkyc(aadhaarDemo);                       // throws AppError when the mock UIDAI is down
  const existing = findProfileByAadhaar(aadhaarDemo);
  if (existing) {
    // The real portal debars you here. Milegi recovers instead: same identity, duplicate recorded.
    const attempted = newOtr();
    if (!existing.duplicateOtrs.includes(attempted)) existing.duplicateOtrs.push(attempted);
    putProfile(existing);
    return { profile: existing, duplicateOf: existing };
  }
  const doc = fetchDigilockerProfile(aadhaarDemo);
  const profile: Profile = {
    id: `prf_${Math.random().toString(16).slice(2, 10)}`,
    otr: newOtr(), mobile: input.mobile, aadhaarDemo,
    nameHi: input.nameHi, nameEn: input.nameEn,
    fatherNameHi: input.fatherNameHi, motherNameHi: input.motherNameHi,
    dob: input.dob, gender: input.gender, category: input.category,
    districtCode: input.districtCode, addressHi: input.addressHi,
    photoRef: doc.photoRef, ekycAt: iso(), duplicateOtrs: [], createdAt: iso(),
  };
  putProfile(profile);
  return { profile };
}

export function recoverIdentity(input: { mobile?: string; boardRollNo?: string; passingYear?: number }):
  { profile?: Profile; hintHi: string } {
  const byMobile = input.mobile ? findProfileByMobile(input.mobile) : undefined;
  if (byMobile) {
    return { profile: byMobile,
      hintHi: `आपका OTR मिल गया: ${byMobile.otr}. नया OTR बनाने की ज़रूरत नहीं है।` };
  }
  return { profile: undefined,
    hintHi: "इन विवरणों से कोई पुराना OTR नहीं मिला। नया OTR बनाने से पहले जिला समाज कल्याण कार्यालय " +
      "में एक बार पुष्टि कर लें — दूसरा OTR बन जाने पर दोनों आवेदन ब्लॉक हो सकते हैं।" };
}
```

- [ ] **Step 6: Run the tests**

Run: `npm test` → 7 router + 5 OTR tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/server/route.ts src/server/otr.ts src/server/route.test.ts src/server/otr.test.ts
git commit -m "feat: three-question router with no dead ends, OTR mint with duplicate recovery"
```

---

### Task 7: Error contract and mock upstream adapters

> **Order note:** Task 6 imports `verifyEkyc` and `fetchDigilockerProfile`. If you are executing
> strictly in sequence, do Steps 3–5 of this task before Task 6 Step 5.

**Files:**
- Create: `src/server/errors.ts`, `src/server/external/ekyc.ts`, `src/server/external/digilocker.ts`, `src/server/external/edistrict.ts`, `src/server/external/boards.ts`, `src/server/external/npci.ts`, `src/server/external/pfms.ts`, `src/server/external/external.test.ts`

**Interfaces:**
- Consumes: `types.ts`, `clock.ts`, `store.ts`, `seeds.ts`.
- Produces: `AppError`, `errorBody(e)`, `newRef()`; `verifyEkyc(aadhaarDemo)`, `fetchDigilockerProfile(aadhaarDemo)`, `verifyCertificate({kind, applicationNo, certNo})`, `matchBoardRoll({board, rollNo, year})`, `matchEnrolment({instituteId, enrolmentNo})`, `checkDbt(aadhaarDemo)`, `runPfmsBatch(cases)`.

- [ ] **Step 1: Write the failing upstream test**

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getSim, hydrate, putSim, reseed } from "./store";
import { AppError, errorBody } from "./errors";
import { verifyCertificate } from "./external/edistrict";
import { checkDbt } from "./external/npci";
import { runPfmsBatch } from "./external/pfms";
import { makeDraftCase } from "./testkit";

beforeEach(async () => { await hydrate(); reseed(); });

test("an AppError renders a citizen-readable body with a reference and no upstream string", () => {
  const body = errorBody(new AppError("UPSTREAM_DOWN", {
    hi: "ई-डिस्ट्रिक्ट सेवा अभी जवाब नहीं दे रही", en: "e-District is not responding",
    retryable: true, upstream: "ETIMEDOUT connect 10.4.4.9:443",
  }));
  assert.equal(body.ok, false);
  assert.equal(body.error.code, "UPSTREAM_DOWN");
  assert.match(body.error.ref, /^ERR-[A-Z0-9]{5}$/);
  assert.equal(body.error.retryable, true);
  assert.equal(JSON.stringify(body).includes("ETIMEDOUT"), false, "never leak the upstream string");
});

test("certificate verification computes a 3-year expiry from the issue date", () => {
  const r = verifyCertificate({ kind: "income", applicationNo: "APP-2024-771201", certNo: "IC-2024-771201" });
  assert.equal(r.state, "ok");
  assert.equal(r.issuedOn.slice(0, 10), "2023-07-12");
  assert.equal(r.expiresOn.slice(0, 10), "2026-07-12");
  assert.equal(r.annualIncome, 96000);
});

test("an unknown certificate number is not_found, not an exception", () => {
  const r = verifyCertificate({ kind: "income", applicationNo: "X", certNo: "IC-0000-000000" });
  assert.equal(r.state, "not_found");
});

test("a downed upstream throws AppError with retryable true", () => {
  const sim = getSim(); sim.upstream.edistrict.health = "down"; putSim(sim);
  assert.throws(
    () => verifyCertificate({ kind: "income", applicationNo: "APP-2024-771201", certNo: "IC-2024-771201" }),
    (e: unknown) => e instanceof AppError && e.code === "UPSTREAM_DOWN" && e.retryable,
  );
});

test("DBT check reports the three real-world states", () => {
  assert.equal(checkDbt("000012340001").state, "seeded");
  assert.equal(checkDbt("000012340002").state, "kyc_only");
  assert.equal(checkDbt("000012340003").state, "dormant");
});

test("a PFMS batch credits a seeded case and bounces an unseeded one with the documented code", () => {
  const ok = makeDraftCase({ stage: "pfms_processing", profileId: "prf_seeded" });
  const bad = makeDraftCase({ stage: "pfms_processing", profileId: "prf_unseeded" });
  const out = runPfmsBatch([
    { caseRec: ok, aadhaarDemo: "000012340001" },
    { caseRec: bad, aadhaarDemo: "000012340002" },
  ]);
  assert.equal(out[0].status, "credited");
  assert.ok(out[0].amount && out[0].amount > 0);
  assert.equal(out[1].status, "rejected_not_seeded");
  assert.equal(out[1].failureCode, "NPCI_NOT_SEEDED");
});

test("a forced PFMS outcome overrides the seeded state, for the demo", () => {
  const sim = getSim(); sim.forcedPfmsOutcome = "limit_exceeded"; putSim(sim);
  const out = runPfmsBatch([{ caseRec: makeDraftCase({ stage: "pfms_processing" }),
    aadhaarDemo: "000012340001" }]);
  assert.equal(out[0].status, "limit_exceeded");
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm test` → FAIL, `Cannot find module './errors'`.

- [ ] **Step 3: Implement `errors.ts`**

```ts
export type ErrorBody = {
  ok: false; prototype: true;
  error: { code: string; hi: string; en: string; retryable: boolean; ref: string; retryAfterSec?: number };
};

export function newRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return `ERR-${out}`;
}

export class AppError extends Error {
  code: string; hi: string; en: string; retryable: boolean; status: number;
  ref: string; retryAfterSec?: number;
  upstream?: string;      // logged server-side, NEVER serialised to the client

  constructor(code: string, o: { hi: string; en: string; retryable?: boolean; status?: number;
    upstream?: string; retryAfterSec?: number }) {
    super(`${code}: ${o.en}`);
    this.code = code; this.hi = o.hi; this.en = o.en;
    this.retryable = o.retryable ?? false;
    this.status = o.status ?? (o.retryable ? 503 : 400);
    this.ref = newRef();
    this.upstream = o.upstream;
    this.retryAfterSec = o.retryAfterSec;
  }
}

export function errorBody(e: unknown): ErrorBody {
  if (e instanceof AppError) {
    if (e.upstream) console.error(`[${e.ref}] ${e.code} upstream=${e.upstream}`);
    return { ok: false, prototype: true, error: { code: e.code, hi: e.hi, en: e.en,
      retryable: e.retryable, ref: e.ref, retryAfterSec: e.retryAfterSec } };
  }
  const ref = newRef();
  console.error(`[${ref}] unexpected`, e);
  return { ok: false, prototype: true, error: {
    code: "INTERNAL", ref, retryable: true,
    hi: "कुछ गड़बड़ हुई, पर आपका ड्राफ़्ट सुरक्षित है। थोड़ी देर में दोबारा कोशिश करें।",
    en: "Something broke, but your draft is safe. Try again shortly.",
  } };
}
```

- [ ] **Step 4: Implement the shared upstream gate**

`src/server/external/gate.ts`:

```ts
import { AppError } from "../errors";
import { getSim } from "../store";
import type { SimConfig } from "../types";

const LABEL_HI: Record<keyof SimConfig["upstream"], string> = {
  ekyc: "आधार e-KYC सेवा", digilocker: "डिजिलॉकर", edistrict: "ई-डिस्ट्रिक्ट प्रमाणपत्र सेवा",
  boards: "बोर्ड/विश्वविद्यालय डेटाबेस", npci: "NPCI आधार-DBT मैपर", pfms: "PFMS भुगतान प्रणाली",
};

export function gate(system: keyof SimConfig["upstream"]): void {
  const cfg = getSim().upstream[system];
  const down = cfg.health === "down" || (cfg.failureRate > 0 && Math.random() < cfg.failureRate);
  if (!down) return;
  throw new AppError("UPSTREAM_DOWN", {
    hi: `${LABEL_HI[system]} अभी जवाब नहीं दे रही। आपका डेटा सुरक्षित है — कुछ मिनट बाद दोबारा कोशिश करें।`,
    en: `${system} is not responding. Your data is safe — retry in a few minutes.`,
    retryable: true, status: 503, retryAfterSec: 120, upstream: `${system}:health=${cfg.health}`,
  });
}

export function slow(system: keyof SimConfig["upstream"]): number {
  return getSim().upstream[system].health === "slow" ? 2500 : 0;   // surfaced as a UI hint, not a sleep
}
```

- [ ] **Step 5: Implement the six adapters**

`ekyc.ts` — `verifyEkyc(aadhaarDemo)`: `gate("ekyc")`, then return `{ ok: true, otpDemo: "6-digit" }`.
`digilocker.ts` — `fetchDigilockerProfile(aadhaarDemo)`: `gate("digilocker")`, return
`{ photoRef: "dl-photo-" + aadhaarDemo.slice(-4), sourceHi: "डिजिलॉकर (नकली)" }`.

`edistrict.ts`:

```ts
import { addDays } from "../clock";
import { CERT_REGISTRY } from "../seeds";
import { gate } from "./gate";

export type CertResult =
  | { state: "ok"; applicationNo: string; certNo: string; issuedOn: string; expiresOn: string;
      annualIncome?: number }
  | { state: "not_found" };

export function verifyCertificate(q: { kind: "income" | "caste"; applicationNo: string; certNo: string }):
  CertResult {
  gate("edistrict");
  const row = CERT_REGISTRY[q.certNo];
  if (!row || row.kind !== q.kind) return { state: "not_found" };
  return { state: "ok", applicationNo: row.applicationNo, certNo: row.certNo,
    issuedOn: row.issuedOn, expiresOn: addDays(row.issuedOn, 365 * 3),
    annualIncome: row.annualIncome };
}
```

`boards.ts` — `matchBoardRoll` and `matchEnrolment` against `BOARD_REGISTRY` / `ENROLMENT_REGISTRY`,
each returning `{ matched: boolean; reasonCode?: "BOARD_ROLL_MISMATCH" | "ENROLMENT_MISMATCH" }`,
gated on `boards`.

`npci.ts` — `checkDbt(aadhaarDemo)`: `gate("npci")`, look up `DBT_REGISTRY`, default `kyc_only` for an
unknown number, return `{ state, hi, actionHi }` where `kyc_only`/`dormant` carry the branch-visit text
from `REASONS.NPCI_NOT_SEEDED`.

`pfms.ts`:

```ts
import type { Case, PfmsStatus } from "../types";
import { iso } from "../clock";
import { getSim } from "../store";
import { checkDbt } from "./npci";
import { gate } from "./gate";

export type PfmsRow = { caseId: string; status: PfmsStatus; amount?: number;
  failureCode?: string; pfmsRef: string; at: string };

export function runPfmsBatch(rows: { caseRec: Case; aadhaarDemo: string }[]): PfmsRow[] {
  gate("pfms");
  const forced = getSim().forcedPfmsOutcome;
  return rows.map(({ caseRec, aadhaarDemo }) => {
    const at = iso();
    const pfmsRef = `PFMS-26-${caseRec.id.slice(-6)}`;
    if (forced) {
      return { caseId: caseRec.id, status: forced, pfmsRef, at,
        amount: forced === "credited" ? caseRec.estimate.total : undefined,
        failureCode: forced === "rejected_not_seeded" ? "NPCI_NOT_SEEDED" : undefined };
    }
    const dbt = checkDbt(aadhaarDemo).state;
    if (dbt === "seeded") {
      return { caseId: caseRec.id, status: "credited", amount: caseRec.estimate.total, pfmsRef, at };
    }
    return { caseId: caseRec.id, pfmsRef, at,
      status: dbt === "dormant" ? "rejected_dormant" : "rejected_not_seeded",
      failureCode: "NPCI_NOT_SEEDED" };
  });
}
```

- [ ] **Step 6: Run the tests**

Run: `npm test` → 7 upstream tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/server/errors.ts src/server/external
git commit -m "feat: citizen-readable error contract and six mock upstream adapters with fault injection"
```

---

### Task 8: Pre-flight

**Files:**
- Create: `src/server/preflight.ts`, `src/server/preflight.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces: `runPreflight(ctx): PreflightItem[]`, `blockers(items): PreflightItem[]`, `PreflightCtx`.

- [ ] **Step 1: Write the failing pre-flight test**

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { hydrate, reseed } from "./store";
import { blockers, runPreflight } from "./preflight";

const CTX = {
  track: "dashmottar" as const, cycle: "renewal" as const, category: "obc" as const,
  instituteId: "inst-csjmu-arts", courseCode: "BSC",
  annualIncome: 96000, incomeCertNo: "IC-2024-771201", incomeAppNo: "APP-2024-771201",
  casteCertNo: "CC-2019-118834", casteAppNo: "APP-2019-118834",
  aadhaarDemo: "000012340001", otr: "UP26-8123456789", duplicateOtrs: [] as string[],
  hosteller: false, previousResult: "passed" as const,
};

beforeEach(async () => { await hydrate(); reseed(); });

test("a clean renewal produces no blockers", () => {
  const items = runPreflight(CTX);
  assert.equal(blockers(items).length, 0);
  assert.ok(items.length >= 10, "every rule should report, not just the failures");
});

test("an income certificate expiring before the disbursement window is a blocker, with the date", () => {
  const items = runPreflight({ ...CTX, incomeCertNo: "IC-2021-330077", incomeAppNo: "APP-2021-330077" });
  const item = items.find((i) => i.id === "income_certificate")!;
  assert.equal(item.state, "blocked");
  assert.match(item.detailHi, /2024-09-02|02 सित/);
  assert.equal(item.fixedBy, "revenue_office");
  assert.ok(item.etaHi);
});

test("income above the category cap is a blocker that shows the cap, its source and the disagreement", () => {
  const item = runPreflight({ ...CTX, annualIncome: 260000 }).find((i) => i.id === "category_income_cap")!;
  assert.equal(item.state, "blocked");
  assert.match(item.detailHi, /2,00,000/);
  assert.ok(item.source);
});

test("an unpublished course blocks with the institute as the fixer and a sentence to say", () => {
  const item = runPreflight({ ...CTX, courseCode: "BED" }).find((i) => i.id === "course_published")!;
  assert.equal(item.state, "blocked");
  assert.equal(item.fixedBy, "institute");
  assert.match(item.actionHi!, /मास्टर डेटा/);
});

test("an unseeded bank account warns but never blocks the application", () => {
  const item = runPreflight({ ...CTX, aadhaarDemo: "000012340002" }).find((i) => i.id === "dbt_seeding")!;
  assert.equal(item.state, "warn");
  assert.equal(item.fixedBy, "bank");
});

test("a recorded duplicate OTR is surfaced as a warning with the recovery route", () => {
  const item = runPreflight({ ...CTX, duplicateOtrs: ["UP26-8999999999"] })
    .find((i) => i.id === "duplicate_otr")!;
  assert.equal(item.state, "warn");
  assert.match(item.detailHi, /UP26-8999999999/);
});

test("a failed previous year blocks a renewal", () => {
  const item = runPreflight({ ...CTX, previousResult: "failed" }).find((i) => i.id === "previous_result")!;
  assert.equal(item.state, "blocked");
});

test("a closed application window is reported as a blocker with the open date", () => {
  // dashmottar renewal closes 15 Oct 2026; the clock helper in the test moves past it
  const items = runPreflight({ ...CTX, todayOverride: "2026-11-01T00:00:00.000Z" });
  const item = items.find((i) => i.id === "window_open")!;
  assert.equal(item.state, "blocked");
  assert.match(item.detailHi, /15/);
});

test("an upstream outage yields state unknown, never a fake pass", () => {
  const items = runPreflight({ ...CTX, simulateEdistrictDown: true });
  const item = items.find((i) => i.id === "income_certificate")!;
  assert.equal(item.state, "unknown");
  assert.match(item.detailHi, /जवाब नहीं/);
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm test` → FAIL, `Cannot find module './preflight'`.

- [ ] **Step 3: Implement `preflight.ts`**

Structure (one small function per check, assembled in order; each returns a `PreflightItem`):

```ts
import type { Category, Cycle, PreflightItem, TrackId } from "./types";
import { iso, isBefore } from "./clock";
import { calendarFor } from "./config/calendar";
import { incomeCapFor } from "./config/rates";
import { REASONS } from "./config/reasons";
import { SCHEMES } from "./config/schemes";
import { getInstitute, getSim, putSim } from "./store";
import { verifyCertificate } from "./external/edistrict";
import { checkDbt } from "./external/npci";
import { AppError } from "./errors";

export type PreflightCtx = {
  track: TrackId; cycle: Cycle; category: Category;
  instituteId: string; courseCode: string;
  annualIncome: number | null;
  incomeCertNo?: string; incomeAppNo?: string; casteCertNo?: string; casteAppNo?: string;
  aadhaarDemo: string; otr: string; duplicateOtrs: string[];
  hosteller: boolean; previousResult?: "passed" | "promoted" | "failed" | null;
  todayOverride?: string;           // tests only
  simulateEdistrictDown?: boolean;  // tests only
};

const ok = (id: string, titleHi: string, titleEn: string, detailHi: string, detailEn: string):
  PreflightItem => ({ id, state: "ok", titleHi, titleEn, detailHi, detailEn,
    actionHi: null, etaHi: null, fixedBy: "none" });

export function runPreflight(ctx: PreflightCtx): PreflightItem[] {
  const today = ctx.todayOverride ?? iso();
  const cal = calendarFor(ctx.track, ctx.cycle);
  const items: PreflightItem[] = [];

  items.push(checkWindow(cal, today));
  items.push(checkOtr(ctx));
  if (ctx.duplicateOtrs.length > 0) items.push(checkDuplicateOtr(ctx));
  items.push(checkIncomeCap(ctx));
  items.push(checkIncomeCertificate(ctx, cal, today));
  if (ctx.category !== "general") items.push(checkCasteCertificate(ctx));
  items.push(checkInstitute(ctx));
  items.push(checkCoursePublished(ctx));
  items.push(checkDbtSeeding(ctx));
  items.push(attendanceNotice());
  if (SCHEMES[ctx.track].needsBonafide) items.push(bonafideNotice());
  if (ctx.cycle === "renewal") items.push(checkPreviousResult(ctx));
  return items;
}

export function blockers(items: PreflightItem[]): PreflightItem[] {
  return items.filter((i) => i.state === "blocked");
}
```

Each check, with its exact copy:

- `checkWindow` — `blocked` when `today` is outside `registrationOpen..studentDeadline`, detail names
  both dates in `DD MMM YYYY`, `actionHi` names the next window when it is in the future.
- `checkOtr` — `ok` when `ctx.otr` matches `/^UP26-\d{10}$/`; otherwise `blocked` with
  `actionHi: "पहले OTR बनाएँ — यही आपकी जीवनभर की पहचान है।"`
- `checkDuplicateOtr` — `warn`, detail lists every OTR in `duplicateOtrs`, action = the recovery route.
- `checkIncomeCap` — compares `annualIncome` to `incomeCapFor(track, category)`, formats both with
  `toLocaleString("en-IN")`, copies `source` onto the item, appends `note` to `detailHi` when present.
- `checkIncomeCertificate` — calls `verifyCertificate`; catches `AppError` and returns `state: "unknown"`
  with the error's `hi` text (never a fake pass); `not_found` → `blocked`; `ok` but
  `expiresOn < cal.disbursementTo` → `blocked` using `REASONS.INCOME_CERT_EXPIRED` and stating both the
  expiry date and the disbursement window, because expiring *during* the pipeline is the real trap;
  `expiresOn` within 60 days of `disbursementTo` → `warn`.
- `checkCasteCertificate` — same shape, `not_found` → `blocked`, no expiry rule.
- `checkInstitute` — institute exists and `masterDataPublishedAt !== null`, else `blocked`,
  `fixedBy: "institute"`.
- `checkCoursePublished` — uses `REASONS.COURSE_NOT_PUBLISHED` for text; `actionHi` is the exact
  sentence for the student to say to the nodal officer.
- `checkDbtSeeding` — `checkDbt`; `seeded` → ok; `kyc_only`/`dormant` → `warn` with
  `etaHi: "3-5 दिन"`, `fixedBy: "bank"`, action from `REASONS.NPCI_NOT_SEEDED.fixHi`; on `AppError`,
  `unknown`.
- `attendanceNotice` — always `warn`-free `ok` informational item: 75% rule, `fixedBy: "institute"`,
  detail states that the institute certifies it and it cannot be fixed online later.
- `bonafideNotice` — informational, states letterhead + enrolment number + seal + under 200KB.
- `checkPreviousResult` — `failed` → `blocked` ("असफल वर्ष पर नवीनीकरण नहीं होता — नियम"),
  `promoted` → `ok` with the "Promoted with Result" hint, `null` → `warn`.

`simulateEdistrictDown` in the ctx flips `getSim().upstream.edistrict.health = "down"` before the call
and restores it after, so the test does not need to reach into the store.

- [ ] **Step 4: Run the tests**

Run: `npm test` → 9 pre-flight tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/server/preflight.ts src/server/preflight.test.ts
git commit -m "feat: pre-flight checks that fail before typing, never after"
```

---

### Task 9: Alerts, escalation, outbox, grievance draft

**Files:**
- Create: `src/server/alerts.ts`, `src/server/notify.ts`, `src/server/grievance.ts`, `src/server/alerts.test.ts`, `src/server/grievance.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces: `deriveAlerts(caseRec, now): Alert[]`, `escalate(caseRec): Case`, `nudge(caseRec, actor): Case`, `sendNotification(caseRec, reason, textHi): Notification`, `grievanceDraft(caseRec, profile): { subjectHi: string; bodyHi: string; bodyEn: string }`.

- [ ] **Step 1: Write the failing alerts test**

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { hydrate, notificationsFor, reseed } from "./store";
import { addDays, iso } from "./clock";
import { deriveAlerts, escalate, nudge } from "./alerts";
import { transition } from "./machine";
import { makeDraftCase } from "./testkit";

const STUDENT = { role: "student" as const, nameHi: "आप", designationHi: "आवेदक", orgHi: "—" };
beforeEach(async () => { await hydrate(); reseed(); });

test("a hard copy due in two days is an info alert with its date", () => {
  const c = transition(makeDraftCase(), "institute_review", STUDENT);
  const alerts = deriveAlerts(c, addDays(c.stageEnteredAt, 1));
  const a = alerts.find((x) => x.kind === "hardcopy_due")!;
  assert.equal(a.severity, "info");
  assert.equal(a.dueAt, c.hardCopy.dueAt);
  assert.ok(a.actionHi);
});

test("an overdue hard copy is a danger alert", () => {
  const c = transition(makeDraftCase(), "institute_review", STUDENT);
  const a = deriveAlerts(c, addDays(c.stageEnteredAt, 5)).find((x) => x.kind === "hardcopy_overdue")!;
  assert.equal(a.severity, "danger");
});

test("a stage past its deadline produces a breach alert naming the owner and the days", () => {
  const c = transition(makeDraftCase(), "institute_review", STUDENT);
  const a = deriveAlerts(c, addDays(c.dueAt!, 4)).find((x) => x.kind === "stage_breach")!;
  assert.equal(a.severity, "danger");
  assert.match(a.detailHi, /श्री आर\. के\. वर्मा/);
  assert.match(a.detailHi, /4 दिन/);
});

test("escalate records an escalation, writes an outbox message, and does not reset the wait", () => {
  let c = transition(makeDraftCase(), "institute_review", STUDENT);
  const stageEnteredAt = c.stageEnteredAt;
  c = escalate({ ...c, dueAt: addDays(iso(), -4) });
  assert.equal(c.escalations.length, 1);
  assert.ok(c.escalations[0].breachDays >= 4);
  assert.equal(c.stageEnteredAt, stageEnteredAt, "escalation must not restart the clock");
  assert.equal(c.events[c.events.length - 1].type, "escalated");
  assert.ok(notificationsFor(c.id).length >= 1);
});

test("escalate is idempotent within the same breach day", () => {
  let c = transition(makeDraftCase(), "institute_review", STUDENT);
  c = { ...c, dueAt: addDays(iso(), -4) };
  c = escalate(c); c = escalate(c);
  assert.equal(c.escalations.length, 1);
});

test("a nudge is recorded without touching the wait counter", () => {
  let c = transition(makeDraftCase(), "institute_review", STUDENT);
  const before = c.stageEnteredAt;
  c = nudge(c, STUDENT);
  assert.equal(c.stageEnteredAt, before);
  assert.equal(c.events[c.events.length - 1].type, "nudge_sent");
});

test("a correction window that has not opened yet says when it opens instead of demanding action now", () => {
  let c = transition(makeDraftCase(), "institute_review", STUDENT);
  c = transition(c, "university_scrutiny", c.owner!);
  c = transition(c, "dwo_review", c.owner!);
  c = { ...c, flags: [{ code: "ENROLMENT_MISMATCH", at: iso(), by: c.owner! }] };
  c = transition(c, "correction_required", c.owner!, { reasonCode: "ENROLMENT_MISMATCH" });
  const a = deriveAlerts(c, "2026-11-01T00:00:00.000Z").find((x) => x.kind === "correction_opens")!;
  assert.match(a.detailHi, /21/);
  assert.equal(a.severity, "info");
});

test("an estimate note is always present so no screen shows a bare number", () => {
  const alerts = deriveAlerts(makeDraftCase(), iso());
  assert.ok(alerts.some((a) => a.kind === "estimate_note"));
});

test("a payment failure produces an actionable alert with the bank step", () => {
  const c = makeDraftCase({ stage: "payment_failed", owner: { role: "student", nameHi: "आप",
    designationHi: "आवेदक", orgHi: "—" }, dueAt: addDays(iso(), 15),
    payment: { status: "rejected_not_seeded", failureCode: "NPCI_NOT_SEEDED" } });
  const a = deriveAlerts(c, iso()).find((x) => x.kind === "payment_action_needed")!;
  assert.match(a.actionHi!, /NPCI|DBT/);
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm test` → FAIL, `Cannot find module './alerts'`.

- [ ] **Step 3: Implement `notify.ts`**

```ts
import type { Case, Notification } from "./types";
import { iso } from "./clock";
import { getProfile, putNotification } from "./store";

export function sendNotification(c: Case, reason: string, textHi: string): Notification {
  const profile = getProfile(c.profileId);
  const n: Notification = {
    id: `ntf_${c.id}_${reason}_${Date.now().toString(36)}`,
    caseId: c.id, channel: "sms", to: profile?.mobile ?? "—",
    textHi: `${textHi} — मिलेगी (नकली सूचना)`, reason, createdAt: iso(),
  };
  putNotification(n);
  return n;
}
```

The outbox is a table, rendered in the UI, and labelled as a mock. Nothing is dispatched.

- [ ] **Step 4: Implement `alerts.ts`**

```ts
import type { ActorRef, Alert, Case } from "./types";
import { addDays, daysBetween, iso, isBefore } from "./clock";
import { calendarFor } from "./config/calendar";
import { REASONS } from "./config/reasons";
import { appendEvent, isTerminal } from "./machine";
import { sendNotification } from "./notify";

const ESCALATE_AFTER_DAYS = 3;

function fmt(isoStamp: string): string {
  const d = new Date(isoStamp);
  const months = ["जन","फ़र","मार्च","अप्रैल","मई","जून","जुल","अग","सित","अक्तू","नव","दिस"];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function deriveAlerts(c: Case, nowIso: string = iso()): Alert[] {
  const out: Alert[] = [];
  const cal = calendarFor(c.track, c.cycle);

  out.push({ id: "estimate", kind: "estimate_note", severity: "info",
    titleHi: "राशि एक अनुमान है", titleEn: "The amount is an estimate",
    detailHi: c.estimate.basisHi, detailEn: "Estimate basis is shown with the amount.",
    actionHi: null, actionHref: null, dueAt: null });

  if (c.stage === "draft") {
    const left = daysBetween(nowIso, cal.studentDeadline);
    if (left <= 7) {
      out.push({ id: "deadline", kind: "deadline_soon", severity: left < 0 ? "danger" : "warn",
        titleHi: left < 0 ? "आवेदन की तारीख़ बीत गई" : `आवेदन की अंतिम तारीख़ ${left} दिन में`,
        titleEn: left < 0 ? "Student deadline passed" : `Deadline in ${left} days`,
        detailHi: `अंतिम तारीख़: ${fmt(cal.studentDeadline)}.`,
        detailEn: `Deadline: ${cal.studentDeadline.slice(0, 10)}.`,
        actionHi: left < 0 ? null : "फ़ॉर्म पूरा करके लॉक करें", actionHref: `/jaanch/${c.id}`,
        dueAt: cal.studentDeadline });
    }
  }

  if (c.hardCopy.dueAt && !c.hardCopy.receivedAt) {
    const left = daysBetween(nowIso, c.hardCopy.dueAt);
    out.push(left < 0
      ? { id: "hardcopy", kind: "hardcopy_overdue", severity: "danger",
          titleHi: "हार्ड कॉपी की 3 दिन की समय सीमा बीत गई",
          titleEn: "The 3-day hard-copy window has passed",
          detailHi: `${fmt(c.hardCopy.dueAt)} तक जमा होनी थी। अब भी जमा करें — फ़ाइल तभी आगे बढ़ेगी।`,
          detailEn: "It was due on the date shown. Submit anyway — the file cannot move without it.",
          actionHi: "अंतिम प्रिंट, शुल्क रसीद और मार्कशीट कॉलेज छात्रवृत्ति प्रकोष्ठ में जमा करें",
          actionHref: null, dueAt: c.hardCopy.dueAt }
      : { id: "hardcopy", kind: "hardcopy_due", severity: "info",
          titleHi: `हार्ड कॉपी ${fmt(c.hardCopy.dueAt)} तक जमा करें`,
          titleEn: `Submit the hard copy by ${c.hardCopy.dueAt.slice(0, 10)}`,
          detailHi: `${left} दिन बचे हैं। रसीद ज़रूर लें।`,
          detailEn: `${left} days left. Get an acknowledgement.`,
          actionHi: "अंतिम प्रिंट, शुल्क रसीद और मार्कशीट जमा करें", actionHref: null,
          dueAt: c.hardCopy.dueAt });
  }

  if (!isTerminal(c.stage) && c.dueAt && c.owner && isBefore(c.dueAt, nowIso)) {
    const late = Math.abs(daysBetween(c.dueAt, nowIso));
    out.push({ id: "breach", kind: "stage_breach", severity: "danger",
      titleHi: `यह चरण ${late} दिन से समय सीमा पार कर चुका है`,
      titleEn: `This stage is ${late} days past its deadline`,
      detailHi: `फ़ाइल ${c.owner.nameHi} (${c.owner.designationHi}, ${c.owner.orgHi}) के पास है। ` +
        `समय सीमा ${fmt(c.dueAt)} थी, ${late} दिन बीत चुके हैं।`,
      detailEn: `Held by ${c.owner.nameHi}; deadline was ${c.dueAt.slice(0, 10)}, ${late} days ago.`,
      actionHi: c.escalations.length > 0 ? "शिकायत का मसौदा देखें" : "अनुस्मारक भेजें",
      actionHref: c.escalations.length > 0 ? `/shikayat/${c.id}` : null, dueAt: c.dueAt });
  }

  if (c.correction) {
    const opensIn = daysBetween(nowIso, c.correction.openAt);
    const closesIn = daysBetween(nowIso, c.correction.closeAt);
    const codes = c.flags.map((f) => REASONS[f.code]?.hi ?? f.code).join("; ");
    out.push(opensIn > 0
      ? { id: "correction", kind: "correction_opens", severity: "info",
          titleHi: `सुधार विंडो ${fmt(c.correction.openAt)} को खुलेगी`,
          titleEn: `Correction window opens ${c.correction.openAt.slice(0, 10)}`,
          detailHi: `आपत्ति: ${codes}. तब तक कागज़ तैयार रखें — विंडो ${fmt(c.correction.closeAt)} को बंद होगी।`,
          detailEn: `Flags: ${codes}.`, actionHi: null, actionHref: `/f/${c.id}`,
          dueAt: c.correction.openAt }
      : { id: "correction", kind: "correction_closing", severity: closesIn <= 3 ? "danger" : "warn",
          titleHi: `सुधार विंडो ${closesIn} दिन में बंद`, titleEn: `Correction closes in ${closesIn} days`,
          detailHi: `आपत्ति: ${codes}. सुधार के बाद नई प्रति 3 दिन में कॉलेज जमा करनी होगी।`,
          detailEn: `Flags: ${codes}. A corrected printout is due at the institute within 3 days.`,
          actionHi: "सुधार भरें", actionHref: `/aavedan/${c.id}`, dueAt: c.correction.closeAt });
  }

  if (c.stage === "payment_failed") {
    const code = c.payment.failureCode ?? "NPCI_NOT_SEEDED";
    out.push({ id: "payfail", kind: "payment_action_needed", severity: "danger",
      titleHi: "भुगतान बैंक स्तर पर लौट आया", titleEn: "Payment bounced at the bank",
      detailHi: REASONS[code]?.hi ?? code, detailEn: REASONS[code]?.en ?? code,
      actionHi: REASONS[code]?.fixHi ?? null, actionHref: null, dueAt: c.dueAt });
  }

  return out;
}

export function escalate(input: Case): Case {
  const c: Case = structuredClone(input);
  const nowIso = iso();
  if (isTerminal(c.stage) || !c.dueAt || !c.owner || !isBefore(c.dueAt, nowIso)) return c;
  const breachDays = Math.abs(daysBetween(c.dueAt, nowIso));
  if (breachDays < ESCALATE_AFTER_DAYS) return c;
  const already = c.escalations.some(
    (e) => e.stage === c.stage && daysBetween(e.at, nowIso) < 1,
  );
  if (already) return c;

  const to: ActorRef = c.owner.role === "institute"
    ? { role: "dwo", nameHi: "जिला समाज कल्याण कार्यालय", designationHi: "अनुश्रवण",
        orgHi: `जिला कोड ${c.form.districtCode ?? "—"}` }
    : { role: "dwo", nameHi: "निदेशालय अनुश्रवण प्रकोष्ठ", designationHi: "उच्च स्तर",
        orgHi: "समाज कल्याण निदेशालय" };

  c.escalations.push({ at: nowIso, stage: c.stage, breachDays, to });
  appendEvent(c, { at: nowIso, type: "escalated",
    actor: { role: "treasury", nameHi: "मिलेगी अनुश्रवण", designationHi: "स्वचालित", orgHi: "प्रणाली" },
    summaryHi: `${breachDays} दिन की देरी पर स्वतः अनुरोध ${to.nameHi} को भेजा गया — प्रतीक्षा गिनती जारी है`,
    summaryEn: `Auto-escalated after ${breachDays} days; the waiting counter keeps running`,
    data: { breachDays } });
  sendNotification(c, "escalation",
    `आपकी फ़ाइल ${c.id} ${breachDays} दिन से ${c.owner.nameHi} के पास रुकी है। अनुरोध ${to.nameHi} को भेज दिया गया`);
  return c;
}

export function nudge(input: Case, actor: ActorRef): Case {
  const c: Case = structuredClone(input);
  const at = iso();
  appendEvent(c, { at, type: "nudge_sent", actor,
    summaryHi: `अनुस्मारक ${c.owner?.nameHi ?? "—"} को भेजा गया (प्रतीक्षा गिनती नहीं बदलती)`,
    summaryEn: "Reminder sent; the waiting counter is unchanged" });
  sendNotification(c, "nudge", `अनुस्मारक भेजा गया: फ़ाइल ${c.id}`);
  return c;
}
```

- [ ] **Step 5: Write the failing grievance test**

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { hydrate, reseed } from "./store";
import { addDays, iso } from "./clock";
import { grievanceDraft } from "./grievance";
import { transition } from "./machine";
import { makeDraftCase } from "./testkit";

beforeEach(async () => { await hydrate(); reseed(); });

test("the grievance draft names the stage, the owner, the days waited and the case id", () => {
  const c = transition(makeDraftCase(), "institute_review",
    { role: "student", nameHi: "आप", designationHi: "आवेदक", orgHi: "—" });
  const late = { ...c, dueAt: addDays(iso(), -12) };
  const d = grievanceDraft(late, { nameHi: "अंकित सिंह", otr: "UP26-8123456789", mobile: "9876500001" });
  assert.match(d.bodyHi, /MLG-26-/);
  assert.match(d.bodyHi, /श्री आर\. के\. वर्मा/);
  assert.match(d.bodyHi, /12/);
  assert.match(d.bodyHi, /UP26-8123456789/);
  assert.ok(d.subjectHi.length > 10);
  assert.ok(d.bodyEn.length > 50, "an English copy exists for the record");
});

test("the draft never fabricates a phone number, an officer's identity or a promise", () => {
  const c = makeDraftCase();
  const d = grievanceDraft(c, { nameHi: "क", otr: "UP26-8000000001", mobile: "9000000001" });
  assert.equal(/\b(?:0\d{2,4}-\d{6,8}|1[89]00\d{6})\b/.test(d.bodyHi), false);
  assert.equal(d.bodyHi.includes("गारंटी"), false);
});
```

- [ ] **Step 6: Implement `grievance.ts`**

```ts
import type { Case } from "./types";
import { daysBetween, iso } from "./clock";
import { calendarFor } from "./config/calendar";
import { REASONS } from "./config/reasons";

export function grievanceDraft(
  c: Case, who: { nameHi: string; otr: string; mobile: string }, nowIso: string = iso(),
) {
  const waited = Math.abs(daysBetween(c.stageEnteredAt, nowIso));
  const late = c.dueAt ? Math.max(0, daysBetween(c.dueAt, nowIso)) : 0;
  const cal = calendarFor(c.track, c.cycle);
  const flags = c.flags.map((f) => REASONS[f.code]?.hi ?? f.code).join("; ") || "कोई आपत्ति दर्ज नहीं";

  const subjectHi =
    `छात्रवृत्ति आवेदन ${c.id} (सत्र ${c.session}) ${waited} दिन से एक ही चरण पर लंबित — निस्तारण हेतु अनुरोध`;

  const bodyHi = [
    `सेवा में,`,
    `जिला समाज कल्याण अधिकारी / सम्बंधित अधिकारी`,
    ``,
    `विषय: ${subjectHi}`,
    ``,
    `महोदय,`,
    `मेरा छात्रवृत्ति आवेदन (आवेदन संख्या ${c.id}, OTR ${who.otr}, सत्र ${c.session}) दिनांक ` +
      `${c.stageEnteredAt.slice(0, 10)} से "${c.stage}" चरण पर लंबित है। यह चरण ` +
      `${c.owner ? `${c.owner.nameHi} (${c.owner.designationHi}, ${c.owner.orgHi})` : "—"} के पास है ` +
      `और निर्धारित समय सीमा ${c.dueAt?.slice(0, 10) ?? "—"} से ${late} दिन बीत चुके हैं।`,
    `दर्ज आपत्तियाँ: ${flags}.`,
    `विभागीय अधिसूचना के अनुसार इस वर्ग के लिए सत्यापन विंडो ${cal.dwoWindowFrom.slice(0, 10)} से ` +
      `${cal.dwoWindowEnd.slice(0, 10)} तक और भुगतान अवधि ${cal.disbursementFrom.slice(0, 10)} से ` +
      `${cal.disbursementTo.slice(0, 10)} तक है।`,
    `कृपया प्रकरण का निस्तारण कराकर स्थिति से अवगत कराने की कृपा करें।`,
    ``,
    `भवदीय,`,
    `${who.nameHi} (पंजीकृत मोबाइल: ${who.mobile})`,
    ``,
    `[यह मसौदा एक स्वतंत्र प्रोटोटाइप ने तैयार किया है। भेजने से पहले विवरण जाँच लें।]`,
  ].join("\n");

  const bodyEn = [
    `To the District Social Welfare Officer / concerned authority,`,
    `Subject: scholarship application ${c.id} (session ${c.session}) pending at one stage for ${waited} days.`,
    `The file has been at "${c.stage}" since ${c.stageEnteredAt.slice(0, 10)}, held by ` +
      `${c.owner?.nameHi ?? "—"}, and is ${late} days past the stated deadline of ${c.dueAt?.slice(0, 10) ?? "—"}.`,
    `Recorded objections: ${flags}. Please have the case disposed of and inform me of the status.`,
    `[Draft prepared by an independent prototype. Verify before sending.]`,
  ].join("\n");

  return { subjectHi, bodyHi, bodyEn };
}
```

- [ ] **Step 7: Run the tests**

Run: `npm test` → 9 alert + 2 grievance tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/server/alerts.ts src/server/notify.ts src/server/grievance.ts src/server/alerts.test.ts src/server/grievance.test.ts
git commit -m "feat: SLA alerts, auto-escalation that never resets the wait, outbox, grievance draft"
```

---

### Task 10: Field specs, validation, PATCH whitelist

**Files:**
- Create: `src/server/fields.ts`, `src/server/patch.ts`, `src/server/fields.test.ts`

**Interfaces:**
- Consumes: `types.ts`, `config/schemes.ts`, `machine.ts`.
- Produces: `FIELDS: Record<string, FieldSpec>`, `fieldsFor(track, cycle, section): FieldSpec[]`, `validateField(name, value, ctx): string | null`, `validateAll(caseRec): { field: string; messageHi: string }[]`, `applyPatch(caseRec, patch, actor): { case: Case; rejected: string[] }`, `EDITABLE_BY_STAGE`.

- [ ] **Step 1: Write the failing field test**

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { hydrate, reseed } from "./store";
import { applyPatch, validateAll, validateField } from "./patch";
import { fieldsFor } from "./fields";
import { makeDraftCase } from "./testkit";

const STUDENT = { role: "student" as const, nameHi: "आप", designationHi: "आवेदक", orgHi: "—" };
beforeEach(async () => { await hydrate(); reseed(); });

test("every section of every track resolves to at least one field with a Hindi label", () => {
  for (const track of ["pre_9_10", "post_inter", "dashmottar", "outside_state"] as const) {
    for (const cycle of ["fresh", "renewal"] as const) {
      for (const section of ["education", "family_docs", "declaration"] as const) {
        const list = fieldsFor(track, cycle, section);
        assert.ok(list.length > 0, `${track}/${cycle}/${section} is empty`);
        assert.ok(list.every((f) => f.labelHi.length > 0));
      }
    }
  }
});

test("marks obtained above marks total is rejected with a Hindi message", () => {
  const msg = validateField("marksObtained", 700, { marksTotal: 600 });
  assert.ok(msg && msg.includes("कुल"));
});

test("a suspiciously low total is flagged as the CGPA mistake", () => {
  const msg = validateField("marksTotal", 10, {});
  assert.ok(msg && msg.includes("CGPA"));
});

test("ration card accepts 0 because that is the documented placeholder", () => {
  assert.equal(validateField("rationCard", "0", {}), null);
});

test("an Aadhaar-shaped value that is not a demo number is rejected", () => {
  assert.ok(validateField("aadhaarDemo", "234512340001", {})?.includes("डेमो"));
});

test("no field named for a bank account or IFSC exists anywhere", () => {
  const all = Object.keys(require("./fields").FIELDS).join(" ").toLowerCase();
  assert.equal(/ifsc|account|khata/.test(all), false);
});

test("applyPatch rejects money, stage and identity fields even if the client sends them", () => {
  const { case: after, rejected } = applyPatch(makeDraftCase(),
    { yearOfStudy: 3, nonRefundable: 1, stage: "paid", otr: "UP26-9999999999" } as never, STUDENT);
  assert.equal(after.form.yearOfStudy, 3);
  assert.deepEqual(rejected.sort(), ["nonRefundable", "otr", "stage"]);
  assert.equal(after.stage, "draft");
});

test("applyPatch on a locked case only accepts the fields the correction window unlocked", () => {
  const c = makeDraftCase({ stage: "correction_required",
    owner: { role: "student", nameHi: "आप", designationHi: "आवेदक", orgHi: "—" },
    dueAt: "2026-12-20T00:00:00.000Z",
    correction: { openAt: "2026-11-21T00:00:00.000Z", closeAt: "2026-12-20T00:00:00.000Z",
      usedAt: null, fields: ["ENROLMENT_MISMATCH"] } });
  const { case: after, rejected } = applyPatch(c, { enrolmentNo: "CSJM2426BA0917", hosteller: true },
    STUDENT);
  assert.equal(after.form.enrolmentNo, "CSJM2426BA0917");
  assert.deepEqual(rejected, ["hosteller"]);
});

test("validateAll returns every missing required field before lock", () => {
  const problems = validateAll(makeDraftCase({ form: { districtCode: "70" } }));
  assert.ok(problems.length >= 3);
  assert.ok(problems.every((p) => p.messageHi.length > 0));
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm test` → FAIL, `Cannot find module './patch'`.

- [ ] **Step 3: Implement `fields.ts`**

```ts
import type { Cycle, TrackId } from "./types";
import type { SectionId } from "./config/schemes";
import { isDemoAadhaar } from "./otr";

export type FieldSpec = {
  name: string;
  labelHi: string; labelEn: string;
  hintHi?: string;
  type: "text" | "number" | "date" | "select" | "checkbox" | "tel";
  section: SectionId;
  options?: { value: string; hi: string; en: string }[];
  requiredWhen?: (ctx: { track: TrackId; cycle: Cycle }) => boolean;
  maxLen?: number;
  validate?: (value: unknown, form: Record<string, unknown>) => string | null;
};

export const FIELDS: Record<string, FieldSpec> = {
  // education
  courseType: { name: "courseType", labelHi: "पाठ्यक्रम का प्रकार", labelEn: "Course type",
    type: "select", section: "education",
    options: [{ value: "regular", hi: "नियमित", en: "Regular" },
              { value: "self", hi: "स्वयं-वित्तपोषित", en: "Self-financed" }],
    requiredWhen: () => true },
  yearOfStudy: { name: "yearOfStudy", labelHi: "अध्ययन का वर्ष", labelEn: "Year of study",
    type: "number", section: "education", requiredWhen: () => true,
    validate: (v) => (Number(v) >= 1 && Number(v) <= 6 ? null : "वर्ष 1 से 6 के बीच होना चाहिए") },
  admissionDate: { name: "admissionDate", labelHi: "प्रवेश की तिथि", labelEn: "Admission date",
    type: "date", section: "education", requiredWhen: () => true },
  hosteller: { name: "hosteller", labelHi: "आवासीय छात्र (छात्रावास में)", labelEn: "Hosteller",
    hintHi: "छात्रावास में रहते हैं तो चुनें — रखरखाव भत्ता इसी से तय होता है",
    type: "checkbox", section: "education" },
  boardName: { name: "boardName", labelHi: "हाई स्कूल बोर्ड", labelEn: "High-school board",
    type: "select", section: "education",
    options: [{ value: "upmsp", hi: "यू.पी. बोर्ड", en: "UP Board" },
              { value: "cbse", hi: "सी.बी.एस.ई.", en: "CBSE" },
              { value: "icse", hi: "आई.सी.एस.ई.", en: "ICSE" }],
    requiredWhen: () => true },
  boardRollNo: { name: "boardRollNo", labelHi: "हाई स्कूल रोल नंबर", labelEn: "High-school roll number",
    hintHi: "मार्कशीट पर जैसा छपा है, वैसा ही — यही नंबर बोर्ड डेटाबेस से मिलाया जाता है",
    type: "text", section: "education", maxLen: 20, requiredWhen: () => true },
  enrolmentNo: { name: "enrolmentNo", labelHi: "नामांकन संख्या", labelEn: "Enrolment number",
    hintHi: "कॉलेज की नामांकन पर्ची से — स्पेस या डैश न डालें",
    type: "text", section: "education", maxLen: 30,
    requiredWhen: ({ track }) => track === "dashmottar" || track === "outside_state" },
  // previous result
  resultStatus: { name: "resultStatus", labelHi: "पिछले वर्ष का परिणाम", labelEn: "Previous result",
    type: "select", section: "previous_result",
    options: [{ value: "passed", hi: "उत्तीर्ण", en: "Passed" },
              { value: "promoted", hi: "बैक पेपर के साथ प्रोन्नत", en: "Promoted with back paper" },
              { value: "failed", hi: "अनुत्तीर्ण", en: "Failed" }],
    requiredWhen: ({ cycle }) => cycle === "renewal" },
  marksObtained: { name: "marksObtained", labelHi: "प्राप्तांक", labelEn: "Marks obtained",
    type: "number", section: "previous_result",
    requiredWhen: ({ cycle }) => cycle === "renewal",
    validate: (v, form) => {
      const total = Number(form.marksTotal ?? 0);
      if (total > 0 && Number(v) > total) return "प्राप्तांक कुल अंकों से अधिक नहीं हो सकते";
      return null;
    } },
  marksTotal: { name: "marksTotal", labelHi: "कुल अंक", labelEn: "Marks total",
    hintHi: "पूरे वर्ष के कुल अंक — CGPA या एक सेमेस्टर के अंक नहीं",
    type: "number", section: "previous_result",
    requiredWhen: ({ cycle }) => cycle === "renewal",
    validate: (v) => (Number(v) > 0 && Number(v) < 50
      ? "यह CGPA जैसा दिख रहा है। कुल अंक भरें (जैसे 600 या 1200), CGPA नहीं।" : null) },
  semesterCombined: { name: "semesterCombined", labelHi: "दोनों सेमेस्टर के अंक जोड़कर भरे हैं",
    labelEn: "Both semesters combined", type: "checkbox", section: "previous_result" },
  // family + docs
  annualIncome: { name: "annualIncome", labelHi: "वार्षिक पारिवारिक आय (₹)", labelEn: "Annual family income",
    type: "number", section: "family_docs", requiredWhen: () => true },
  rationCard: { name: "rationCard", labelHi: "राशन कार्ड संख्या", labelEn: "Ration card number",
    hintHi: "न हो तो 0 भरें — यही आधिकारिक तरीका है", type: "text", section: "family_docs",
    maxLen: 20, requiredWhen: () => true },
  incomeAppNo: { name: "incomeAppNo", labelHi: "आय प्रमाणपत्र आवेदन संख्या",
    labelEn: "Income certificate application number", type: "text", section: "family_docs",
    requiredWhen: () => true },
  incomeCertNo: { name: "incomeCertNo", labelHi: "आय प्रमाणपत्र संख्या", labelEn: "Income certificate number",
    type: "text", section: "family_docs", requiredWhen: () => true },
  casteAppNo: { name: "casteAppNo", labelHi: "जाति प्रमाणपत्र आवेदन संख्या",
    labelEn: "Caste certificate application number", type: "text", section: "family_docs" },
  casteCertNo: { name: "casteCertNo", labelHi: "जाति प्रमाणपत्र संख्या", labelEn: "Caste certificate number",
    type: "text", section: "family_docs" },
  aadhaarDemo: { name: "aadhaarDemo", labelHi: "डेमो आधार संख्या", labelEn: "Demo Aadhaar number",
    hintHi: "0000 से शुरू होने वाला 12 अंकों का डेमो नंबर — असली आधार यहाँ काम नहीं करेगा",
    type: "text", section: "identity", maxLen: 12,
    validate: (v) => (isDemoAadhaar(String(v)) ? null
      : "यह प्रोटोटाइप असली आधार नंबर स्वीकार नहीं करता — 0000 से शुरू होने वाला डेमो नंबर डालें") },
  // declarations
  declAttendance: { name: "declAttendance", labelHi: "मेरी उपस्थिति 75% या अधिक है",
    labelEn: "My attendance is 75% or more", type: "checkbox", section: "declaration",
    requiredWhen: () => true },
  declNoOtherScholarship: { name: "declNoOtherScholarship",
    labelHi: "मैं कोई अन्य राज्य या केंद्रीय छात्रवृत्ति नहीं ले रहा/रही हूँ",
    labelEn: "I hold no other state or central scholarship", type: "checkbox", section: "declaration",
    requiredWhen: () => true },
  declTruthful: { name: "declTruthful", labelHi: "भरी गई जानकारी सही है; गलत जानकारी पर आवेदन निरस्त हो सकता है",
    labelEn: "The information is correct; false information can void the application",
    type: "checkbox", section: "declaration", requiredWhen: () => true },
};

export function fieldsFor(track: TrackId, cycle: Cycle, section: SectionId): FieldSpec[] {
  return Object.values(FIELDS).filter(
    (f) => f.section === section && (!f.requiredWhen || true) &&
      (section !== "previous_result" || cycle === "renewal" || track !== "pre_9_10" ? true : true),
  ).filter((f) => f.section === section);
}
```

> Keep `fieldsFor` dumb: it returns the section's fields; `requiredWhen` decides what must be filled.
> Section visibility is `SCHEMES[track].sections`, already defined in config.

- [ ] **Step 4: Implement `patch.ts`**

```ts
import type { ActorRef, Case, Stage } from "./types";
import { iso } from "./clock";
import { FIELDS } from "./fields";
import { SCHEMES } from "./config/schemes";
import { appendEvent } from "./machine";

export const EDITABLE_BY_STAGE: Record<Stage, "all_form" | "correction_only" | "none"> = {
  draft: "all_form", returned_to_student: "all_form",
  correction_required: "correction_only",
  institute_review: "none", university_scrutiny: "none", dwo_review: "none",
  sanctioned: "none", pfms_processing: "none", payment_failed: "none",
  paid: "none", rejected: "none", lapsed: "none",
};

const CORRECTABLE_FIELDS: Record<string, string[]> = {
  BOARD_ROLL_MISMATCH: ["boardName", "boardRollNo"],
  ENROLMENT_MISMATCH: ["enrolmentNo"],
  INCOME_CERT_EXPIRED: ["incomeAppNo", "incomeCertNo", "annualIncome"],
  FEE_MISMATCH: [],
  HARDCOPY_NOT_RECEIVED: [],
};

export function validateField(name: string, value: unknown, form: Record<string, unknown>): string | null {
  const spec = FIELDS[name];
  if (!spec) return "अज्ञात फ़ील्ड";
  if (spec.maxLen && String(value).length > spec.maxLen) return `अधिकतम ${spec.maxLen} अक्षर`;
  return spec.validate ? spec.validate(value, form) : null;
}

export function validateAll(c: Case): { field: string; messageHi: string }[] {
  const scheme = SCHEMES[c.track];
  const out: { field: string; messageHi: string }[] = [];
  for (const spec of Object.values(FIELDS)) {
    if (!scheme.sections.includes(spec.section)) continue;
    const required = spec.requiredWhen?.({ track: c.track, cycle: c.cycle }) ?? false;
    const value = c.form[spec.name];
    if (required && (value === undefined || value === null || value === "" || value === false)) {
      out.push({ field: spec.name, messageHi: `${spec.labelHi} भरना ज़रूरी है` });
      continue;
    }
    if (value !== undefined && value !== null && value !== "") {
      const msg = validateField(spec.name, value, c.form);
      if (msg) out.push({ field: spec.name, messageHi: msg });
    }
  }
  return out;
}

export function applyPatch(input: Case, patch: Record<string, unknown>, actor: ActorRef):
  { case: Case; rejected: string[] } {
  const c: Case = structuredClone(input);
  const mode = EDITABLE_BY_STAGE[c.stage];
  const allowedByCorrection = new Set(
    c.flags.flatMap((f) => CORRECTABLE_FIELDS[f.code] ?? []),
  );
  const rejected: string[] = [];
  let changed = 0;

  for (const [key, value] of Object.entries(patch)) {
    const spec = FIELDS[key];
    const sectionAllowed = spec ? SCHEMES[c.track].sections.includes(spec.section) : false;
    const stageAllowed =
      mode === "all_form" ? true :
      mode === "correction_only" ? allowedByCorrection.has(key) : false;
    if (!spec || !sectionAllowed || !stageAllowed) { rejected.push(key); continue; }
    if (validateField(key, value, { ...c.form, ...patch })) { rejected.push(key); continue; }
    c.form[key] = value as never;
    changed += 1;
  }

  if (changed > 0) {
    c.updatedAt = iso();
    if (c.stage === "correction_required") c.correction = { ...c.correction!, usedAt: iso() };
  }
  if (rejected.length > 0) {
    appendEvent(c, { at: iso(), type: "patch_rejected", actor,
      summaryHi: `कुछ फ़ील्ड इस चरण पर बदले नहीं जा सकते: ${rejected.join(", ")}`,
      summaryEn: `Fields not editable at this stage: ${rejected.join(", ")}`,
      data: { rejected } });
  }
  return { case: c, rejected };
}
```

- [ ] **Step 5: Run the tests**

Run: `npm test` → 9 field/patch tests pass. Replace the `require("./fields")` line in the
"no bank field" test with a static `import { FIELDS } from "./fields"` if the runner complains.

- [ ] **Step 6: Full gate**

Run: `npm test && npm run typecheck && npm run build`
Expected: every suite green (≈70 assertions across 10 files), no type errors, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/server/fields.ts src/server/patch.ts src/server/fields.test.ts
git commit -m "feat: field specs shared by client and server, stage-aware patch whitelist"
```

---

## Self-review — Part A (domain)

- **Spec coverage:** §3 modules — `clock`, `config/*`, `store`, `machine`, `fees`, `route`, `otr`,
  `preflight`, `alerts`, `notify`, `grievance`, `errors`, `external/*`, `fields`, `patch` are all built
  here. `api.ts`, `useAutosave`, UI and Neon are explicitly plan 02+.
- **Invariant:** covered by `machine.test.ts` ("non-terminal stages can never be produced without owner
  and dueAt") and re-asserted inside `transition`.
- **Honesty rules:** the "no bank field" test and the "never leak the upstream string" test are
  guardrails, not decoration — keep them.
- **Known gap, deliberate:** `fieldsFor` currently filters only by section. Section *visibility* per
  track comes from `SCHEMES[track].sections`, which the UI already reads; do not add a second
  filtering rule in two places.
- **Type consistency:** `PreflightItem`, `Alert`, `Notification`, `SimConfig` are defined once in
  `types.ts` and imported everywhere; `ActorRef.role` includes `"treasury"` and `"bank"`, used by
  `machine` and `alerts` respectively.

---

# Part B — API layer (tasks 11-17)

**Goal:** Expose the domain over HTTP — sessions, student routes, institute routes, DWO routes, simulator routes — and make the store durable on Neon, so the frontend plan builds against a live API instead of inventing fetch shapes.

**Architecture:** Route handlers in `src/app/api/**`. Each handler does exactly four things: authenticate, parse, call one domain function, `persist()`. No domain logic in a route file, ever. All responses use one envelope.

**Added dependency:** `@neondatabase/serverless`.

## Part B constraints (in addition to the global ones)

- Every response: `{ ok: true, prototype: true, data }` or the `ErrorBody` from `src/server/errors.ts`.
- Route `params` is a Promise in Next 16 — always `await params`.
- Handler order is fixed: `await hydrate()` -> auth -> validate -> domain -> `await persist()` -> respond.
- Student routes may never write `stage`, money, `owner`, `dueAt`, `attendancePercent` or `payment`.
- Operator routes require an operator session; a mismatch is 403 with a Hindi message, never a redirect.
- On Vercel without `DATABASE_URL`: every API route returns **503** with `code: "STORE_UNCONFIGURED"` unless `MILEGI_ALLOW_EPHEMERAL=1`.
- `POST /api/sim/*` is unauthenticated on purpose (it is the demo panel) and every response from it carries `"simulated": true`.

---

### Task 11: Envelope, sessions, auth routes

**Files:**
- Create: `src/server/http.ts`, `src/server/session.ts`
- Create: `src/app/api/auth/otp/route.ts`, `src/app/api/auth/verify/route.ts`, `src/app/api/auth/operator/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/me/route.ts`
- Create: `src/server/session.test.ts`

**Interfaces:**
- Produces: `ok(data, init?)`, `fail(e)`, `readJson(req, shape)`, `handler(fn)`; `signSession(payload)`, `readSession(): Session | null`, `requireStudent()`, `requireRole(role)`, `Session = { role: "student"|"institute"|"dwo"; subjectId: string; exp: number }`.

- [ ] **Step 1: Write the failing session test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { signSession, verifySession } from "./session";

test("a signed session round-trips", () => {
  const token = signSession({ role: "student", subjectId: "prf_1", exp: Date.now() + 3600_000 });
  assert.equal(verifySession(token)?.subjectId, "prf_1");
});

test("a tampered session is rejected", () => {
  const token = signSession({ role: "student", subjectId: "prf_1", exp: Date.now() + 3600_000 });
  const [body] = token.split(".");
  assert.equal(verifySession(`${body}.deadbeef`), null);
});

test("an expired session is rejected", () => {
  assert.equal(verifySession(signSession({ role: "dwo", subjectId: "d70", exp: Date.now() - 1 })), null);
});

test("a role cannot be escalated by editing the payload", () => {
  const token = signSession({ role: "student", subjectId: "prf_1", exp: Date.now() + 3600_000 });
  const forged = Buffer.from(JSON.stringify({ role: "dwo", subjectId: "prf_1",
    exp: Date.now() + 3600_000 })).toString("base64url") + "." + token.split(".")[1];
  assert.equal(verifySession(forged), null);
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm test` → FAIL, `Cannot find module './session'`.

- [ ] **Step 3: Implement `session.ts`**

```ts
import crypto from "node:crypto";
import { cookies } from "next/headers";

export type Session = { role: "student" | "institute" | "dwo"; subjectId: string; exp: number };
export const COOKIE = "mlg_session";

function secret(): string {
  return process.env.MILEGI_SESSION_SECRET || "dev-only-change-me";
}

export function signSession(s: Session): string {
  const body = Buffer.from(JSON.stringify(s)).toString("base64url");
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifySession(token: string | undefined): Session | null {
  if (!token || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (mac.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    return s.exp > Date.now() ? s : null;
  } catch { return null; }
}

export async function readSession(): Promise<Session | null> {
  const jar = await cookies();
  return verifySession(jar.get(COOKIE)?.value);
}

export async function setSession(s: Session): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, signSession(s), { httpOnly: true, sameSite: "lax", path: "/",
    secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 12 });
}
```

- [ ] **Step 4: Implement `http.ts`**

```ts
import { AppError, errorBody } from "./errors";
import { hydrate, persist } from "./store";

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ ok: true, prototype: true, data }, { status });
}

export function fail(e: unknown): Response {
  const body = errorBody(e);
  const status = e instanceof AppError ? e.status : 500;
  return Response.json(body, { status });
}

export function storeGuard(): void {
  const onVercel = Boolean(process.env.VERCEL);
  if (onVercel && !process.env.DATABASE_URL && process.env.MILEGI_ALLOW_EPHEMERAL !== "1") {
    throw new AppError("STORE_UNCONFIGURED", {
      hi: "यह तैनाती डेटाबेस से जुड़ी नहीं है, इसलिए आवेदन सुरक्षित नहीं रह पाएगा।",
      en: "This deployment has no database configured, so applications would not persist.",
      status: 503, retryable: false,
    });
  }
}

// Every route handler is wrapped in this: hydrate, guard, run, persist, envelope.
export function handler(fn: (req: Request, ctx: { params: Promise<Record<string, string>> })
  => Promise<Response>) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      storeGuard();
      await hydrate();
      const res = await fn(req, ctx);
      await persist();
      return res;
    } catch (e) {
      return fail(e);
    }
  };
}
```

- [ ] **Step 5: Write the four auth routes**

`POST /api/auth/otp` — body `{ mobile }`. Validates 10 digits starting 6-9. Stores the generated OTP on
the sim config (`otpFor[mobile]`), returns `{ otpDemo, noteHi: "यह नकली OTP है, कोई SMS नहीं गया" }`.

`POST /api/auth/verify` — body `{ mobile, otp }`. On match: find or create nothing (profile creation is
`/api/otr`), set the session with `subjectId = profile?.id ?? "pending:" + mobile`, return
`{ profile: profile ?? null, cases: casesFor(profile) }`. On mismatch: `AppError("OTP_WRONG", …)`.

`POST /api/auth/operator` — body `{ role: "institute" | "dwo", code, pin }`. Demo credentials live in
`seeds.ts` as `OPERATOR_LOGINS` and are printed on the login page. Sets the session with
`subjectId = instituteId | districtCode`.

`POST /api/auth/logout` — clears the cookie, returns `{ done: true }`.

`GET /api/me` — returns `{ session, profile, cases: CaseSummary[] }` where
`CaseSummary = { id, track, cycle, stage, stageHi, owner, dueAt, alerts: Alert[] }`.

- [ ] **Step 6: Verify by curl**

```bash
npx next dev &
sleep 6
OTP=$(curl -s localhost:3000/api/auth/otp -X POST -H 'content-type: application/json' \
  -d '{"mobile":"9876500001"}' | grep -o '"otpDemo":"[0-9]*"' | cut -d'"' -f4)
curl -s -c /tmp/mlg.jar localhost:3000/api/auth/verify -X POST -H 'content-type: application/json' \
  -d "{\"mobile\":\"9876500001\",\"otp\":\"$OTP\"}" | head -c 200
curl -s -b /tmp/mlg.jar localhost:3000/api/me | head -c 200
```

Expected: `{"ok":true,"prototype":true,…}` twice, and `/api/me` reflects the session.

- [ ] **Step 7: Commit**

```bash
git add src/server/http.ts src/server/session.ts src/server/session.test.ts src/app/api/auth src/app/api/me
git commit -m "feat: response envelope, signed sessions, mock-OTP and operator auth"
```

---

### Task 12: Student case routes

**Files:**
- Create: `src/app/api/otr/route.ts`, `src/app/api/route/route.ts`, `src/app/api/institutes/route.ts`
- Create: `src/app/api/cases/route.ts`, `src/app/api/cases/[id]/route.ts`, `src/app/api/cases/[id]/draft/route.ts`, `src/app/api/cases/[id]/[action]/route.ts`, `src/app/api/track/[code]/route.ts`
- Create: `src/server/cases.ts`, `src/server/cases.test.ts`

**Interfaces:**
- Produces: `createCase(profile, { track, cycle, instituteId, courseCode }): Case`, `caseView(caseRec): CaseView`, `lockCase(caseRec, actor): Case`, `mintRegistrationNo(caseRec): string`, `prefillFromLastYear(profile, caseRec): Case`.
- `[action]` handles: `preflight`, `verify-certificate`, `lock`, `fee-dispute`, `nudge`, `grievance`, `resend-notification`.

- [ ] **Step 1: Write the failing case-service test**

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { hydrate, putCase, reseed } from "./store";
import { createCase, caseView, lockCase, prefillFromLastYear } from "./cases";
import { makeDraftCase } from "./testkit";
import { mintOtr } from "./otr";

const INPUT = { aadhaarDemo: "000012340001", mobile: "9876500001", dob: "2006-04-11",
  category: "obc" as const, nameHi: "अंकित सिंह", nameEn: "Ankit Singh", fatherNameHi: "राम सिंह",
  motherNameHi: "सीता देवी", districtCode: "70", addressHi: "कानपुर", gender: "m" as const };

beforeEach(async () => { await hydrate(); reseed(); });

test("a new case starts in draft, owned by the student, with the calendar deadline", () => {
  const p = mintOtr(INPUT).profile;
  const c = createCase(p, { track: "dashmottar", cycle: "fresh", instituteId: "inst-csjmu-arts",
    courseCode: "BSC" });
  assert.equal(c.stage, "draft");
  assert.equal(c.owner?.role, "student");
  assert.equal(c.dueAt, "2026-10-31T00:00:00.000Z");
  assert.equal(c.fee.nonRefundable, 19800);
  assert.equal(c.registrationNo, "", "the session registration number is minted at lock");
});

test("a case cannot be created on an unpublished course", () => {
  const p = mintOtr(INPUT).profile;
  assert.throws(() => createCase(p, { track: "dashmottar", cycle: "fresh",
    instituteId: "inst-csjmu-arts", courseCode: "BED" }), /not published/);
});

test("lock mints a 15-digit registration number and starts the hard-copy clock", () => {
  const c = lockCase(makeDraftCase({ form: { districtCode: "70", yearOfStudy: 2, hosteller: false,
    courseType: "regular", admissionDate: "2026-07-20", boardName: "upmsp",
    boardRollNo: "2404771201", enrolmentNo: "CSJM2426BA0917", resultStatus: "passed",
    marksObtained: 410, marksTotal: 600, semesterCombined: true, annualIncome: 96000,
    rationCard: "0", incomeAppNo: "APP-2024-771201", incomeCertNo: "IC-2024-771201",
    declAttendance: true, declNoOtherScholarship: true, declTruthful: true } }),
    { role: "student", nameHi: "आप", designationHi: "आवेदक", orgHi: "—" });
  assert.match(c.registrationNo, /^\d{15}$/);
  assert.equal(c.stage, "institute_review");
  assert.ok(c.hardCopy.dueAt);
});

test("lock refuses while a required field is missing, and names every one", () => {
  assert.throws(() => lockCase(makeDraftCase({ form: { districtCode: "70" } }),
    { role: "student", nameHi: "आप", designationHi: "आवेदक", orgHi: "—" }),
    /भरना ज़रूरी/);
});

test("lock refuses while a pre-flight blocker stands", () => {
  const c = makeDraftCase({ courseCode: "BSC",
    certificates: { income: { applicationNo: "APP-2021-330077", certNo: "IC-2021-330077",
      issuedOn: "2021-09-02T00:00:00.000Z", expiresOn: "2024-09-01T00:00:00.000Z",
      annualIncome: 84000, state: "expired" } } });
  assert.throws(() => lockCase(c, { role: "student", nameHi: "आप", designationHi: "आवेदक",
    orgHi: "—" }), /प्रमाणपत्र/);
});

test("a renewal is prefilled from last year and only three fields are left blank", () => {
  const p = mintOtr(INPUT).profile;
  const lastYear = makeDraftCase({ profileId: p.id, stage: "paid", owner: null, dueAt: null,
    session: "2026-27", form: { districtCode: "70", yearOfStudy: 1, hosteller: false,
      courseType: "regular", boardName: "upmsp", boardRollNo: "2404771201",
      enrolmentNo: "CSJM2426BA0917", annualIncome: 96000, rationCard: "0" } });
  putCase(lastYear);
  const fresh = createCase(p, { track: "dashmottar", cycle: "renewal",
    instituteId: "inst-csjmu-arts", courseCode: "BSC" });
  const filled = prefillFromLastYear(p, fresh);
  assert.equal(filled.form.enrolmentNo, "CSJM2426BA0917");
  assert.equal(filled.form.yearOfStudy, 2, "the year advances automatically");
  for (const blank of ["resultStatus", "marksObtained", "marksTotal"]) {
    assert.ok(!filled.form[blank], `${blank} must be re-entered every year`);
  }
});

test("caseView hides internals and includes alerts, the stage label and the estimate basis", () => {
  const v = caseView(makeDraftCase());
  assert.ok(v.stageHi.length > 0);
  assert.ok(Array.isArray(v.alerts));
  assert.ok(v.estimate.basisHi.length > 0);
  assert.equal((v as Record<string, unknown>).events === undefined, false, "the timeline is public");
  assert.equal(JSON.stringify(v).includes("aadhaarDemo"), false, "never ship the identity number");
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm test` → FAIL, `Cannot find module './cases'`.

- [ ] **Step 3: Implement `cases.ts`**

Key rules, in code:

```ts
export function mintRegistrationNo(c: Case): string {
  // 15 digits: 26 (session) + district(2) + track(1) + 10-digit sequence — mirrors the real shape.
  const trackDigit = { pre_9_10: "1", post_inter: "2", dashmottar: "3", outside_state: "4" }[c.track];
  const seq = String(Math.abs(hash(c.id))).padStart(10, "0").slice(0, 10);
  return `26${String(c.form.districtCode ?? "00").padStart(2, "0")}${trackDigit}${seq}`;
}

export function lockCase(input: Case, actor: ActorRef): Case {
  const problems = validateAll(input);
  if (problems.length > 0) {
    throw new AppError("FORM_INCOMPLETE", {
      hi: `कुछ ज़रूरी जानकारी बाकी है: ${problems.map((p) => p.messageHi).join("; ")}`,
      en: `Incomplete: ${problems.map((p) => p.field).join(", ")}`, status: 422,
    });
  }
  const blocking = blockers(input.preflight);
  if (blocking.length > 0) {
    throw new AppError("PREFLIGHT_BLOCKED", {
      hi: blocking.map((b) => b.detailHi).join(" "), en: blocking.map((b) => b.titleEn).join("; "),
      status: 422,
    });
  }
  const withReg = { ...structuredClone(input), registrationNo: mintRegistrationNo(input) };
  const locked = transition(withReg, "institute_review", actor);
  sendNotification(locked, "locked",
    `आवेदन ${locked.id} लॉक हुआ। पंजीकरण संख्या ${locked.registrationNo}. ` +
    `हार्ड कॉपी ${locked.hardCopy.dueAt?.slice(0, 10)} तक कॉलेज में जमा करें`);
  return locked;
}
```

`caseView` returns exactly: `id`, `session`, `track`, `trackHi`, `cycle`, `cycleHi`, `stage`, `stageHi`,
`stageEnteredAt`, `waitingDays`, `owner`, `dueAt`, `registrationNo`, `instituteNameHi`, `courseNameHi`,
`form`, `preflight`, `certificates` (numbers masked to last 4), `fee`, `estimate`, `hardCopy`,
`attendancePercent`, `flags` (each expanded with its `REASONS` entry), `correction`, `payment`,
`escalations`, `alerts`, `events`, `updatedAt`. It never includes `profileId` or any identity number.

`prefillFromLastYear` copies every form field except `resultStatus`, `marksObtained`, `marksTotal`,
`semesterCombined`, increments `yearOfStudy`, and appends an event
`prefilled_from_last_year` with `summaryHi: "पिछले वर्ष के आवेदन से जानकारी भर दी गई — केवल परिणाम, अंक और शुल्क जाँचें"`.

- [ ] **Step 4: Write the route handlers**

Each is thin. `src/app/api/cases/[id]/draft/route.ts`:

```ts
import { handler, ok } from "@/server/http";
import { AppError } from "@/server/errors";
import { getCase, putCase } from "@/server/store";
import { applyPatch } from "@/server/patch";
import { estimateFor } from "@/server/fees";
import { readSession } from "@/server/session";
import { caseView } from "@/server/cases";
import { iso } from "@/server/clock";

export const PATCH = handler(async (req, { params }) => {
  const { id } = await params;
  const session = await readSession();
  const existing = getCase(id);
  if (!existing) throw new AppError("CASE_NOT_FOUND", {
    hi: "यह आवेदन नहीं मिला। लिंक दोबारा जाँचें।", en: "Case not found", status: 404 });
  if (session?.role !== "student" || session.subjectId !== existing.profileId) {
    throw new AppError("FORBIDDEN", { hi: "यह आवेदन आपके खाते का नहीं है।",
      en: "Not your application", status: 403 });
  }
  const patch = (await req.json()) as Record<string, unknown>;
  const { case: updated, rejected } = applyPatch(existing, patch,
    { role: "student", nameHi: "आप", designationHi: "आवेदक", orgHi: "—" });
  updated.estimate = estimateFor(updated);
  putCase(updated);
  return ok({ case: caseView(updated), rejected, savedAt: iso() });
});
```

`GET /api/track/[code]` is the public read: it returns a **reduced** view — stage, stageHi, owner,
`dueAt`, `waitingDays`, alerts and the timeline, with no form data and no certificate numbers — because
the tracking code is shareable.

- [ ] **Step 5: Verify by curl**

```bash
curl -s localhost:3000/api/route -X POST -H 'content-type: application/json' \
  -d '{"studying":"college","firstYear":false,"gotLastYear":"dunno","changedCourse":false,"rejectedLastYear":false,"inUp":true}'
curl -s -b /tmp/mlg.jar localhost:3000/api/otr -X POST -H 'content-type: application/json' \
  -d '{"aadhaarDemo":"000012340001","mobile":"9876500001","dob":"2006-04-11","category":"obc","nameHi":"अंकित सिंह","nameEn":"Ankit Singh","fatherNameHi":"राम सिंह","motherNameHi":"सीता देवी","districtCode":"70","addressHi":"कानपुर","gender":"m"}'
CASE=$(curl -s -b /tmp/mlg.jar localhost:3000/api/cases -X POST -H 'content-type: application/json' \
  -d '{"track":"dashmottar","cycle":"renewal","instituteId":"inst-csjmu-arts","courseCode":"BSC"}' \
  | grep -o '"id":"MLG-26-[0-9]*"' | head -1 | cut -d'"' -f4)
curl -s -b /tmp/mlg.jar "localhost:3000/api/cases/$CASE/draft" -X PATCH \
  -H 'content-type: application/json' -d '{"marksTotal":10}'
curl -s "localhost:3000/api/track/$CASE"
```

Expected: the router returns `renewal` with a recovery line; OTR mints `UP26-…`; the draft PATCH
**rejects** `marksTotal: 10` with the CGPA message; the public track view contains no `form` key.

- [ ] **Step 6: Commit**

```bash
git add src/server/cases.ts src/server/cases.test.ts src/app/api/otr src/app/api/route src/app/api/institutes src/app/api/cases src/app/api/track
git commit -m "feat: student API — routing, OTR, case create, draft patch, lock, public tracking"
```

---

### Task 13: Institute routes

**Files:**
- Create: `src/server/institute.ts`, `src/server/institute.test.ts`
- Create: `src/app/api/institute/queue/route.ts`, `src/app/api/institute/cases/[id]/[action]/route.ts`, `src/app/api/institute/master/route.ts`

**Interfaces:**
- Produces: `instituteQueue(instituteId, filter): QueueRow[]`, `receiveHardCopy(caseRec, actor)`, `setAttendance(caseRec, percent, actor)`, `forwardCase(caseRec, actor)`, `returnCase(caseRec, code, note, actor)`, `publishCourse(instituteId, course, actor)`.

- [ ] **Step 1: Write the failing institute test**

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { hydrate, reseed, getInstitute } from "./store";
import { forwardCase, publishCourse, receiveHardCopy, returnCase, setAttendance } from "./institute";
import { transition } from "./machine";
import { makeDraftCase } from "./testkit";

const CLERK = { role: "institute" as const, nameHi: "श्री आर. के. वर्मा",
  designationHi: "छात्रवृत्ति लिपिक", orgHi: "राजकीय महाविद्यालय, कल्याणपुर" };
const STUDENT = { role: "student" as const, nameHi: "आप", designationHi: "आवेदक", orgHi: "—" };

beforeEach(async () => { await hydrate(); reseed(); });

function locked() { return transition(makeDraftCase(), "institute_review", STUDENT); }

test("forwarding is refused until the hard copy is marked received", () => {
  assert.throws(() => forwardCase(locked(), CLERK), /हार्ड कॉपी/);
});

test("forwarding is refused when attendance is below 75 and the flag names the rule", () => {
  let c = receiveHardCopy(locked(), CLERK);
  c = setAttendance(c, 68, CLERK);
  assert.throws(() => forwardCase(c, CLERK), /75/);
});

test("a degree file forwards to university scrutiny, a school file straight to the DWO", () => {
  let college = setAttendance(receiveHardCopy(locked(), CLERK), 82, CLERK);
  college = forwardCase(college, CLERK);
  assert.equal(college.stage, "university_scrutiny");

  let school = transition(makeDraftCase({ track: "pre_9_10", instituteId: "inst-school-gkp",
    courseCode: "CLASS9" }), "institute_review", STUDENT);
  school = setAttendance(receiveHardCopy(school, CLERK), 90, CLERK);
  school = forwardCase(school, CLERK);
  assert.equal(school.stage, "dwo_review");
});

test("returning a case gives the student a coded reason and a new deadline", () => {
  const c = returnCase(locked(), "HARDCOPY_NOT_RECEIVED", "प्रति नहीं मिली", CLERK);
  assert.equal(c.stage, "returned_to_student");
  assert.equal(c.owner?.role, "student");
  assert.ok(c.dueAt);
  assert.equal(c.flags[c.flags.length - 1].code, "HARDCOPY_NOT_RECEIVED");
});

test("returning with an unknown reason code is refused", () => {
  assert.throws(() => returnCase(locked(), "MADE_UP", "x", CLERK), /कोड/);
});

test("publishing a course makes it selectable and records who published it", () => {
  const before = getInstitute("inst-csjmu-arts")!.courses.find((c) => c.code === "BED")!;
  assert.equal(before.publishedAt, null);
  publishCourse("inst-csjmu-arts", { code: "BED", tuition: 51250 }, CLERK);
  const after = getInstitute("inst-csjmu-arts")!.courses.find((c) => c.code === "BED")!;
  assert.ok(after.publishedAt);
  assert.equal(after.feeHeads.tuition, 51250);
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm test` → FAIL, `Cannot find module './institute'`.

- [ ] **Step 3: Implement `institute.ts`**

- `receiveHardCopy` sets `hardCopy.receivedAt`, appends `hardcopy_received`, notifies the student.
- `setAttendance` writes `attendancePercent`, appends an event with the value.
- `forwardCase` throws `AppError("HARDCOPY_MISSING")` when `hardCopy.receivedAt` is null, throws
  `AppError("ATTENDANCE_LOW")` (text from `REASONS.ATTENDANCE_BELOW_75`) below 75, otherwise transitions
  to `university_scrutiny` when `getInstitute(c.instituteId)?.affiliatedTo` is set, else `dwo_review`.
- `returnCase` validates the code against `REASONS`, pushes the flag, transitions to
  `returned_to_student`, notifies with the code's `fixHi` as the action line.
- `publishCourse` upserts the course's `feeHeads.tuition` and stamps `publishedAt`, and appends nothing
  to any case — but a later `runPreflight` on affected cases now passes, which is the point.
- `instituteQueue` returns `{ caseId, studentNameHi, courseNameHi, stage, waitingDays, dueAt,
  breachDays, hardCopyReceived, attendancePercent, flags }`, sorted by `breachDays` descending so the
  files about to be auto-cancelled sit at the top.

- [ ] **Step 4: Write the routes**

`GET /api/institute/queue?state=&breach=1` requires `role: "institute"`.
`POST /api/institute/cases/[id]/[action]` where action ∈ `hardcopy | attendance | forward | return`;
each validates that the case's `instituteId` equals the session's `subjectId` (403 otherwise).
`POST /api/institute/master` publishes a course.
`POST /api/institute/bulk-forward` takes `{ caseIds: string[] }`, runs `forwardCase` per case, and
returns `{ forwarded: string[]; refused: { id, reasonHi }[] }` — a partial success is normal and must be
shown, not swallowed.

- [ ] **Step 5: Verify by curl**

```bash
curl -s -c /tmp/inst.jar localhost:3000/api/auth/operator -X POST -H 'content-type: application/json' \
  -d '{"role":"institute","code":"inst-csjmu-arts","pin":"1234"}'
curl -s -b /tmp/inst.jar 'localhost:3000/api/institute/queue' | head -c 300
curl -s -b /tmp/inst.jar "localhost:3000/api/institute/cases/$CASE/forward" -X POST | head -c 200
```

Expected: the forward attempt fails with the hard-copy message until `hardcopy` is posted first.

- [ ] **Step 6: Commit**

```bash
git add src/server/institute.ts src/server/institute.test.ts src/app/api/institute
git commit -m "feat: institute API — queue, hard copy, attendance, forward, coded return, master data"
```

---

### Task 14: DWO routes

**Files:**
- Create: `src/server/dwo.ts`, `src/server/dwo.test.ts`
- Create: `src/app/api/dwo/queue/route.ts`, `src/app/api/dwo/cases/[id]/[action]/route.ts`, `src/app/api/dwo/sanction/route.ts`

**Interfaces:**
- Produces: `dwoQueue(districtCode, filter): DwoRow[]`, `crossCheck(caseRec): CrossCheckResult[]`, `verifyCase(caseRec, actor)`, `flagCase(caseRec, codes, note, actor)`, `rejectCase(caseRec, code, note, actor)`, `sanctionBatch(caseIds, actor): { sanctioned: string[]; refused: {id, reasonHi}[] }`.

- [ ] **Step 1: Write the failing DWO test**

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { hydrate, reseed } from "./store";
import { crossCheck, flagCase, rejectCase, sanctionBatch, verifyCase } from "./dwo";
import { transition } from "./machine";
import { makeDraftCase } from "./testkit";

const DWO = { role: "dwo" as const, nameHi: "जिला समाज कल्याण कार्यालय",
  designationHi: "जिला छात्रवृत्ति समिति", orgHi: "जिला कोड 70" };
const STUDENT = { role: "student" as const, nameHi: "आप", designationHi: "आवेदक", orgHi: "—" };

beforeEach(async () => { await hydrate(); reseed(); });

function atDwo(form: Record<string, unknown> = {}) {
  let c = transition(makeDraftCase({ form: { districtCode: "70", yearOfStudy: 2, hosteller: false,
    boardName: "upmsp", boardRollNo: "2404771201", enrolmentNo: "CSJM2426BA0917", ...form } }),
    "institute_review", STUDENT);
  c = transition(c, "university_scrutiny", c.owner!);
  return transition(c, "dwo_review", c.owner!);
}

test("cross-check passes when the roll number and enrolment are in the registries", () => {
  const results = crossCheck(atDwo());
  assert.equal(results.every((r) => r.matched), true);
  assert.ok(results.length >= 3, "board roll, enrolment and income certificate are all checked");
});

test("a wrong enrolment number produces the documented reason code, not a generic failure", () => {
  const results = crossCheck(atDwo({ enrolmentNo: "WRONG123" }));
  const row = results.find((r) => r.id === "enrolment")!;
  assert.equal(row.matched, false);
  assert.equal(row.reasonCode, "ENROLMENT_MISMATCH");
});

test("flagging moves the case to correction_required with the window dates attached", () => {
  const c = flagCase(atDwo(), ["ENROLMENT_MISMATCH"], "", DWO);
  assert.equal(c.stage, "correction_required");
  assert.equal(c.correction?.openAt, "2026-11-21T00:00:00.000Z");
  assert.equal(c.correction?.closeAt, "2026-12-20T00:00:00.000Z");
  assert.equal(c.owner?.role, "student");
});

test("flagging with a non-correctable code says so and still gives the student the real fix", () => {
  const c = flagCase(atDwo(), ["BLOCKED_BY_DIRECTORATE"], "", DWO);
  const last = c.events[c.events.length - 1];
  assert.match(last.summaryHi, /निदेशालय/);
  assert.equal(c.correction?.fields.includes("BLOCKED_BY_DIRECTORATE"), true);
});

test("verify moves to sanctioned and records the officer", () => {
  const c = verifyCase(atDwo(), DWO);
  assert.equal(c.stage, "sanctioned");
  assert.equal(c.events[c.events.length - 1].actor.role, "dwo");
});

test("a sanction batch refuses anything not in sanctioned and reports why", () => {
  const good = verifyCase(atDwo(), DWO);
  const bad = atDwo();
  const out = sanctionBatch([good, bad], DWO);
  assert.deepEqual(out.sanctioned, [good.id]);
  assert.equal(out.refused[0].id, bad.id);
  assert.ok(out.refused[0].reasonHi.length > 0);
});

test("rejection requires a code from the reason table", () => {
  assert.throws(() => rejectCase(atDwo(), "BECAUSE", "", DWO), /कोड/);
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm test` → FAIL, `Cannot find module './dwo'`.

- [ ] **Step 3: Implement `dwo.ts`**

```ts
export type CrossCheckResult = {
  id: "board" | "enrolment" | "income" | "duplicate_income" | "attendance" | "intake";
  labelHi: string; matched: boolean; detailHi: string; reasonCode?: string;
};
```

- `crossCheck` calls `matchBoardRoll`, `matchEnrolment`, `verifyCertificate` (income, and re-checks the
  3-year expiry against the disbursement window), scans other cases for the same `incomeCertNo`
  (→ `DUPLICATE_INCOME_CERT`), and checks `attendancePercent >= 75`. An `AppError` from an upstream
  becomes `matched: false` with `detailHi` = the error's Hindi text and **no** reason code, so an outage
  is never recorded as a student's fault.
- `flagCase` validates every code against `REASONS`, pushes flags, transitions to
  `correction_required`, and notifies with the codes' `fixHi` lines. For a code with
  `correctable: false`, the notification and the event both say plainly that the correction window will
  not fix it and name who must act.
- `verifyCase` transitions to `sanctioned` and notifies with the disbursement window dates.
- `rejectCase` validates the code, transitions to `rejected`.
- `sanctionBatch` filters `stage === "sanctioned"`, transitions each to `pfms_processing`, returns both
  lists.
- `dwoQueue` returns `{ caseId, instituteNameHi, courseNameHi, category, stage, waitingDays, breachDays,
  crossCheck: CrossCheckResult[], estimateTotal }` for cases whose `form.districtCode` matches, sorted
  by `breachDays` desc.

- [ ] **Step 4: Write the routes**

`GET /api/dwo/queue?district=&filter=` (session district wins over the query parameter),
`POST /api/dwo/cases/[id]/[action]` with action ∈ `crosscheck | verify | flag | reject`,
`POST /api/dwo/sanction` with `{ caseIds }`.

- [ ] **Step 5: Verify by curl**

```bash
curl -s -c /tmp/dwo.jar localhost:3000/api/auth/operator -X POST -H 'content-type: application/json' \
  -d '{"role":"dwo","code":"70","pin":"1234"}'
curl -s -b /tmp/dwo.jar localhost:3000/api/dwo/queue | head -c 400
curl -s -b /tmp/dwo.jar "localhost:3000/api/dwo/cases/$CASE/crosscheck" -X POST | head -c 400
```

Expected: the queue lists district-70 cases with a `crossCheck` array; a wrong enrolment shows
`ENROLMENT_MISMATCH`.

- [ ] **Step 6: Commit**

```bash
git add src/server/dwo.ts src/server/dwo.test.ts src/app/api/dwo
git commit -m "feat: DWO API — automated cross-check, coded flags, verify, reject, sanction batch"
```

---

### Task 15: Simulator routes and the escalation sweep

**Files:**
- Create: `src/server/sim.ts`, `src/server/sim.test.ts`
- Create: `src/app/api/sim/config/route.ts`, `src/app/api/sim/advance/route.ts`, `src/app/api/sim/pfms/route.ts`, `src/app/api/sim/reset/route.ts`, `src/app/api/sim/state/route.ts`

**Interfaces:**
- Produces: `setUpstream(system, health, failureRate)`, `advanceDays(n): SweepReport`, `sweep(): SweepReport`, `runPayments(): PfmsRow[]`, `resetAll()`.

- [ ] **Step 1: Write the failing simulator test**

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { allCases, getSim, hydrate, putCase, reseed } from "./store";
import { advanceDays, runPayments, setUpstream } from "./sim";
import { transition } from "./machine";
import { makeDraftCase } from "./testkit";

const STUDENT = { role: "student" as const, nameHi: "आप", designationHi: "आवेदक", orgHi: "—" };
beforeEach(async () => { await hydrate(); reseed(); });

test("advancing the clock escalates a breached stage and reports what it did", () => {
  putCase(transition(makeDraftCase(), "institute_review", STUDENT));
  const report = advanceDays(20);
  assert.equal(getSim().clockOffsetDays, 20);
  assert.ok(report.escalated.length >= 1);
  const after = allCases()[0];
  assert.ok(after.escalations.length >= 1);
});

test("advancing the clock auto-advances university scrutiny past its SLA", () => {
  let c = transition(makeDraftCase(), "institute_review", STUDENT);
  c = transition(c, "university_scrutiny", c.owner!);
  putCase(c);
  const report = advanceDays(12);
  assert.ok(report.autoAdvanced.includes(c.id));
  assert.equal(allCases()[0].stage, "dwo_review");
});

test("advancing past the student deadline lapses an untouched draft, with an event", () => {
  putCase(makeDraftCase());
  advanceDays(400);
  const after = allCases()[0];
  assert.equal(after.stage, "lapsed");
  assert.equal(after.owner, null);
  assert.match(after.events[after.events.length - 1].summaryHi, /समय सीमा/);
});

test("a downed upstream is written to the outage log so an escalation can cite it", () => {
  setUpstream("edistrict", "down", 0);
  assert.equal(getSim().outageLog.at(-1)?.system, "edistrict");
  setUpstream("edistrict", "up", 0);
  assert.ok(getSim().outageLog.at(-1)?.to, "restoring closes the outage window");
});

test("running payments moves sanctioned cases and records the bank outcome per case", () => {
  let c = transition(makeDraftCase(), "institute_review", STUDENT);
  c = transition(c, "university_scrutiny", c.owner!);
  c = transition(c, "dwo_review", c.owner!);
  c = transition(c, "sanctioned", c.owner!);
  c = transition(c, "pfms_processing", c.owner!);
  putCase(c);
  const rows = runPayments();
  assert.equal(rows.length, 1);
  const after = allCases()[0];
  assert.ok(["paid", "payment_failed"].includes(after.stage));
  assert.ok(after.payment.status);
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npm test` → FAIL, `Cannot find module './sim'`.

- [ ] **Step 3: Implement `sim.ts`**

```ts
export type SweepReport = {
  atIso: string; offsetDays: number;
  escalated: string[]; autoAdvanced: string[]; lapsed: string[]; alerted: string[];
};
```

`sweep()` iterates every case and, in this order:

1. `draft` past `calendarFor(track, cycle).studentDeadline` → `transition(c, "lapsed", SYSTEM)`.
2. `university_scrutiny` past `dueAt` → `transition(c, "dwo_review", UNIVERSITY_ACTOR)` and append an
   event whose summary says the step auto-forwarded because this prototype has no university console.
3. Any non-terminal stage past `dueAt` → `escalate(c)`.
4. Recompute `deriveAlerts` and send a notification for any newly-crossed threshold (dedupe by
   `reason` in the outbox so the same alert is not messaged twice).

`advanceDays(n)` writes `sim.clockOffsetDays += n`, calls `setClockOffset`, then `sweep()`.
`setUpstream` appends `{ system, from: iso(), to: null }` on entering `down`, and closes the open row on
returning to `up`.
`runPayments()` gathers `pfms_processing` cases, calls `runPfmsBatch`, then transitions each to `paid`
(recording `payment.amount`) or `payment_failed` (recording `failureCode`), and notifies.

- [ ] **Step 4: Write the routes**

- `GET /api/sim/state` — the whole simulator picture: offset, upstream health, outage log, counts by
  stage. Used by the panel and by the student-facing status banner when something is down.
- `POST /api/sim/config` — `{ system, health, failureRate }` or `{ forcedPfmsOutcome }`.
- `POST /api/sim/advance` — `{ days }`, returns the `SweepReport`.
- `POST /api/sim/pfms` — runs a payment batch, returns the rows.
- `POST /api/sim/reset` — `reseed()`, returns the fresh state.

Every simulator response includes `"simulated": true` next to `prototype: true`.

- [ ] **Step 5: Verify by curl**

```bash
curl -s localhost:3000/api/sim/advance -X POST -H 'content-type: application/json' -d '{"days":9}'
curl -s localhost:3000/api/sim/config -X POST -H 'content-type: application/json' \
  -d '{"system":"npci","health":"down","failureRate":0}'
curl -s localhost:3000/api/sim/state | head -c 400
curl -s localhost:3000/api/sim/reset -X POST | head -c 200
```

Expected: the advance report lists escalations; state shows `npci.health = "down"` and an open outage
row; reset restores the seed and zeroes the offset.

- [ ] **Step 6: Commit**

```bash
git add src/server/sim.ts src/server/sim.test.ts src/app/api/sim
git commit -m "feat: simulator API — clock travel, sweep with escalation, outage log, payment batches"
```

---

### Task 16: Neon store

**Files:**
- Modify: `src/server/store.ts`
- Create: `src/server/store.neon.test.ts` (skipped without `DATABASE_URL`)
- Modify: `package.json` (add `@neondatabase/serverless`)

**Interfaces:**
- Consumes: the existing store API — **no caller changes**.
- Produces: the same `hydrate`/`persist`, backed by Postgres when `DATABASE_URL` is set.

- [ ] **Step 1: Write the conditional Neon test**

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { allInstitutes, hydrate, persist, putSim, getSim, reseed, __resetForTests } from "./store";

const LIVE = Boolean(process.env.DATABASE_URL);

test("neon round-trip", { skip: !LIVE ? "no DATABASE_URL" : false }, async () => {
  __resetForTests();
  await hydrate();
  reseed();
  const sim = getSim(); sim.clockOffsetDays = 7; putSim(sim);
  await persist();
  __resetForTests();
  await hydrate();
  assert.equal(getSim().clockOffsetDays, 7);
  assert.ok(allInstitutes().length >= 4);
});
```

- [ ] **Step 2: Run it (it should skip locally)**

Run: `npm test`
Expected: the test reports as skipped with "no DATABASE_URL". That is a pass.

- [ ] **Step 3: Add the Neon branch inside `store.ts`**

```ts
import { neon } from "@neondatabase/serverless";

const SCHEMA = `CREATE TABLE IF NOT EXISTS records (
  kind text NOT NULL, id text NOT NULL, payload jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1, PRIMARY KEY (kind, id))`;

function useNeon(): boolean { return Boolean(process.env.DATABASE_URL); }

async function hydrateFromNeon(): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!);
  await sql(SCHEMA);
  const rows = await sql`SELECT kind, id, payload FROM records` as
    { kind: string; id: string; payload: unknown }[];
  const s = emptySnapshot();
  for (const r of rows) {
    if (r.kind === "profile") s.profiles[r.id] = r.payload as Profile;
    else if (r.kind === "case") s.cases[r.id] = r.payload as Case;
    else if (r.kind === "institute") s.institutes[r.id] = r.payload as Institute;
    else if (r.kind === "notification") s.notifications[r.id] = r.payload as Notification;
    else if (r.kind === "config" && r.id === "sim") s.sim = r.payload as SimConfig;
    else if (r.kind === "config" && r.id === "seq") s.seq = (r.payload as { seq: number }).seq;
  }
  if (Object.keys(s.institutes).length === 0) {
    for (const inst of SEED_INSTITUTES) s.institutes[inst.id] = structuredClone(inst);
    dirty = true;
  }
  snap = s;
}

async function persistToNeon(): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!);
  const s = db();
  const rows: [string, string, unknown][] = [
    ...Object.entries(s.profiles).map(([id, v]) => ["profile", id, v] as [string, string, unknown]),
    ...Object.entries(s.cases).map(([id, v]) => ["case", id, v] as [string, string, unknown]),
    ...Object.entries(s.institutes).map(([id, v]) => ["institute", id, v] as [string, string, unknown]),
    ...Object.entries(s.notifications).map(([id, v]) => ["notification", id, v] as [string, string, unknown]),
    ["config", "sim", s.sim], ["config", "seq", { seq: s.seq }],
  ];
  for (const [kind, id, payload] of rows) {
    await sql`INSERT INTO records (kind, id, payload) VALUES (${kind}, ${id}, ${JSON.stringify(payload)}::jsonb)
      ON CONFLICT (kind, id) DO UPDATE SET payload = EXCLUDED.payload, version = records.version + 1`;
  }
}
```

`hydrate()` becomes: `if (snap) { setClockOffset(...); return; } if (useNeon()) await hydrateFromNeon();
else readJsonFile(); setClockOffset(...)`. `persist()` becomes: `if (!dirty) return; if (useNeon()) await
persistToNeon(); else writeJsonFile(); dirty = false;`. Export `__resetForTests()` that nulls `snap`.

> `ponytail:` this writes every row on every persist. At demo scale that is a few dozen upserts.
> Upgrade path if it ever matters: track a dirty-id set instead of a boolean.

- [ ] **Step 4: Prove it against a real Neon branch**

```bash
export DATABASE_URL='postgresql://…-pooler…/neondb?sslmode=require'
npm test
psql "$DATABASE_URL" -c "select kind, count(*) from records group by kind;"
```

Expected: the Neon test runs (not skipped) and passes; `records` contains `institute` and `config` rows.
The hostname **must** contain `-pooler`.

- [ ] **Step 5: Commit**

```bash
git add src/server/store.ts src/server/store.neon.test.ts package.json package-lock.json
git commit -m "feat: neon-backed store behind the existing hydrate/persist API"
```

---

### Task 17: One smoke script for the whole pipeline

**Files:**
- Create: `scripts/smoke.sh`

- [ ] **Step 1: Write the script**

It drives a case end to end with curl only: OTP → verify → OTR → route → create case → PATCH the whole
form → preflight → lock → institute login → hardcopy → attendance → forward → sim advance → DWO login →
crosscheck → flag → correction PATCH → resubmit → verify → sanction → sim pfms → assert `paid`. Every
step greps for a specific string and exits non-zero on mismatch, printing the failing step's response
body.

- [ ] **Step 2: Run it against a clean store**

```bash
rm -f "$TMPDIR/milegi-store.json" 2>/dev/null || rm -f /tmp/milegi-store.json
npx next dev & sleep 6
bash scripts/smoke.sh
```

Expected output ends with `SMOKE OK — case … reached paid`.

- [ ] **Step 3: Commit**

```bash
git add scripts/smoke.sh
git commit -m "test: end-to-end curl smoke over the full pipeline"
```

---

## Self-review — Part B (API)

- **Spec coverage:** every route named in spec §12's data needs exists here; `/api/me`, `/api/track/:code`
  and `/api/sim/state` are the three the UI plans depend on most.
- **Auth:** four tests cover tamper, expiry, and role forgery. Ownership (`case.profileId ===
  session.subjectId`, `case.instituteId === session.subjectId`, district match) is checked in the
  handlers, not the domain, and each returns 403 with Hindi text.
- **No placeholders:** `handler()`, `session.ts`, the draft PATCH route and the Neon branch are written
  out in full; the remaining handlers are four-line variants of the draft route with their domain call
  named explicitly in their task step.
- **Honesty:** simulator responses carry `simulated: true`; auto-advance of university scrutiny appends
  an event that says why; outages are logged so escalation text can cite them.
