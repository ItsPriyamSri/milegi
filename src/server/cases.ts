import type { ActorRef, Case, Cycle, Profile, TrackId } from "./types";
import { daysBetween, iso } from "./clock";
import { calendarFor } from "./config/calendar";
import { REASONS } from "./config/reasons";
import { SCHEMES } from "./config/schemes";
import { districtEn, districtHi } from "./config/districts";
import { AppError } from "./errors";
import { deriveAlerts, waitingDays as waitingDaysOf, breachDays as breachDaysOf } from "./alerts";
import { estimateFor, feeFor } from "./fees";
import { STUDENT_ACTOR, dueAtFor, ownerFor, stageLabelEn, stageLabelHi, transition } from "./machine";
import { sendNotification } from "./notify";
import { blockers, runPreflight, type PreflightCtx } from "./preflight";
import { validateAll } from "./patch";
import { casesForProfile, getInstitute, getProfile, nextCaseId, putCase } from "./store";

export function createCase(
  profile: Profile,
  input: { track: TrackId; cycle: Cycle; instituteId: string; courseCode: string },
): Case {
  const fee = feeFor(input.instituteId, input.courseCode);
  const inst = getInstitute(input.instituteId)!;
  const at = iso();
  const base: Case = {
    id: nextCaseId(),
    session: "2026-27",
    profileId: profile.id,
    track: input.track,
    cycle: input.cycle,
    registrationNo: "",
    instituteId: input.instituteId,
    courseCode: input.courseCode,
    stage: "draft",
    stageEnteredAt: at,
    owner: null,
    dueAt: null,
    form: {
      districtCode: inst.districtCode,
      aadhaarDemo: profile.aadhaarDemo,
      otr: profile.otr,
      hosteller: false,
    },
    preflight: [],
    certificates: {},
    fee: { heads: fee.heads, nonRefundable: fee.nonRefundable },
    estimate: { feeReimbursement: 0, maintenancePerMonth: 0, months: 0, total: 0, basisHi: "—" },
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
        actor: STUDENT_ACTOR,
        summaryHi: `आवेदन शुरू हुआ — ${SCHEMES[input.track].nameHi}, ${
          input.cycle === "renewal" ? "नवीनीकरण" : "नया आवेदन"
        }`,
        summaryEn: `Application started (${SCHEMES[input.track].nameEn}, ${input.cycle})`,
      },
    ],
    updatedAt: at,
  };
  base.owner = ownerFor(base, "draft");
  base.dueAt = dueAtFor(base, "draft", at);
  base.estimate = estimateFor(base);
  return base;
}

/** Renewal prefill: everything carries over except the three things that genuinely change. */
const NEVER_PREFILLED = ["resultStatus", "marksObtained", "marksTotal", "semesterCombined"];

