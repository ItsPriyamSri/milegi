import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeMobile, requireMobile } from "./mobile";
import { AppError } from "./errors";

test("numbers starting 6, 7, 8 and 9 are accepted", () => {
  assert.equal(normalizeMobile("6987654321"), "6987654321");
  assert.equal(normalizeMobile("7987654321"), "7987654321");
  assert.equal(normalizeMobile("8987654321"), "8987654321");
  assert.equal(normalizeMobile("9876500001"), "9876500001");
});

test("+91, 91 prefix and leading 0 strip to ten digits", () => {
  assert.equal(normalizeMobile("+91 79876 54321"), "7987654321");
  assert.equal(normalizeMobile("917987654321"), "7987654321");
  assert.equal(normalizeMobile("07987654321"), "7987654321");
});

test("landlines and 5-leading numbers are rejected", () => {
  assert.equal(normalizeMobile("5123456789"), null);
  assert.equal(normalizeMobile("12345"), null);
  assert.throws(() => requireMobile("5123456789"), AppError);
});
