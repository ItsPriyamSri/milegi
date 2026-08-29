import type { ActorRef, Case, CaseEvent, Stage } from "./types";
import { addDays, earliest, iso } from "./clock";
import { calendarFor } from "./config/calendar";
import { REASONS } from "./config/reasons";
import { STAGE_LABELS_EN, STAGE_LABELS_HI } from "./config/schemes";
import { districtEn, districtHi } from "./config/districts";
import { getInstitute } from "./store";

export const TRANSITIONS: Record<Stage, Stage[]> = {
  draft: ["institute_review", "lapsed"],
  institute_review: ["university_scrutiny", "dwo_review", "returned_to_student"],
  returned_to_student: ["institute_review", "lapsed"],
  university_scrutiny: ["dwo_review"],
  dwo_review: ["sanctioned", "correction_required", "rejected"],
  correction_required: ["dwo_review", "lapsed"],
  sanctioned: ["pfms_processing"],
  pfms_processing: ["paid", "payment_failed"],
  payment_failed: ["pfms_processing"],
  paid: [],
  rejected: [],
  lapsed: [],
};

const TERMINAL: Stage[] = ["paid", "rejected", "lapsed"];

export function isTerminal(stage: Stage): boolean {
  return TERMINAL.includes(stage);
}

export const SYSTEM_ACTOR: ActorRef = {
  role: "treasury",
  nameHi: "कोषागार / भुगतान प्रणाली",
  nameEn: "Treasury / payment system",
  designationHi: "स्वचालित चरण",
  designationEn: "Automatic stage",
  orgHi: "PFMS (नकली)",
  orgEn: "PFMS (mock)",
};

export const STUDENT_ACTOR: ActorRef = {
  role: "student",
  nameHi: "आप",
  nameEn: "You",
  designationHi: "आवेदक",
  designationEn: "Applicant",
  orgHi: "—",
  orgEn: "—",
};

export const MONITOR_ACTOR: ActorRef = {
  role: "treasury",
  nameHi: "मिलेगी अनुश्रवण",
  nameEn: "Milegi monitor",
  designationHi: "स्वचालित",
  designationEn: "Automatic",
  orgHi: "प्रणाली",
  orgEn: "System",
};

export function ownerFor(c: Case, stage: Stage): ActorRef | null {
  const inst = getInstitute(c.instituteId);
  switch (stage) {
    case "draft":
    case "correction_required":
    case "returned_to_student":
    case "payment_failed":
      return STUDENT_ACTOR;
    case "institute_review":
      return (
        inst?.clerk ?? {
          role: "institute",
          nameHi: "संस्थान लिपिक",
          nameEn: "Institute clerk",
          designationHi: "छात्रवृत्ति लिपिक",
          designationEn: "Scholarship clerk",
          orgHi: "—",
          orgEn: "—",
        }
      );
    case "university_scrutiny":
      return {
        role: "university",
        nameHi: "सम्बद्धता अनुभाग",
        nameEn: "Affiliation cell",
        designationHi: "शुल्क सत्यापन",
        designationEn: "Fee scrutiny",
        orgHi: inst?.affiliatedTo ?? "सम्बद्ध विश्वविद्यालय",
        orgEn: inst?.affiliatedTo ?? "Affiliating university",
      };
    case "dwo_review":
      return {
        role: "dwo",
        nameHi: "जिला समाज कल्याण कार्यालय",
        nameEn: "District Social Welfare Office",
        designationHi: "जिला छात्रवृत्ति समिति",
        designationEn: "District scholarship committee",
        orgHi: districtHi(String(c.form.districtCode ?? "")),
        orgEn: districtEn(String(c.form.districtCode ?? "")),
        contactHint: "विकास भवन / कल्याण भवन",
      };
    case "sanctioned":
    case "pfms_processing":
      return SYSTEM_ACTOR;
    default:
      return null;
  }
}

export function dueAtFor(c: Case, stage: Stage, at: string): string | null {
  const cal = calendarFor(c.track, c.cycle);
  switch (stage) {
    case "draft":
      return cal.studentDeadline;
    case "institute_review":
      return earliest(cal.instituteForwardDeadline, addDays(at, 7));
    case "returned_to_student":
      return earliest(cal.studentDeadline, addDays(at, 5));
    case "university_scrutiny":
      return earliest(cal.dwoWindowFrom, addDays(at, 10));
    case "dwo_review":
      return earliest(cal.dwoWindowEnd, addDays(at, 15));
    case "correction_required":
      return cal.correctionClose;
    case "sanctioned":
      return cal.disbursementTo;
    case "pfms_processing":
      return addDays(at, 7);
    case "payment_failed":
      return addDays(at, 15);
    default:
      return null;
  }
}

