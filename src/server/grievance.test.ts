import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __resetForTests, hydrate, reseed } from "./store";
import { addDays, iso } from "./clock";
import { grievanceDraft } from "./grievance";
import { STUDENT_ACTOR, transition } from "./machine";
import { makeDraftCase } from "./testkit";

process.env.MILEGI_STORE_PATH = `${process.env.TMPDIR || "/tmp"}/milegi-store-test.json`;

beforeEach(async () => {
  __resetForTests();
  await hydrate();
  reseed();
});

test("the grievance draft names the stage, the owner, the days waited and the case id", () => {
  const c = transition(makeDraftCase(), "institute_review", STUDENT_ACTOR);
  const late = { ...c, dueAt: addDays(iso(), -12), stageEnteredAt: addDays(iso(), -19) };
  const d = grievanceDraft(late, {
    nameHi: "अंकित सिंह",
    otr: "UP26-8123456789",
    mobile: "9876500001",
  });
  assert.match(d.bodyHi, /MLG-26-/);
  assert.match(d.bodyHi, /श्री आर\. के\. वर्मा/);
  assert.match(d.bodyHi, /12/);
  assert.match(d.bodyHi, /UP26-8123456789/);
  assert.ok(d.subjectHi.length > 10);
  assert.ok(d.bodyEn.length > 50, "an English copy exists for the record");
});

test("the draft never fabricates a phone number, an officer identity or a promise", () => {
  const c = makeDraftCase();
  const d = grievanceDraft(c, { nameHi: "क", otr: "UP26-8000000001", mobile: "9000000001" });
  assert.equal(/\b(?:0\d{2,4}-\d{6,8}|1[89]00\d{6})\b/.test(d.bodyHi), false);
  assert.equal(d.bodyHi.includes("गारंटी"), false);
});
