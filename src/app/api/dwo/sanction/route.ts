import { handler, ok, readJson } from "@/server/http";
import { AppError } from "@/server/errors";
import { requireRole } from "@/server/session-cookie";
import { sanctionBatch } from "@/server/dwo";
import { districtHi } from "@/server/config/districts";
import { getCase, putCase } from "@/server/store";

export const POST = handler(async (req) => {
  const session = await requireRole("dwo");
  const body = await readJson(req);
  const ids = Array.isArray(body.caseIds) ? body.caseIds.map(String) : [];
  if (ids.length === 0) {
    throw new AppError("NOTHING_SELECTED", {
      hi: "कोई फ़ाइल चुनी नहीं गई।",
      en: "No cases selected.",
      status: 422,
    });
  }
  const officer = {
    role: "dwo" as const,
    nameHi: "जिला समाज कल्याण कार्यालय",
    designationHi: "स्वीकृति",
    orgHi: districtHi(session.subjectId),
  };
  const cases = ids
    .map((id) => getCase(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .filter((c) => String(c.form.districtCode ?? "") === session.subjectId);
  const result = sanctionBatch(cases, officer);
  for (const c of result.sanctioned) putCase(c);
  return ok({
    sanctioned: result.sanctioned.map((c) => c.id),
    refused: result.refused,
    totalEstimate: result.sanctioned.reduce((sum, c) => sum + c.estimate.total, 0),
  });
});
