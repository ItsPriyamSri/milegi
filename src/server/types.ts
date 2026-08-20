export type Track = "prematric" | "inter" | "dashmottar" | "outside_state";
export type Cycle = "fresh" | "renewal";
export type Category = "general" | "obc" | "sc" | "st" | "minority";
export type CourseType = "regular" | "self_financed";
export type ResultStatus = "passed" | "promoted" | "failed" | null;
export type NpciStatus = "ok" | "pending" | "timeout";

export type ApplicationStatus =
  | "choose"
  | "preflight"
  | "draft"
  | "review"
  | "institute"
  | "dwo"
  | "paid"
  | "rejected";

export type ActorRole = "student" | "clerk" | "university" | "nic" | "dwo" | "pfms";

export type Actor = {
  name: string;
  role: ActorRole;
  waitingDays: number;
  done: boolean;
};

export type Blocker = {
  code: string;
  hi: string;
  en: string;
};

/** College master data. The student never types any of these numbers. */
export type Institute = {
  id: string;
  name: string;
  listed: boolean;
  courseName: string;
  /** Non-refundable tuition only. */
  tuition: number;
  hostel: number;
  mess: number;
  caution: number;
  /** What we estimate will be reimbursed. Not a promise — see `docs/milegi-plan.md`. */
  expectedAmount: number;
};

export type Application = {
  id: string;
  prototype: true;
  sessionYear: "2026-27";
  track: Track;
  cycle: Cycle;
  status: ApplicationStatus;

  /** Typed secret that reopens this case in another browser, e.g. MLG-PRIYA. */
  resumeCode: string;

  studentName: string;
  fatherName: string;
  motherName: string;
  /** Lifetime OTR. Official shape `UPyy-##########`. Synthetic only. */
  otr: string | null;
  /** Session registration number, 15 digits. Different thing from the OTR. */
  registrationNo: string | null;
  aadhaarToken: string;
  mobileMasked: string;
  category: Category;

  incomeAmount: number;
  incomeIssuedOn: string;
  incomeAppNo: string;
  incomeCertNo: string;
  casteAppNo: string | null;
  casteCertNo: string | null;

  instituteId: string;
  instituteName: string;
  instituteListed: boolean;
  npci: NpciStatus;

  courseType: CourseType;
  courseName: string;
  yearOfStudy: number;
  admissionDate: string | null;
  dayScholar: boolean;
  rationCard: string;

  /** Copied from institutes.tuition. Never patchable. */
  feeNonRefundable: number;
  /** Copied from institutes.expectedAmount. An estimate, not a sanctioned amount. */
  expectedAmount: number;
  feeDispute: boolean;
  feeDisputeNote: string | null;

  resultStatus: ResultStatus;
  marksObtained: number | null;
  marksTotal: number | null;
  semesterCombined: boolean;
  courseChanged: boolean;
  lastYearPaid: number | null;

  enrollmentNo: string | null;
  counseling: boolean;
  counselingNo: string | null;
  bonafideOk: boolean;
  photoReady: boolean;
  attendancePct: number;

  /** Set by lock: hard copy is due at the institute within 3 days. Informational. */
  hardCopyDueAt: string | null;
  /** Set by ping. The wait does not reset — see `pingClerk`. */
  nudgeSentAt: string | null;
  /** Both OTRs when the student minted a second one. */
  duplicateOtrs: string[] | null;

  lastSavedAt: string;
  actors: Actor[];
};
