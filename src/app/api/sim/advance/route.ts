import { handler, ok, readJson } from "@/server/http";
import { AppError } from "@/server/errors";
import { advanceDays, setClockOffsetDays, simState } from "@/server/sim";

export const POST = handler(async (req) => {
  const body = await readJson(req);
  if (body.setOffset !== undefined) {
    const report = setClockOffsetDays(Number(body.setOffset));
    return ok({ report, state: simState(), simulated: true });
  }
  const days = Number(body.days ?? 0);
  if (!Number.isFinite(days) || days === 0 || Math.abs(days) > 500) {
    throw new AppError("BAD_DAYS", {
      hi: "दिनों की संख्या 1 से 500 के बीच होनी चाहिए।",
      en: "days must be between 1 and 500.",
      status: 422,
    });
  }
  const report = advanceDays(days);
  return ok({ report, state: simState(), simulated: true });
});
