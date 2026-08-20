import type { ActorRef, Case } from "./types";
import { iso, isBefore } from "./clock";
import { calendarFor } from "./config/calendar";
import { REASONS } from "./config/reasons";
import { districtHi } from "./config/districts";
import { AppError } from "./errors";
import { breachDays, waitingDays } from "./alerts";
import { stageLabelHi, transition } from "./machine";
import { sendNotification } from "./notify";
import { matchBoardRoll, matchEnrolment } from "./external/boards";
import { verifyCertificate } from "./external/edistrict";
import { ATTENDANCE_MIN } from "./institute";
import { allCases, getInstitute, getProfile } from "./store";

export type CrossCheckResult = {
  id: "board" | "enrolment" | "income" | "duplicate_income" | "attendance";
  labelHi: string;
  matched: boolean;
  /** true when the check itself could not run (upstream down) — never the student's fault. */
  unknown?: boolean;
  submitted: string;
  registry: string;
  detailHi: string;
  reasonCode?: string;
};

export function crossCheck(c: Case): CrossCheckResult[] {
  const out: CrossCheckResult[] = [];
  const cal = calendarFor(c.track, c.cycle);

  const board = String(c.form.boardName ?? "");
  const roll = String(c.form.boardRollNo ?? "");
  try {
    const r = matchBoardRoll({ board, rollNo: roll });
    out.push({
      id: "board",
      labelHi: "हाई स्कूल रोल नंबर",
      matched: r.matched,
      submitted: roll || "—",
      registry: r.registryValue ?? "—",
      detailHi: r.matched
        ? "बोर्ड डेटाबेस से मेल खा गया।"
        : REASONS.BOARD_ROLL_MISMATCH.hi,
      ...(r.reasonCode ? { reasonCode: r.reasonCode } : {}),
    });
  } catch (e) {
    out.push({
      id: "board",
      labelHi: "हाई स्कूल रोल नंबर",
      matched: false,
      unknown: true,
      submitted: roll || "—",
      registry: "—",
      detailHi: e instanceof AppError ? e.hi : "जाँच नहीं हो सकी।",
    });
  }

  const enrolment = String(c.form.enrolmentNo ?? "");
  if (enrolment) {
    try {
      const r = matchEnrolment({ instituteId: c.instituteId, enrolmentNo: enrolment });
      out.push({
        id: "enrolment",
        labelHi: "नामांकन संख्या",
        matched: r.matched,
        submitted: enrolment,
        registry: r.registryValue ?? "—",
        detailHi: r.matched ? "विश्वविद्यालय मास्टर डेटा से मेल खा गया।" : REASONS.ENROLMENT_MISMATCH.hi,
        ...(r.reasonCode ? { reasonCode: r.reasonCode } : {}),
      });
    } catch (e) {
      out.push({
        id: "enrolment",
        labelHi: "नामांकन संख्या",
        matched: false,
        unknown: true,
        submitted: enrolment,
        registry: "—",
        detailHi: e instanceof AppError ? e.hi : "जाँच नहीं हो सकी।",
      });
    }
  }

  const certNo = String(c.form.incomeCertNo ?? "");
  const appNo = String(c.form.incomeAppNo ?? "");
  if (certNo && appNo) {
    try {
      const r = verifyCertificate({ kind: "income", applicationNo: appNo, certNo });
      if (r.state === "not_found") {
        out.push({
          id: "income",
          labelHi: "आय प्रमाणपत्र",
          matched: false,
          submitted: certNo,
          registry: "—",
          detailHi: "ई-डिस्ट्रिक्ट रिकॉर्ड में यह प्रमाणपत्र नहीं मिला।",
          reasonCode: "INCOME_CERT_EXPIRED",
        });
      } else {
        const expiresBeforePayment = isBefore(r.expiresOn, cal.disbursementTo);
        out.push({
          id: "income",
          labelHi: "आय प्रमाणपत्र",
          matched: !expiresBeforePayment,
          submitted: certNo,
          registry: `जारी ${r.issuedOn.slice(0, 10)}, वैध ${r.expiresOn.slice(0, 10)} तक`,
          detailHi: expiresBeforePayment
            ? `भुगतान अवधि (${cal.disbursementTo.slice(0, 10)}) से पहले वैधता खत्म।`
            : "वैध है और भुगतान अवधि तक चलेगा।",
          ...(expiresBeforePayment ? { reasonCode: "INCOME_CERT_EXPIRED" } : {}),
        });
      }
    } catch (e) {
      out.push({
        id: "income",
        labelHi: "आय प्रमाणपत्र",
        matched: false,
        unknown: true,
        submitted: certNo,
        registry: "—",
        detailHi: e instanceof AppError ? e.hi : "जाँच नहीं हो सकी।",
      });
    }

    const duplicate = allCases().find(
      (other) => other.id !== c.id && String(other.form.incomeCertNo ?? "") === certNo,
    );
    out.push({
      id: "duplicate_income",
      labelHi: "आय प्रमाणपत्र की पुनरावृत्ति",
      matched: !duplicate,
      submitted: certNo,
      registry: duplicate ? duplicate.id : "—",
      detailHi: duplicate ? REASONS.DUPLICATE_INCOME_CERT.hi : "किसी अन्य आवेदन में दर्ज नहीं।",
      ...(duplicate ? { reasonCode: "DUPLICATE_INCOME_CERT" } : {}),
    });
  }

  const attendance = c.attendancePercent;
  out.push({
    id: "attendance",
    labelHi: "उपस्थिति",
    matched: attendance !== null && attendance >= ATTENDANCE_MIN,
    submitted: attendance === null ? "दर्ज नहीं" : `${attendance}%`,
    registry: `न्यूनतम ${ATTENDANCE_MIN}%`,
    detailHi:
      attendance === null
        ? "संस्थान ने उपस्थिति दर्ज नहीं की।"
        : attendance >= ATTENDANCE_MIN
          ? "नियम के भीतर।"
          : REASONS.ATTENDANCE_BELOW_75.hi,
    ...(attendance !== null && attendance < ATTENDANCE_MIN
      ? { reasonCode: "ATTENDANCE_BELOW_75" }
      : {}),
  });

  return out;
}

