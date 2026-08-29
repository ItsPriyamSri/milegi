import fs from "node:fs";
import path from "node:path";
import type { Case, Institute, Notification, Profile, SimConfig } from "./types";
import { setClockOffset } from "./clock";
import { SEED_CASES, SEED_INSTITUTES, SEED_PROFILES } from "./seeds";

type Snapshot = {
  profiles: Record<string, Profile>;
  cases: Record<string, Case>;
  institutes: Record<string, Institute>;
  notifications: Record<string, Notification>;
  sim: SimConfig;
  seq: number;
};

// Next can load this module twice (RSC vs Route). Module locals then diverge: API
// persist writes the file, the track page still has the old snap and 404s a live OTR.
type Bag = { snap: Snapshot | null; dirty: boolean; fileMtime: number };
function bag(): Bag {
  const g = globalThis as typeof globalThis & { __milegiStore?: Bag };
  if (!g.__milegiStore) g.__milegiStore = { snap: null, dirty: false, fileMtime: 0 };
  return g.__milegiStore;
}

export const DEFAULT_SIM: SimConfig = {
  clockOffsetDays: 0,
  upstream: {
    ekyc: { health: "up", failureRate: 0 },
    digilocker: { health: "up", failureRate: 0 },
    edistrict: { health: "up", failureRate: 0 },
    boards: { health: "up", failureRate: 0 },
    npci: { health: "up", failureRate: 0 },
    pfms: { health: "up", failureRate: 0 },
  },
  forcedPfmsOutcome: null,
  outageLog: [],
  otpFor: {},
};

/** Scoped under cwd so Turbopack can see the store is not the whole project tree. */
function storePath(): string {
  return process.env.MILEGI_STORE_PATH || path.join(process.cwd(), ".data", "milegi-store.json");
}

function emptySnapshot(): Snapshot {
  return {
    profiles: {},
    cases: {},
    institutes: {},
    notifications: {},
    sim: structuredClone(DEFAULT_SIM),
    seq: 136,
  };
}

function seedCatalog(s: Snapshot): void {
  for (const inst of SEED_INSTITUTES) {
    const copy = structuredClone(inst);
    if (JSON.stringify(s.institutes[inst.id]) !== JSON.stringify(copy)) {
      s.institutes[inst.id] = copy;
      bag().dirty = true;
    }
  }
  // Demo people leak into unit tests (shared cert numbers, extra PFMS cases).
  if (process.env.NODE_TEST_CONTEXT) return;
  // Always refresh the printed how-to-try identities. Insert-if-missing left Neon
  // on the old OTR/reg shapes, so live /t/UP26-8000100001 404'd after a code deploy.
  for (const p of SEED_PROFILES) {
    const copy = structuredClone(p);
    if (JSON.stringify(s.profiles[p.id]) !== JSON.stringify(copy)) {
      s.profiles[p.id] = copy;
      bag().dirty = true;
    }
  }
  for (const c of SEED_CASES) {
    const copy = structuredClone(c);
    if (JSON.stringify(s.cases[c.id]) !== JSON.stringify(copy)) {
      s.cases[c.id] = copy;
      bag().dirty = true;
    }
  }
}

export function reseed(): void {
  const s = emptySnapshot();
  seedCatalog(s);
  const b = bag();
  b.snap = s;
  b.dirty = true;
  setClockOffset(0);
}

export function __resetForTests(): void {
  const b = bag();
  b.snap = null;
  b.dirty = false;
  b.fileMtime = 0;
}

export function useNeon(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

const SCHEMA = `CREATE TABLE IF NOT EXISTS records (
  kind text NOT NULL,
  id text NOT NULL,
  payload jsonb NOT NULL,
  version integer NOT NULL DEFAULT 1,
  PRIMARY KEY (kind, id))`;

async function neonSql() {
  const { neon } = await import("@neondatabase/serverless");
  return neon(process.env.DATABASE_URL as string);
}

async function hydrateFromNeon(): Promise<void> {
  const sql = await neonSql();
  await sql.query(SCHEMA);
  const rows = (await sql`SELECT kind, id, payload FROM records`) as unknown as {
    kind: string;
    id: string;
    payload: unknown;
  }[];
  const s = emptySnapshot();
  for (const r of rows) {
    if (r.kind === "profile") s.profiles[r.id] = r.payload as Profile;
    else if (r.kind === "case") s.cases[r.id] = r.payload as Case;
    else if (r.kind === "institute") s.institutes[r.id] = r.payload as Institute;
    else if (r.kind === "notification") s.notifications[r.id] = r.payload as Notification;
    else if (r.kind === "config" && r.id === "sim") s.sim = { ...DEFAULT_SIM, ...(r.payload as SimConfig) };
    else if (r.kind === "config" && r.id === "seq") s.seq = (r.payload as { seq: number }).seq;
  }
  seedCatalog(s);
  bag().snap = s;
}

async function persistToNeon(): Promise<void> {
  const sql = await neonSql();
  const s = db();
  const rows: [string, string, unknown][] = [
    ...Object.entries(s.profiles).map(([id, v]) => ["profile", id, v] as [string, string, unknown]),
    ...Object.entries(s.cases).map(([id, v]) => ["case", id, v] as [string, string, unknown]),
    ...Object.entries(s.institutes).map(([id, v]) => ["institute", id, v] as [string, string, unknown]),
    ...Object.entries(s.notifications).map(
      ([id, v]) => ["notification", id, v] as [string, string, unknown],
    ),
    ["config", "sim", s.sim],
    ["config", "seq", { seq: s.seq }],
  ];
  for (const [kind, id, payload] of rows) {
    await sql`INSERT INTO records (kind, id, payload)
      VALUES (${kind}, ${id}, ${JSON.stringify(payload)}::jsonb)
      ON CONFLICT (kind, id) DO UPDATE
      SET payload = EXCLUDED.payload, version = records.version + 1`;
  }
}

function fileMtimeMs(): number {
  try {
    return fs.statSync(/* turbopackIgnore: true */ storePath()).mtimeMs;
  } catch {
    return 0;
  }
}

function loadFromFile(): boolean {
  try {
    const parsed = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ storePath(), "utf8")) as Snapshot;
    const next = { ...emptySnapshot(), ...parsed, sim: { ...DEFAULT_SIM, ...parsed.sim } };
    seedCatalog(next);
    const b = bag();
    b.snap = next;
    b.fileMtime = fileMtimeMs();
    return true;
  } catch {
    return false;
  }
}

