import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __resetForTests, hydrate, putCase, reseed } from "./store";
import { resolveTracking } from "./track";
import { mintOtr } from "./otr";
import { createCase, lockCase, runPreflightOn } from "./cases";
import { makeDraftCase } from "./testkit";

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

beforeEach(async () => {
  __resetForTests();
  await hydrate();
  reseed();
});

test("tracking by case id, registration number, or OTR all hit the same file", () => {
  const p = mintOtr(INPUT).profile;
  const draft = runPreflightOn(
    makeDraftCase({
      profileId: p.id,
      form: {
        districtCode: "70",
        aadhaarDemo: p.aadhaarDemo,
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
      },
    }),
    p,
  );
  const locked = lockCase(draft);
  putCase(locked);

  const byId = resolveTracking(locked.id);
  const byReg = resolveTracking(locked.registrationNo);
  const byOtr = resolveTracking(`  ${p.otr.toLowerCase()}  `);
  assert.equal(byId.kind, "case");
  assert.equal(byReg.kind, "case");
  assert.equal(byOtr.kind, "case");
  if (byId.kind === "case" && byReg.kind === "case" && byOtr.kind === "case") {
    assert.equal(byId.case.id, locked.id);
    assert.equal(byReg.case.id, locked.id);
    assert.equal(byOtr.case.id, locked.id);
  }
});

test("an OTR with no case is a distinct hit, not a miss", () => {
  const p = mintOtr(INPUT).profile;
  const hit = resolveTracking(p.otr);
  assert.deepEqual(hit, { kind: "otr_no_case", otr: p.otr });
});

test("unknown codes are missing", () => {
  assert.equal(resolveTracking("MLG-26-999999").kind, "missing");
  assert.equal(resolveTracking("UP26-0000000000").kind, "missing");
  assert.equal(resolveTracking("").kind, "missing");
});

test("createCase stamps the OTR onto the form identity", () => {
  const p = mintOtr(INPUT).profile;
  const c = createCase(p, {
    track: "dashmottar",
    cycle: "fresh",
    instituteId: "inst-csjmu-arts",
    courseCode: "BSC",
  });
  assert.equal(c.form.otr, p.otr);
});
