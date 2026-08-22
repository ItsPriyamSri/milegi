import fs from "node:fs";
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

function seedInstitutes(s: Snapshot): void {
  for (const inst of SEED_INSTITUTES) s.institutes[inst.id] = structuredClone(inst);
}

export function reseed(): void {
  const s = emptySnapshot();
  seedInstitutes(s);
  snap = s;
  setClockOffset(0);
  dirty = true;
}

export function __resetForTests(): void {
  snap = null;
  dirty = false;
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
  if (Object.keys(s.institutes).length === 0) {
    seedInstitutes(s);
    dirty = true;
  }
  snap = s;
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

export async function hydrate(): Promise<void> {
  if (snap) {
    setClockOffset(snap.sim.clockOffsetDays);
    return;
  }
  if (useNeon()) {
    await hydrateFromNeon();
  } else {
    try {
      // turbopackIgnore: path may be env-overridden; store is demo-sized JSON only.
      const parsed = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ storePath(), "utf8")) as Snapshot;
      snap = { ...emptySnapshot(), ...parsed, sim: { ...DEFAULT_SIM, ...parsed.sim } };
    } catch {
      reseed();
    }
  }
  setClockOffset(snap!.sim.clockOffsetDays);
}

// ponytail: whole-snapshot write, last-write-wins. Ceiling is a demo-sized store; the upgrade path is
// a dirty-id set plus the version column that already exists on `records`.
export async function persist(): Promise<void> {
  if (!snap || !dirty) return;
  if (useNeon()) {
    await persistToNeon();
  } else {
    const file = storePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(/* turbopackIgnore: true */ file, JSON.stringify(snap), "utf8");
  }
  dirty = false;
}

function db(): Snapshot {
  if (!snap) throw new Error("store not hydrated — call await hydrate() first");
  return snap;
}

export function getCase(id: string): Case | undefined {
  return db().cases[id];
}
export function putCase(c: Case): void {
  db().cases[c.id] = c;
  dirty = true;
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
  dirty = true;
}
export function findProfileByMobile(mobile: string): Profile | undefined {
  return Object.values(db().profiles).find((p) => p.mobile === mobile);
}
export function findProfileByAadhaar(aadhaarDemo: string): Profile | undefined {
  return Object.values(db().profiles).find((p) => p.aadhaarDemo === aadhaarDemo);
}
export function getInstitute(id: string): Institute | undefined {
  return db().institutes[id];
}
export function allInstitutes(): Institute[] {
  return Object.values(db().institutes);
}
export function putInstitute(i: Institute): void {
  db().institutes[i.id] = i;
  dirty = true;
}
export function putNotification(n: Notification): void {
  db().notifications[n.id] = n;
  dirty = true;
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
  dirty = true;
}
export function markDirty(): void {
  dirty = true;
}
export function nextCaseId(): string {
  const s = db();
  s.seq += 1;
  dirty = true;
  return `MLG-26-${String(s.seq).padStart(6, "0")}`;
}
