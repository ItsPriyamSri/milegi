import { REASONS } from "../config/reasons";
import { DBT_REGISTRY } from "../seeds";
import { gate } from "./gate";

export type DbtState = "seeded" | "kyc_only" | "dormant";

export function checkDbt(aadhaarDemo: string): {
  state: DbtState;
  hi: string;
  actionHi: string | null;
} {
  gate("npci");
  const state: DbtState = DBT_REGISTRY[aadhaarDemo] ?? "kyc_only";
  if (state === "seeded") {
    return {
      state,
      hi: "बैंक खाता आधार-DBT (NPCI) से जुड़ा है — भुगतान इसी खाते में जाएगा।",
      actionHi: null,
    };
  }
  if (state === "dormant") {
    return { state, hi: REASONS.ACCOUNT_DORMANT.hi, actionHi: REASONS.ACCOUNT_DORMANT.fixHi };
  }
  return {
    state,
    hi: "खाते में KYC है, पर आधार-DBT (NPCI) सीडिंग नहीं दिख रही — भुगतान लौट सकता है।",
    actionHi: REASONS.NPCI_NOT_SEEDED.fixHi,
  };
}
