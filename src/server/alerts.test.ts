import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __resetForTests, hydrate, notificationsFor, reseed } from "./store";
import { addDays, iso } from "./clock";
import { deriveAlerts, escalate, nudge } from "./alerts";
import { STUDENT_ACTOR, transition } from "./machine";
import { makeDraftCase } from "./testkit";

process.env.MILEGI_STORE_PATH = `${process.env.TMPDIR || "/tmp"}/milegi-store-test.json`;

beforeEach(async () => {
  __resetForTests();
  await hydrate();
  reseed();
});

test("a hard copy due in two days is an info alert with its date", () => {
  const c = transition(makeDraftCase(), "institute_review", STUDENT_ACTOR);
  const a = deriveAlerts(c, addDays(c.stageEnteredAt, 1)).find((x) => x.kind === "hardcopy_due")!;
  assert.equal(a.severity, "info");
  assert.equal(a.dueAt, c.hardCopy.dueAt);
  assert.ok(a.actionHi);
});

test("an overdue hard copy is a danger alert", () => {
  const c = transition(makeDraftCase(), "institute_review", STUDENT_ACTOR);
  const a = deriveAlerts(c, addDays(c.stageEnteredAt, 5)).find(
    (x) => x.kind === "hardcopy_overdue",
  )!;
  assert.equal(a.severity, "danger");
});

test("a stage past its deadline produces a breach alert naming the owner and the days", () => {
  const c = transition(makeDraftCase(), "institute_review", STUDENT_ACTOR);
  const a = deriveAlerts(c, addDays(c.dueAt!, 4)).find((x) => x.kind === "stage_breach")!;
  assert.equal(a.severity, "danger");
  assert.match(a.detailHi, /श्री आर\. के\. वर्मा/);
  assert.match(a.detailHi, /4 दिन/);
});

test("escalate records an escalation, writes an outbox message, and does not reset the wait", () => {
  let c = transition(makeDraftCase(), "institute_review", STUDENT_ACTOR);
  const stageEnteredAt = c.stageEnteredAt;
  c = escalate({ ...c, dueAt: addDays(iso(), -4) });
  assert.equal(c.escalations.length, 1);
  assert.ok(c.escalations[0].breachDays >= 4);
  assert.equal(c.stageEnteredAt, stageEnteredAt, "escalation must not restart the clock");
  assert.equal(c.events[c.events.length - 1].type, "escalated");
  assert.ok(notificationsFor(c.id).length >= 1);
});

test("escalate is idempotent within the same breach day", () => {
  let c = transition(makeDraftCase(), "institute_review", STUDENT_ACTOR);
  c = { ...c, dueAt: addDays(iso(), -4) };
  c = escalate(c);
  c = escalate(c);
  assert.equal(c.escalations.length, 1);
});

test("a nudge is recorded without touching the wait counter", () => {
  let c = transition(makeDraftCase(), "institute_review", STUDENT_ACTOR);
  const before = c.stageEnteredAt;
  c = nudge(c, STUDENT_ACTOR);
  assert.equal(c.stageEnteredAt, before);
  assert.equal(c.events[c.events.length - 1].type, "nudge_sent");
});

test("a correction window that has not opened says when it opens instead of demanding action now", () => {
  let c = transition(makeDraftCase(), "institute_review", STUDENT_ACTOR);
  c = transition(c, "university_scrutiny", c.owner!);
  c = transition(c, "dwo_review", c.owner!);
  c = { ...c, flags: [{ code: "ENROLMENT_MISMATCH", at: iso(), by: c.owner! }] };
  c = transition(c, "correction_required", c.owner!, { reasonCode: "ENROLMENT_MISMATCH" });
  const a = deriveAlerts(c, "2026-11-01T00:00:00.000Z").find((x) => x.kind === "correction_opens")!;
  assert.match(a.titleHi, /21 नव/);
  assert.match(a.detailHi, /20 दिस/);
  assert.equal(a.severity, "info");
});

test("an estimate note is always present so no screen shows a bare number", () => {
  assert.ok(deriveAlerts(makeDraftCase(), iso()).some((a) => a.kind === "estimate_note"));
});

test("a payment failure produces an actionable alert with the bank step", () => {
  const c = makeDraftCase({
    stage: "payment_failed",
    owner: STUDENT_ACTOR,
    dueAt: addDays(iso(), 15),
    payment: { status: "rejected_not_seeded", failureCode: "NPCI_NOT_SEEDED" },
  });
  const a = deriveAlerts(c, iso()).find((x) => x.kind === "payment_action_needed")!;
  assert.match(a.actionHi!, /NPCI|DBT/);
});