function requireDwoStage(c: Case, verb: string): void {
  if (c.stage !== "dwo_review") {
    throw new AppError("WRONG_STAGE", {
      hi: `यह फ़ाइल "${stageLabelHi(c.stage)}" पर है, इसलिए ${verb} नहीं की जा सकती।`,
      en: `Case is at ${c.stage}.`,
      status: 409,
    });
  }
}

export function verifyCase(input: Case, actor: ActorRef): Case {
  requireDwoStage(input, "स्वीकृति");
  const cal = calendarFor(input.track, input.cycle);
  const c = transition(input, "sanctioned", actor);
  sendNotification(
    c,
    "verified",
    `फ़ाइल ${c.id} जिला स्तर पर सत्यापित। भुगतान अवधि ${cal.disbursementFrom.slice(
      0,
      10,
    )} से ${cal.disbursementTo.slice(0, 10)}`,
  );
  return c;
}

export function flagCase(input: Case, codes: string[], note: string, actor: ActorRef): Case {
  requireDwoStage(input, "आपत्ति");
  if (codes.length === 0) {
    throw new AppError("BAD_REASON_CODE", {
      hi: "कम से कम एक कारण कोड चुनें।",
      en: "At least one reason code is required.",
      status: 422,
    });
  }
  for (const code of codes) {
    if (!REASONS[code]) {
      throw new AppError("BAD_REASON_CODE", {
        hi: `कारण कोड ${code} सूची में नहीं है।`,
        en: `Unknown reason code ${code}.`,
        status: 422,
      });
    }
  }
  const withFlags: Case = structuredClone(input);
  const at = iso();
  for (const code of codes) {
    withFlags.flags.push({ code, at, by: actor, ...(note ? { note } : {}) });
  }
  const c = transition(withFlags, "correction_required", actor, { reasonCode: codes[0], note });
  const notCorrectable = codes.filter((code) => !REASONS[code].correctable);
  if (notCorrectable.length > 0) {
    c.events.push({
      at,
      type: "flag_not_correctable",
      actor,
      summaryHi:
        `इनमें से कुछ आपत्तियाँ सुधार विंडो से ठीक नहीं होतीं: ` +
        notCorrectable.map((code) => `${REASONS[code].hi} → ${REASONS[code].fixHi}`).join(" | "),
      summaryEn: `Not fixable in the correction window: ${notCorrectable.join(", ")}`,
      data: { codes: notCorrectable },
    });
  }
  sendNotification(
    c,
    "flagged",
    `फ़ाइल ${c.id} में आपत्ति: ${codes.map((code) => REASONS[code].hi).join("; ")}. सुधार विंडो ${
      c.correction?.openAt.slice(0, 10) ?? "—"
    } से ${c.correction?.closeAt.slice(0, 10) ?? "—"}`,
  );
  return c;
}

