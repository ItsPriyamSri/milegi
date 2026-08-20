import { handler, ok, readJson } from "@/server/http";
import { AppError } from "@/server/errors";
import { iso } from "@/server/clock";
import { requireRole } from "@/server/session-cookie";
import { caseView } from "@/server/cases";
import { estimateFor } from "@/server/fees";
import { STUDENT_ACTOR } from "@/server/machine";
import { applyPatch } from "@/server/patch";
import { getCase, putCase } from "@/server/store";

export const PATCH = handler(async (req, { params }) => {
  const { id } = await params;
  const session = await requireRole("student");
  const existing = getCase(id);
  if (!existing) {
    throw new AppError("CASE_NOT_FOUND", {
      hi: "यह आवेदन नहीं मिला। लिंक दोबारा जाँचें।",
      en: "Case not found.",
      status: 404,
    });
  }
  if (existing.profileId !== session.subjectId) {
    throw new AppError("FORBIDDEN", {
      hi: "यह आवेदन आपके खाते का नहीं है।",
      en: "Not your application.",
      status: 403,
    });
  }
  const patch = await readJson(req);
  const { case: updated, rejected } = applyPatch(existing, patch, STUDENT_ACTOR);
  updated.estimate = estimateFor(updated);
  putCase(updated);
  return ok({ case: caseView(updated), rejected, savedAt: iso() });
});
