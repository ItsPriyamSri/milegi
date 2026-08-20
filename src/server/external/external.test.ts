import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __resetForTests, getSim, hydrate, putSim, reseed } from "../store";
import { AppError, errorBody } from "../errors";
import { verifyCertificate } from "./edistrict";
import { checkDbt } from "./npci";
import { runPfmsBatch } from "./pfms";
import { makeDraftCase } from "../testkit";

process.env.MILEGI_STORE_PATH = `${process.env.TMPDIR || "/tmp"}/milegi-store-test.json`;

beforeEach(async () => {
  __resetForTests();
  await hydrate();
  reseed();
});

test("an AppError renders a citizen-readable body with a reference and no upstream string", () => {
  const body = errorBody(
    new AppError("UPSTREAM_DOWN", {
      hi: "ई-डिस्ट्रिक्ट सेवा अभी जवाब नहीं दे रही",
      en: "e-District is not responding",
      retryable: true,
      upstream: "ETIMEDOUT connect 10.4.4.9:443",
    }),
  );
  assert.equal(body.ok, false);
  assert.equal(body.error.code, "UPSTREAM_DOWN");
  assert.match(body.error.ref, /^ERR-[A-Z0-9]{5}$/);
  assert.equal(body.error.retryable, true);
  assert.equal(JSON.stringify(body).includes("ETIMEDOUT"), false, "never leak the upstream string");
});

test("certificate verification computes a 3-year expiry from the issue date", () => {
  const r = verifyCertificate({
    kind: "income",
    applicationNo: "APP-2024-771201",
    certNo: "IC-2024-771201",
  });
  assert.equal(r.state, "ok");
  if (r.state !== "ok") return;
  assert.equal(r.issuedOn.slice(0, 10), "2024-07-12");
  assert.equal(r.expiresOn.slice(0, 10), "2027-07-12");
  assert.equal(r.annualIncome, 96000);
});

test("an unknown certificate number is not_found, not an exception", () => {
  assert.equal(
    verifyCertificate({ kind: "income", applicationNo: "X", certNo: "IC-0000-000000" }).state,
    "not_found",
  );
});

test("a downed upstream throws AppError with retryable true", () => {
  const sim = getSim();
  sim.upstream.edistrict.health = "down";
  putSim(sim);
  assert.throws(
    () =>
      verifyCertificate({
        kind: "income",
        applicationNo: "APP-2024-771201",
        certNo: "IC-2024-771201",
      }),
    (e: unknown) => e instanceof AppError && e.code === "UPSTREAM_DOWN" && e.retryable,
  );
});

test("DBT check reports the three real-world states", () => {
  assert.equal(checkDbt("000012340001").state, "seeded");
  assert.equal(checkDbt("000012340002").state, "kyc_only");
  assert.equal(checkDbt("000012340003").state, "dormant");
});

test("a PFMS batch credits a seeded case and bounces an unseeded one with the documented code", () => {
  const ok = makeDraftCase({ stage: "pfms_processing" });
  const bad = makeDraftCase({ stage: "pfms_processing" });
  const out = runPfmsBatch([
    { caseRec: ok, aadhaarDemo: "000012340001" },
    { caseRec: bad, aadhaarDemo: "000012340002" },
  ]);
  assert.equal(out[0].status, "credited");
  assert.ok(out[0].amount && out[0].amount > 0);
  assert.equal(out[1].status, "rejected_not_seeded");
  assert.equal(out[1].failureCode, "NPCI_NOT_SEEDED");
});

test("a forced PFMS outcome overrides the seeded state, for the demo", () => {
  const sim = getSim();
  sim.forcedPfmsOutcome = "limit_exceeded";
  putSim(sim);
  const out = runPfmsBatch([
    { caseRec: makeDraftCase({ stage: "pfms_processing" }), aadhaarDemo: "000012340001" },
  ]);
  assert.equal(out[0].status, "limit_exceeded");
  assert.equal(out[0].failureCode, "TXN_LIMIT_EXCEEDED");
});
