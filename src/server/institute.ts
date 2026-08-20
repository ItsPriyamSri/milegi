import type { ActorRef, Case, Institute } from "./types";
import { iso } from "./clock";
import { REASONS } from "./config/reasons";
import { AppError } from "./errors";
import { breachDays, waitingDays } from "./alerts";
import { appendEvent, stageLabelHi, transition } from "./machine";
import { sendNotification } from "./notify";
import { allCases, getInstitute, getProfile, putInstitute } from "./store";

export const ATTENDANCE_MIN = 75;

export function receiveHardCopy(input: Case, actor: ActorRef, at: string = iso()): Case {
  const c: Case = structuredClone(input);
  if (c.hardCopy.receivedAt) return c;
  c.hardCopy.receivedAt = at;
  appendEvent(c, {
    at,
    type: "hardcopy_received",
    actor,
    summaryHi: "संस्थान ने हार्ड कॉपी प्राप्त दर्ज की",
    summaryEn: "The institute recorded the hard copy as received",
  });
  sendNotification(c, "hardcopy_received", `फ़ाइल ${c.id}: कॉलेज ने हार्ड कॉपी प्राप्त दर्ज कर ली`);
  return c;
}

export function setAttendance(input: Case, percent: number, actor: ActorRef): Case {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new AppError("BAD_ATTENDANCE", {
      hi: "उपस्थिति 0 से 100 के बीच होनी चाहिए।",
      en: "Attendance must be between 0 and 100.",
      status: 422,
    });
  }
  const c: Case = structuredClone(input);
  const at = iso();
  c.attendancePercent = percent;
  appendEvent(c, {
    at,
    type: "attendance_set",
    actor,
    summaryHi: `संस्थान ने उपस्थिति ${percent}% दर्ज की`,
    summaryEn: `Institute recorded attendance at ${percent}%`,
    data: { percent },
  });
  return c;
}

export function forwardCase(input: Case, actor: ActorRef): Case {
  if (input.stage !== "institute_review") {
    throw new AppError("WRONG_STAGE", {
      hi: `यह फ़ाइल इस समय "${stageLabelHi(input.stage)}" पर है, संस्थान से अग्रसारित नहीं हो सकती।`,
      en: `The case is at ${input.stage} and cannot be forwarded.`,
      status: 409,
    });
  }
  if (!input.hardCopy.receivedAt) {
    throw new AppError("HARDCOPY_MISSING", {
      hi: "हार्ड कॉपी प्राप्त दर्ज नहीं है — कागज़ मिलने के बाद ही फ़ाइल अग्रसारित हो सकती है।",
      en: "The hard copy has not been recorded as received.",
      status: 409,
    });
  }
  if (input.attendancePercent === null) {
    throw new AppError("ATTENDANCE_MISSING", {
      hi: "अग्रसारित करने से पहले उपस्थिति प्रतिशत दर्ज करें।",
      en: "Record the attendance percentage before forwarding.",
      status: 422,
    });
  }
  if (input.attendancePercent < ATTENDANCE_MIN) {
    throw new AppError("ATTENDANCE_LOW", {
      hi: `${REASONS.ATTENDANCE_BELOW_75.hi} (${input.attendancePercent}%). ${REASONS.ATTENDANCE_BELOW_75.fixHi}`,
      en: REASONS.ATTENDANCE_BELOW_75.en,
      status: 409,
    });
  }
  const inst = getInstitute(input.instituteId);
  const next = inst?.affiliatedTo ? "university_scrutiny" : "dwo_review";
  const c = transition(input, next, actor);
  sendNotification(
    c,
    "forwarded",
    `फ़ाइल ${c.id} संस्थान से आगे भेज दी गई — अब ${c.owner?.nameHi ?? "—"} के पास`,
  );
  return c;
}

