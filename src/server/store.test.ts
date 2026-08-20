import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  __resetForTests,
  allInstitutes,
  getInstitute,
  getSim,
  hydrate,
  persist,
  putSim,
  reseed,
} from "./store";

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
