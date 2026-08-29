import { test } from "node:test";
import assert from "node:assert/strict";
import { routeStudent } from "./route";

const BASE = {
  studying: "college" as const,
  firstYear: false,
  gotLastYear: "yes" as const,
  changedCourse: false,
  rejectedLastYear: false,
  inUp: true,
};

test("college + not first year + got it last year = dashmottar renewal", () => {
  const r = routeStudent(BASE);
  assert.equal(r.track, "dashmottar");
  assert.equal(r.cycle, "renewal");
  assert.match(r.reasonHi, /नवीनीकरण/);
  assert.ok(r.recoveryEn.includes("OTR"));
  assert.ok(r.warnEn);
});

test('"पता नहीं" never coerces to fresh — it resolves to the safe side with a recovery route', () => {
  const r = routeStudent({ ...BASE, gotLastYear: "dunno" });
  assert.equal(r.cycle, "renewal");
  assert.ok(r.recoveryHi.includes("हाई स्कूल रोल"));
});

test("changed course beats renewal — a course change is always a fresh application", () => {
  const r = routeStudent({ ...BASE, changedCourse: true });
  assert.equal(r.cycle, "fresh");
  assert.match(r.reasonHi, /कोर्स बदला/);
});

test("rejected last year is a fresh application, not a renewal", () => {
  const r = routeStudent({ ...BASE, gotLastYear: "no", rejectedLastYear: true });
  assert.equal(r.cycle, "fresh");
});

test("class 9-10 and 11-12 map to their own tracks", () => {
  assert.equal(routeStudent({ ...BASE, studying: "class_9_10", firstYear: true }).track, "pre_9_10");
  assert.equal(
    routeStudent({ ...BASE, studying: "class_11_12", firstYear: true }).track,
    "post_inter",
  );
});

test("studying outside UP overrides the level and never dead-ends", () => {
  const r = routeStudent({ ...BASE, firstYear: true, inUp: false });
  assert.equal(r.track, "outside_state");
  assert.ok(r.reasonHi.length > 0);
});

test("the router always returns a track and a cycle — there is no not-found result", () => {
  for (const studying of ["class_9_10", "class_11_12", "college"] as const) {
    for (const firstYear of [true, false]) {
      for (const gotLastYear of ["yes", "no", "dunno"] as const) {
        const r = routeStudent({ ...BASE, studying, firstYear, gotLastYear });
        assert.ok(r.track && r.cycle, `${studying}/${firstYear}/${gotLastYear} produced nothing`);
      }
    }
  }
});
