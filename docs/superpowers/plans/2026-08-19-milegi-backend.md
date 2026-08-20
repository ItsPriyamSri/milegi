# Milegi Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Rewritten 20 Aug 2026 (Opus review).** This plan is now **linear**: Task N never builds something Task N+2 deletes. There is no "v2 overrides" section any more, because there is nothing left to override. If you are an executor: implement tasks in order, paste the last code block you see, and you will get the shipped design.

**Goal:** Durable mock Saksham backend: a Dashmottar case file (not a write-only form), door resolver that never dies on "No Record Found," fee from college master data, crash-safe drafts.

**Architecture:** Domain in `src/server` (no HTTP). Next.js route handlers are the JS backend — no Express. JSON file store for tests and local dev. Neon Postgres when `DATABASE_URL` is set so resume codes survive Vercel. Government systems are fakes.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, `@neondatabase/serverless`, `node --test` via `tsx`. No ORM. No live Aadhaar/NPCI/PFMS.

**Spec:** `docs/milegi-plan.md`  
**Build order / who codes:** `docs/superpowers/plans/2026-08-20-milegi-build-order.md`  
**Progress:** `docs/PROGRESS.md`  
**Cursor implements Tasks 1–9. Codex does not touch this plan.**

## Global Constraints

- Synthetic data only. Tokens look fake: `AADHAAR-DEMO-PRIYA`, `OTR-DEMO-PRIYA`. Never a 12-digit Aadhaar, never a real OTR shape.
- Every JSON response includes `"prototype": true`.
- Demo completable paths: **Dashmottar Fresh + Dashmottar Renewal only.**
- Income cap (Dashmottar/Post-Matric): SC/ST ₹2,50,000; every other category ₹2,00,000. Certificate valid **3 years**. (Sources in `docs/milegi-plan.md`.)
- Renewal must not mint a second OTR. Duplicate Fresh must recover, not 404.
- The student **cannot** set the fee. `feeNonRefundable` is copied from `institutes.tuition`. There is no `feeIncludesHostel` field — hostel/mess/caution/library/exam only exist on the institute record.
- State machine: `choose → preflight → draft → review → institute → dwo → paid | rejected`. Lock = `review → institute`.
- `PATCH` cannot set `status`, `actors`, `otr`, `registrationNo`, `npci`, `instituteListed`, `feeNonRefundable`, `expectedAmount`, `resumeCode`, `hardCopyDueAt`, `lastYearPaid`, `duplicateOtrs`, `feeDispute`, `feeDisputeNote`, `nudgeSentAt`, `courseName`, `instituteName`.
- "No Record Found" is never a terminal API result from `/api/resolve`.
- Do not call `scholarship.up.gov.in`. Do not log in anywhere.
- Route `params` is a Promise — `await params`. (Next 15 made it a Promise; Next 16 **removed** sync access. <https://nextjs.org/docs/app/api-reference/file-conventions/route>)
- Tests and local dev: JSON file store. Production: `DATABASE_URL` (Neon, pooled).

## Module-system decision (read once, saves a day)

`node --test` cannot run a `.ts` file that uses `import`/`export` unless the package is ESM, and Node's own type-stripping requires **explicit `.ts` extensions in every import**. Explicit `.ts` specifiers then have to survive Turbopack, and `"type": "module"` has a live Vercel regression history on Next 16.

So we do the boring thing:

- **No `"type": "module"`** in `package.json`. (`"type": "module"` + Next 16 on Vercel produced `ERR_REQUIRE_ESM` — <https://github.com/vercel/next.js/issues/91740>. Fixed in 16.3+, but we do not need the field at all.)
- **No `.ts` extensions in imports.** `import { getApp } from "./store"`.
- **No `allowImportingTsExtensions`.**
- Tests run through `tsx`: `node --import tsx --test src/server/logic.test.ts`. One devDependency buys extensionless imports plus CJS/ESM interop, and Next only ever sees ordinary extensionless specifiers.

Plan B if `tsx` ever misbehaves: add `"type": "module"` to `package.json`, append `.ts` to every relative import in `src/server`, drop `--import tsx`. Node 22.18+/24 strips types with no flag (<https://nodejs.org/docs/latest-v24.x/api/typescript.html>). Do not go down this road unless plan A actually fails.

## Store shape (why there is a `hydrate` / `persist` seam)

Neon is **async**. If `getApp` is async, then `preflight`, `patchDraft`, `lock`, `reviewGaps` and every test become async too. That rewrite is a day we do not have.

Instead: all domain code stays **synchronous** against an in-memory snapshot, and each route handler wraps its work in two awaits.

```ts
await hydrate();          // JSON: read file + seed. Neon: SELECT all rows into memory.
const app = lock(id);     // sync domain code, unchanged
await persist();          // JSON: no-op (saveApp already wrote). Neon: upsert dirty rows.
```

ponytail: whole-table load per request and last-write-wins on concurrent writes. Ceiling is a few hundred rows and tens of users, which is exactly the demo. Upgrade path if it ever matters: fetch one row by id instead of all, and make `saveApp` conditional on a version column.

`hydrate()` also enforces the production rule: **on Vercel without `DATABASE_URL`, fail loudly.** A silent in-memory store on Vercel means resume codes die between requests and the judge sees a broken demo instead of an error.

## File map

| File | Responsibility |
|---|---|
| `package.json` | `dev`, `build`, `start`, `test`, `typecheck` |
| `tsconfig.json`, `next.config.ts`, `.gitignore` | scaffold |
| `src/server/types.ts` | `Application`, `Institute`, statuses, `Blocker` |
| `src/server/store.ts` | JSON + Neon, seeds, `getInstitute`, `getAppByResume`, `hydrate`, `persist` |
| `src/server/logic.ts` | machine, preflight, patch, lock, resolveDoor, `envelope` |
| `src/server/logic.test.ts` | the only test file |
| `src/app/api/apps/[id]/route.ts` | GET |
| `src/app/api/apps/[id]/draft/route.ts` | PATCH |
| `src/app/api/apps/[id]/[action]/route.ts` | POST actions incl. `fee-dispute` |
| `src/app/api/resolve/route.ts` | POST door |
| `src/app/api/resume/[code]/route.ts` | GET by `MLG-…` |
| `src/app/api/seed/route.ts` | POST reset personas |
| `src/app/layout.tsx`, `src/app/page.tsx` | stubs so `next dev` boots; the frontend plan replaces them |

There is **no** `schema.sql` (two `CREATE TABLE IF NOT EXISTS` statements live in `store.ts`; a `.sql` file read at runtime is not reliably bundled into a Vercel function). There is **no** `POST /api/apps` and no `createApp`.

---

### Task 1: Scaffold + final types + state machine

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`
- Create: `src/server/types.ts`, `src/server/logic.ts`, `src/server/logic.test.ts`

**Interfaces:**
- Produces: `Application`, `Institute`, `ApplicationStatus`, `Track`, `Cycle`, `Blocker`, `Actor`, `canTransition`, `assertTransition`, `incomeCap`, `incomeExpired`, `jsonError`

These types are **final**. No later task adds a field to `Application`.

- [ ] **Step 1: Write package + tsconfig + config**

```json
{
  "name": "milegi",
  "private": true,
  "engines": { "node": ">=22.18" },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "test": "node --import tsx --test src/server/logic.test.ts"
  },
  "dependencies": {
    "next": "^16.3.1",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@types/node": "^22.15.0",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "tsx": "^4.20.0",
    "typescript": "^5.9.0"
  }
}
```

Next 16.3 is the current stable line in Aug 2026; Next 15 is Maintenance LTS with security support ending 21 Oct 2026 (<https://endoflife.date/nextjs>). Nothing in this plan uses a Next 15-only API — `params` was already a Promise.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```ts
// next.config.ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
```

`.gitignore`:

```
node_modules
.next
.env*.local
next-env.d.ts
```

(No `.data` entry: the JSON store lives under `os.tmpdir()`, not in the repo. Writing a JSON file inside the project directory makes `next dev` recompile on every autosave.)

- [ ] **Step 2: Write the failing test**

```ts
// src/server/logic.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { canTransition, incomeCap, incomeExpired } from "./logic";

test("lock only from review", () => {
  assert.equal(canTransition("draft", "institute"), false);
  assert.equal(canTransition("review", "institute"), true);
});

test("income caps: SC/ST 2.5L, everyone else 2L", () => {
  assert.equal(incomeCap("sc"), 250_000);
  assert.equal(incomeCap("st"), 250_000);
  assert.equal(incomeCap("obc"), 200_000);
  assert.equal(incomeCap("general"), 200_000);
  assert.equal(incomeCap("minority"), 200_000);
});

test("income expires at 3 years", () => {
  const now = new Date("2026-08-20T00:00:00.000Z");
  assert.equal(incomeExpired("2023-08-20", now), true);
  assert.equal(incomeExpired("2023-08-21", now), false);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm install && npm test`

Expected: FAIL, cannot find `./logic`.

- [ ] **Step 4: Write types + machine + caps**

```ts
// src/server/types.ts
export type Track = "prematric" | "inter" | "dashmottar" | "outside_state";
export type Cycle = "fresh" | "renewal";
export type Category = "general" | "obc" | "sc" | "st" | "minority";
export type CourseType = "regular" | "self_financed";
export type ResultStatus = "passed" | "promoted" | "failed" | null;
export type NpciStatus = "ok" | "pending" | "timeout";

export type ApplicationStatus =
  | "choose"
  | "preflight"
  | "draft"
  | "review"
  | "institute"
  | "dwo"
  | "paid"
  | "rejected";

export type ActorRole = "student" | "clerk" | "university" | "nic" | "dwo" | "pfms";

export type Actor = {
  name: string;
  role: ActorRole;
  waitingDays: number;
  done: boolean;
};

export type Blocker = {
  code: string;
  hi: string;
  en: string;
};

/** College master data. The student never types any of these numbers. */
export type Institute = {
  id: string;
  name: string;
  listed: boolean;
  courseName: string;
  /** Non-refundable tuition only. */
  tuition: number;
  hostel: number;
  mess: number;
  caution: number;
  /** What we estimate will be reimbursed. Not a promise — see `docs/milegi-plan.md`. */
  expectedAmount: number;
};

export type Application = {
  id: string;
  prototype: true;
  sessionYear: "2026-27";
  track: Track;
  cycle: Cycle;
  status: ApplicationStatus;

  /** Typed secret that reopens this case in another browser, e.g. MLG-PRIYA. */
  resumeCode: string;

  studentName: string;
  fatherName: string;
  motherName: string;
  /** Lifetime one-time registration. Mock shape, never a real OTR. */
  otr: string | null;
  /** Session registration number, 15 digits. Different thing from the OTR. */
  registrationNo: string | null;
  aadhaarToken: string;
  mobileMasked: string;
  category: Category;

  incomeAmount: number;
  incomeIssuedOn: string;
  incomeAppNo: string;
  incomeCertNo: string;
  casteAppNo: string | null;
  casteCertNo: string | null;

  instituteId: string;
  instituteName: string;
  instituteListed: boolean;
  npci: NpciStatus;

  courseType: CourseType;
  courseName: string;
  yearOfStudy: number;
  admissionDate: string | null;
  dayScholar: boolean;
  rationCard: string;

  /** Copied from institutes.tuition. Never patchable. */
  feeNonRefundable: number;
  /** Copied from institutes.expectedAmount. An estimate, not a sanctioned amount. */
  expectedAmount: number;
  feeDispute: boolean;
  feeDisputeNote: string | null;

  resultStatus: ResultStatus;
  marksObtained: number | null;
  marksTotal: number | null;
  semesterCombined: boolean;
  courseChanged: boolean;
  lastYearPaid: number | null;

  enrollmentNo: string | null;
  counseling: boolean;
  counselingNo: string | null;
  bonafideOk: boolean;
  photoReady: boolean;
  attendancePct: number;

  /** Set by lock: hard copy is due at the institute within 3 days. Informational. */
  hardCopyDueAt: string | null;
  /** Set by ping. The wait does not reset — see `pingClerk`. */
  nudgeSentAt: string | null;
  /** Both OTRs when the student minted a second one. */
  duplicateOtrs: string[] | null;

  lastSavedAt: string;
  actors: Actor[];
};
```

Deliberately absent, and do not add them back: `feeIncludesHostel` (the fee is not a student input any more, so the bug cannot happen), `stream` and `hostState` (only Inter / Outside-State forms need them, and neither is completable in this prototype), any bank account or IFSC field (the real portal pays by Aadhaar DBT), any real Aadhaar number.

```ts
// src/server/logic.ts
import type {
  Application,
  ApplicationStatus,
  Blocker,
  Category,
  Cycle,
  Institute,
  Track,
} from "./types";
import {
  findByAadhaarToken,
  getApp,
  getAppByResume,
  getInstitute,
  saveApp,
  sessionReg,
} from "./store";

// Tasks 3–6 append to this file. Do not add more import lines; everything
// logic.ts needs from the store is already imported above.

const ALLOWED: Record<ApplicationStatus, ApplicationStatus[]> = {
  choose: ["preflight"],
  preflight: ["draft", "rejected"],
  draft: ["review"],
  review: ["institute", "draft"],
  institute: ["dwo"],
  dwo: ["paid", "rejected"],
  paid: [],
  rejected: ["draft"],
};

export function canTransition(from: ApplicationStatus, to: ApplicationStatus) {
  return ALLOWED[from].includes(to);
}

export function assertTransition(from: ApplicationStatus, to: ApplicationStatus) {
  if (!canTransition(from, to)) {
    throw Object.assign(new Error(`illegal transition ${from} → ${to}`), { status: 409 });
  }
}

/**
 * Post-Matric / Dashmottar family income caps for 2026-27.
 * SC/ST ₹2.5L, General/OBC/Minority ₹2L.
 * Pre-Matric caps are deliberately not modelled: public 2026-27 sources disagree
 * (₹1L in some, ₹2.5L in others) and class 9–10 is not a completable journey here.
 */
export function incomeCap(category: Category): number {
  return category === "sc" || category === "st" ? 250_000 : 200_000;
}

/** UP income certificates are valid for exactly 3 years from the date of issue. */
export function incomeExpired(issuedOn: string, now = new Date()): boolean {
  const end = new Date(`${issuedOn}T00:00:00.000Z`);
  end.setUTCFullYear(end.getUTCFullYear() + 3);
  return now.getTime() >= end.getTime();
}

export function jsonError(err: unknown) {
  const message = err instanceof Error ? err.message : "error";
  const status =
    err instanceof Error && "status" in err && typeof err.status === "number"
      ? err.status
      : 400;
  const blockers =
    err instanceof Error && "blockers" in err
      ? (err as Error & { blockers?: Blocker[] }).blockers
      : undefined;
  return {
    status,
    body: { ok: false as const, prototype: true as const, error: message, blockers },
  };
}
```

`logic.ts` will not compile until Task 2 creates `store.ts`. That is expected — the import block is written once, here, so that later tasks only append functions. If you want a green `npm test` at the end of Task 1, comment out the store import line and uncomment it in Task 2. `Cycle`, `Track`, `Institute` are used by Tasks 5–6.

- [ ] **Step 5: Run tests**

Run: `npm test` — expected PASS (3 tests).

- [ ] **Step 6: Prove the other toolchain also works — do not skip this**

```bash
mkdir -p src/app
printf 'export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="hi"><body>{children}</body></html>;}\n' > src/app/layout.tsx
printf 'export default function Page(){return <p>Milegi</p>;}\n' > src/app/page.tsx
npm run typecheck && npm run build
```

Expected: both succeed. This is the single cheapest way to find a module-resolution or version problem — on day 1, not on day 6 during deploy. If `npm run build` fails here, fix it here.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json next.config.ts .gitignore src
git commit -m "$(cat <<'EOF'
Add Milegi types and scholarship state machine.
EOF
)"
```

---

### Task 2: Store, institute master, persona seeds

**Files:**
- Create: `src/server/store.ts`
- Modify: `src/server/logic.test.ts`

**Interfaces:**
- Produces: `hydrate()`, `persist()`, `useNeon()`, `getApp`, `saveApp`, `findByAadhaarToken`, `getAppByResume`, `getInstitute`, `listInstitutes`, `resetSeed`, `sessionReg`, `priya`, `amit`, `amitDup`, `csjmuBa`, `csjmuBsc`

Rules:
- Read `process.env.MILEGI_STORE_PATH` **inside** every function, never as a module-level const, so tests can set it first.
- `store.ts` must **not** import `logic.ts`. Nothing in the store needs domain rules. `getAppByResume` lives here because it is a lookup.
- `getApp` does not seed. `hydrate()` seeds. Route handlers call `hydrate()` first; tests call `resetSeed()`.

- [ ] **Step 1: Append the failing store test**

```ts
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getApp, getAppByResume, getInstitute, resetSeed } from "./store";

/** Fresh isolated store for one test. */
function isoStore() {
  process.env.MILEGI_STORE_PATH = join(mkdtempSync(join(tmpdir(), "milegi-")), "store.json");
  delete process.env.DATABASE_URL;
  resetSeed();
}

test("seeded Priya is loadable and blocked-by-design", () => {
  isoStore();
  const priya = getApp("app-priya");
  assert.equal(priya.studentName, "प्रिया वर्मा");
  assert.equal(priya.cycle, "fresh");
  assert.equal(priya.npci, "timeout");
  assert.equal(priya.resumeCode, "MLG-PRIYA");
  assert.equal(priya.feeNonRefundable, 0); // openForm fills this from the college
});

test("resume code is case-insensitive", () => {
  isoStore();
  assert.equal(getAppByResume("  mlg-amit ").id, "app-amit");
});

test("institute master carries the excluded charges", () => {
  isoStore();
  const inst = getInstitute("inst-csjmu-bsc");
  assert.equal(inst.tuition, 19800);
  assert.ok(inst.hostel > 0 && inst.mess > 0 && inst.caution > 0);
});
```

- [ ] **Step 2: Run — FAIL, missing `store.ts`**

- [ ] **Step 3: Write the store**

```ts
// src/server/store.ts
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { Application, Institute } from "./types";

type Snapshot = {
  apps: Application[];
  institutes: Institute[];
  /** ids written since the last persist(); only used by the Neon branch. */
  dirty: Set<string>;
};

const g = globalThis as unknown as { __milegi?: Snapshot };

function mem(): Snapshot {
  if (!g.__milegi) g.__milegi = { apps: [], institutes: [], dirty: new Set() };
  return g.__milegi;
}

function storePath() {
  // Outside the project dir on purpose: a JSON write inside the repo retriggers
  // the next dev compiler on every autosave.
  return process.env.MILEGI_STORE_PATH ?? join(tmpdir(), "milegi-store.json");
}

export function useNeon() {
  return Boolean(process.env.DATABASE_URL) && !process.env.MILEGI_STORE_PATH;
}

function writeFileStore() {
  if (useNeon() || process.env.VERCEL) return;
  const path = storePath();
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  const { apps, institutes } = mem();
  writeFileSync(tmp, JSON.stringify({ apps, institutes }, null, 2));
  renameSync(tmp, path);
}

function readFileStore() {
  if (useNeon() || process.env.VERCEL) return;
  try {
    const raw = JSON.parse(readFileSync(storePath(), "utf8")) as {
      apps: Application[];
      institutes: Institute[];
    };
    const m = mem();
    m.apps = raw.apps ?? [];
    m.institutes = raw.institutes ?? [];
  } catch {
    /* first run: nothing on disk yet */
  }
}

export function getApp(id: string): Application {
  const app = mem().apps.find((a) => a.id === id);
  if (!app) throw Object.assign(new Error(`not found: ${id}`), { status: 404 });
  return app;
}

export function saveApp(app: Application): Application {
  const m = mem();
  const i = m.apps.findIndex((a) => a.id === app.id);
  if (i === -1) m.apps.push(app);
  else m.apps[i] = app;
  m.dirty.add(app.id);
  writeFileStore();
  return app;
}

export function findByAadhaarToken(token: string, exceptId?: string): Application[] {
  return mem().apps.filter((a) => a.aadhaarToken === token && a.id !== exceptId);
}

export function getAppByResume(code: string): Application {
  const needle = code.trim().toUpperCase();
  const app = mem().apps.find((a) => a.resumeCode.toUpperCase() === needle);
  if (!app) throw Object.assign(new Error("unknown_resume"), { status: 404 });
  return app;
}

export function getInstitute(id: string): Institute {
  const inst = mem().institutes.find((i) => i.id === id);
  if (!inst) throw Object.assign(new Error(`institute not found: ${id}`), { status: 404 });
  return inst;
}

export function listInstitutes(): Institute[] {
  return mem().institutes;
}

function nowIso() {
  return new Date().toISOString();
}

function yearsAgo(n: number) {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - n);
  return d.toISOString().slice(0, 10);
}

/** Session registration number: 15 digits, deterministic so the demo is stable. */
export function sessionReg(id: string) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return `26${String(n).padStart(13, "0")}`.slice(0, 15);
}

export function csjmuBa(): Institute {
  return {
    id: "inst-csjmu-ba",
    name: "CSJMU कानपुर (डेमो)",
    listed: true,
    courseName: "B.A.",
    tuition: 8500,
    hostel: 12000,
    mess: 8000,
    caution: 2000,
    expectedAmount: 8500,
  };
}

export function csjmuBsc(): Institute {
  return {
    id: "inst-csjmu-bsc",
    name: "CSJMU कानपुर (डेमो)",
    listed: true,
    courseName: "B.Sc.",
    tuition: 19800,
    hostel: 12000,
    mess: 8000,
    caution: 2000,
    expectedAmount: 19800,
  };
}

export function priya(): Application {
  return {
    id: "app-priya",
    prototype: true,
    sessionYear: "2026-27",
    track: "dashmottar",
    cycle: "fresh",
    status: "choose",
    resumeCode: "MLG-PRIYA",
    studentName: "प्रिया वर्मा",
    fatherName: "राजेश वर्मा",
    motherName: "सुनीता वर्मा",
    otr: null,
    registrationNo: null,
    aadhaarToken: "AADHAAR-DEMO-PRIYA",
    mobileMasked: "******3210",
    category: "obc",
    incomeAmount: 120000,
    incomeIssuedOn: yearsAgo(4), // expired on purpose
    incomeAppNo: "INC-APP-PRIYA",
    incomeCertNo: "INC-CERT-PRIYA",
    casteAppNo: "CST-APP-PRIYA",
    casteCertNo: "CST-CERT-PRIYA",
    instituteId: "inst-csjmu-ba",
    instituteName: "CSJMU कानपुर (डेमो)",
    instituteListed: true,
    npci: "timeout", // NPCI hang on purpose
    courseType: "regular",
    courseName: "",
    yearOfStudy: 1,
    admissionDate: "2026-07-15",
    dayScholar: true,
    rationCard: "0",
    feeNonRefundable: 0,
    expectedAmount: 0,
    feeDispute: false,
    feeDisputeNote: null,
    resultStatus: null,
    marksObtained: null,
    marksTotal: null,
    semesterCombined: false,
    courseChanged: false,
    lastYearPaid: null,
    enrollmentNo: "",
    counseling: false,
    counselingNo: null,
    bonafideOk: false,
    photoReady: false,
    attendancePct: 0,
    hardCopyDueAt: null,
    nudgeSentAt: null,
    duplicateOtrs: null,
    lastSavedAt: nowIso(),
    actors: [],
  };
}

export function amit(): Application {
  return {
    ...priya(),
    id: "app-amit",
    cycle: "renewal",
    resumeCode: "MLG-AMIT",
    studentName: "अमित यादव",
    fatherName: "सुरेश यादव",
    motherName: "गीता यादव",
    otr: "OTR-DEMO-AMIT",
    registrationNo: sessionReg("app-amit"),
    aadhaarToken: "AADHAAR-DEMO-AMIT",
    mobileMasked: "******4411",
    incomeAmount: 150000,
    incomeIssuedOn: yearsAgo(1),
    incomeAppNo: "INC-APP-AMIT",
    incomeCertNo: "INC-CERT-AMIT",
    casteAppNo: "CST-APP-AMIT",
    casteCertNo: "CST-CERT-AMIT",
    instituteId: "inst-csjmu-bsc",
    npci: "ok",
    courseName: "B.Sc.",
    yearOfStudy: 2,
    admissionDate: "2025-07-10",
    feeNonRefundable: 19800,
    expectedAmount: 19800,
    lastYearPaid: 18500,
    enrollmentNo: "ENR-AMIT-2025",
    bonafideOk: true,
    photoReady: true,
  };
}

/**
 * Amit filed a second Fresh application on the same Aadhaar — the real trap that
 * gets both applications blocked. The door has to recover this, not 404.
 */
export function amitDup(): Application {
  return {
    ...priya(),
    id: "app-amit-dup",
    resumeCode: "MLG-DUP",
    studentName: "अमित (गलत Fresh)",
    aadhaarToken: "AADHAAR-DEMO-AMIT",
    cycle: "fresh",
    otr: "OTR-DEMO-DUP",
    registrationNo: sessionReg("app-amit-dup"),
    instituteId: "inst-csjmu-bsc",
    incomeIssuedOn: yearsAgo(1),
    npci: "ok",
    duplicateOtrs: ["OTR-DEMO-AMIT", "OTR-DEMO-DUP"],
  };
}

export function resetSeed() {
  const m = mem();
  m.apps = [priya(), amit(), amitDup()];
  m.institutes = [csjmuBa(), csjmuBsc()];
  for (const a of m.apps) m.dirty.add(a.id);
  for (const i of m.institutes) m.dirty.add(`inst:${i.id}`);
  writeFileStore();
}

/**
 * Load a snapshot into memory. Every route handler awaits this first.
 * Task 8 adds the Neon branch; nothing else changes.
 */
export async function hydrate(): Promise<void> {
  if (process.env.VERCEL && !useNeon() && !process.env.MILEGI_ALLOW_EPHEMERAL) {
    throw Object.assign(
      new Error(
        "DATABASE_URL is not set. Production must use Neon or resume codes die between requests. " +
          "Set DATABASE_URL, or set MILEGI_ALLOW_EPHEMERAL=1 to accept an in-memory smoke deploy.",
      ),
      { status: 503 },
    );
  }
  if (!mem().apps.length) readFileStore();
  if (!mem().apps.length || !mem().institutes.length) resetSeed();
}

/** Flush writes. Task 8 adds the Neon branch. */
export async function persist(): Promise<void> {
  mem().dirty.clear();
}
```

Note the `amit()` / `amitDup()` spread of `priya()`: it keeps the three personas structurally identical, so adding a field to `Application` cannot leave one seed half-built.

- [ ] **Step 4: `npm test` — PASS**

- [ ] **Step 5: Commit** `Add file-backed mock store, college master data, and personas.`

---

### Task 3: Pre-flight

**Files:** Modify `src/server/logic.ts`, `src/server/logic.test.ts`

**Interfaces:** Produces `preflight(app, now?): { ok: boolean; blockers: Blocker[] }`

Exact blocker codes:

| code | when |
|---|---|
| `income_expired` | `incomeExpired(incomeIssuedOn)` |
| `income_over_limit` | `incomeAmount > incomeCap(category)` |
| `npci_timeout` | `npci === "timeout"` |
| `npci_pending` | `npci === "pending"` |
| `institute_unlisted` | `!instituteListed` |
| `duplicate_fresh` | `cycle === "fresh"` and another app shares `aadhaarToken` and is either `renewal` or already at `institute\|dwo\|paid` |
| `renewal_failed_year` | `cycle === "renewal"` and `resultStatus === "failed"` |
| `course_changed_must_be_fresh` | `cycle === "renewal"` and `courseChanged` |
| `missing_otr` | `cycle === "fresh"` and `!otr` |
| `missing_enrollment` | `!enrollmentNo`, **only** once status has left `choose`/`preflight` |

There is no `hostel_in_fee` blocker. The student cannot put hostel money in the fee because the student cannot set the fee.

Hindi copy is the product. These strings are exact:

- `income_expired`: `आय प्रमाण पत्र 3 साल से पुराना है। नया प्रमाण पत्र बनवाकर तारीख अपडेट करें।`
- `npci_timeout`: `आधार-DBT (NPCI) का जवाब नहीं आया। फॉर्म सेव रहेगा — फिर जाँचें।`
- `duplicate_fresh`: `इस आधार पर पहले से आवेदन है। नया मत बनाइए — नवीनीकरण चुनें।`
- `missing_fee`: `कॉलेज मास्टर डेटा में इस कोर्स का शुल्क नहीं है। कॉलेज नोडल अधिकारी से अपलोड कराएँ।`

- [ ] **Step 1: Failing tests**

```ts
import { preflight } from "./logic";
import { saveApp } from "./store";

test("Priya is blocked on expired income, NPCI, and a missing OTR", () => {
  isoStore();
  const r = preflight(getApp("app-priya"), new Date("2026-08-20T00:00:00.000Z"));
  assert.equal(r.ok, false);
  assert.ok(r.blockers.some((b) => b.code === "income_expired"));
  assert.ok(r.blockers.some((b) => b.code === "npci_timeout"));
  assert.ok(r.blockers.some((b) => b.code === "missing_otr"));
});

test("Amit passes pre-flight before marks are filled", () => {
  isoStore();
  assert.equal(preflight(getApp("app-amit"), new Date("2026-08-20T00:00:00.000Z")).ok, true);
});

test("a second Fresh on Amit's Aadhaar is a duplicate", () => {
  isoStore();
  const dup = getApp("app-amit-dup");
  const r = preflight(dup, new Date("2026-08-20T00:00:00.000Z"));
  assert.ok(r.blockers.some((b) => b.code === "duplicate_fresh"));
});

test("income over the cap is named", () => {
  isoStore();
  const rich = { ...getApp("app-amit"), id: "app-rich", incomeAmount: 400000 };
  saveApp(rich);
  const r = preflight(rich, new Date("2026-08-20T00:00:00.000Z"));
  assert.ok(r.blockers.some((b) => b.code === "income_over_limit"));
});
```

- [ ] **Step 2: Run — FAIL, `preflight` not exported**

- [ ] **Step 3: Append to `logic.ts`**

```ts
const COPY: Record<string, { hi: string; en: string }> = {
  income_expired: {
    hi: "आय प्रमाण पत्र 3 साल से पुराना है। नया प्रमाण पत्र बनवाकर तारीख अपडेट करें।",
    en: "Income certificate is older than 3 years. Get a new one and update the date.",
  },
  income_over_limit: {
    hi: "पारिवारिक आय इस श्रेणी की सीमा से अधिक है।",
    en: "Family income is above the cap for this category.",
  },
  npci_timeout: {
    hi: "आधार-DBT (NPCI) का जवाब नहीं आया। फॉर्म सेव रहेगा — फिर जाँचें।",
    en: "Aadhaar DBT (NPCI) did not respond. Your draft stays — retry.",
  },
  npci_pending: {
    hi: "आधार-DBT अभी लंबित है। बैंक शाखा में DBT सीडिंग की जाँच कराएँ।",
    en: "Aadhaar DBT is still pending. Ask your bank branch to seed the account for DBT.",
  },
  institute_unlisted: {
    hi: "यह संस्थान मास्टर डेटा में नहीं है। कॉलेज नोडल अधिकारी से कोर्स अपलोड कराएँ।",
    en: "Institute is not in master data. The college nodal officer must upload the course.",
  },
  duplicate_fresh: {
    hi: "इस आधार पर पहले से आवेदन है। नया मत बनाइए — नवीनीकरण चुनें।",
    en: "An application already exists for this Aadhaar. Choose renewal, do not file fresh.",
  },
  renewal_failed_year: {
    hi: "पिछला साल फेल है — इस साल नवीनीकरण नहीं बनेगा।",
    en: "Failed last year — renewal is not allowed.",
  },
  course_changed_must_be_fresh: {
    hi: "कोर्स या कॉलेज बदला है तो नवीनीकरण नहीं — नया आवेदन चुनें।",
    en: "Course or college changed — file as fresh, not renewal.",
  },
  missing_otr: {
    hi: "पहले वन-टाइम रजिस्ट्रेशन (OTR) पूरा करें।",
    en: "Complete one-time registration (OTR) first.",
  },
  missing_enrollment: {
    hi: "विश्वविद्यालय नामांकन संख्या लिखें।",
    en: "Enter the university enrollment number.",
  },
  missing_fee: {
    hi: "कॉलेज मास्टर डेटा में इस कोर्स का शुल्क नहीं है। कॉलेज नोडल अधिकारी से अपलोड कराएँ।",
    en: "The college master data has no fee for this course. Ask the nodal officer to upload it.",
  },
  missing_photo: {
    hi: "फोटो तैयार है — यह बॉक्स टिक करें।",
    en: "Tick that the photo is ready.",
  },
  missing_marks: {
    hi: "कुल अंक और प्राप्तांक दोनों लिखें।",
    en: "Enter obtained and total marks.",
  },
  missing_result: {
    hi: "परिणाम चुनें: पास या प्रोमोटेड।",
    en: "Select Passed or Promoted.",
  },
  missing_semester_combined: {
    hi: "दोनों सेमेस्टर के अंक जोड़कर टिक करें।",
    en: "Tick that both semester marks are combined.",
  },
  missing_caste_numbers: {
    hi: "जाति प्रमाण पत्र का आवेदन नंबर और प्रमाण पत्र नंबर लिखें।",
    en: "Enter caste certificate application and certificate numbers.",
  },
  missing_income_numbers: {
    hi: "आय प्रमाण पत्र का आवेदन नंबर और प्रमाण पत्र नंबर लिखें।",
    en: "Enter income certificate application and certificate numbers.",
  },
  missing_ration: {
    hi: "राशन कार्ड नंबर लिखें। नहीं है तो 0।",
    en: "Enter ration card number, or 0.",
  },
  missing_bonafide: {
    hi: "डिजिटल बोनाफाइड तैयार है — टिक करें।",
    en: "Tick that the digitally signed bonafide is ready.",
  },
};

function blocker(code: string): Blocker {
  const c = COPY[code];
  if (!c) throw new Error(`no copy for blocker ${code}`);
  return { code, hi: c.hi, en: c.en };
}

export function preflight(
  app: Application,
  now = new Date(),
): { ok: boolean; blockers: Blocker[] } {
  const blockers: Blocker[] = [];
  if (incomeExpired(app.incomeIssuedOn, now)) blockers.push(blocker("income_expired"));
  if (app.incomeAmount > incomeCap(app.category)) blockers.push(blocker("income_over_limit"));
  if (app.npci === "timeout") blockers.push(blocker("npci_timeout"));
  if (app.npci === "pending") blockers.push(blocker("npci_pending"));
  if (!app.instituteListed) blockers.push(blocker("institute_unlisted"));
  if (app.cycle === "fresh") {
    const others = findByAadhaarToken(app.aadhaarToken, app.id);
    const conflict = others.some(
      (o) =>
        o.cycle === "renewal" ||
        o.status === "institute" ||
        o.status === "dwo" ||
        o.status === "paid",
    );
    if (conflict) blockers.push(blocker("duplicate_fresh"));
    if (!app.otr) blockers.push(blocker("missing_otr"));
  }
  if (app.cycle === "renewal" && app.resultStatus === "failed") {
    blockers.push(blocker("renewal_failed_year"));
  }
  if (app.cycle === "renewal" && app.courseChanged) {
    blockers.push(blocker("course_changed_must_be_fresh"));
  }
  const afterPre = app.status !== "choose" && app.status !== "preflight";
  if (afterPre && !app.enrollmentNo) blockers.push(blocker("missing_enrollment"));
  return { ok: blockers.length === 0, blockers };
}
```

- [ ] **Step 4: `npm test` — PASS**
- [ ] **Step 5: Commit** `Add pre-flight blockers for income, NPCI, and duplicate Fresh.`

---

### Task 4: Draft patch, OTR, open form, review gate

**Files:** Modify `src/server/logic.ts`, `src/server/logic.test.ts`

**Interfaces:**
- `patchDraft(id, partial): Application`
- `completeKyc(id): Application`
- `openForm(id): Application`
- `applyInstituteFees(app): Application`
- `reviewGaps(app): Blocker[]`

`PATCHABLE` is a whitelist and it **never** contains a money field. The exact set is in Step 3 — do not retype it here.

Not patchable, on purpose: `feeNonRefundable`, `expectedAmount`, `courseName`, `instituteId`, `instituteName`, `instituteListed`, `track`, `cycle`, `status`, `otr`, `registrationNo`, `npci`, `resumeCode`, `hardCopyDueAt`, `lastYearPaid`, `duplicateOtrs`, `feeDispute`, `feeDisputeNote`, `nudgeSentAt`, `actors`, `id`, `prototype`, `aadhaarToken`. `track`/`cycle` come from the door, not from a field edit.

`patchDraft` rules:
- Allowed statuses: `choose`, `preflight`, `draft`, `review`. Anything later throws 409 `draft frozen after lock`.
- Merge only whitelisted keys, silently ignore the rest. Never delete the record on error.
- Always set `lastSavedAt`.
- If status is `choose`, move to `preflight` — even when there are zero blockers. A renewal student with a green checklist must still **see** the checklist; that is the product.
- Status becomes `draft` only via `openForm`.

`completeKyc`: if `otr` is already set, return unchanged. Never mint a second OTR. Otherwise set `otr = OTR-DEMO-${id}` and `registrationNo = sessionReg(id)`.

`openForm`: throw 409 with `blockers` if pre-flight is not clean, then `applyInstituteFees` and move to `draft`.

- [ ] **Step 1: Failing tests**

```ts
import { completeKyc, openForm, patchDraft, retryNpci, reviewGaps } from "./logic";

function lastYear() {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

test("patch keeps earlier fields and cannot set npci or tuition", () => {
  isoStore();
  completeKyc("app-priya");
  const a = patchDraft("app-priya", {
    incomeIssuedOn: lastYear(),
    enrollmentNo: "ENR-PRIYA",
    npci: "ok",
    feeNonRefundable: 99999,
    expectedAmount: 1,
  });
  assert.equal(a.enrollmentNo, "ENR-PRIYA");
  assert.equal(a.studentName, "प्रिया वर्मा");
  assert.equal(a.npci, "timeout");
  assert.equal(a.feeNonRefundable, 0);
  assert.equal(a.expectedAmount, 0);
  assert.equal(a.status, "preflight");
  assert.ok(a.lastSavedAt);
});

test("renewal KYC does not mint a second OTR", () => {
  isoStore();
  const before = getApp("app-amit").otr;
  assert.equal(completeKyc("app-amit").otr, before);
});

test("openForm copies the college tuition, the student never types it", () => {
  isoStore();
  completeKyc("app-priya");
  retryNpci("app-priya");
  patchDraft("app-priya", { incomeIssuedOn: lastYear(), enrollmentNo: "ENR-PRIYA" });
  const a = openForm("app-priya");
  assert.equal(a.status, "draft");
  assert.equal(a.courseName, "B.A.");
  assert.equal(a.feeNonRefundable, 8500);
  assert.equal(a.expectedAmount, 8500);
});

test("reviewGaps names the renewal gaps, not a missing fee", () => {
  isoStore();
  const g = reviewGaps(getApp("app-amit"));
  assert.ok(g.some((b) => b.code === "missing_result"));
  assert.ok(g.some((b) => b.code === "missing_marks"));
  assert.equal(g.some((b) => b.code === "missing_fee"), false);
});
```

`retryNpci` arrives in Task 5; if you are running tests between tasks, comment that line out. NPCI is never patchable — `retryNpci` is the only legal way to change it.

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Append to `logic.ts`**

```ts
const PATCHABLE = new Set([
  "category", "studentName", "fatherName", "motherName", "mobileMasked",
  "incomeAmount", "incomeIssuedOn", "incomeAppNo", "incomeCertNo",
  "casteAppNo", "casteCertNo", "courseType", "yearOfStudy", "admissionDate",
  "dayScholar", "rationCard", "resultStatus", "marksObtained", "marksTotal",
  "semesterCombined", "courseChanged", "enrollmentNo", "counseling",
  "counselingNo", "bonafideOk", "photoReady",
]);

/** College master data is the single source of truth for money and course name. */
export function applyInstituteFees(app: Application): Application {
  const inst: Institute = getInstitute(app.instituteId);
  app.instituteName = inst.name;
  app.instituteListed = inst.listed;
  app.courseName = inst.courseName;
  app.feeNonRefundable = inst.tuition;
  app.expectedAmount = inst.expectedAmount;
  return app;
}

export function completeKyc(id: string): Application {
  const app = getApp(id);
  if (app.otr) return app; // never mint a second OTR
  app.otr = `OTR-DEMO-${id}`;
  app.registrationNo = sessionReg(id);
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}

export function patchDraft(id: string, partial: Partial<Application>): Application {
  const app = getApp(id);
  if (!["choose", "preflight", "draft", "review"].includes(app.status)) {
    throw Object.assign(new Error("draft frozen after lock"), { status: 409 });
  }
  const merged: Application = { ...app };
  for (const [k, v] of Object.entries(partial)) {
    if (!PATCHABLE.has(k)) continue;
    (merged as unknown as Record<string, unknown>)[k] = v;
  }
  merged.lastSavedAt = new Date().toISOString();
  if (merged.status === "choose") merged.status = "preflight";
  return saveApp(merged);
}

export function openForm(id: string): Application {
  const app = getApp(id);
  const pf = preflight(app);
  if (!pf.ok) {
    throw Object.assign(new Error("preflight blocked"), { status: 409, blockers: pf.blockers });
  }
  applyInstituteFees(app);
  if (app.status === "choose" || app.status === "preflight") {
    app.status = "draft";
  }
  return saveApp(app);
}

export function reviewGaps(app: Application): Blocker[] {
  const gaps = [...preflight(app).blockers];
  const add = (code: string) => {
    if (!gaps.some((g) => g.code === code)) gaps.push(blocker(code));
  };
  if (!(app.feeNonRefundable > 0)) add("missing_fee");
  if (!app.enrollmentNo) add("missing_enrollment");
  if (app.cycle === "fresh") {
    if (!app.photoReady) add("missing_photo");
    if (!app.rationCard) add("missing_ration");
    if (!app.incomeAppNo || !app.incomeCertNo) add("missing_income_numbers");
    if (app.category !== "general" && (!app.casteAppNo || !app.casteCertNo)) {
      add("missing_caste_numbers");
    }
    if (!app.bonafideOk) add("missing_bonafide");
  } else {
    if (app.resultStatus !== "passed" && app.resultStatus !== "promoted") add("missing_result");
    if (app.marksObtained == null || app.marksTotal == null || app.marksTotal <= 0) {
      add("missing_marks");
    }
    if (!app.semesterCombined) add("missing_semester_combined");
  }
  return gaps;
}
```

`missing_fee` can now only fire because the **college** has no tuition in master data, never because the student left a box empty. If it ever shows up for Priya or Amit after `openForm`, the institute seed is wrong — fix the seed, do not add a fee input.

- [ ] **Step 4: `npm test` — PASS**
- [ ] **Step 5: Commit** `Add crash-safe draft patches, mock OTR, and college-master fees.`

---

### Task 5: Lock, institute, pay, crash, dispute, nudge

**Files:** Modify `src/server/logic.ts`, `src/server/logic.test.ts`

**Interfaces:**
- `moveToReview(id)` — 409 with `blockers: reviewGaps(app)` unless empty
- `lock(id)` — `review → institute`, names clerk `राम प्रकाश`, sets `hardCopyDueAt = today + 3 days`
- `attestInstitute(id)` — `institute → dwo`, idempotent, sets `attendancePct` to 80 if 0
- `retryNpci(id)` — the only legal way to set `npci = "ok"`
- `pay(id)` — `dwo → paid`, 409 if `npci !== "ok"`
- `reject(id)` — `dwo → rejected`
- `crash(id)` — mutates nothing but `lastSavedAt`
- `pingClerk(id)` — records `nudgeSentAt`; **does not** reset `waitingDays`
- `raiseFeeDispute(id, note)` — allowed at `draft`, `review`, `institute`; never changes `feeNonRefundable`

Two honesty decisions baked in here:

1. **`hardCopyDueAt` is informational.** There is no hard-copy blocker in pre-flight, and attest does not clear the date. The case page shows the Friday deadline, and after attest shows the same line struck through. The prototype's happy path is a digital attest; the clock is there so we are not pretending the paper requirement vanished.
2. **A nudge does not clear a wait.** Zeroing `waitingDays` when the student clicks "remind the clerk" would be a lie on screen. We record that a reminder went out and leave the 12 days standing.

- [ ] **Step 1: Failing tests**

```ts
import {
  attestInstitute, crash, lock, moveToReview, pay, pingClerk, raiseFeeDispute, reject,
} from "./logic";

/** Take Priya from seeded-and-blocked to ready-to-review. */
function clearPriyaGates() {
  isoStore();
  completeKyc("app-priya");
  retryNpci("app-priya");
  patchDraft("app-priya", {
    incomeIssuedOn: lastYear(),
    enrollmentNo: "ENR-PRIYA",
    bonafideOk: true,
    photoReady: true,
    rationCard: "0",
  });
  openForm("app-priya");
}

test("cannot lock with expired income", () => {
  isoStore();
  completeKyc("app-priya");
  assert.throws(() => lock("app-priya"));
});

test("happy path: review, lock, attest, pay", () => {
  clearPriyaGates();
  moveToReview("app-priya");
  const atClerk = lock("app-priya");
  assert.equal(atClerk.status, "institute");
  assert.equal(atClerk.actors[0].name, "राम प्रकाश");
  assert.ok(atClerk.hardCopyDueAt);
  const dwo = attestInstitute("app-priya");
  assert.equal(dwo.status, "dwo");
  assert.equal(dwo.hardCopyDueAt, atClerk.hardCopyDueAt); // attest does not hide the clock
  assert.equal(attestInstitute("app-priya").status, "dwo"); // idempotent
  assert.equal(pay("app-priya").status, "paid");
});

test("crash keeps the draft", () => {
  clearPriyaGates();
  patchDraft("app-priya", { enrollmentNo: "ENR-CRASH" });
  assert.equal(crash("app-priya").crashed, true);
  assert.equal(getApp("app-priya").enrollmentNo, "ENR-CRASH");
});

test("fee dispute does not touch master tuition", () => {
  clearPriyaGates();
  const a = raiseFeeDispute("app-priya", "रसीद 9000 दिखाती है");
  assert.equal(a.feeDispute, true);
  assert.equal(a.feeNonRefundable, 8500);
});

test("a nudge is recorded but the wait does not reset", () => {
  isoStore();
  patchDraft("app-amit", {
    resultStatus: "passed", marksObtained: 410, marksTotal: 600, semesterCombined: true,
  });
  openForm("app-amit");
  moveToReview("app-amit");
  const locked = lock("app-amit");
  assert.equal(locked.actors[0].waitingDays, 12);
  const nudged = pingClerk("app-amit");
  assert.ok(nudged.nudgeSentAt);
  assert.equal(nudged.actors[0].waitingDays, 12);
});

test("DWO can reject", () => {
  clearPriyaGates();
  moveToReview("app-priya");
  lock("app-priya");
  attestInstitute("app-priya");
  assert.equal(reject("app-priya").status, "rejected");
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Append to `logic.ts`**

```ts
const CLERK = "राम प्रकाश";
const UNIVERSITY = "सम्बद्ध विश्वविद्यालय (नकली)";
const DWO = "जिला कल्याण अधिकारी (नकली)";

export function moveToReview(id: string): Application {
  const app = getApp(id);
  const gaps = reviewGaps(app);
  if (gaps.length) {
    throw Object.assign(new Error("not ready to review"), { status: 409, blockers: gaps });
  }
  assertTransition(app.status, "review");
  app.status = "review";
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}

export function lock(id: string): Application {
  const app = getApp(id);
  const gaps = reviewGaps(app);
  if (gaps.length) {
    throw Object.assign(new Error("cannot lock"), { status: 409, blockers: gaps });
  }
  assertTransition(app.status, "institute");
  app.status = "institute";
  // ponytail: Amit's 12-day wait is a demo constant so the video can show a named
  // clerk sitting on a file. Everyone else starts at 0. Upgrade path: derive it
  // from lockedAt when there is a real clock.
  app.actors = [{ name: CLERK, role: "clerk", waitingDays: id === "app-amit" ? 12 : 0, done: false }];
  const due = new Date();
  due.setUTCDate(due.getUTCDate() + 3);
  app.hardCopyDueAt = due.toISOString().slice(0, 10);
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}

export function attestInstitute(id: string): Application {
  const app = getApp(id);
  if (app.status === "dwo" || app.status === "paid") return app;
  assertTransition(app.status, "dwo");
  app.status = "dwo";
  if (!app.attendancePct) app.attendancePct = 80; // the real rule is 75% minimum
  // ponytail: the affiliating university is a real actor in the Dashmottar chain.
  // We show it in the chain and auto-forward it. No university dashboard.
  app.actors = [
    { name: CLERK, role: "clerk", waitingDays: 0, done: true },
    { name: UNIVERSITY, role: "university", waitingDays: 0, done: true },
    { name: DWO, role: "dwo", waitingDays: 0, done: false },
  ];
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}

export function retryNpci(id: string): Application {
  const app = getApp(id);
  app.npci = "ok";
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}

export function pay(id: string): Application {
  const app = getApp(id);
  if (app.npci !== "ok") {
    throw Object.assign(new Error("NPCI not ok"), { status: 409 });
  }
  assertTransition(app.status, "paid");
  app.status = "paid";
  app.actors = [
    ...app.actors.map((a) => ({ ...a, done: true })),
    { name: "PFMS (नकली)", role: "pfms" as const, waitingDays: 0, done: true },
  ];
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}

export function reject(id: string): Application {
  const app = getApp(id);
  assertTransition(app.status, "rejected");
  app.status = "rejected";
  app.actors = app.actors.map((a) => (a.role === "dwo" ? { ...a, done: true } : a));
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}

export function crash(id: string) {
  const app = getApp(id);
  app.lastSavedAt = new Date().toISOString();
  saveApp(app);
  return {
    crashed: true as const,
    savedAt: app.lastSavedAt,
    messageHi: "सर्वर व्यस्त है। आपका फॉर्म सेव है।",
    messageEn: "Server busy. Your form is saved.",
  };
}

export function pingClerk(id: string): Application {
  const app = getApp(id);
  if (app.status !== "institute") {
    throw Object.assign(new Error("ping only while the file is at the institute"), { status: 409 });
  }
  // The wait is real. A reminder is recorded; it does not reset the clock.
  app.nudgeSentAt = new Date().toISOString();
  return saveApp(app);
}

export function raiseFeeDispute(id: string, note: string): Application {
  const app = getApp(id);
  if (!["draft", "review", "institute"].includes(app.status)) {
    throw Object.assign(new Error("fee dispute only before the DWO stage"), { status: 409 });
  }
  app.feeDispute = true;
  app.feeDisputeNote = note.slice(0, 200);
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}
```

- [ ] **Step 4: `npm test` — PASS**
- [ ] **Step 5: Commit** `Add lock, institute attest, mock PFMS, and crash-keep-draft.`

---

### Task 6: Door resolver (replaces the eight logins)

**Files:** Modify `src/server/logic.ts`, `src/server/logic.test.ts`

**Interfaces:** `Studying`, `DoorInput`, `DoorResult`, `resolveDoor(input)`

`resolveDoor` **never** throws not-found and never returns a terminal "No Record Found." Every branch returns a named next action. School / Inter / Outside-State are `completable: false` plus an `alt` that continues as college — honest scope, not a fake school form.

`alt` is the recovery slot. It carries the *other* case the student might actually be: the real renewal when they filed a duplicate Fresh, the Fresh case when they are not sure whether last year's money arrived, the college case when they picked a track this prototype does not complete. Without it, the UI has to hardcode `/apply/app-amit`.

`gotLastYear` is a **tri-state**. "पता नहीं" is the honest answer for most students, and treating it as `false` would open Priya's Fresh case for a student who is actually Amit — the exact duplicate-OTR trap the product exists to prevent.

```ts
export type Studying = "9-10" | "11-12" | "college" | "outside";
export type GotLastYear = "yes" | "no" | "dunno";

export type DoorInput = {
  studying: Studying;
  firstYear: boolean;
  gotLastYear: GotLastYear;
};

export type DoorAlt = {
  appId: string;
  resumeCode: string;
  labelHi: string;
  labelEn: string;
} | null;

export type DoorResult = {
  completable: boolean;
  track: Track;
  cycle: Cycle;
  appId: string | null;
  resumeCode: string | null;
  otrs: string[];
  alt: DoorAlt;
  messageHi: string;
  messageEn: string;
};
```

- [ ] **Step 1: Failing tests**

```ts
import { resolveDoor } from "./logic";

test("the door never returns not-found", () => {
  isoStore();
  const school = resolveDoor({ studying: "9-10", firstYear: true, gotLastYear: "no" });
  assert.equal(school.completable, false);
  assert.equal(school.appId, null);
  assert.equal(school.alt?.appId, "app-priya"); // "continue as college"

  const amit = resolveDoor({ studying: "college", firstYear: false, gotLastYear: "yes" });
  assert.equal(amit.appId, "app-amit");
  assert.equal(amit.cycle, "renewal");

  const dup = resolveDoor({ studying: "college", firstYear: true, gotLastYear: "yes" });
  assert.equal(dup.appId, "app-amit-dup");
  assert.equal(dup.otrs.length, 2);
  assert.equal(dup.alt?.appId, "app-amit"); // the real renewal to open instead

  const fresh = resolveDoor({ studying: "college", firstYear: true, gotLastYear: "no" });
  assert.equal(fresh.appId, "app-priya");
});

test("'don't know' does not silently open a Fresh case for a renewal student", () => {
  isoStore();
  const later = resolveDoor({ studying: "college", firstYear: false, gotLastYear: "dunno" });
  assert.equal(later.cycle, "renewal");
  assert.equal(later.appId, "app-amit");
  assert.equal(later.alt?.appId, "app-priya");
});
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Append to `logic.ts`**

```ts
const SCOPE_HI =
  "यह प्रोटोटाइप दशमोत्तर (कॉलेज) तक चलाता है। स्कूल या दूसरे राज्य का फॉर्म यहाँ नकली नहीं बनाया गया।";
const SCOPE_EN =
  "This prototype completes the Dashmottar (college) journey. It does not fake a school or outside-state form.";

function altFor(id: "app-priya" | "app-amit", labelHi: string, labelEn: string): DoorAlt {
  const app = getApp(id);
  return { appId: app.id, resumeCode: app.resumeCode, labelHi, labelEn };
}

/**
 * ponytail: this resolver decides from the three answers alone — there is no
 * identity input, so it cannot look anybody up. The persona mapping below IS the
 * demo. Do not "fix" it into a database search: with three synthetic students a
 * search would 404, which is the exact failure the product exists to remove.
 * `docs/milegi-plan.md` and /limitations say this out loud.
 */
export function resolveDoor(input: DoorInput): DoorResult {
  const cycle: Cycle = input.firstYear ? "fresh" : "renewal";

  if (input.studying !== "college") {
    const track: Track =
      input.studying === "9-10" ? "prematric" : input.studying === "11-12" ? "inter" : "outside_state";
    return {
      completable: false,
      track,
      cycle,
      appId: null,
      resumeCode: null,
      otrs: [],
      alt: altFor("app-priya", "कॉलेज (दशमोत्तर) के रूप में जारी रखें", "Continue as college (Dashmottar)"),
      messageHi: SCOPE_HI,
      messageEn: SCOPE_EN,
    };
  }

  // First year of this course AND money last year on this course: the student
  // almost certainly minted a second OTR. Name both, point at the renewal.
  if (input.firstYear && input.gotLastYear === "yes") {
    const app = getApp("app-amit-dup");
    return {
      completable: true,
      track: "dashmottar",
      cycle: "fresh",
      appId: app.id,
      resumeCode: app.resumeCode,
      otrs: app.duplicateOtrs ?? [],
      alt: altFor("app-amit", "असली नवीनीकरण खोलें", "Open the real renewal"),
      messageHi: "इस आधार पर दो OTR मिले। नया Fresh मत बनाइए — नवीनीकरण खोलें।",
      messageEn: "Two OTRs on this Aadhaar. Do not file Fresh — open the renewal.",
    };
  }

  const asRenewal = !input.firstYear && input.gotLastYear !== "no";
  if (asRenewal) {
    const app = getApp("app-amit");
    const unsure = input.gotLastYear === "dunno";
    return {
      completable: true,
      track: "dashmottar",
      cycle: "renewal",
      appId: app.id,
      resumeCode: app.resumeCode,
      otrs: app.otr ? [app.otr] : [],
      alt: altFor("app-priya", "पिछले साल नहीं मिली थी — नया आवेदन खोलें", "Did not get it last year — open a fresh case"),
      messageHi: unsure
        ? "पक्का नहीं? हम नवीनीकरण से खोल रहे हैं — यही सुरक्षित है, क्योंकि दूसरा OTR बनाना दोनों आवेदन ब्लॉक करा देता है। (असली पोर्टल पर पुराना रजिस्ट्रेशन नंबर हाई स्कूल रोल नंबर से निकलता है।)"
        : "नवीनीकरण मिला। नया OTR न बनाएँ।",
      messageEn: unsure
        ? "Not sure? We are opening the renewal, which is the safe side: minting a second OTR blocks both applications. (On the real portal you recover last year's registration number using your high-school roll number.)"
        : "Renewal found. Do not mint a new OTR.",
    };
  }

  const app = getApp("app-priya");
  return {
    completable: true,
    track: "dashmottar",
    cycle: "fresh",
    appId: app.id,
    resumeCode: app.resumeCode,
    otrs: app.otr ? [app.otr] : [],
    alt: altFor("app-amit", "नहीं, मैं नवीनीकरण हूँ", "No, I am a renewal"),
    messageHi: "Fresh दशमोत्तर। OTR अभी बनाना है।",
    messageEn: "Fresh Dashmottar. The OTR still has to be minted.",
  };
}

/** One JSON shape for every app response. */
export function envelope(app: Application) {
  const pf = preflight(app);
  return {
    ok: true as const,
    prototype: true as const,
    app,
    blockers: pf.blockers,
    missing: reviewGaps(app),
    preflightOk: pf.ok,
    institute: getInstitute(app.instituteId),
  };
}

export { getAppByResume };
```

- [ ] **Step 4: `npm test` — PASS**
- [ ] **Step 5: Commit** `Resolve the eight Saksham doors without a dead end.`

---

### Task 7: HTTP routes

**Files:**
- Create: `src/app/api/apps/[id]/route.ts`, `src/app/api/apps/[id]/draft/route.ts`, `src/app/api/apps/[id]/[action]/route.ts`
- Create: `src/app/api/resolve/route.ts`, `src/app/api/resume/[code]/route.ts`, `src/app/api/seed/route.ts`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx` (stubs from Task 1 Step 6 are fine)

Envelope: `{ ok, prototype, app, blockers, missing, preflightOk, institute }` or `{ ok: false, prototype, error, blockers? }`. `blockers` is pre-flight; `missing` is `reviewGaps` (pre-flight plus form gaps). Always send both — the UI needs "what stops you now" and "what is still empty."

Every handler: `await hydrate()` first, `await persist()` before responding on anything that writes. GET handlers in the App Router are dynamic by default since Next 15, so no cache directives are needed.

| Method | Path | Body | Calls |
|---|---|---|---|
| GET | `/api/apps/[id]` | — | `envelope(getApp(id))` |
| PATCH | `/api/apps/[id]/draft` | partial Application | `patchDraft` |
| POST | `/api/apps/[id]/kyc` | — | `completeKyc` |
| POST | `/api/apps/[id]/open` | — | `openForm` |
| POST | `/api/apps/[id]/review` | — | `moveToReview` |
| POST | `/api/apps/[id]/lock` | — | `lock` |
| POST | `/api/apps/[id]/npci` | — | 400 ms delay then `retryNpci` |
| POST | `/api/apps/[id]/attest` | — | `attestInstitute` |
| POST | `/api/apps/[id]/pay` | — | `pay` |
| POST | `/api/apps/[id]/reject` | — | `reject` |
| POST | `/api/apps/[id]/crash` | — | `crash` |
| POST | `/api/apps/[id]/ping` | — | `pingClerk` |
| POST | `/api/apps/[id]/fee-dispute` | `{ note }` | `raiseFeeDispute` |
| POST | `/api/resolve` | `{ studying, firstYear, gotLastYear }` | `resolveDoor` |
| GET | `/api/resume/[code]` | — | `getAppByResume` |
| POST | `/api/seed` | — | `resetSeed` then return Priya |

`fee-dispute` lives inside `[action]`, not in its own file — one fewer route, one fewer thing to keep in sync. `POST /api/apps/[id]/draft` hits the static `draft` segment (PATCH only) and returns 405. That is correct; do not "fix" it.

- [ ] **Step 1: GET one app**

```ts
// src/app/api/apps/[id]/route.ts
import { NextResponse } from "next/server";
import { envelope, jsonError } from "@/server/logic";
import { getApp, hydrate } from "@/server/store";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await hydrate();
    const { id } = await ctx.params;
    return NextResponse.json(envelope(getApp(id)));
  } catch (err) {
    const { status, body } = jsonError(err);
    return NextResponse.json(body, { status });
  }
}
```

- [ ] **Step 2: PATCH the draft**

```ts
// src/app/api/apps/[id]/draft/route.ts
import { NextResponse } from "next/server";
import { envelope, jsonError, patchDraft } from "@/server/logic";
import { hydrate, persist } from "@/server/store";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await hydrate();
    const { id } = await ctx.params;
    const partial = await req.json();
    const app = patchDraft(id, partial);
    await persist();
    return NextResponse.json(envelope(app));
  } catch (err) {
    const { status, body } = jsonError(err);
    return NextResponse.json(body, { status });
  }
}
```

- [ ] **Step 3: The action switch**

```ts
// src/app/api/apps/[id]/[action]/route.ts
import { NextResponse } from "next/server";
import {
  attestInstitute,
  completeKyc,
  crash,
  envelope,
  jsonError,
  lock,
  moveToReview,
  openForm,
  pay,
  pingClerk,
  raiseFeeDispute,
  reject,
  retryNpci,
} from "@/server/logic";
import { getApp, hydrate, persist } from "@/server/store";
import type { Application } from "@/server/types";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; action: string }> },
) {
  try {
    await hydrate();
    const { id, action } = await ctx.params;
    let extra: Record<string, unknown> = {};
    let app: Application;

    if (action === "kyc") app = completeKyc(id);
    else if (action === "open") app = openForm(id);
    else if (action === "review") app = moveToReview(id);
    else if (action === "lock") app = lock(id);
    else if (action === "npci") {
      await new Promise((r) => setTimeout(r, 400)); // the hang students actually feel
      app = retryNpci(id);
    } else if (action === "attest") app = attestInstitute(id);
    else if (action === "pay") app = pay(id);
    else if (action === "reject") app = reject(id);
    else if (action === "ping") app = pingClerk(id);
    else if (action === "fee-dispute") {
      const body = (await req.json().catch(() => ({}))) as { note?: string };
      app = raiseFeeDispute(id, body.note ?? "रसीद मेल नहीं खाती");
    } else if (action === "crash") {
      extra = crash(id);
      app = getApp(id);
    } else {
      return NextResponse.json(
        { ok: false, prototype: true, error: "unknown action" },
        { status: 404 },
      );
    }

    await persist();
    return NextResponse.json({ ...envelope(app), ...extra });
  } catch (err) {
    const { status, body } = jsonError(err);
    return NextResponse.json(body, { status });
  }
}
```

- [ ] **Step 4: Door, resume, seed**

```ts
// src/app/api/resolve/route.ts
import { NextResponse } from "next/server";
import { jsonError, resolveDoor } from "@/server/logic";
import { hydrate } from "@/server/store";
import type { GotLastYear, Studying } from "@/server/logic";

