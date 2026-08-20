import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __resetForTests, hydrate, reseed } from "./store";
import { blockers, runPreflight, type PreflightCtx } from "./preflight";

process.env.MILEGI_STORE_PATH = `${process.env.TMPDIR || "/tmp"}/milegi-store-test.json`;

const CTX: PreflightCtx = {
  track: "dashmottar",
  cycle: "renewal",
  category: "obc",
  instituteId: "inst-csjmu-arts",
  courseCode: "BSC",
  annualIncome: 96000,
  incomeCertNo: "IC-2024-771201",
  incomeAppNo: "APP-2024-771201",
  casteCertNo: "CC-2019-118834",
  casteAppNo: "APP-2019-118834",
  aadhaarDemo: "000012340001",
  otr: "UP26-8123456789",
  duplicateOtrs: [],
  hosteller: false,
  previousResult: "passed",
};

beforeEach(async () => {
  __resetForTests();
  await hydrate();
  reseed();
});

test("a clean renewal produces no blockers and reports every rule, not just failures", () => {
  const items = runPreflight(CTX);
  assert.deepEqual(blockers(items), []);
  assert.ok(items.length >= 10, `expected >=10 items, got ${items.length}`);
});

test("an income certificate expiring before the payment window is a blocker, with both dates", () => {
  const items = runPreflight({
    ...CTX,
    incomeCertNo: "IC-2021-330077",
    incomeAppNo: "APP-2021-330077",
  });
  const found = items.find((i) => i.id === "income_certificate")!;
  assert.equal(found.state, "blocked");
  assert.match(found.detailHi, /2024/);
  assert.equal(found.fixedBy, "revenue_office");
  assert.ok(found.etaHi);
});

test("income above the category cap is a blocker showing the cap, its source and the disagreement", () => {
  const found = runPreflight({ ...CTX, annualIncome: 260000 }).find(
    (i) => i.id === "category_income_cap",
  )!;
  assert.equal(found.state, "blocked");
  assert.match(found.detailHi, /2,00,000/);
  assert.ok(found.source);
  assert.match(found.detailHi, /मेल नहीं खाते/);
});

test("an unpublished course blocks, names the institute as the fixer, and gives a sentence to say", () => {
  const found = runPreflight({ ...CTX, courseCode: "BED" }).find((i) => i.id === "course_published")!;
  assert.equal(found.state, "blocked");
  assert.equal(found.fixedBy, "institute");
  assert.match(found.actionHi!, /मास्टर डेटा/);
});

test("an unseeded bank account warns but never blocks the application", () => {
  const found = runPreflight({ ...CTX, aadhaarDemo: "000012340002" }).find(
    (i) => i.id === "dbt_seeding",
  )!;
  assert.equal(found.state, "warn");
  assert.equal(found.fixedBy, "bank");
});

test("a recorded duplicate OTR is surfaced as a warning naming both numbers", () => {
  const found = runPreflight({ ...CTX, duplicateOtrs: ["UP26-8999999999"] }).find(
    (i) => i.id === "duplicate_otr",
  )!;
  assert.equal(found.state, "warn");
  assert.match(found.detailHi, /UP26-8999999999/);
});

test("a failed previous year blocks a renewal", () => {
  const found = runPreflight({ ...CTX, previousResult: "failed" }).find(
    (i) => i.id === "previous_result",
  )!;
  assert.equal(found.state, "blocked");
});

test("a closed application window is a blocker naming the date that passed", () => {
  const found = runPreflight({ ...CTX, todayOverride: "2026-11-01T00:00:00.000Z" }).find(
    (i) => i.id === "window_open",
  )!;
  assert.equal(found.state, "blocked");
  assert.match(found.detailHi, /15 अक्तू 2026/);
});

test("a window that has not opened warns and invites preparation instead of blocking", () => {
  const found = runPreflight({ ...CTX, todayOverride: "2026-08-20T00:00:00.000Z" }).find(
    (i) => i.id === "window_open",
  )!;
  assert.equal(found.state, "warn");
  assert.match(found.detailHi, /15 सित 2026/);
});

test("an upstream outage yields state unknown, never a fake pass", () => {
  const found = runPreflight({ ...CTX, simulateEdistrictDown: true }).find(
    (i) => i.id === "income_certificate",
  )!;
  assert.equal(found.state, "unknown");
  assert.match(found.detailHi, /जवाब नहीं/);
});

test("general category is not asked for a caste certificate", () => {
  const items = runPreflight({ ...CTX, category: "general" });
  assert.equal(
    items.some((i) => i.id === "caste_certificate"),
    false,
  );
});
