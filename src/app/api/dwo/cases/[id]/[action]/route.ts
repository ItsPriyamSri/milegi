import { handler, ok, readJson } from "@/server/http";
import { AppError } from "@/server/errors";
import { requireRole } from "@/server/session-cookie";
import { caseView } from "@/server/cases";
import { crossCheck, flagCase, rejectCase, verifyCase } from "@/server/dwo";
import { districtHi } from "@/server/config/districts";
import { getCase, putCase } from "@/server/store";

export const POST = handler(async (req, { params }) => {
  const { id, action } = await params;
  const session = await requireRole("dwo");
  const existing = getCase(id);
  if (!existing) {
    throw new AppError("CASE_NOT_FOUND", { hi: "फ़ाइल नहीं मिली।", en: "Case not found.", status: 404 });
  }
  if (String(existing.form.districtCode ?? "") !== session.subjectId) {
    throw new AppError("FORBIDDEN", {
      hi: "यह फ़ाइल आपके जिले की नहीं है।",
      en: "This case belongs to another district.",
      status: 403,
    });
  }
  const officer = {
    role: "dwo" as const,
    nameHi: "जिला समाज कल्याण कार्यालय",
    designationHi: "जिला छात्रवृत्ति समिति",
    orgHi: districtHi(session.subjectId),
  };

  switch (action) {
    case "crosscheck":
      return ok({ checks: crossCheck(existing), case: caseView(existing) });
    case "verify": {
      const updated = verifyCase(existing, officer);
      putCase(updated);
      return ok({ case: caseView(updated) });
    }
    case "flag": {
      const body = await readJson(req);
      const codes = Array.isArray(body.codes) ? body.codes.map(String) : [];
      const updated = flagCase(existing, codes, String(body.note ?? "").slice(0, 200), officer);
      putCase(updated);
      return ok({ case: caseView(updated) });
    }
    case "reject": {
      const body = await readJson(req);
      const updated = rejectCase(
        existing,
        String(body.code ?? ""),
        String(body.note ?? "").slice(0, 200),
        officer,
      );
      putCase(updated);
      return ok({ case: caseView(updated) });
    }
    default:
      throw new AppError("UNKNOWN_ACTION", {
        hi: "यह क्रिया उपलब्ध नहीं है।",
        en: `Unknown action ${action}.`,
        status: 404,
      });
  }
});