const STUDYING: Studying[] = ["9-10", "11-12", "college", "outside"];
const GOT: GotLastYear[] = ["yes", "no", "dunno"];

export async function POST(req: Request) {
  try {
    await hydrate();
    const body = (await req.json()) as {
      studying?: Studying;
      firstYear?: boolean;
      gotLastYear?: GotLastYear;
    };
    if (!body.studying || !STUDYING.includes(body.studying)) {
      throw Object.assign(new Error("bad studying"), { status: 400 });
    }
    const gotLastYear = body.gotLastYear && GOT.includes(body.gotLastYear) ? body.gotLastYear : "dunno";
    const door = resolveDoor({
      studying: body.studying,
      firstYear: Boolean(body.firstYear),
      gotLastYear,
    });
    return NextResponse.json({ ok: true, prototype: true, ...door });
  } catch (err) {
    const { status, body } = jsonError(err);
    return NextResponse.json(body, { status });
  }
}
```

`Studying` and `GotLastYear` are exported from `logic.ts` (Task 6). If you prefer them in `types.ts`, move them there and fix the two imports — just pick one place.

```ts
// src/app/api/resume/[code]/route.ts
import { NextResponse } from "next/server";
import { envelope, jsonError } from "@/server/logic";
import { getAppByResume, hydrate } from "@/server/store";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    await hydrate();
    const { code } = await ctx.params;
    return NextResponse.json(envelope(getAppByResume(decodeURIComponent(code))));
  } catch (err) {
    const { status, body } = jsonError(err);
    return NextResponse.json(body, { status });
  }
}
```

```ts
// src/app/api/seed/route.ts
import { NextResponse } from "next/server";
import { envelope, jsonError } from "@/server/logic";
import { getApp, hydrate, persist, resetSeed } from "@/server/store";

