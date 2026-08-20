import { test } from "node:test";
import assert from "node:assert/strict";
import { mergePatches, nextBackoffMs } from "./queue";

test("patches merge last-write-wins per field, preserving unrelated fields", () => {
  assert.deepEqual(mergePatches([{ marksTotal: 600 }, { marksObtained: 410 }, { marksTotal: 1200 }]), {
    marksTotal: 1200,
    marksObtained: 410,
  });
});

test("backoff grows and is capped", () => {
  assert.equal(nextBackoffMs(0), 1000);
  assert.equal(nextBackoffMs(1), 2000);
  assert.ok(nextBackoffMs(9) <= 30000);
});

test("an empty queue merges to an empty patch, not undefined", () => {
  assert.deepEqual(mergePatches([]), {});
});
