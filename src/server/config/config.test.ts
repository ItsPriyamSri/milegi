import { test } from "node:test";
import assert from "node:assert/strict";
import { SCHEMES } from "./schemes";
import { calendarFor } from "./calendar";
import { incomeCapFor, maintenanceFor } from "./rates";
import { REASONS } from "./reasons";

const TRACKS = ["pre_9_10", "post_inter", "dashmottar", "outside_state"] as const;

test("every track has a scheme, both cycles have a calendar, dates are ordered", () => {
  for (const track of TRACKS) {
    assert.ok(SCHEMES[track], `missing scheme ${track}`);
    for (const cycle of ["fresh", "renewal"] as const) {
      const c = calendarFor(track, cycle);
      assert.ok(c.registrationOpen < c.studentDeadline, `${track}/${cycle} window inverted`);
      assert.ok(c.studentDeadline < c.instituteForwardDeadline);
      assert.ok(c.instituteForwardDeadline <= c.dwoWindowEnd);
      assert.ok(c.correctionOpen < c.correctionClose);
      assert.ok(c.disbursementFrom < c.disbursementTo);
      assert.ok(c.source.length > 0 && c.confidence);
    }
  }
});

test("income caps are sourced and never silently equal across categories", () => {
  const sc = incomeCapFor("dashmottar", "sc");
  const obc = incomeCapFor("dashmottar", "obc");
  assert.equal(sc.cap, 250000);
  assert.equal(obc.cap, 200000);
  assert.match(sc.source, /http/);
  assert.ok(obc.note.length > 0, "a contested cap must carry a note");
});

test("maintenance bands exist for every course group and both residence types", () => {
  for (const group of ["prof", "tech", "general", "school"] as const) {
    for (const hosteller of [true, false]) {
      const m = maintenanceFor(group, hosteller);
      assert.ok(m.perMonth > 0 && m.months > 0);
      assert.ok(m.source.length > 0);
    }
  }
});

test("every reason code says who fixes it and whether the correction window applies", () => {
  const codes = Object.values(REASONS);
  assert.ok(codes.length >= 8);
  for (const r of codes) {
    assert.ok(r.hi.length > 0 && r.en.length > 0);
    assert.ok(["student", "institute", "bank", "revenue_office", "none"].includes(r.fixedBy));
    assert.equal(typeof r.correctable, "boolean");
    assert.ok(r.fixHi.length > 0);
  }
});

test("BLOCKED_BY_DIRECTORATE is explicitly not student-fixable", () => {
  assert.equal(REASONS.BLOCKED_BY_DIRECTORATE.fixedBy, "institute");
  assert.equal(REASONS.BLOCKED_BY_DIRECTORATE.correctable, false);
});
