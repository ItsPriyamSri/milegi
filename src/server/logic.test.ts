import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  attestInstitute,
  canTransition,
  completeKyc,
  crash,
  incomeCap,
  incomeExpired,
  lock,
  moveToReview,
  openForm,
  patchDraft,
  pay,
  pingClerk,
  preflight,
  raiseFeeDispute,
  reject,
  resolveDoor,
  retryNpci,
  reviewGaps,
} from "./logic";
import { getApp, getAppByResume, getInstitute, resetSeed, saveApp } from "./store";

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
