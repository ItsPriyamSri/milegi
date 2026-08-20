import { addYears } from "../clock";
import { CERT_REGISTRY } from "../seeds";
import { gate } from "./gate";

export type CertResult =
  | {
      state: "ok";
      applicationNo: string;
      certNo: string;
      issuedOn: string;
      expiresOn: string;
      annualIncome?: number;
    }
  | { state: "not_found" };

export function verifyCertificate(q: {
  kind: "income" | "caste";
  applicationNo: string;
  certNo: string;
}): CertResult {
  gate("edistrict");
  const row = CERT_REGISTRY[q.certNo.trim()];
  if (!row || row.kind !== q.kind) return { state: "not_found" };
  return {
    state: "ok",
    applicationNo: row.applicationNo,
    certNo: row.certNo,
    issuedOn: row.issuedOn,
    // UP income certificates are valid for exactly three years from issue, with no grace period.
    expiresOn: addYears(row.issuedOn, 3),
    ...(row.annualIncome !== undefined ? { annualIncome: row.annualIncome } : {}),
  };
}
