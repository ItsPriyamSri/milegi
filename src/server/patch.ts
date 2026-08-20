import type { ActorRef, Case, Stage } from "./types";
import { iso } from "./clock";
import { FIELDS, isRequired } from "./fields";
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

export function validateField(
  name: string,
  value: unknown,
  form: Record<string, unknown>,
): string | null {
  const spec = FIELDS[name];
  if (!spec) return "अज्ञात फ़ील्ड";
  if (spec.maxLen && String(value).length > spec.maxLen) return `अधिकतम ${spec.maxLen} अक्षर`;
  if (spec.options && value !== "" && value !== null && value !== undefined) {
    if (!spec.options.some((o) => o.value === String(value))) return "सूची में से चुनें";
  }
  return spec.validate ? spec.validate(value, form) : null;
}

export function validateAll(c: Case): { field: string; messageHi: string }[] {
  const scheme = SCHEMES[c.track];
  const out: { field: string; messageHi: string }[] = [];
  for (const spec of Object.values(FIELDS)) {
    if (!scheme.sections.includes(spec.section)) continue;
    if (spec.section === "previous_result" && c.cycle !== "renewal" && !scheme.needsMarks) continue;
    const required = isRequired(spec, { track: c.track, cycle: c.cycle });
    const value = c.form[spec.name];
    if (required && (value === undefined || value === null || value === "" || value === false)) {
      out.push({ field: spec.name, messageHi: `${spec.labelHi} भरना ज़रूरी है` });
      continue;
    }
    if (value !== undefined && value !== null && value !== "") {
      const msg = validateField(spec.name, value, c.form);
      if (msg) out.push({ field: spec.name, messageHi: msg });
    }
  }
  return out;
}

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
