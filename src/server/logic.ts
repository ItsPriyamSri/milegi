import { correctionWindow } from "@/lib/calendar";
import type {
  Application,
  ApplicationStatus,
  Blocker,
  Category,
  Cycle,
  Institute,
  Track,
} from "./types";
import {
  findByAadhaarToken,
  getApp,
  getAppByResume,
  getInstitute,
  mintOtr,
  saveApp,
  sessionReg,
} from "./store";

const ALLOWED: Record<ApplicationStatus, ApplicationStatus[]> = {
  choose: ["preflight"],
  preflight: ["draft", "rejected"],
  draft: ["review"],
  review: ["institute", "draft"],
  institute: ["dwo"],
  dwo: ["paid", "rejected"],
  paid: [],
  rejected: ["draft"],
};

export function canTransition(from: ApplicationStatus, to: ApplicationStatus) {
  return ALLOWED[from].includes(to);
}

export function assertTransition(from: ApplicationStatus, to: ApplicationStatus) {
  if (!canTransition(from, to)) {
    throw Object.assign(new Error(`illegal transition ${from} → ${to}`), { status: 409 });
  }
}

/**
 * Post-Matric / Dashmottar family income caps for 2026-27.
 * SC/ST ₹2.5L, General/OBC/Minority ₹2L.
 * Pre-Matric caps are deliberately not modelled: public 2026-27 sources disagree
 * (₹1L in some, ₹2.5L in others) and class 9–10 is not a completable journey here.
 */
export function incomeCap(category: Category): number {
  return category === "sc" || category === "st" ? 250_000 : 200_000;
}

/** UP income certificates are valid for exactly 3 years from the date of issue. */
export function incomeExpired(issuedOn: string, now = new Date()): boolean {
  const end = new Date(`${issuedOn}T00:00:00.000Z`);
  end.setUTCFullYear(end.getUTCFullYear() + 3);
  return now.getTime() >= end.getTime();
}

export function jsonError(err: unknown) {
  const message = err instanceof Error ? err.message : "error";
  const status =
    err instanceof Error && "status" in err && typeof err.status === "number"
      ? err.status
      : 400;
  const extra = err as { blockers?: Blocker[]; code?: string; window?: unknown };
  return {
    status,
    body: {
      ok: false as const,
      prototype: true as const,
      error: message,
      blockers: extra.blockers,
      code: extra.code,
      window: extra.window,
    },
  };
}

const COPY: Record<string, { hi: string; en: string }> = {
  income_expired: {
    hi: "आय प्रमाण पत्र 3 साल से पुराना है। नया प्रमाण पत्र बनवाकर तारीख अपडेट करें।",
    en: "Income certificate is older than 3 years. Get a new one and update the date.",
  },
  income_over_limit: {
    hi: "पारिवारिक आय इस श्रेणी की सीमा से अधिक है।",
    en: "Family income is above the cap for this category.",
  },
  npci_timeout: {
    hi: "आधार-DBT (NPCI) का जवाब नहीं आया। फॉर्म सेव रहेगा — फिर जाँचें।",
    en: "Aadhaar DBT (NPCI) did not respond. Your draft stays — retry.",
  },
  npci_pending: {
    hi: "आधार-DBT अभी लंबित है। बैंक शाखा में DBT सीडिंग की जाँच कराएँ।",
    en: "Aadhaar DBT is still pending. Ask your bank branch to seed the account for DBT.",
  },
  institute_unlisted: {
    hi: "यह संस्थान मास्टर डेटा में नहीं है। कॉलेज नोडल अधिकारी से कोर्स अपलोड कराएँ।",
    en: "Institute is not in master data. The college nodal officer must upload the course.",
  },
  duplicate_fresh: {
    hi: "इस आधार पर पहले से आवेदन है। नया मत बनाइए — नवीनीकरण चुनें।",
    en: "An application already exists for this Aadhaar. Choose renewal, do not file fresh.",
  },
  renewal_failed_year: {
    hi: "पिछला साल फेल है — इस साल नवीनीकरण नहीं बनेगा।",
    en: "Failed last year — renewal is not allowed.",
  },
  course_changed_must_be_fresh: {
    hi: "कोर्स या कॉलेज बदला है तो नवीनीकरण नहीं — नया आवेदन चुनें।",
    en: "Course or college changed — file as fresh, not renewal.",
  },
  missing_otr: {
    hi: "पहले वन-टाइम रजिस्ट्रेशन (OTR) पूरा करें।",
    en: "Complete one-time registration (OTR) first.",
  },
  missing_enrollment: {
    hi: "विश्वविद्यालय नामांकन संख्या लिखें।",
    en: "Enter the university enrollment number.",
  },
  missing_fee: {
    hi: "कॉलेज मास्टर डेटा में इस कोर्स का शुल्क नहीं है। कॉलेज नोडल अधिकारी से अपलोड कराएँ।",
    en: "The college master data has no fee for this course. Ask the nodal officer to upload it.",
  },
  missing_photo: {
    hi: "फोटो तैयार है — यह बॉक्स टिक करें।",
    en: "Tick that the photo is ready.",
  },
  missing_marks: {
    hi: "कुल अंक और प्राप्तांक दोनों लिखें।",
    en: "Enter obtained and total marks.",
  },
  missing_result: {
    hi: "परिणाम चुनें: पास या प्रोमोटेड।",
    en: "Select Passed or Promoted.",
  },
  missing_semester_combined: {
    hi: "दोनों सेमेस्टर के अंक जोड़कर टिक करें।",
    en: "Tick that both semester marks are combined.",
  },
  missing_caste_numbers: {
    hi: "जाति प्रमाण पत्र का आवेदन नंबर और प्रमाण पत्र नंबर लिखें।",
    en: "Enter caste certificate application and certificate numbers.",
  },
  missing_income_numbers: {
    hi: "आय प्रमाण पत्र का आवेदन नंबर और प्रमाण पत्र नंबर लिखें।",
    en: "Enter income certificate application and certificate numbers.",
  },
  missing_ration: {
    hi: "राशन कार्ड नंबर लिखें। नहीं है तो 0।",
    en: "Enter ration card number, or 0.",
  },
  missing_bonafide: {
    hi: "डिजिटल बोनाफाइड तैयार है — टिक करें।",
    en: "Tick that the digitally signed bonafide is ready.",
  },
};