export function prefillFromLastYear(profile: Profile, target: Case): Case {
  const previous = casesForProfile(profile.id)
    .filter((c) => c.id !== target.id && c.courseCode === target.courseCode)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  if (!previous) return target;

  const c: Case = structuredClone(target);
  for (const [key, value] of Object.entries(previous.form)) {
    if (NEVER_PREFILLED.includes(key)) continue;
    if (c.form[key] === undefined || c.form[key] === null || c.form[key] === "") {
      c.form[key] = value;
    }
  }
  const prevYear = Number(previous.form.yearOfStudy ?? 0);
  if (prevYear > 0) c.form.yearOfStudy = prevYear + 1;
  if (previous.certificates.income) c.certificates.income = previous.certificates.income;
  if (previous.certificates.caste) c.certificates.caste = previous.certificates.caste;
  c.estimate = estimateFor(c);
  c.events.push({
    at: iso(),
    type: "prefilled_from_last_year",
    actor: STUDENT_ACTOR,
    summaryHi:
      "पिछले वर्ष के आवेदन से जानकारी भर दी गई — केवल परिणाम, अंक और इस वर्ष का शुल्क जाँचें",
    summaryEn: "Prefilled from last year; only result, marks and this year's fee need checking",
    data: { from: previous.id },
  });
  c.updatedAt = iso();
  return c;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** 15 digits: 26 (session) + district(2) + track(1) + 10-digit sequence — mirrors the real shape. */
export function mintRegistrationNo(c: Case): string {
  const trackDigit = { pre_9_10: "1", post_inter: "2", dashmottar: "3", outside_state: "4" }[c.track];
  const district = String(c.form.districtCode ?? "00").replace(/\D/g, "").padStart(2, "0").slice(0, 2);
  const seq = String(Math.abs(hash(c.id))).padStart(10, "0").slice(0, 10);
  return `26${district}${trackDigit}${seq}`;
}

export function preflightCtxFor(c: Case, profile: Profile): PreflightCtx {
  return {
    track: c.track,
    cycle: c.cycle,
    category: profile.category,
    instituteId: c.instituteId,
    courseCode: c.courseCode,
    annualIncome: c.form.annualIncome === undefined || c.form.annualIncome === null
      ? null
      : Number(c.form.annualIncome),
    ...(c.form.incomeCertNo ? { incomeCertNo: String(c.form.incomeCertNo) } : {}),
    ...(c.form.incomeAppNo ? { incomeAppNo: String(c.form.incomeAppNo) } : {}),
    ...(c.form.casteCertNo ? { casteCertNo: String(c.form.casteCertNo) } : {}),
    ...(c.form.casteAppNo ? { casteAppNo: String(c.form.casteAppNo) } : {}),
    aadhaarDemo: profile.aadhaarDemo,
    otr: profile.otr,
    duplicateOtrs: profile.duplicateOtrs,
    hosteller: c.form.hosteller === true,
    previousResult: (c.form.resultStatus as PreflightCtx["previousResult"]) ?? null,
  };
}

export function runPreflightOn(input: Case, profile: Profile): Case {
  const c: Case = structuredClone(input);
  c.preflight = runPreflight(preflightCtxFor(c, profile));
  c.updatedAt = iso();
  return c;
}

export function lockCase(input: Case, actor: ActorRef = STUDENT_ACTOR): Case {
  const problems = validateAll(input);
  if (problems.length > 0) {
    throw new AppError("FORM_INCOMPLETE", {
      hi: `कुछ ज़रूरी जानकारी बाकी है: ${problems.map((p) => p.messageHi).join("; ")}`,
      en: `Incomplete: ${problems.map((p) => p.messageEn).join("; ")}`,
      status: 422,
    });
  }
  const blocking = blockers(input.preflight);
  if (blocking.length > 0) {
    throw new AppError("PREFLIGHT_BLOCKED", {
      hi: `लॉक करने से पहले यह ठीक करें — ${blocking.map((b) => b.titleHi).join("; ")}. ${
        blocking[0].detailHi
      }`,
      en: `Blocked: ${blocking.map((b) => b.titleEn).join("; ")}`,
      status: 422,
    });
  }
  const withReg: Case = { ...structuredClone(input), registrationNo: mintRegistrationNo(input) };
  const locked = transition(withReg, "institute_review", actor);
  sendNotification(
    locked,
    "locked",
    `आवेदन ${locked.id} लॉक हुआ। पंजीकरण संख्या ${locked.registrationNo}. हार्ड कॉपी ${
      locked.hardCopy.dueAt?.slice(0, 10) ?? "—"
    } तक कॉलेज में जमा करें`,
  );
  putCase(locked);
  return locked;
}

/** The demo Aadhaar never leaves the server in full, even though it is synthetic. */
/**
 * After a bank-side failure the department re-attempts in the next disbursement batch (Phase 2 in the
 * published calendar). Nothing is re-sanctioned: the same sanction goes back into the payment queue.
 */
export function requeuePayment(input: Case, actor: ActorRef = STUDENT_ACTOR): Case {
  if (input.stage !== "payment_failed") {
    throw new AppError("WRONG_STAGE", {
      hi: "भुगतान अभी लौटा नहीं है, इसलिए दोबारा भेजने की ज़रूरत नहीं।",
      en: "The payment has not failed, so there is nothing to requeue.",
      status: 409,
    });
  }
  const moved = transition(input, "pfms_processing", actor);
  moved.events.push({
    at: iso(),
    type: "payment_requeued",
    actor,
    summaryHi:
      "बैंक सुधार के बाद भुगतान अगले बैच में दोबारा भेजा गया — पुरानी स्वीकृति वही रहती है",
    summaryEn: "Requeued into the next payment batch after the bank fix; the sanction is unchanged",
  });
  sendNotification(moved, "payment_requeued", `फ़ाइल ${moved.id} भुगतान के अगले बैच में भेजी गई`);
  return moved;
}

function maskForm(form: Case["form"]): Case["form"] {
  const out = { ...form };
  if (typeof out.aadhaarDemo === "string" && out.aadhaarDemo.length > 4) {
    out.aadhaarDemo = `••••••••${out.aadhaarDemo.slice(-4)}`;
  }
  return out;
}

function maskCert(v?: string): string | undefined {
  if (!v) return undefined;
  return v.length <= 4 ? v : `••••${v.slice(-4)}`;
}

export type CaseView = ReturnType<typeof caseView>;

export function caseView(c: Case, nowIso: string = iso()) {
  const inst = getInstitute(c.instituteId);
  const course = inst?.courses.find((x) => x.code === c.courseCode);
  const cal = calendarFor(c.track, c.cycle);
  const profile = getProfile(c.profileId);
  return {
    id: c.id,
    session: c.session,
    ids: {
      caseId: c.id,
      otr: profile?.otr ?? null,
      registrationNo: c.registrationNo || null,
    },
    track: c.track,
    trackHi: SCHEMES[c.track].nameHi,
    trackEn: SCHEMES[c.track].nameEn,
    cycle: c.cycle,
    cycleHi: c.cycle === "renewal" ? "नवीनीकरण" : "नया आवेदन",
    cycleEn: c.cycle === "renewal" ? "Renewal" : "Fresh",
    stage: c.stage,
    stageHi: stageLabelHi(c.stage),
    stageEn: stageLabelEn(c.stage),
    stageEnteredAt: c.stageEnteredAt,
    waitingDays: waitingDaysOf(c, nowIso),
    breachDays: breachDaysOf(c, nowIso),
    owner: c.owner,
    dueAt: c.dueAt,
    registrationNo: c.registrationNo,
    otr: profile?.otr ?? null,
    studentNameHi: profile?.nameHi ?? "—",
    studentNameEn: profile?.nameEn ?? "—",
    categoryHi: profile?.category ?? null,
    districtHi: districtHi(String(c.form.districtCode ?? "")),
    districtEn: districtEn(String(c.form.districtCode ?? "")),
    instituteId: c.instituteId,
    instituteNameHi: inst?.nameHi ?? "—",
    instituteNameEn: inst?.nameEn ?? "—",
    affiliatedTo: inst?.affiliatedTo ?? null,
    courseCode: c.courseCode,
    courseNameHi: course?.nameHi ?? c.courseCode,
    courseNameEn: course?.nameEn ?? c.courseCode,
    form: maskForm(c.form),
    preflight: c.preflight,
    certificates: {
      income: c.certificates.income
        ? { ...c.certificates.income, certNo: maskCert(c.certificates.income.certNo) }
        : null,
      caste: c.certificates.caste
        ? { ...c.certificates.caste, certNo: maskCert(c.certificates.caste.certNo) }
        : null,
    },
    fee: c.fee,
    excludedHeads: course
      ? (["exam", "hostel", "mess", "caution", "library"] as const)
          .filter((k) => course.feeHeads[k] > 0)
          .map((k) => ({ key: k, amount: course.feeHeads[k] }))
      : [],
    estimate: c.estimate,
    hardCopy: c.hardCopy,
    attendancePercent: c.attendancePercent,
    flags: c.flags.map((f) => ({
      ...f,
      reason: REASONS[f.code] ?? null,
    })),
    correction: c.correction,
    payment: c.payment,
    escalations: c.escalations,
    calendar: cal,
    alerts: deriveAlerts(c, nowIso),
    events: [...c.events].reverse(),
    updatedAt: c.updatedAt,
  };
}

/** The shareable tracking view: stage, owner, clock and timeline, with no form or certificate data. */
export function trackView(c: Case, nowIso: string = iso()) {
  const full = caseView(c, nowIso);
  return {
    id: full.id,
    ids: full.ids,
    session: full.session,
    track: full.track,
    trackHi: full.trackHi,
    trackEn: full.trackEn,
    cycle: full.cycle,
    cycleHi: full.cycleHi,
    cycleEn: full.cycleEn,
    stage: full.stage,
    stageHi: full.stageHi,
    stageEn: full.stageEn,
    stageEnteredAt: full.stageEnteredAt,
    waitingDays: full.waitingDays,
    breachDays: full.breachDays,
    owner: full.owner,
    dueAt: full.dueAt,
    otr: full.otr,
    registrationNo: full.registrationNo,
    instituteNameHi: full.instituteNameHi,
    instituteNameEn: full.instituteNameEn,
    courseNameHi: full.courseNameHi,
    courseNameEn: full.courseNameEn,
    estimate: full.estimate,
    hardCopy: full.hardCopy,
    correction: full.correction,
    payment: full.payment,
    escalations: full.escalations,
    alerts: full.alerts,
    events: full.events,
    flags: full.flags,
  };
}

export function caseSummary(c: Case, nowIso: string = iso()) {
  return {
    id: c.id,
    stage: c.stage,
    stageHi: stageLabelHi(c.stage),
    trackHi: SCHEMES[c.track].nameHi,
    cycleHi: c.cycle === "renewal" ? "नवीनीकरण" : "नया आवेदन",
    owner: c.owner,
    dueAt: c.dueAt,
    waitingDays: waitingDaysOf(c, nowIso),
    breachDays: breachDaysOf(c, nowIso),
    estimateTotal: c.estimate.total,
    updatedAt: c.updatedAt,
  };
}

export function daysLeft(target: string, nowIso: string = iso()): number {
  return daysBetween(nowIso, target);
}
