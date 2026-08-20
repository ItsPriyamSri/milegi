import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __resetForTests, hydrate, putCase, reseed } from "./store";
import { caseView, createCase, lockCase, prefillFromLastYear, runPreflightOn, trackView } from "./cases";
import { mintOtr } from "./otr";
import { makeDraftCase } from "./testkit";
import { AppError } from "./errors";

process.env.MILEGI_STORE_PATH = `${process.env.TMPDIR || "/tmp"}/milegi-store-test.json`;

const INPUT = {
  aadhaarDemo: "000012340001",
  mobile: "9876500001",
  dob: "2006-04-11",
  category: "obc" as const,
  nameHi: "अंकित सिंह",
  nameEn: "Ankit Singh",
  fatherNameHi: "राम सिंह",
  motherNameHi: "सीता देवी",
  districtCode: "70",
  addressHi: "कानपुर",
  gender: "m" as const,
};

const COMPLETE_FORM = {
  districtCode: "70",
  aadhaarDemo: "000012340001",
  yearOfStudy: 2,
  hosteller: false,
  courseType: "regular",
  admissionDate: "2026-07-20",
  boardName: "upmsp",
  boardRollNo: "2404771201",
  enrolmentNo: "CSJM2426BA0917",
  resultStatus: "passed",
  marksObtained: 410,
  marksTotal: 600,
  semesterCombined: true,
  annualIncome: 96000,
  rationCard: "0",
  incomeAppNo: "APP-2024-771201",
  incomeCertNo: "IC-2024-771201",
  casteAppNo: "APP-2019-118834",
  casteCertNo: "CC-2019-118834",
  declAttendance: true,
  declNoOtherScholarship: true,
  declTruthful: true,
};

beforeEach(async () => {
  __resetForTests();
  await hydrate();
  reseed();
});

test("a new case starts in draft, owned by the student, with the calendar deadline", () => {
  const p = mintOtr(INPUT).profile;
  const c = createCase(p, {
    track: "dashmottar",
    cycle: "fresh",
    instituteId: "inst-csjmu-arts",
    courseCode: "BSC",
  });
  assert.equal(c.stage, "draft");
  assert.equal(c.owner?.role, "student");
  assert.equal(c.dueAt, "2026-10-31T00:00:00.000Z");
  assert.equal(c.fee.nonRefundable, 19800);
  assert.equal(c.registrationNo, "", "the session registration number is minted at lock");
});

test("a case cannot be created on an unpublished course", () => {
  const p = mintOtr(INPUT).profile;
  assert.throws(
    () =>
      createCase(p, {
        track: "dashmottar",
        cycle: "fresh",
        instituteId: "inst-csjmu-arts",
        courseCode: "BED",
      }),
    /not published/,
  );
});

test("lock mints a 15-digit registration number and starts the hard-copy clock", () => {
  const p = mintOtr(INPUT).profile;
  const draft = runPreflightOn(
    makeDraftCase({ profileId: p.id, form: { ...COMPLETE_FORM } }),
    p,
  );
  const c = lockCase(draft);
  assert.match(c.registrationNo, /^\d{15}$/);
  assert.equal(c.stage, "institute_review");
  assert.ok(c.hardCopy.dueAt);
});

test("lock refuses while a required field is missing, and names it", () => {
  const p = mintOtr(INPUT).profile;
  assert.throws(
    () => lockCase(makeDraftCase({ profileId: p.id, form: { districtCode: "70" } })),
    (e: unknown) => e instanceof AppError && e.code === "FORM_INCOMPLETE" && /भरना ज़रूरी/.test(e.hi),
  );
});

test("lock refuses while a pre-flight blocker stands", () => {
  const p = mintOtr(INPUT).profile;
  const draft = runPreflightOn(
    makeDraftCase({
      profileId: p.id,
      form: { ...COMPLETE_FORM, incomeCertNo: "IC-2021-330077", incomeAppNo: "APP-2021-330077" },
    }),
    p,
  );
  assert.throws(
    () => lockCase(draft),
    (e: unknown) => e instanceof AppError && e.code === "PREFLIGHT_BLOCKED",
  );
});

test("a renewal is prefilled from last year and only the changing fields stay blank", () => {
  const p = mintOtr(INPUT).profile;
  const lastYear = makeDraftCase({
    profileId: p.id,
    stage: "paid",
    owner: null,
    dueAt: null,
    form: {
      districtCode: "70",
      yearOfStudy: 1,
      hosteller: false,
      courseType: "regular",
      boardName: "upmsp",
      boardRollNo: "2404771201",
      enrolmentNo: "CSJM2426BA0917",
      annualIncome: 96000,
      rationCard: "0",
    },
  });
  putCase(lastYear);
  const fresh = createCase(p, {
    track: "dashmottar",
    cycle: "renewal",
    instituteId: "inst-csjmu-arts",
    courseCode: "BSC",
  });
  const filled = prefillFromLastYear(p, fresh);
  assert.equal(filled.form.enrolmentNo, "CSJM2426BA0917");
  assert.equal(filled.form.yearOfStudy, 2, "the year advances automatically");
  for (const blank of ["resultStatus", "marksObtained", "marksTotal"]) {
    assert.ok(!filled.form[blank], `${blank} must be re-entered every year`);
  }
});

test("caseView exposes the timeline and alerts but never the identity number", () => {
  const p = mintOtr(INPUT).profile;
  const v = caseView(makeDraftCase({ profileId: p.id }));
  assert.ok(v.stageHi.length > 0);
  assert.ok(Array.isArray(v.alerts));
  assert.ok(Array.isArray(v.events));
  assert.ok(v.estimate.basisHi.length > 0);
  assert.equal(v.otr, p.otr);
  assert.equal(
    JSON.stringify(v).includes(p.aadhaarDemo),
    false,
    "even the demo identity number is masked on the way out",
  );
  assert.equal(String(v.certificates.income), "null");
});

test("trackView is safe to share: no form, no certificates", () => {
  const p = mintOtr(INPUT).profile;
  const v = trackView(makeDraftCase({ profileId: p.id, form: { ...COMPLETE_FORM } }));
  const json = JSON.stringify(v);
  assert.equal(json.includes("IC-2024-771201"), false);
  assert.equal(json.includes("000012340001"), false);
  assert.equal((v as Record<string, unknown>).form, undefined);
  assert.ok(v.stageHi.length > 0);
});
