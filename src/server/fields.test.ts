import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __resetForTests, hydrate, reseed } from "./store";
import { FIELDS, fieldsFor } from "./fields";
import { applyPatch, validateAll, validateField } from "./patch";
import { STUDENT_ACTOR } from "./machine";
import { makeDraftCase } from "./testkit";

process.env.MILEGI_STORE_PATH = `${process.env.TMPDIR || "/tmp"}/milegi-store-test.json`;

beforeEach(async () => {
  __resetForTests();
  await hydrate();
  reseed();
});

test("every section of every track resolves to at least one field with a Hindi label", () => {
  for (const track of ["pre_9_10", "post_inter", "dashmottar", "outside_state"] as const) {
    for (const cycle of ["fresh", "renewal"] as const) {
      for (const section of ["identity", "education", "previous_result", "family_docs", "declaration"] as const) {
        const list = fieldsFor(track, cycle, section);
        assert.ok(list.length > 0, `${track}/${cycle}/${section} is empty`);
        assert.ok(list.every((f) => f.labelHi.length > 0));
      }
    }
  }
});

test("marks obtained above marks total is rejected with a Hindi message", () => {
  const msg = validateField("marksObtained", 700, { marksTotal: 600 });
  assert.ok(msg && msg.includes("कुल"));
});

test("a suspiciously low total is flagged as the CGPA mistake", () => {
  const msg = validateField("marksTotal", 10, {});
  assert.ok(msg && msg.includes("CGPA"));
});

test("ration card accepts 0 because that is the documented placeholder", () => {
  assert.equal(validateField("rationCard", "0", {}), null);
});

test("an Aadhaar-shaped value that is not a demo number is rejected", () => {
  assert.ok(validateField("aadhaarDemo", "234512340001", {})?.includes("डेमो"));
});

test("no field named for a bank account or IFSC exists anywhere", () => {
  const all = Object.keys(FIELDS).join(" ").toLowerCase();
  assert.equal(/ifsc|account|khata|bank/.test(all), false);
});

test("applyPatch rejects money, stage and identity fields even if the client sends them", () => {
  const { case: after, rejected } = applyPatch(
    makeDraftCase(),
    { yearOfStudy: 3, nonRefundable: 1, stage: "paid", aadhaarDemo: "000012349999" },
    STUDENT_ACTOR,
  );
  assert.equal(after.form.yearOfStudy, 3);
  assert.deepEqual(rejected.sort(), ["aadhaarDemo", "nonRefundable", "stage"]);
  assert.equal(after.stage, "draft");
});

test("applyPatch on a flagged case only accepts the fields the correction window unlocked", () => {
  const c = makeDraftCase({
    stage: "correction_required",
    owner: STUDENT_ACTOR,
    dueAt: "2026-12-20T00:00:00.000Z",
    flags: [{ code: "ENROLMENT_MISMATCH", at: "2026-11-20T00:00:00.000Z", by: STUDENT_ACTOR }],
    correction: {
      openAt: "2026-11-21T00:00:00.000Z",
      closeAt: "2026-12-20T00:00:00.000Z",
      usedAt: null,
      fields: ["ENROLMENT_MISMATCH"],
    },
  });
  const { case: after, rejected } = applyPatch(
    c,
    { enrolmentNo: "CSJM2426BA0917", hosteller: true },
    STUDENT_ACTOR,
  );
  assert.equal(after.form.enrolmentNo, "CSJM2426BA0917");
  assert.deepEqual(rejected, ["hosteller"]);
});

test("a locked case at the institute accepts nothing at all", () => {
  const c = makeDraftCase({
    stage: "institute_review",
    owner: { role: "institute", nameHi: "क", designationHi: "ख", orgHi: "ग" },
    dueAt: "2026-11-07T00:00:00.000Z",
  });
  const { rejected } = applyPatch(c, { yearOfStudy: 4 }, STUDENT_ACTOR);
  assert.deepEqual(rejected, ["yearOfStudy"]);
});

test("validateAll returns every missing required field before lock", () => {
  const problems = validateAll(makeDraftCase({ form: { districtCode: "70" } }));
  assert.ok(problems.length >= 3);
  assert.ok(problems.every((p) => p.messageHi.length > 0));
});