function blocker(code: string): Blocker {
  const c = COPY[code];
  if (!c) throw new Error(`no copy for blocker ${code}`);
  return { code, hi: c.hi, en: c.en };
}

export function preflight(
  app: Application,
  now = new Date(),
): { ok: boolean; blockers: Blocker[] } {
  const blockers: Blocker[] = [];
  if (incomeExpired(app.incomeIssuedOn, now)) blockers.push(blocker("income_expired"));
  if (app.incomeAmount > incomeCap(app.category)) blockers.push(blocker("income_over_limit"));
  if (app.npci === "timeout") blockers.push(blocker("npci_timeout"));
  if (app.npci === "pending") blockers.push(blocker("npci_pending"));
  if (!app.instituteListed) blockers.push(blocker("institute_unlisted"));
  if (app.cycle === "fresh") {
    const others = findByAadhaarToken(app.aadhaarToken, app.id);
    const conflict = others.some(
      (o) =>
        o.cycle === "renewal" ||
        o.status === "institute" ||
        o.status === "dwo" ||
        o.status === "paid",
    );
    if (conflict) blockers.push(blocker("duplicate_fresh"));
    if (!app.otr) blockers.push(blocker("missing_otr"));
  }
  if (app.cycle === "renewal" && app.resultStatus === "failed") {
    blockers.push(blocker("renewal_failed_year"));
  }
  if (app.cycle === "renewal" && app.courseChanged) {
    blockers.push(blocker("course_changed_must_be_fresh"));
  }
  const afterPre = app.status !== "choose" && app.status !== "preflight";
  if (afterPre && !app.enrollmentNo) blockers.push(blocker("missing_enrollment"));
  return { ok: blockers.length === 0, blockers };
}

const PATCHABLE = new Set([
  "category", "studentName", "fatherName", "motherName", "mobileMasked",
  "incomeAmount", "incomeIssuedOn", "incomeAppNo", "incomeCertNo",
  "casteAppNo", "casteCertNo", "courseType", "yearOfStudy", "admissionDate",
  "dayScholar", "rationCard", "resultStatus", "marksObtained", "marksTotal",
  "semesterCombined", "courseChanged", "enrollmentNo", "counseling",
  "counselingNo", "bonafideOk", "photoReady",
]);

/** College master data is the single source of truth for money and course name. */
export function applyInstituteFees(app: Application): Application {
  const inst: Institute = getInstitute(app.instituteId);
  app.instituteName = inst.name;
  app.instituteListed = inst.listed;
  app.courseName = inst.courseName;
  app.feeNonRefundable = inst.tuition;
  app.expectedAmount = inst.expectedAmount;
  return app;
}