export async function hydrate(): Promise<void> {
  const b = bag();
  if (useNeon()) {
    if (b.snap) {
      setClockOffset(b.snap.sim.clockOffsetDays);
      return;
    }
    await hydrateFromNeon();
    setClockOffset(b.snap!.sim.clockOffsetDays);
    return;
  }
  const mtime = fileMtimeMs();
  if (b.snap && b.dirty) {
    seedCatalog(b.snap);
    setClockOffset(b.snap.sim.clockOffsetDays);
    return;
  }
  if (b.snap && mtime === b.fileMtime) {
    seedCatalog(b.snap);
    setClockOffset(b.snap.sim.clockOffsetDays);
    return;
  }
  if (!loadFromFile()) {
    if (!b.snap) reseed();
  }
  seedCatalog(b.snap!);
  setClockOffset(b.snap!.sim.clockOffsetDays);
}

// ponytail: whole-snapshot write, last-write-wins. Ceiling is a demo-sized store; the upgrade path is
// a dirty-id set plus the version column that already exists on `records`.
export async function persist(): Promise<void> {
  const b = bag();
  if (!b.snap || !b.dirty) return;
  if (useNeon()) {
    await persistToNeon();
  } else {
    const file = storePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(/* turbopackIgnore: true */ file, JSON.stringify(b.snap), "utf8");
    b.fileMtime = fileMtimeMs();
  }
  b.dirty = false;
}

function db(): Snapshot {
  const snap = bag().snap;
  if (!snap) throw new Error("store not hydrated — call await hydrate() first");
  return snap;
}

export function getCase(id: string): Case | undefined {
  return db().cases[id];
}
export function putCase(c: Case): void {
  db().cases[c.id] = c;
  bag().dirty = true;
}
export function allCases(): Case[] {
  return Object.values(db().cases);
}
export function casesForProfile(profileId: string): Case[] {
  return allCases()
    .filter((c) => c.profileId === profileId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function getProfile(id: string): Profile | undefined {
  return db().profiles[id];
}
export function putProfile(p: Profile): void {
  db().profiles[p.id] = p;
  bag().dirty = true;
}
export function findProfileByMobile(mobile: string): Profile | undefined {
  return Object.values(db().profiles).find((p) => p.mobile === mobile);
}
export function findProfileByAadhaar(aadhaarDemo: string): Profile | undefined {
  return Object.values(db().profiles).find((p) => p.aadhaarDemo === aadhaarDemo);
}
export function findProfileByOtr(otr: string): Profile | undefined {
  const n = otr.trim().replace(/\s+/g, "").toUpperCase();
  return Object.values(db().profiles).find((p) => p.otr.toUpperCase() === n);
}
export function findCaseByRegistrationNo(registrationNo: string): Case | undefined {
  const n = registrationNo.trim();
  if (!n) return undefined;
  return Object.values(db().cases).find((c) => c.registrationNo === n);
}
export function getInstitute(id: string): Institute | undefined {
  return db().institutes[id];
}
export function allInstitutes(): Institute[] {
  return Object.values(db().institutes);
}
export function putInstitute(i: Institute): void {
  db().institutes[i.id] = i;
  bag().dirty = true;
}
export function putNotification(n: Notification): void {
  db().notifications[n.id] = n;
  bag().dirty = true;
}
export function notificationsFor(caseId: string): Notification[] {
  return Object.values(db().notifications)
    .filter((n) => n.caseId === caseId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export function getSim(): SimConfig {
  return db().sim;
}
export function putSim(s: SimConfig): void {
  db().sim = s;
  bag().dirty = true;
}
export function markDirty(): void {
  bag().dirty = true;
}
export function nextCaseId(): string {
  const s = db();
  s.seq += 1;
  bag().dirty = true;
  return `MLG-26-${String(s.seq).padStart(6, "0")}`;
}
