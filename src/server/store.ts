import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { AMIT_OTR, DUP_OTR, mintOtr, normalizeResume } from "@/lib/demoCodes";
import type { Application, Institute } from "./types";

export { AMIT_OTR, DUP_OTR, mintOtr, normalizeResume };

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
  writeFileSync(/* turbopackIgnore: true */ tmp, JSON.stringify({ apps, institutes }, null, 2));
  renameSync(tmp, path);
}

function readFileStore() {
  if (useNeon() || process.env.VERCEL) return;
  try {
    const raw = JSON.parse(readFileSync(/* turbopackIgnore: true */ storePath(), "utf8")) as {
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
  const needle = normalizeResume(code);
  const app = mem().apps.find((a) => {
    if (normalizeResume(a.resumeCode) === needle) return true;
    if (a.otr && normalizeResume(a.otr) === needle) return true;
    if (a.registrationNo && a.registrationNo === needle) return true;
    return false;
  });
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
    otr: AMIT_OTR,
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
    otr: DUP_OTR,
    registrationNo: sessionReg("app-amit-dup"),
    instituteId: "inst-csjmu-bsc",
    incomeIssuedOn: yearsAgo(1),
    npci: "ok",
    duplicateOtrs: [AMIT_OTR, DUP_OTR],
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
    resetSeed();
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

/**
 * Load a snapshot into memory. Every route handler awaits this first.
 */
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

/** Flush writes. Neon upserts dirty rows; JSON already wrote in saveApp. */
export async function persist(): Promise<void> {
  if (useNeon()) {
    await neonFlush();
    return;
  }
  mem().dirty.clear();
}