export function completeKyc(id: string): Application {
  const app = getApp(id);
  if (app.otr) return app; // never mint a second OTR
  app.otr = mintOtr(id);
  app.registrationNo = sessionReg(id);
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}

export function patchDraft(id: string, partial: Partial<Application>): Application {
  const app = getApp(id);
  if (!["choose", "preflight", "draft", "review"].includes(app.status)) {
    throw Object.assign(new Error("draft frozen after lock"), { status: 409 });
  }
  const merged: Application = { ...app };
  for (const [k, v] of Object.entries(partial)) {
    if (!PATCHABLE.has(k)) continue;
    (merged as unknown as Record<string, unknown>)[k] = v;
  }
  merged.lastSavedAt = new Date().toISOString();
  if (merged.status === "choose") merged.status = "preflight";
  return saveApp(merged);
}

export function openForm(id: string): Application {
  const app = getApp(id);
  const pf = preflight(app);
  if (!pf.ok) {
    throw Object.assign(new Error("preflight blocked"), { status: 409, blockers: pf.blockers });
  }
  applyInstituteFees(app);
  if (app.status === "choose" || app.status === "preflight") {
    app.status = "draft";
  }
  return saveApp(app);
}

export function reviewGaps(app: Application): Blocker[] {
  const gaps = [...preflight(app).blockers];
  const add = (code: string) => {
    if (!gaps.some((g) => g.code === code)) gaps.push(blocker(code));
  };
  if (!(app.feeNonRefundable > 0)) add("missing_fee");
  if (!app.enrollmentNo) add("missing_enrollment");
  if (app.cycle === "fresh") {
    if (!app.photoReady) add("missing_photo");
    if (!app.rationCard) add("missing_ration");
    if (!app.incomeAppNo || !app.incomeCertNo) add("missing_income_numbers");
    if (app.category !== "general" && (!app.casteAppNo || !app.casteCertNo)) {
      add("missing_caste_numbers");
    }
    if (!app.bonafideOk) add("missing_bonafide");
  } else {
    if (app.resultStatus !== "passed" && app.resultStatus !== "promoted") add("missing_result");
    if (app.marksObtained == null || app.marksTotal == null || app.marksTotal <= 0) {
      add("missing_marks");
    }
    if (!app.semesterCombined) add("missing_semester_combined");
  }
  return gaps;
}

const CLERK = "राम प्रकाश";
const UNIVERSITY = "सम्बद्ध विश्वविद्यालय (नकली)";
const DWO = "जिला कल्याण अधिकारी (नकली)";

export function moveToReview(id: string): Application {
  const app = getApp(id);
  const gaps = reviewGaps(app);
  if (gaps.length) {
    throw Object.assign(new Error("not ready to review"), { status: 409, blockers: gaps });
  }
  assertTransition(app.status, "review");
  app.status = "review";
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}

export function lock(id: string): Application {
  const app = getApp(id);
  const gaps = reviewGaps(app);
  if (gaps.length) {
    throw Object.assign(new Error("cannot lock"), { status: 409, blockers: gaps });
  }
  assertTransition(app.status, "institute");
  app.status = "institute";
  // ponytail: Amit's 12-day wait is a demo constant so the video can show a named
  // clerk sitting on a file. Everyone else starts at 0. Upgrade path: derive it
  // from lockedAt when there is a real clock.
  app.actors = [{ name: CLERK, role: "clerk", waitingDays: id === "app-amit" ? 12 : 0, done: false }];
  const due = new Date();
  due.setUTCDate(due.getUTCDate() + 3);
  app.hardCopyDueAt = due.toISOString().slice(0, 10);
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}

export function attestInstitute(id: string): Application {
  const app = getApp(id);
  if (app.status === "dwo" || app.status === "paid") return app;
  assertTransition(app.status, "dwo");
  app.status = "dwo";
  if (!app.attendancePct) app.attendancePct = 80; // the real rule is 75% minimum
  // ponytail: the affiliating university is a real actor in the Dashmottar chain.
  // We show it in the chain and auto-forward it. No university dashboard.
  app.actors = [
    { name: CLERK, role: "clerk", waitingDays: 0, done: true },
    { name: UNIVERSITY, role: "university", waitingDays: 0, done: true },
    { name: DWO, role: "dwo", waitingDays: 0, done: false },
  ];
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}

