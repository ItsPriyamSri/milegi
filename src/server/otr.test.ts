import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __resetForTests, hydrate, reseed } from "./store";
import { isDemoAadhaar, mintOtr, recoverIdentity } from "./otr";
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
  addressHi: "कल्याणपुर, कानपुर नगर",
  gender: "m" as const,
};

beforeEach(async () => {
  __resetForTests();
  await hydrate();
  reseed();
});

test("only demo Aadhaar numbers are accepted", () => {
  assert.equal(isDemoAadhaar("000012340001"), true);
  assert.equal(isDemoAadhaar("234512340001"), false);
  assert.throws(
    () => mintOtr({ ...INPUT, aadhaarDemo: "234512340001" }),
    (e: unknown) => e instanceof AppError && /डेमो नंबर/.test(e.hi),
  );
});

test("a minted OTR looks like the real thing and is stable for the profile", () => {
  const { profile } = mintOtr(INPUT);
  assert.match(profile.otr, /^UP26-\d{10}$/);
  assert.equal(profile.duplicateOtrs.length, 0);
});

test("minting twice for the same Aadhaar returns the existing profile and records the duplicate", () => {
  const first = mintOtr(INPUT).profile;
  const second = mintOtr({ ...INPUT, mobile: "9876500099" });
  assert.equal(second.profile.id, first.id, "must not create a second identity");
  assert.ok(second.duplicateOf, "the duplicate attempt must be reported back");
  assert.ok(second.profile.duplicateOtrs.length >= 1);
});

test("recovery finds an existing profile from the registered mobile", () => {
  const created = mintOtr(INPUT).profile;
  const found = recoverIdentity({
    mobile: created.mobile,
    boardRollNo: "2404771201",
    passingYear: 2024,
  });
  assert.equal(found.profile?.id, created.id);
  assert.ok(found.hintHi.length > 0);
});

test("recovery with nothing matching still returns a next step, never an empty failure", () => {
  const found = recoverIdentity({ mobile: "9000000000", boardRollNo: "0000000000", passingYear: 2020 });
  assert.equal(found.profile, undefined);
  assert.match(found.hintHi, /जिला समाज कल्याण|OTR/);
});
