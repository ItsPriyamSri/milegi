import type { Case, PfmsStatus } from "../types";
import { iso } from "../clock";
import { getSim } from "../store";
import { checkDbt } from "./npci";
import { gate } from "./gate";

export type PfmsRow = {
  caseId: string;
  status: PfmsStatus;
  amount?: number;
  failureCode?: string;
  pfmsRef: string;
  at: string;
};

const FAILURE_CODE: Partial<Record<PfmsStatus, string>> = {
  rejected_not_seeded: "NPCI_NOT_SEEDED",
  rejected_dormant: "ACCOUNT_DORMANT",
  limit_exceeded: "TXN_LIMIT_EXCEEDED",
};

export function runPfmsBatch(rows: { caseRec: Case; aadhaarDemo: string }[]): PfmsRow[] {
  gate("pfms");
  const forced = getSim().forcedPfmsOutcome;
  return rows.map(({ caseRec, aadhaarDemo }) => {
    const at = iso();
    const pfmsRef = `PFMS-26-${caseRec.id.slice(-6)}`;
    if (forced) {
      return {
        caseId: caseRec.id,
        status: forced,
        pfmsRef,
        at,
        ...(forced === "credited" ? { amount: caseRec.estimate.total } : {}),
        ...(FAILURE_CODE[forced] ? { failureCode: FAILURE_CODE[forced] as string } : {}),
      };
    }
    const dbt = checkDbt(aadhaarDemo).state;
    if (dbt === "seeded") {
      return { caseId: caseRec.id, status: "credited", amount: caseRec.estimate.total, pfmsRef, at };
    }
    const status: PfmsStatus = dbt === "dormant" ? "rejected_dormant" : "rejected_not_seeded";
    return { caseId: caseRec.id, status, pfmsRef, at, failureCode: FAILURE_CODE[status] as string };
  });
}