export function rejectCase(input: Case, code: string, note: string, actor: ActorRef): Case {
  requireDwoStage(input, "अस्वीकृति");
  if (!REASONS[code]) {
    throw new AppError("BAD_REASON_CODE", {
      hi: "अस्वीकृति के लिए सूची में से कारण कोड चुनें।",
      en: "A known reason code is required to reject.",
      status: 422,
    });
  }
  const c = transition(input, "rejected", actor, { reasonCode: code, note });
  sendNotification(c, "rejected", `फ़ाइल ${c.id} अस्वीकृत: ${REASONS[code].hi}`);
  return c;
}

export function sanctionBatch(
  cases: Case[],
  actor: ActorRef,
): { sanctioned: Case[]; refused: { id: string; reasonHi: string }[] } {
  const sanctioned: Case[] = [];
  const refused: { id: string; reasonHi: string }[] = [];
  for (const c of cases) {
    if (c.stage !== "sanctioned") {
      refused.push({
        id: c.id,
        reasonHi: `"${stageLabelHi(c.stage)}" चरण पर है — स्वीकृति बैच में केवल सत्यापित फ़ाइलें जाती हैं।`,
      });
      continue;
    }
    const moved = transition(c, "pfms_processing", actor);
    sendNotification(moved, "sanction_batch", `फ़ाइल ${moved.id} भुगतान बैच में भेजी गई (PFMS)`);
    sanctioned.push(moved);
  }
  return { sanctioned, refused };
}

export type DwoRow = {
  caseId: string;
  studentNameHi: string;
  instituteNameHi: string;
  courseNameHi: string;
  categoryHi: string;
  stage: Case["stage"];
  stageHi: string;
  waitingDays: number;
  breachDays: number;
  estimateTotal: number;
  checks: { id: string; matched: boolean; unknown: boolean }[];
  flags: string[];
};

export function dwoQueue(
  districtCode: string,
  filter: "all" | "pending" | "flagged" | "breach" | "verified" = "all",
  nowIso: string = iso(),
): DwoRow[] {
  const rows = allCases()
    .filter((c) => String(c.form.districtCode ?? "") === districtCode && c.stage !== "draft")
    .map((c) => {
      const inst = getInstitute(c.instituteId);
      const course = inst?.courses.find((x) => x.code === c.courseCode);
      const checks =
        c.stage === "dwo_review"
          ? crossCheck(c).map((r) => ({ id: r.id, matched: r.matched, unknown: Boolean(r.unknown) }))
          : [];
      return {
        caseId: c.id,
        studentNameHi: getProfile(c.profileId)?.nameHi ?? "—",
        instituteNameHi: inst?.nameHi ?? "—",
        courseNameHi: course?.nameHi ?? c.courseCode,
        categoryHi: getProfile(c.profileId)?.category ?? "—",
        stage: c.stage,
        stageHi: stageLabelHi(c.stage),
        waitingDays: waitingDays(c, nowIso),
        breachDays: breachDays(c, nowIso),
        estimateTotal: c.estimate.total,
        checks,
        flags: c.flags.map((f) => f.code),
      };
    });
  const filtered = rows.filter((r) => {
    if (filter === "pending") return r.stage === "dwo_review";
    if (filter === "flagged") return r.stage === "correction_required" || r.flags.length > 0;
    if (filter === "breach") return r.breachDays > 0;
    if (filter === "verified") return ["sanctioned", "pfms_processing", "paid"].includes(r.stage);
    return true;
  });
  return filtered.sort((a, b) => b.breachDays - a.breachDays || b.waitingDays - a.waitingDays);
}

export function dwoDistrictLabel(code: string): string {
  return districtHi(code);
}