export async function POST() {
  try {
    await hydrate();
    resetSeed();
    await persist();
    return NextResponse.json(envelope(getApp("app-priya")));
  } catch (err) {
    const { status, body } = jsonError(err);
    return NextResponse.json(body, { status });
  }
}
```

- [ ] **Step 5: Manual check**

```bash
npx next dev
```

```bash
curl -s localhost:3000/api/seed -X POST | head -c 400
curl -s localhost:3000/api/apps/app-priya | grep -o 'MLG-PRIYA'
curl -s localhost:3000/api/apps/app-priya | grep -o 'income_expired'
curl -s localhost:3000/api/resume/MLG-AMIT | grep -o 'अमित यादव'
curl -s localhost:3000/api/resolve -H 'content-type: application/json' \
  -d '{"studying":"college","firstYear":false,"gotLastYear":"yes"}'
curl -s localhost:3000/api/resolve -H 'content-type: application/json' \
  -d '{"studying":"9-10","firstYear":true,"gotLastYear":"no"}'
curl -s localhost:3000/api/apps/app-priya/crash -X POST >/dev/null
curl -s localhost:3000/api/apps/app-priya | grep -o 'प्रिया वर्मा'
```

Expected: Priya carries `MLG-PRIYA` and an `income_expired` blocker; college+renewal resolves to `app-amit`; class 9–10 returns `"completable":false` with an `alt`, and the word "not found" appears nowhere; crash did not wipe the record.

- [ ] **Step 6: Commit** `Expose the mock scholarship HTTP API.`

---

### Task 8: Neon when `DATABASE_URL` is set

**Files:** Modify `src/server/store.ts`, `package.json`

Tests and local dev are untouched: they set `MILEGI_STORE_PATH`, so `useNeon()` is false. Nothing in `logic.ts` changes — the whole Neon branch lives inside `hydrate()` and `persist()`.

Neon rules that matter:
- Use the **pooled** connection string (`-pooler` in the hostname) in `DATABASE_URL`. The direct string is for migrations only, and we have no migrations. <https://neon.com/docs/connect/choose-connection>
- `@neondatabase/serverless`'s `neon()` speaks HTTP, one statement per round trip, no connection to keep alive. That is why there is no `Pool`, no `end()`, and no cold-start connection dance. <https://neon.com/docs/guides/nextjs>
- Two tables, `JSONB` payload, no ORM, no separate `.sql` file (a `.sql` read from disk is not reliably included in a Vercel function bundle).

```bash
npm install @neondatabase/serverless
```

```ts
// add to src/server/store.ts
let schemaReady = false;

