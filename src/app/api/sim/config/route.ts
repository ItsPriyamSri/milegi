import { handler, ok, readJson } from "@/server/http";
import { AppError } from "@/server/errors";
import { setForcedPfmsOutcome, setUpstream, simState } from "@/server/sim";
import type { PfmsStatus, UpstreamName } from "@/server/types";

const SYSTEMS = ["ekyc", "digilocker", "edistrict", "boards", "npci", "pfms"];
const OUTCOMES = [
  "processing_with_bank",
  "credited",
  "beneficiary_pending",
  "rejected_not_seeded",
  "rejected_dormant",
  "limit_exceeded",
];

export const POST = handler(async (req) => {
  const body = await readJson(req);
  if (body.forcedPfmsOutcome !== undefined) {
    const outcome = body.forcedPfmsOutcome === null ? null : String(body.forcedPfmsOutcome);
    if (outcome !== null && !OUTCOMES.includes(outcome)) {
      throw new AppError("BAD_OUTCOME", {
        hi: "यह भुगतान परिणाम सूची में नहीं है।",
        en: "Unknown PFMS outcome.",
        status: 422,
      });
    }
    setForcedPfmsOutcome(outcome as PfmsStatus | null);
    return ok({ ...simState(), simulated: true });
  }
  const system = String(body.system ?? "");
  if (!SYSTEMS.includes(system)) {
    throw new AppError("BAD_SYSTEM", {
      hi: "यह प्रणाली सूची में नहीं है।",
      en: "Unknown upstream system.",
      status: 422,
    });
  }
  const health = ["up", "slow", "down"].includes(String(body.health))
    ? (String(body.health) as "up" | "slow" | "down")
    : "up";
  const failureRate = Math.min(1, Math.max(0, Number(body.failureRate ?? 0)));
  setUpstream(system as UpstreamName, health, failureRate);
  return ok({ ...simState(), simulated: true });
});