export function returnCase(input: Case, code: string, note: string, actor: ActorRef): Case {
  const reason = REASONS[code];
  if (!reason) {
    throw new AppError("BAD_REASON_CODE", {
      hi: "वापस भेजने के लिए सूची में से कारण कोड चुनना ज़रूरी है।",
      en: "A known reason code is required to return a case.",
      status: 422,
    });
  }
  if (input.stage !== "institute_review") {
    throw new AppError("WRONG_STAGE", {
      hi: `यह फ़ाइल "${stageLabelHi(input.stage)}" पर है, संस्थान से वापस नहीं भेजी जा सकती।`,
      en: `Cannot return from ${input.stage}.`,
      status: 409,
    });
  }
  const withFlag: Case = structuredClone(input);
  withFlag.flags.push({ code, at: iso(), by: actor, ...(note ? { note } : {}) });
  const c = transition(withFlag, "returned_to_student", actor, { reasonCode: code, note });
  sendNotification(
    c,
    `returned_${code}`,
    `फ़ाइल ${c.id} सुधार के लिए वापस: ${reason.hi}. करना है: ${reason.fixHi}`,
  );
  return c;
}

export function publishCourse(
  instituteId: string,
  input: { code: string; tuition: number; nameHi?: string; group?: Institute["courses"][number]["group"] },
  _actor: ActorRef,
): Institute {
  const inst = getInstitute(instituteId);
  if (!inst) {
    throw new AppError("INSTITUTE_NOT_FOUND", {
      hi: "संस्थान नहीं मिला।",
      en: "Institute not found.",
      status: 404,
    });
  }
  const copy: Institute = structuredClone(inst);
  const existing = copy.courses.find((c) => c.code === input.code);
  const at = iso();
  if (existing) {
    existing.feeHeads.tuition = input.tuition;
    existing.publishedAt = at;
    if (input.nameHi) existing.nameHi = input.nameHi;
  } else {
    copy.courses.push({
      code: input.code,
      nameHi: input.nameHi ?? input.code,
      nameEn: input.code,
      group: input.group ?? "general",
      years: 3,
      feeHeads: {
        tuition: input.tuition,
        exam: 0,
        hostel: 0,
        mess: 0,
        caution: 0,
        library: 0,
        other: 0,
      },
      publishedAt: at,
    });
  }
  copy.masterDataPublishedAt = copy.masterDataPublishedAt ?? at;
  putInstitute(copy);
  return copy;
}

export function unpublishCourse(instituteId: string, code: string): Institute {
  const inst = getInstitute(instituteId);
  if (!inst) {
    throw new AppError("INSTITUTE_NOT_FOUND", { hi: "संस्थान नहीं मिला।", en: "Not found", status: 404 });
  }
  const copy: Institute = structuredClone(inst);
  const course = copy.courses.find((c) => c.code === code);
  if (course) course.publishedAt = null;
  putInstitute(copy);
  return copy;
}

export type QueueRow = {
  caseId: string;
  studentNameHi: string;
  courseNameHi: string;
  stage: Case["stage"];
  stageHi: string;
  waitingDays: number;
  breachDays: number;
  dueAt: string | null;
  hardCopyReceived: boolean;
  attendancePercent: number | null;
  feeDisputed: boolean;
  flags: string[];
};

export function instituteQueue(
  instituteId: string,
  filter: "all" | "pending" | "breach" | "hardcopy" | "forwarded" = "all",
  nowIso: string = iso(),
): QueueRow[] {
  const inst = getInstitute(instituteId);
  const rows = allCases()
    .filter((c) => c.instituteId === instituteId && c.stage !== "draft")
    .map((c) => {
      const course = inst?.courses.find((x) => x.code === c.courseCode);
      return {
        caseId: c.id,
        studentNameHi: getProfile(c.profileId)?.nameHi ?? "—",
        courseNameHi: course?.nameHi ?? c.courseCode,
        stage: c.stage,
        stageHi: stageLabelHi(c.stage),
        waitingDays: waitingDays(c, nowIso),
        breachDays: breachDays(c, nowIso),
        dueAt: c.dueAt,
        hardCopyReceived: Boolean(c.hardCopy.receivedAt),
        attendancePercent: c.attendancePercent,
        feeDisputed: Boolean(c.fee.disputed),
        flags: c.flags.map((f) => f.code),
      };
    });
  const filtered = rows.filter((r) => {
    if (filter === "pending") return r.stage === "institute_review";
    if (filter === "breach") return r.breachDays > 0;
    if (filter === "hardcopy") return r.stage === "institute_review" && !r.hardCopyReceived;
    if (filter === "forwarded") return r.stage !== "institute_review";
    return true;
  });
  return filtered.sort((a, b) => b.breachDays - a.breachDays || b.waitingDays - a.waitingDays);
}