export function retryNpci(id: string): Application {
  const app = getApp(id);
  app.npci = "ok";
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}

export function pay(id: string): Application {
  const app = getApp(id);
  if (app.npci !== "ok") {
    throw Object.assign(new Error("NPCI not ok"), { status: 409 });
  }
  assertTransition(app.status, "paid");
  app.status = "paid";
  app.actors = [
    ...app.actors.map((a) => ({ ...a, done: true })),
    { name: "PFMS (नकली)", role: "pfms" as const, waitingDays: 0, done: true },
  ];
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}

export function reject(id: string): Application {
  const app = getApp(id);
  assertTransition(app.status, "rejected");
  app.status = "rejected";
  app.actors = app.actors.map((a) => (a.role === "dwo" ? { ...a, done: true } : a));
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}

export function crash(id: string) {
  const app = getApp(id);
  app.lastSavedAt = new Date().toISOString();
  saveApp(app);
  return {
    crashed: true as const,
    savedAt: app.lastSavedAt,
    messageHi: "सर्वर व्यस्त है। आपका फॉर्म सेव है।",
    messageEn: "Server busy. Your form is saved.",
  };
}

export function pingClerk(id: string): Application {
  const app = getApp(id);
  if (app.status !== "institute") {
    throw Object.assign(new Error("ping only while the file is at the institute"), { status: 409 });
  }
  // The wait is real. A reminder is recorded; it does not reset the clock.
  app.nudgeSentAt = new Date().toISOString();
  return saveApp(app);
}

/** Sanshodhan: named window, never a silent edit after lock. Always throws — the product is the refusal. */
export function tryCorrect(id: string, now = new Date()): Application {
  const app = getApp(id);
  if (["choose", "preflight", "draft", "review"].includes(app.status)) {
    throw Object.assign(new Error("not_locked"), { status: 409, code: "not_locked" });
  }
  const w = correctionWindow(app.cycle, now);
  if (!w.open) {
    throw Object.assign(new Error("correction_closed"), { status: 409, code: "correction_closed", window: w });
  }
  throw Object.assign(new Error("correction_not_built"), {
    status: 409,
    code: "correction_not_built",
    window: w,
  });
}

export function raiseFeeDispute(id: string, note: string): Application {
  const app = getApp(id);
  if (!["draft", "review", "institute"].includes(app.status)) {
    throw Object.assign(new Error("fee dispute only before the DWO stage"), { status: 409 });
  }
  app.feeDispute = true;
  app.feeDisputeNote = note.slice(0, 200);
  app.lastSavedAt = new Date().toISOString();
  return saveApp(app);
}

export type Studying = "9-10" | "11-12" | "college" | "outside";
export type GotLastYear = "yes" | "no" | "dunno";

export type DoorInput = {
  studying: Studying;
  firstYear: boolean;
  gotLastYear: GotLastYear;
};

export type DoorAlt = {
  appId: string;
  resumeCode: string;
  labelHi: string;
  labelEn: string;
} | null;

export type DoorResult = {
  completable: boolean;
  track: Track;
  cycle: Cycle;
  appId: string | null;
  resumeCode: string | null;
  otrs: string[];
  alt: DoorAlt;
  messageHi: string;
  messageEn: string;
};

const SCOPE_HI =
  "यह प्रोटोटाइप दशमोत्तर (कॉलेज) तक चलाता है। स्कूल या दूसरे राज्य का फॉर्म यहाँ नकली नहीं बनाया गया।";
const SCOPE_EN =
  "This prototype completes the Dashmottar (college) journey. It does not fake a school or outside-state form.";

function altFor(id: "app-priya" | "app-amit", labelHi: string, labelEn: string): DoorAlt {
  const app = getApp(id);
  return { appId: app.id, resumeCode: app.resumeCode, labelHi, labelEn };
}

/**
 * ponytail: this resolver decides from the three answers alone — there is no
 * identity input, so it cannot look anybody up. The persona mapping below IS the
 * demo. Do not "fix" it into a database search: with three synthetic students a
 * search would 404, which is the exact failure the product exists to remove.
 * `docs/milegi-plan.md` and /limitations say this out loud.
 */
