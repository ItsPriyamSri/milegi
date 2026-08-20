import { handler, ok } from "@/server/http";
import { AppError } from "@/server/errors";
import { requireRole } from "@/server/session-cookie";
import { caseView } from "@/server/cases";
import { getCase } from "@/server/store";

export const GET = handler(async (_req, { params }) => {
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
  return ok({ case: caseView(existing) });
});
