import { handler, ok, readJson, num } from "@/server/http";
import { AppError } from "@/server/errors";
import { requireRole } from "@/server/session-cookie";
import { caseView } from "@/server/cases";
import { forwardCase, receiveHardCopy, returnCase, setAttendance } from "@/server/institute";
import { crossCheck } from "@/server/dwo";
import { getCase, getInstitute, putCase } from "@/server/store";

export const POST = handler(async (req, { params }) => {
  const { id, action } = await params;
  const session = await requireRole("institute");
  const existing = getCase(id);
  if (!existing) {
    throw new AppError("CASE_NOT_FOUND", { hi: "फ़ाइल नहीं मिली।", en: "Case not found.", status: 404 });
  }
  if (existing.instituteId !== session.subjectId) {
    throw new AppError("FORBIDDEN", {
      hi: "यह फ़ाइल आपके संस्थान की नहीं है।",
      en: "This case belongs to another institute.",
      status: 403,
    });
  }
  const clerk = getInstitute(session.subjectId)!.clerk;

  switch (action) {
    case "hardcopy": {
      const updated = receiveHardCopy(existing, clerk);
      putCase(updated);
      return ok({ case: caseView(updated) });
    }
    case "attendance": {
      const body = await readJson(req);
      const updated = setAttendance(existing, num(body.percent, { en: "Attendance", hi: "उपस्थिति" }), clerk);
      putCase(updated);
      return ok({ case: caseView(updated) });
    }
    case "forward": {
      const updated = forwardCase(existing, clerk);
      putCase(updated);
      return ok({ case: caseView(updated) });
    }
    case "return": {
      const body = await readJson(req);
      const updated = returnCase(
        existing,
        String(body.code ?? ""),
        String(body.note ?? "").slice(0, 200),
        clerk,
      );
      putCase(updated);
      return ok({ case: caseView(updated) });
    }
    case "checks":
      return ok({ checks: crossCheck(existing) });
    default:
      throw new AppError("UNKNOWN_ACTION", {
        hi: "यह क्रिया उपलब्ध नहीं है।",
        en: `Unknown action ${action}.`,
        status: 404,
      });
  }
});