export function resolveDoor(input: DoorInput): DoorResult {
  const cycle: Cycle = input.firstYear ? "fresh" : "renewal";

  if (input.studying !== "college") {
    const track: Track =
      input.studying === "9-10" ? "prematric" : input.studying === "11-12" ? "inter" : "outside_state";
    const school = input.studying !== "outside";
    const loginHi =
      track === "prematric"
        ? cycle === "fresh"
          ? "Pre-Matric Fresh"
          : "Pre-Matric Renewal"
        : track === "inter"
          ? cycle === "fresh"
            ? "Post-Matric Inter Fresh"
            : "Post-Matric Inter Renewal"
          : cycle === "fresh"
            ? "Outside State Fresh"
            : "Outside State Renewal";
    const datesHi = school
      ? cycle === "fresh"
        ? "11 अगस्त–21 सितम्बर 2026"
        : "11–25 अगस्त 2026"
      : "दशमोत्तर कैलेंडर (15 सितम्बर से)";
    return {
      completable: false,
      track,
      cycle,
      appId: null,
      resumeCode: null,
      otrs: [],
      alt: altFor("app-priya", "कॉलेज (दशमोत्तर) के रूप में जारी रखें", "Continue as college (Dashmottar)"),
      messageHi: `${loginHi} · ${datesHi}। खोया रजिस्ट्रेशन हाई स्कूल बोर्ड, पास वर्ष और रोल नंबर से निकलता है — नया OTR मत बनाइए। ${SCOPE_HI}`,
      messageEn: `${loginHi}, ${datesHi}. Recover the 15-digit registration with class-10 board, pass year and roll number — do not mint a second OTR. ${SCOPE_EN}`,
    };
  }

  // First year of this course AND money last year on this course: the student
  // almost certainly minted a second OTR. Name both, point at the renewal.
  if (input.firstYear && input.gotLastYear === "yes") {
    const app = getApp("app-amit-dup");
    return {
      completable: true,
      track: "dashmottar",
      cycle: "fresh",
      appId: app.id,
      resumeCode: app.resumeCode,
      otrs: app.duplicateOtrs ?? [],
      alt: altFor("app-amit", "असली नवीनीकरण खोलें", "Open the real renewal"),
      messageHi: "इस आधार पर दो OTR मिले। नया Fresh मत बनाइए — नवीनीकरण खोलें।",
      messageEn: "Two OTRs on this Aadhaar. Do not file Fresh — open the renewal.",
    };
  }

  const asRenewal = !input.firstYear && input.gotLastYear !== "no";
  if (asRenewal) {
    const app = getApp("app-amit");
    const unsure = input.gotLastYear === "dunno";
    return {
      completable: true,
      track: "dashmottar",
      cycle: "renewal",
      appId: app.id,
      resumeCode: app.resumeCode,
      otrs: app.otr ? [app.otr] : [],
      alt: altFor("app-priya", "पिछले साल नहीं मिली थी — नया आवेदन खोलें", "Did not get it last year — open a fresh case"),
      messageHi: unsure
        ? "पक्का नहीं? हम नवीनीकरण से खोल रहे हैं — यही सुरक्षित है, क्योंकि दूसरा OTR बनाना दोनों आवेदन ब्लॉक करा देता है। (असली पोर्टल पर पुराना रजिस्ट्रेशन नंबर हाई स्कूल रोल नंबर से निकलता है।)"
        : "नवीनीकरण मिला। नया OTR न बनाएँ।",
      messageEn: unsure
        ? "Not sure? We are opening the renewal, which is the safe side: minting a second OTR blocks both applications. (On the real portal you recover last year's registration number using your high-school roll number.)"
        : "Renewal found. Do not mint a new OTR.",
    };
  }

  const app = getApp("app-priya");
  return {
    completable: true,
    track: "dashmottar",
    cycle: "fresh",
    appId: app.id,
    resumeCode: app.resumeCode,
    otrs: app.otr ? [app.otr] : [],
    alt: altFor("app-amit", "नहीं, मैं नवीनीकरण हूँ", "No, I am a renewal"),
    messageHi: "Fresh दशमोत्तर। OTR अभी बनाना है।",
    messageEn: "Fresh Dashmottar. The OTR still has to be minted.",
  };
}

/** One JSON shape for every app response. */
export function envelope(app: Application) {
  const pf = preflight(app);
  return {
    ok: true as const,
    prototype: true as const,
    app,
    blockers: pf.blockers,
    missing: reviewGaps(app),
    preflightOk: pf.ok,
    institute: getInstitute(app.instituteId),
  };
}

export { getAppByResume };
