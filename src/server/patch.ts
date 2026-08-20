import type { ActorRef, Case, Stage } from "./types";
import { iso } from "./clock";
import { FIELDS, validateField, validateAll } from "./fields";

export { validateField, validateAll };
import { SCHEMES } from "./config/schemes";
import { appendEvent } from "./machine";

export const EDITABLE_BY_STAGE: Record<Stage, "all_form" | "correction_only" | "none"> = {
  draft: "all_form",
  returned_to_student: "all_form",
  correction_required: "correction_only",
  institute_review: "none",
  university_scrutiny: "none",
  dwo_review: "none",
  sanctioned: "none",
  pfms_processing: "none",
  payment_failed: "none",
  paid: "none",
  rejected: "none",
  lapsed: "none",
};

/** Which fields a given DWO/institute objection actually unlocks in the correction window. */
export const CORRECTABLE_FIELDS: Record<string, string[]> = {
  BOARD_ROLL_MISMATCH: ["boardName", "boardRollNo"],
  ENROLMENT_MISMATCH: ["enrolmentNo"],
  INCOME_CERT_EXPIRED: ["incomeAppNo", "incomeCertNo", "annualIncome"],
  DUPLICATE_INCOME_CERT: [],
  BLOCKED_BY_DIRECTORATE: [],
  ATTENDANCE_BELOW_75: [],
  FEE_MISMATCH: [],
  HARDCOPY_NOT_RECEIVED: [],
};

export function applyPatch(
  input: Case,
  patch: Record<string, unknown>,
  actor: ActorRef,
): { case: Case; rejected: string[] } {
  const c: Case = structuredClone(input);
  const mode = EDITABLE_BY_STAGE[c.stage];
  const allowedByCorrection = new Set(
    c.flags.flatMap((f) => CORRECTABLE_FIELDS[f.code] ?? []),
  );
  const rejected: string[] = [];
  let changed = 0;

  for (const [key, value] of Object.entries(patch)) {
    const spec = FIELDS[key];
    const sectionAllowed = spec ? SCHEMES[c.track].sections.includes(spec.section) : false;
    const stageAllowed =
      mode === "all_form" ? true : mode === "correction_only" ? allowedByCorrection.has(key) : false;
    if (!spec || spec.readOnly || !sectionAllowed || !stageAllowed) {
      rejected.push(key);
      continue;
    }
    if (validateField(key, value, { ...c.form, ...patch })) {
      rejected.push(key);
      continue;
    }
    c.form[key] = value as never;
    changed += 1;
  }

  if (changed > 0) {
    c.updatedAt = iso();
    if (c.stage === "correction_required" && c.correction) {
      c.correction = { ...c.correction, usedAt: iso() };
    }
  }
  if (rejected.length > 0) {
    appendEvent(c, {
      at: iso(),
      type: "patch_rejected",
      actor,
      summaryHi: `कुछ फ़ील्ड इस चरण पर बदले नहीं जा सकते: ${rejected.join(", ")}`,
      summaryEn: `Fields not editable at this stage: ${rejected.join(", ")}`,
      data: { rejected },
    });
  }
  return { case: c, rejected };
}
