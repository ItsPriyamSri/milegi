import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  __resetForTests,
  allInstitutes,
  findProfileByOtr,
  getInstitute,
  getSim,
  hydrate,
  persist,
  putProfile,
  putSim,
  reseed,
} from "./store";
import { mintOtr } from "./otr";
import { SEED_CASES, SEED_PROFILES } from "./seeds";

process.env.MILEGI_STORE_PATH = `${process.env.TMPDIR || "/tmp"}/milegi-store-test.json`;

beforeEach(async () => {
  __resetForTests();
  await hydrate();
  reseed();
});

test("seeds include a college with published courses and one with an unpublished course", () => {
  const list = allInstitutes();
  assert.ok(list.length >= 4);
  assert.ok(list.find((i) => i.courses.some((c) => c.publishedAt !== null)));
  assert.ok(
    list.find((i) => i.courses.some((c) => c.publishedAt === null)),
    "need the master-data failure case for preflight",
  );
});

test("fee heads always carry the excluded heads so the UI can strike them through", () => {
  for (const inst of allInstitutes()) {
    for (const course of inst.courses) {
      for (const head of ["tuition", "exam", "hostel", "mess", "caution", "library", "other"] as const) {
        assert.equal(typeof course.feeHeads[head], "number", `${inst.id}/${course.code}/${head}`);
      }
    }
  }
});

test("every institute has a named clerk with a designation", () => {
  for (const inst of allInstitutes()) {
    assert.ok(inst.clerk.nameHi.length > 0);
    assert.ok(inst.clerk.designationHi.length > 0);
    assert.equal(inst.clerk.role, "institute");
  }
});

test("sim config round-trips through persist and hydrate", async () => {
  const sim = getSim();
  sim.upstream.npci.health = "down";
  putSim(sim);
  await persist();
  __resetForTests();
  await hydrate();
  assert.equal(getSim().upstream.npci.health, "down");
});

test("getInstitute returns undefined for an unknown id rather than throwing", () => {
  assert.equal(getInstitute("nope"), undefined);
});

test("catalog includes SRMCEM Lucknow, an Other catch-all, and a reusable demo OTR", () => {
  assert.ok(getInstitute("inst-srmcem-lko")?.nameEn.includes("SRMCEM"));
  assert.ok(getInstitute("inst-srmcem-lko")?.nameEn.includes("Ramswaroop"));
  assert.equal(getInstitute("inst-srmcem-lko")?.districtCode, "72");
  assert.equal(getInstitute("inst-akt-engg")?.districtCode, "UN");
  assert.ok(getInstitute("inst-other"));
});

test("demo seed identities use real OTR and 15-digit registration shapes", () => {
  for (const p of SEED_PROFILES) {
    assert.match(p.otr, /^UP26-\d{10}$/);
  }
  for (const c of SEED_CASES) {
    assert.match(c.registrationNo, /^\d{15}$/);
  }
});

test("a minted OTR survives persist and hydrate", async () => {
  const { profile } = mintOtr({
    aadhaarDemo: "000012340099",
    mobile: "7987654321",
    dob: "2006-04-11",
    category: "obc",
    nameHi: "टेस्ट",
    nameEn: "Test",
    fatherNameHi: "पिता",
    motherNameHi: "माता",
    districtCode: "72",
    addressHi: "Lucknow",
    gender: "m",
  });
  putProfile(profile);
  await persist();
  __resetForTests();
  await hydrate();
  const found = findProfileByOtr(profile.otr);
  assert.equal(found?.id, profile.id);
  assert.equal(found?.mobile, "7987654321");
});

test("hydrate reloads when another isolate wrote the store file", async () => {
  const { profile } = mintOtr({
    aadhaarDemo: "000012340088",
    mobile: "7987654300",
    dob: "2006-04-11",
    category: "obc",
    nameHi: "टेस्ट",
    nameEn: "Test",
    fatherNameHi: "पिता",
    motherNameHi: "माता",
    districtCode: "72",
    addressHi: "Lucknow",
    gender: "m",
  });
  putProfile(profile);
  await persist();
  const file = process.env.MILEGI_STORE_PATH!;
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as {
    profiles: Record<string, typeof profile>;
  };
  parsed.profiles.prf_other_isolate = {
    ...profile,
    id: "prf_other_isolate",
    otr: "UP26-8111111111",
    aadhaarDemo: "000012340087",
    mobile: "7987654301",
  };
  fs.writeFileSync(file, JSON.stringify(parsed));
  const st = fs.statSync(file);
  fs.utimesSync(file, st.atime, new Date(st.mtimeMs + 20));
  await hydrate();
  assert.equal(findProfileByOtr("UP26-8111111111")?.id, "prf_other_isolate");
});
