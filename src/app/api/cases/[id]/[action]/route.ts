import { handler, ok, readJson } from "@/server/http";
import { AppError } from "@/server/errors";
import { iso } from "@/server/clock";
import { requireRole } from "@/server/session-cookie";
import { caseView, lockCase, requeuePayment, runPreflightOn } from "@/server/cases";
import { nudge } from "@/server/alerts";
import { raiseFeeDispute } from "@/server/fees";
import { grievanceDraft } from "@/server/grievance";
import { STUDENT_ACTOR, transition } from "@/server/machine";
import { verifyCertificate } from "@/server/external/edistrict";
import { getCase, getProfile, notificationsFor, putCase } from "@/server/store";
import { addYears } from "@/server/clock";

export const POST = handler(async (req, { params }) => {
  const { id, action } = await params;
  const session = await requireRole("student");
  const existing = getCase(id);
  if (!existing) {
    throw new AppError("CASE_NOT_FOUND", {
      hi: "यह आवेदन नहीं मिला।",
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
  const profile = getProfile(existing.profileId)!;

  switch (action) {
    case "preflight": {
      const updated = runPreflightOn(existing, profile);
      putCase(updated);
      return ok({ case: caseView(updated) });
    }

    case "verify-certificate": {
      const body = await readJson(req);
      const kind = String(body.kind) === "caste" ? "caste" : "income";
      const applicationNo = String(body.applicationNo ?? "").trim();
      const certNo = String(body.certNo ?? "").trim();
      const result = verifyCertificate({ kind, applicationNo, certNo });
      const updated = structuredClone(existing);
      if (result.state === "ok") {
        updated.certificates[kind] = {
          applicationNo: result.applicationNo,
          certNo: result.certNo,
          issuedOn: result.issuedOn,
          expiresOn: kind === "income" ? result.expiresOn : addYears(result.issuedOn, 3),
          ...(result.annualIncome !== undefined ? { annualIncome: result.annualIncome } : {}),
          verifiedAt: iso(),
          state: "ok",
        };
        updated.form[kind === "income" ? "incomeCertNo" : "casteCertNo"] = certNo;
        updated.form[kind === "income" ? "incomeAppNo" : "casteAppNo"] = applicationNo;
        if (kind === "income" && result.annualIncome !== undefined) {
          updated.form.annualIncome = result.annualIncome;
        }
      } else {
        updated.certificates[kind] = {
          applicationNo,
          certNo,
          issuedOn: "",
          state: "not_found",
        };
      }
      const withPreflight = runPreflightOn(updated, profile);
      putCase(withPreflight);
      return ok({ case: caseView(withPreflight), result });
    }

    case "lock": {
      const refreshed = runPreflightOn(existing, profile);
      const locked = lockCase(refreshed);
      return ok({ case: caseView(locked) });
    }

    case "resubmit": {
      if (existing.stage !== "returned_to_student" && existing.stage !== "correction_required") {
        throw new AppError("WRONG_STAGE", {
          hi: "इस चरण पर दोबारा जमा करने की ज़रूरत नहीं है।",
          en: "Nothing to resubmit at this stage.",
          status: 409,
        });
      }
      const next = existing.stage === "returned_to_student" ? "institute_review" : "dwo_review";
      const moved = transition(existing, next, STUDENT_ACTOR);
      if (next === "institute_review") moved.hardCopy.receivedAt = null;
      putCase(moved);
      return ok({ case: caseView(moved) });
    }

    case "retry-payment": {
      const updated = requeuePayment(existing);
      putCase(updated);
      return ok({ case: caseView(updated) });
    }

    case "fee-dispute": {
      const body = await readJson(req);
      const note = String(body.note ?? "").trim().slice(0, 200);
      const updated = raiseFeeDispute(
        existing,
        note || "रसीद की राशि मास्टर डेटा से मेल नहीं खा रही",
        STUDENT_ACTOR,
        body.amount ? Number(body.amount) : undefined,
      );
      putCase(updated);
      return ok({ case: caseView(updated) });
    }

    case "nudge": {
      const updated = nudge(existing, STUDENT_ACTOR);
      putCase(updated);
      return ok({ case: caseView(updated) });
    }

    case "grievance": {
      const draft = grievanceDraft(existing, {
        nameHi: profile.nameHi,
        otr: profile.otr,
        mobile: profile.mobile,
      });
      const updated = structuredClone(existing);
      updated.grievanceDraftAt = iso();
      updated.events.push({
        at: iso(),
        type: "grievance_drafted",
        actor: STUDENT_ACTOR,
        summaryHi: "शिकायत का मसौदा तैयार किया गया (भेजना छात्र के हाथ में है)",
        summaryEn: "A grievance draft was prepared; sending it stays with the student",
      });
      putCase(updated);
      return ok({ case: caseView(updated), draft });
    }

    case "notifications":
      return ok({ notifications: notificationsFor(existing.id) });

    default:
      throw new AppError("UNKNOWN_ACTION", {
        hi: "यह क्रिया उपलब्ध नहीं है।",
        en: `Unknown action ${action}.`,
        status: 404,
      });
  }
});
