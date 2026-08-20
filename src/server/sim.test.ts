import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __resetForTests, allCases, getSim, hydrate, putCase, reseed } from "./store";
import { advanceDays, runPayments, setUpstream } from "./sim";
import { STUDENT_ACTOR, transition } from "./machine";
import { makeDraftCase } from "./testkit";

process.env.MILEGI_STORE_PATH = `${process.env.TMPDIR || "/tmp"}/milegi-store-test.json`;

beforeEach(async () => {
  __resetForTests();
  await hydrate();
  reseed();
});

test("advancing the clock escalates a breached stage and reports what it did", () => {
  putCase(transition(makeDraftCase(), "institute_review", STUDENT_ACTOR));
  const report = advanceDays(20);
  assert.equal(getSim().clockOffsetDays, 20);
  assert.ok(report.escalated.length >= 1);
  assert.ok(allCases()[0].escalations.length >= 1);
});

test("advancing the clock auto-advances university scrutiny past its SLA, with a disclosure event", () => {
  let c = transition(makeDraftCase(), "institute_review", STUDENT_ACTOR);
  c = transition(c, "university_scrutiny", c.owner!);
  putCase(c);
  const report = advanceDays(30);
  assert.ok(report.autoAdvanced.includes(c.id));
  const after = allCases()[0];
  assert.equal(after.stage, "dwo_review");
  assert.ok(after.events.some((e) => e.type === "auto_forwarded"));
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

test("running payments moves each case and records the bank outcome", () => {
  let c = transition(makeDraftCase(), "institute_review", STUDENT_ACTOR);
  c = transition(c, "university_scrutiny", c.owner!);
  c = transition(c, "dwo_review", c.owner!);
  c = transition(c, "sanctioned", c.owner!);
  c = transition(c, "pfms_processing", c.owner!);
  putCase(c);
  const { rows } = runPayments();
  assert.equal(rows.length, 1);
  const after = allCases()[0];
  assert.ok(["paid", "payment_failed"].includes(after.stage));
  assert.ok(after.payment.status);
});