async function sql() {
  const { neon } = await import("@neondatabase/serverless");
  return neon(process.env.DATABASE_URL as string);
}

async function ensureSchema() {
  if (schemaReady) return;
  const q = await sql();
  await q`CREATE TABLE IF NOT EXISTS apps (id TEXT PRIMARY KEY, payload JSONB NOT NULL)`;
  await q`CREATE TABLE IF NOT EXISTS institutes (id TEXT PRIMARY KEY, payload JSONB NOT NULL)`;
  schemaReady = true;
}

// ponytail: every request loads every row. Three personas and two institutes, so
// this is two round trips, and it means the whole domain layer stays synchronous.
// Ceiling: a few hundred rows. Upgrade path: fetch by id and add a version column.
async function neonLoad() {
  await ensureSchema();
  const q = await sql();
  const apps = (await q`SELECT payload FROM apps`) as { payload: Application }[];
  const institutes = (await q`SELECT payload FROM institutes`) as { payload: Institute }[];
  const m = mem();
  m.apps = apps.map((r) => r.payload);
  m.institutes = institutes.map((r) => r.payload);
  m.dirty.clear();
  if (m.apps.length < 3 || m.institutes.length < 2) {
    resetSeed();      // marks everything dirty
    await neonFlush();
  }
}

async function neonFlush() {
  const m = mem();
  if (!m.dirty.size) return;
  const q = await sql();
  for (const app of m.apps) {
    if (!m.dirty.has(app.id)) continue;
    await q`INSERT INTO apps (id, payload) VALUES (${app.id}, ${JSON.stringify(app)}::jsonb)
            ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`;
  }
  for (const inst of m.institutes) {
    if (!m.dirty.has(`inst:${inst.id}`)) continue;
    await q`INSERT INTO institutes (id, payload) VALUES (${inst.id}, ${JSON.stringify(inst)}::jsonb)
            ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`;
  }
  m.dirty.clear();
}
```

Then swap the two seam functions:

```ts
export async function hydrate(): Promise<void> {
  if (useNeon()) {
    await neonLoad();
    return;
  }
  if (process.env.VERCEL && !process.env.MILEGI_ALLOW_EPHEMERAL) {
    throw Object.assign(
      new Error(
        "DATABASE_URL is not set. Production must use Neon or resume codes die between requests. " +
          "Set DATABASE_URL, or set MILEGI_ALLOW_EPHEMERAL=1 to accept an in-memory smoke deploy.",
      ),
      { status: 503 },
    );
  }
  if (!mem().apps.length) readFileStore();
  if (!mem().apps.length || !mem().institutes.length) resetSeed();
}

