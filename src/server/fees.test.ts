import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __resetForTests, hydrate, reseed } from "./store";
import { DISPUTABLE_STAGES, estimateFor, feeFor, raiseFeeDispute } from "./fees";
import { STUDENT_ACTOR } from "./machine";
import { AppError } from "./errors";
import { makeDraftCase } from "./testkit";

process.env.MILEGI_STORE_PATH = `${process.env.TMPDIR || "/tmp"}/milegi-store-test.json`;

beforeEach(async () => {
  __resetForTests();
  await hydrate();
  reseed();
});

test("non-refundable fee is tuition only, and every excluded head is itemised", () => {
  const f = feeFor("inst-csjmu-arts", "BSC");
  assert.equal(f.nonRefundable, 19800);
  assert.deepEqual(f.excluded.map((e) => e.key).sort(), [
    "caution",
    "exam",
    "hostel",
    "library",
    "mess",
  ]);
  assert.ok(f.excluded.every((e) => e.label.length > 0));
});

test("an unpublished course cannot produce a fee", () => {
  assert.throws(() => feeFor("inst-csjmu-arts", "BED"), /not published/);
});

test("estimate is fee reimbursement plus a maintenance band, and states its basis", () => {
  const e = estimateFor(makeDraftCase());
  assert.equal(e.feeReimbursement, 19800);
  assert.equal(e.maintenancePerMonth, 300);
  assert.equal(e.months, 10);
  assert.equal(e.total, 19800 + 300 * 10);
  assert.match(e.basisHi, /अनुमान/);
});

test("hosteller gets the hosteller band", () => {
  const e = estimateFor(
    makeDraftCase({ form: { districtCode: "70", yearOfStudy: 2, hosteller: true } }),
  );
  assert.equal(e.maintenancePerMonth, 570);
});

test("pre-matric has no fee reimbursement, only maintenance", () => {
  const e = estimateFor(
    makeDraftCase({ track: "pre_9_10", instituteId: "inst-school-gkp", courseCode: "CLASS9" }),
  );
  assert.equal(e.feeReimbursement, 0);
  assert.ok(e.total > 0);
});

test("a fee dispute is allowed up to dwo_review and records who raised it", () => {
  assert.deepEqual(DISPUTABLE_STAGES, [
    "draft",
    "institute_review",
    "university_scrutiny",
    "dwo_review",
  ]);
  const c = raiseFeeDispute(makeDraftCase(), "रसीद में ₹21,300 लिखा है", STUDENT_ACTOR);
  assert.equal(c.fee.disputed?.note, "रसीद में ₹21,300 लिखा है");
  assert.equal(c.events[c.events.length - 1].type, "fee_disputed");
});

test("a fee dispute after sanction is refused", () => {
  const c = makeDraftCase({ stage: "sanctioned" });
  assert.throws(
    () => raiseFeeDispute(c, "देर से", STUDENT_ACTOR),
    (e: unknown) => e instanceof AppError && e.code === "DISPUTE_TOO_LATE" && /नहीं/.test(e.hi),
  );
});
