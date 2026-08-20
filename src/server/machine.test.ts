import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __resetForTests, hydrate, reseed } from "./store";
import { isTerminal, transition, STUDENT_ACTOR } from "./machine";
import { makeDraftCase } from "./testkit";

process.env.MILEGI_STORE_PATH = `${process.env.TMPDIR || "/tmp"}/milegi-store-test.json`;

beforeEach(async () => {
  __resetForTests();
  await hydrate();
  reseed();
});

test("a locked case is owned by the named institute clerk with a deadline", () => {
  const c = transition(makeDraftCase(), "institute_review", STUDENT_ACTOR);
  assert.equal(c.stage, "institute_review");
  assert.equal(c.owner?.role, "institute");
  assert.equal(c.owner?.nameHi, "श्री आर. के. वर्मा");
  assert.ok(c.dueAt, "institute_review must have a deadline");
  assert.ok(c.hardCopy.dueAt, "locking starts the 3-day hard-copy clock");
});

test("terminal stages have no owner and no deadline", () => {
  let c = makeDraftCase();
  c = transition(c, "institute_review", STUDENT_ACTOR);
  c = transition(c, "university_scrutiny", c.owner!);
  c = transition(c, "dwo_review", c.owner!);
  c = transition(c, "rejected", c.owner!, { reasonCode: "ATTENDANCE_BELOW_75" });
  assert.equal(c.stage, "rejected");
  assert.equal(c.owner, null);
  assert.equal(c.dueAt, null);
  assert.ok(isTerminal("rejected"));
});

test("an illegal transition throws instead of silently moving the file", () => {
  assert.throws(
    () =>
      transition(makeDraftCase(), "paid", {
        role: "dwo",
        nameHi: "x",
        designationHi: "y",
        orgHi: "z",
      }),
    /not allowed/,
  );
});

test("every transition appends exactly one event with an actor and a Hindi summary", () => {
  const c = transition(makeDraftCase(), "institute_review", STUDENT_ACTOR);
  const last = c.events[c.events.length - 1];
  assert.equal(c.events.length, 2);
  assert.equal(last.type, "locked");
  assert.ok(last.summaryHi.length > 0);
  assert.ok(last.actor.nameHi.length > 0);
});

test("non-terminal stages can never be produced without owner and dueAt", () => {
  let c = makeDraftCase();
  for (const to of ["institute_review", "university_scrutiny", "dwo_review"] as const) {
    c = transition(c, to, c.owner ?? STUDENT_ACTOR);
    assert.ok(c.owner && c.dueAt, `${to} left the case unowned`);
  }
});

test("dwo_review deadline never runs past the published DWO window end", () => {
  let c = makeDraftCase();
  c = transition(c, "institute_review", STUDENT_ACTOR);
  c = transition(c, "university_scrutiny", c.owner!);
  c = transition(c, "dwo_review", c.owner!);
  assert.ok(c.dueAt! <= "2026-12-15T00:00:00.000Z");
});