export async function persist(): Promise<void> {
  if (useNeon()) {
    await neonFlush();
    return;
  }
  mem().dirty.clear();
}
```

Rules this encodes, once, so nobody has to guess later:

- Neon wins whenever `DATABASE_URL` is set and `MILEGI_STORE_PATH` is not. Production **always** Neon.
- On Vercel with no `DATABASE_URL` the API returns 503 with a readable message instead of quietly serving a per-instance in-memory store. `MILEGI_ALLOW_EPHEMERAL=1` is the deliberate opt-out for a first smoke deploy before the Neon project exists.
- Vercel must have `DATABASE_URL` set and must **not** have `MILEGI_STORE_PATH` set.
- Never connect to Neon during `npm test`.

- [ ] **Step 1: Add the dependency and the Neon branch**
- [ ] **Step 2: `npm test` — still PASS with no `DATABASE_URL`**
- [ ] **Step 3: `npm run build` — still passes (the dynamic import must not break the build)**
- [ ] **Step 4: If a Neon project exists, `DATABASE_URL=… npx next dev`, then `POST /api/seed` and `GET /api/apps/app-priya`. Restart the server and confirm the case survives. Skip if there is no project yet.**
- [ ] **Step 5: Commit** `Persist scholarship cases to Neon when configured.`

---

### Task 9: README for judges

Do this **last**. No earlier phase's done-check depends on it.

```md
# Milegi

