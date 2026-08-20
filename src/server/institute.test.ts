import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __resetForTests, getInstitute, hydrate, reseed } from "./store";
import {
  forwardCase,
  instituteQueue,
  publishCourse,
  receiveHardCopy,
  returnCase,
  setAttendance,
} from "./institute";
import { STUDENT_ACTOR, transition } from "./machine";
import { makeDraftCase } from "./testkit";
import { AppError } from "./errors";

process.env.MILEGI_STORE_PATH = `${process.env.TMPDIR || "/tmp"}/milegi-store-test.json`;

const CLERK = {
  role: "institute" as const,
  nameHi: "श्री आर. के. वर्मा",
  designationHi: "छात्रवृत्ति लिपिक",
  orgHi: "राजकीय महाविद्यालय, कल्याणपुर",
};

beforeEach(async () => {
  __resetForTests();
  await hydrate();
  reseed();
});

const locked = () => transition(makeDraftCase(), "institute_review", STUDENT_ACTOR);

test("forwarding is refused until the hard copy is marked received", () => {
  assert.throws(
    () => forwardCase(locked(), CLERK),
    (e: unknown) => e instanceof AppError && e.code === "HARDCOPY_MISSING" && /हार्ड कॉपी/.test(e.hi),
  );
});

test("forwarding is refused when attendance is below 75 and the message names the rule", () => {
  let c = receiveHardCopy(locked(), CLERK);
  c = setAttendance(c, 68, CLERK);
  assert.throws(
    () => forwardCase(c, CLERK),
    (e: unknown) => e instanceof AppError && e.code === "ATTENDANCE_LOW" && /75/.test(e.hi),
  );
});

test("a degree file forwards to university scrutiny, a school file straight to the DWO", () => {
  let college = setAttendance(receiveHardCopy(locked(), CLERK), 82, CLERK);
  college = forwardCase(college, CLERK);
  assert.equal(college.stage, "university_scrutiny");

  let school = transition(
    makeDraftCase({ track: "pre_9_10", instituteId: "inst-school-gkp", courseCode: "CLASS9" }),
    "institute_review",
    STUDENT_ACTOR,
  );
  school = setAttendance(receiveHardCopy(school, CLERK), 90, CLERK);
  school = forwardCase(school, CLERK);
  assert.equal(school.stage, "dwo_review");
});

test("returning a case gives the student a coded reason and a new deadline", () => {
  const c = returnCase(locked(), "HARDCOPY_NOT_RECEIVED", "प्रति नहीं मिली", CLERK);
  assert.equal(c.stage, "returned_to_student");
  assert.equal(c.owner?.role, "student");
  assert.ok(c.dueAt);
  assert.equal(c.flags[c.flags.length - 1].code, "HARDCOPY_NOT_RECEIVED");
});

test("returning with an unknown reason code is refused", () => {
  assert.throws(
    () => returnCase(locked(), "MADE_UP", "x", CLERK),
    (e: unknown) => e instanceof AppError && e.code === "BAD_REASON_CODE",
  );
});

test("publishing a course makes it selectable and records the fee", () => {
  assert.equal(
    getInstitute("inst-csjmu-arts")!.courses.find((c) => c.code === "BED")!.publishedAt,
    null,
  );
  publishCourse("inst-csjmu-arts", { code: "BED", tuition: 51250 }, CLERK);
  const after = getInstitute("inst-csjmu-arts")!.courses.find((c) => c.code === "BED")!;
  assert.ok(after.publishedAt);
  assert.equal(after.feeHeads.tuition, 51250);
});

test("the queue puts breached files first and reports what each one is missing", async () => {
  const { putCase } = await import("./store");
  putCase(locked());
  const fresh = receiveHardCopy(locked(), CLERK);
  putCase(fresh);
  const rows = instituteQueue("inst-csjmu-arts");
  assert.equal(rows.length, 2);
  assert.ok(rows.some((r) => r.hardCopyReceived === false));
  assert.ok(rows.every((r) => r.stageHi.length > 0));
});
