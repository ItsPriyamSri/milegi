import type { Case } from "./types";
import { iso } from "./clock";
import { getInstitute, nextCaseId } from "./store";
import { dueAtFor, ownerFor } from "./machine";
import { estimateFor } from "./fees";

/** Test-only factory so every suite builds the same shaped case. */
export function makeDraftCase(over: Partial<Case> = {}): Case {
  const at = iso();
  const instituteId = over.instituteId ?? "inst-csjmu-arts";
  const courseCode = over.courseCode ?? "BSC";
  const course = getInstitute(instituteId)?.courses.find((c) => c.code === courseCode);
  const base: Case = {
    id: nextCaseId(),
    session: "2026-27",
    profileId: "prf_test0001",
    track: "dashmottar",
    cycle: "renewal",
    registrationNo: "",
    instituteId,
    courseCode,
    stage: "draft",
    stageEnteredAt: at,
    owner: null,
    dueAt: null,
    form: { districtCode: "70", yearOfStudy: 2, hosteller: false },
    preflight: [],
    certificates: {},
    fee: {
      heads:
        course?.feeHeads ??
        { tuition: 0, exam: 0, hostel: 0, mess: 0, caution: 0, library: 0, other: 0 },
      nonRefundable: course?.feeHeads.tuition ?? 0,
    },
    estimate: {
      feeReimbursement: 0,
      maintenancePerMonth: 0,
      months: 0,
      total: 0,
      basisHi: "—",
    },
    hardCopy: { dueAt: null, receivedAt: null },
    attendancePercent: null,
    flags: [],
    correction: null,
    payment: {},
    escalations: [],
    grievanceDraftAt: null,
    events: [
      {
        at,
        type: "created",
        actor: { role: "student", nameHi: "आप", designationHi: "आवेदक", orgHi: "—" },
        summaryHi: "आवेदन शुरू हुआ",
        summaryEn: "Application started",
      },
    ],
    updatedAt: at,
    ...over,
  };
  base.owner = ownerFor(base, base.stage);
  base.dueAt = dueAtFor(base, base.stage, at);
  base.estimate = estimateFor(base);
  return base;
}
