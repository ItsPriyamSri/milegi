import { test } from "node:test";
import assert from "node:assert/strict";
import { signSession, verifySession } from "./session";

test("a signed session round-trips", () => {
  const token = signSession({ role: "student", subjectId: "prf_1", exp: Date.now() + 3600_000 });
  assert.equal(verifySession(token)?.subjectId, "prf_1");
});

test("a tampered session is rejected", () => {
  const token = signSession({ role: "student", subjectId: "prf_1", exp: Date.now() + 3600_000 });
  const [body] = token.split(".");
  assert.equal(verifySession(`${body}.deadbeef`), null);
});

test("an expired session is rejected", () => {
  assert.equal(verifySession(signSession({ role: "dwo", subjectId: "70", exp: Date.now() - 1 })), null);
});

test("a role cannot be escalated by editing the payload", () => {
  const token = signSession({ role: "student", subjectId: "prf_1", exp: Date.now() + 3600_000 });
  const forged =
    Buffer.from(JSON.stringify({ role: "dwo", subjectId: "prf_1", exp: Date.now() + 3600_000 })).toString(
      "base64url",
    ) +
    "." +
    token.split(".")[1];
  assert.equal(verifySession(forged), null);
});