Independent hackathon prototype of a UP Saksham scholarship **case file**. Mock data. Not a government site.

The form is intake. The product is `/status/[id]`.

## Run

    npm install
    npm test
    npm run dev

## Demo

1. प्रिया (Fresh दशमोत्तर): expired income cert → NPCI retry → short form with no fee box → crash → recover → lock → case page → `/institute/app-priya` attest → pay
2. अमित (Renewal): the door recovers the OTR → marks only → lock → named clerk, 12 days → nudge
3. गलत Fresh: the door names both OTRs and points at the renewal (`MLG-DUP`)
4. Reopen in another browser: `/r/MLG-PRIYA` (needs `DATABASE_URL`)

Reset the personas: `POST /api/seed`

## Store

- `npm test` and local dev: JSON file under the OS temp dir (`MILEGI_STORE_PATH`)
- Production: Neon (`DATABASE_URL`, pooled) so resume codes survive Vercel. With no `DATABASE_URL` on Vercel the API fails loudly rather than pretending to remember.

## What is mocked

OTP, DigiLocker/OTR, e-District income and caste verification, NPCI/Aadhaar-DBT, the affiliating university step, PFMS. See `/limitations`.

## Codex

Cursor wrote `src/server` and the case page. Codex (ChatGPT Go) wrote the volume UI. Split and commit trail: `docs/superpowers/plans/2026-08-20-milegi-build-order.md`.
```

- [ ] **Step 1: Write `README.md`**
- [ ] **Step 2: Commit** `Add judge-facing README.`

---

## Self-review

- Linear: no task builds something a later task deletes. No `createApp`, no `POST /api/apps`, no `feeIncludesHostel`, no student-typed fee anywhere in this file.
- The student cannot PATCH tuition; `openForm` copies the institute master.
- `POST /api/resolve` never returns a terminal not-found. School / Inter / Outside-State are `completable: false` with an `alt`. "पता नहीं" resolves to the renewal, the safe side.
- Lock sets `hardCopyDueAt`; attest does not clear it; a nudge does not reset the wait.
- `store.ts` does not import `logic.ts`. `getAppByResume` is a store lookup.
- Domain code is synchronous; Neon lives behind `hydrate` / `persist`.
- Tests use the JSON store; Neon only when `DATABASE_URL` is set and `MILEGI_STORE_PATH` is not; Vercel without `DATABASE_URL` fails loudly.
- `await params` everywhere. No ORM, no Express, no live Aadhaar, no bank fields, no runtime LLM.
