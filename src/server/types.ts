// Every domain type lives here. No logic.

export type TrackId = "pre_9_10" | "post_inter" | "dashmottar" | "outside_state";
export type Cycle = "fresh" | "renewal";
export type Category = "sc" | "st" | "obc" | "general" | "minority";
export type Confidence = "GO" | "AGG" | "CIT";
export type Sourced<T> = T & { source: string; confidence: Confidence };

export type Role = "student" | "institute" | "university" | "dwo" | "treasury" | "bank";

export type ActorRef = {
  role: Role;
  nameHi: string;
  designationHi: string;
  orgHi: string;
  contactHint?: string;
};

export type Profile = {
  id: string;
  otr: string;
  mobile: string;
  aadhaarDemo: string;
  nameHi: string;
  nameEn: string;
  fatherNameHi: string;
  motherNameHi: string;
  dob: string;
  gender: "f" | "m" | "o";
  category: Category;
  districtCode: string;
  addressHi: string;
  photoRef: string;
  ekycAt: string;
  duplicateOtrs: string[];
  createdAt: string;
};

export type Stage =
  | "draft"
  | "institute_review"
  | "university_scrutiny"
  | "dwo_review"
  | "correction_required"
  | "returned_to_student"
  | "sanctioned"
  | "pfms_processing"
  | "payment_failed"
  | "paid"
  | "rejected"
  | "lapsed";

export type PfmsStatus =
  | "processing_with_bank"
  | "credited"
  | "beneficiary_pending"
  | "rejected_not_seeded"
  | "rejected_dormant"
  | "limit_exceeded";

export type FeeHeads = {
  tuition: number;
  exam: number;
  hostel: number;
  mess: number;
  caution: number;
  library: number;
  other: number;
};

export type PreflightItem = {
  id: string;
  state: "ok" | "warn" | "blocked" | "unknown";
  titleHi: string;
  titleEn: string;
  detailHi: string;
  detailEn: string;
  actionHi: string | null;
  etaHi: string | null;
  fixedBy: "student" | "institute" | "bank" | "revenue_office" | "none";
  source?: string;
};

export type CaseEvent = {
  at: string;
  type: string;
  actor: ActorRef;
  summaryHi: string;
  summaryEn: string;
  data?: Record<string, unknown>;
};

export type CertificateRecord = {
  applicationNo: string;
  certNo: string;
  issuedOn: string;
  expiresOn?: string;
  annualIncome?: number;
  verifiedAt?: string;
  state: "ok" | "expired" | "not_found";
};

export type FormValues = Record<string, string | number | boolean | null>;

export type Case = {
  id: string;
  session: "2026-27";
  profileId: string;
  track: TrackId;
  cycle: Cycle;
  registrationNo: string;
  instituteId: string;
  courseCode: string;
  stage: Stage;
  stageEnteredAt: string;
  owner: ActorRef | null;
  dueAt: string | null;
  form: FormValues;
  preflight: PreflightItem[];
  certificates: { income?: CertificateRecord; caste?: CertificateRecord };
  fee: { heads: FeeHeads; nonRefundable: number; disputed?: { note: string; amount?: number; at: string } };
  estimate: {
    feeReimbursement: number;
    maintenancePerMonth: number;
    months: number;
    total: number;
    basisHi: string;
  };
  hardCopy: { dueAt: string | null; receivedAt: string | null };
  attendancePercent: number | null;
  flags: { code: string; at: string; by: ActorRef; note?: string }[];
  correction: { openAt: string; closeAt: string; usedAt: string | null; fields: string[] } | null;
  payment: {
    pfmsRef?: string;
    status?: PfmsStatus;
    failureCode?: string;
    amount?: number;
    at?: string;
  };
  escalations: { at: string; stage: Stage; breachDays: number; to: ActorRef }[];
  grievanceDraftAt: string | null;
  events: CaseEvent[];
  updatedAt: string;
};

export type Institute = {
  id: string;
  nameHi: string;
  nameEn: string;
  districtCode: string;
  kind: "school" | "college" | "iti" | "university";
  affiliatedTo: string | null;
  clerk: ActorRef;
  loginPin: string;
  masterDataPublishedAt: string | null;
  courses: {
    code: string;
    nameHi: string;
    nameEn: string;
    group: "prof" | "tech" | "general" | "school";
    years: number;
    feeHeads: FeeHeads;
    publishedAt: string | null;
  }[];
};

export type Alert = {
  id: string;
  kind: string;
  severity: "info" | "warn" | "danger";
  titleHi: string;
  titleEn: string;
  detailHi: string;
  detailEn: string;
  actionHi: string | null;
  actionHref: string | null;
  dueAt: string | null;
};

export type Notification = {
  id: string;
  caseId: string;
  channel: "sms" | "whatsapp";
  to: string;
  textHi: string;
  reason: string;
  createdAt: string;
};

export type UpstreamName = "ekyc" | "digilocker" | "edistrict" | "boards" | "npci" | "pfms";

export type SimConfig = {
  clockOffsetDays: number;
  upstream: Record<UpstreamName, { health: "up" | "slow" | "down"; failureRate: number }>;
  forcedPfmsOutcome: PfmsStatus | null;
  outageLog: { system: string; from: string; to: string | null }[];
  otpFor: Record<string, string>;
};