export function appendEvent(c: Case, event: CaseEvent): void {
  c.events.push(event);
  c.updatedAt = event.at;
}

export function assertOwned(c: Case): void {
  if (isTerminal(c.stage)) {
    if (c.owner !== null || c.dueAt !== null) {
      throw new Error(`invariant: terminal stage ${c.stage} must have no owner or dueAt`);
    }
    return;
  }
  if (!c.owner || !c.dueAt) {
    throw new Error(`invariant: stage ${c.stage} has no ${!c.owner ? "owner" : "dueAt"}`);
  }
}

const ENTRY_SUMMARY: Record<Stage, { hi: string; en: string }> = {
  draft: { hi: "आवेदन शुरू हुआ", en: "Application started" },
  institute_review: {
    hi: "आवेदन लॉक हुआ और संस्थान के पास पहुँचा",
    en: "Locked and sent to the institute",
  },
  returned_to_student: {
    hi: "संस्थान ने सुधार के लिए वापस भेजा",
    en: "Returned by the institute",
  },
  university_scrutiny: {
    hi: "संस्थान ने अग्रसारित किया; सम्बद्ध विश्वविद्यालय में शुल्क सत्यापन",
    en: "Forwarded; fee scrutiny at the affiliating university",
  },
  dwo_review: {
    hi: "जिला समाज कल्याण कार्यालय में सत्यापन",
    en: "With the district welfare office",
  },
  correction_required: {
    hi: "जाँच में आपत्ति — सुधार आवश्यक",
    en: "Flagged in scrutiny — correction required",
  },
  sanctioned: { hi: "स्वीकृत — भुगतान के लिए भेजा गया", en: "Sanctioned for payment" },
  pfms_processing: { hi: "PFMS/बैंक में भुगतान प्रक्रिया", en: "Payment processing at PFMS/bank" },
  payment_failed: { hi: "भुगतान बैंक स्तर पर लौटा", en: "Payment returned by the bank" },
  paid: { hi: "भुगतान खाते में पहुँचा", en: "Paid" },
  rejected: { hi: "आवेदन अस्वीकृत", en: "Rejected" },
  lapsed: { hi: "समय सीमा बीत गई", en: "Deadline lapsed" },
};

function eventTypeFor(from: Stage, to: Stage): string {
  if (to === "institute_review" && from === "draft") return "locked";
  if (to === "institute_review" && from === "returned_to_student") return "resubmitted";
  if (to === "university_scrutiny") return "institute_forwarded";
  if (to === "dwo_review" && from === "correction_required") return "correction_submitted";
  if (to === "dwo_review" && from === "university_scrutiny") return "university_verified";
  if (to === "correction_required") return "dwo_flagged";
  if (to === "returned_to_student") return "institute_returned";
  return `entered_${to}`;
}

export function stageLabelHi(stage: Stage): string {
  return STAGE_LABELS_HI[stage] ?? stage;
}

export function stageLabelEn(stage: Stage): string {
  return STAGE_LABELS_EN[stage] ?? stage;
}

export function transition(
  input: Case,
  to: Stage,
  actor: ActorRef,
  opts: { reasonCode?: string; note?: string; at?: string } = {},
): Case {
  const c: Case = structuredClone(input);
  const at = opts.at ?? iso();
  if (!TRANSITIONS[c.stage].includes(to)) {
    throw new Error(`transition ${c.stage} → ${to} is not allowed`);
  }
  const type = eventTypeFor(c.stage, to);

  if (to === "institute_review" && c.stage === "draft") {
    // Locking starts the physical 3-day hard-copy obligation, which the real portal never shows.
    c.hardCopy.dueAt = addDays(at, 3);
  }
  if (to === "correction_required") {
    const cal = calendarFor(c.track, c.cycle);
    c.correction = {
      openAt: cal.correctionOpen,
      closeAt: cal.correctionClose,
      usedAt: null,
      fields: c.flags.map((f) => f.code),
    };
  }
  if (to === "rejected" && opts.reasonCode) {
    c.flags.push({
      code: opts.reasonCode,
      at,
      by: actor,
      ...(opts.note ? { note: opts.note } : {}),
    });
  }

  c.stage = to;
  c.stageEnteredAt = at;
  c.owner = ownerFor(c, to);
  c.dueAt = dueAtFor(c, to, at);

  const reason = opts.reasonCode ? ` — ${REASONS[opts.reasonCode]?.hi ?? opts.reasonCode}` : "";
  appendEvent(c, {
    at,
    type,
    actor,
    summaryHi: ENTRY_SUMMARY[to].hi + reason,
    summaryEn: ENTRY_SUMMARY[to].en,
    ...(opts.reasonCode ? { data: { reasonCode: opts.reasonCode } } : {}),
  });

  assertOwned(c);
  return c;
}
