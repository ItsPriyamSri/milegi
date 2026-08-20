import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, daysBetween, getClockOffset, iso, now, setClockOffset } from "./clock";

test("clock offset moves now() forward in whole days", () => {
  setClockOffset(0);
  const base = now().getTime();
  setClockOffset(10);
  const moved = now().getTime();
  assert.equal(Math.round((moved - base) / 86400000), 10);
  assert.equal(getClockOffset(), 10);
  setClockOffset(0);
});

test("addDays and daysBetween are inverse on ISO dates", () => {
  assert.equal(addDays("2026-09-15T00:00:00.000Z", 3).slice(0, 10), "2026-09-18");
  assert.equal(daysBetween("2026-09-15T00:00:00.000Z", "2026-09-22T00:00:00.000Z"), 7);
  assert.equal(daysBetween("2026-09-22T00:00:00.000Z", "2026-09-15T00:00:00.000Z"), -7);
});

test("iso is stable and second-precision safe", () => {
  assert.equal(iso(new Date("2026-10-01T05:30:00.000Z")), "2026-10-01T05:30:00.000Z");
});
