import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __resetForTests, hydrate, reseed } from "./store";
import { crossCheck, flagCase, rejectCase, sanctionBatch, verifyCase } from "./dwo";
import { STUDENT_ACTOR, transition } from "./machine";
import { makeDraftCase } from "./testkit";
import { AppError } from "./errors";

process.env.MILEGI_STORE_PATH = `${process.env.TMPDIR || "/tmp"}/milegi-store-test.json`;

const DWO = {
  role: "dwo" as const,
  nameHi: "जिला समाज कल्याण कार्यालय",
  designationHi: "जिला छात्रवृत्ति समिति",
  orgHi: "कानपुर नगर",
};

beforeEach(async () => {
  __resetForTests();
  await hydrate();
  reseed();
});

function atDwo(form: Record<string, unknown> = {}) {
  let c = transition(
    makeDraftCase({
      attendancePercent: 82,
      form: {
        districtCode: "70",
        yearOfStudy: 2,
        hosteller: false,
        boardName: "upmsp",
        boardRollNo: "2404771201",
        enrolmentNo: "CSJM2426BA0917",
        incomeCertNo: "IC-2024-771201",
        incomeAppNo: "APP-2024-771201",
        ...form,
      } as never,
    }),
    "institute_review",
    STUDENT_ACTOR,
  );
  c = transition(c, "university_scrutiny", c.owner!);
  return transition(c, "dwo_review", c.owner!);
}

test("cross-check passes when the roll number, enrolment and certificate are all good", () => {
  const results = crossCheck(atDwo());
  assert.ok(results.length >= 4, "board, enrolment, income, duplicate and attendance are checked");
  assert.equal(
    results.every((r) => r.matched),
    true,
    JSON.stringify(results.filter((r) => !r.matched)),
  );
});

test("a wrong enrolment number produces the documented reason code with both values", () => {
  const row = crossCheck(atDwo({ enrolmentNo: "WRONG123" })).find((r) => r.id === "enrolment")!;
  assert.equal(row.matched, false);
  assert.equal(row.reasonCode, "ENROLMENT_MISMATCH");
  assert.equal(row.submitted, "WRONG123");
  assert.match(row.registry, /CSJM/);
});

test("flagging moves the case to correction_required with the window dates attached", () => {
  const c = flagCase(atDwo(), ["ENROLMENT_MISMATCH"], "", DWO);
  assert.equal(c.stage, "correction_required");
  assert.equal(c.correction?.openAt, "2026-11-21T00:00:00.000Z");
  assert.equal(c.correction?.closeAt, "2026-12-20T00:00:00.000Z");
  assert.equal(c.owner?.role, "student");
});

test("flagging a non-correctable code says so and still gives the real fix", () => {
  const c = flagCase(atDwo(), ["BLOCKED_BY_DIRECTORATE"], "", DWO);
  const note = c.events.find((e) => e.type === "flag_not_correctable")!;
  assert.match(note.summaryHi, /निदेशालय/);
  assert.match(note.summaryHi, /सुधार विंडो से ठीक नहीं/);
});

test("verify moves to sanctioned and records the officer", () => {
  const c = verifyCase(atDwo(), DWO);
  assert.equal(c.stage, "sanctioned");
  assert.equal(c.events[c.events.length - 1].actor.role, "dwo");
});

test("a sanction batch refuses anything not sanctioned and reports why", () => {
  const good = verifyCase(atDwo(), DWO);
  const bad = atDwo();
  const out = sanctionBatch([good, bad], DWO);
  assert.deepEqual(
    out.sanctioned.map((c) => c.id),
    [good.id],
  );
  assert.equal(out.refused[0].id, bad.id);
  assert.ok(out.refused[0].reasonHi.length > 0);
});

test("rejection requires a code from the reason table", () => {
  assert.throws(
    () => rejectCase(atDwo(), "BECAUSE", "", DWO),
    (e: unknown) => e instanceof AppError && e.code === "BAD_REASON_CODE",
  );
});

test("an upstream outage marks a check unknown rather than blaming the student", async () => {
  const { getSim, putSim } = await import("./store");
  const c = atDwo();
  const sim = getSim();
  sim.upstream.boards.health = "down";
  putSim(sim);
  const row = crossCheck(c).find((r) => r.id === "board")!;
  assert.equal(row.unknown, true);
  assert.equal(row.reasonCode, undefined);
});
