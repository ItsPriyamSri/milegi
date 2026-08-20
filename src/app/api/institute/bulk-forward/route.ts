import { handler, ok, readJson } from "@/server/http";
import { AppError } from "@/server/errors";
import { requireRole } from "@/server/session-cookie";
import { forwardCase } from "@/server/institute";
import { getCase, getInstitute, putCase } from "@/server/store";

export const POST = handler(async (req) => {
  const session = await requireRole("institute");
  const body = await readJson(req);
  const ids = Array.isArray(body.caseIds) ? body.caseIds.map(String) : [];
  if (ids.length === 0) {
    throw new AppError("NOTHING_SELECTED", {
      hi: "कोई फ़ाइल चुनी नहीं गई।",
      en: "No cases selected.",
      status: 422,
    });
  }
  const clerk = getInstitute(session.subjectId)!.clerk;
  const forwarded: string[] = [];
  const refused: { id: string; reasonHi: string }[] = [];
  for (const id of ids) {
    const existing = getCase(id);
    if (!existing || existing.instituteId !== session.subjectId) {
      refused.push({ id, reasonHi: "यह फ़ाइल आपके संस्थान की नहीं है।" });
      continue;
    }
    try {
      const updated = forwardCase(existing, clerk);
      putCase(updated);
      forwarded.push(id);
    } catch (e) {
      refused.push({ id, reasonHi: e instanceof AppError ? e.hi : "अग्रसारित नहीं हो सकी।" });
    }
  }
  return ok({ forwarded, refused });
});
