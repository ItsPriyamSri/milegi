import type { Case, Cycle, TrackId } from "./types";
import { SCHEMES, type SectionId } from "./config/schemes";
import { DEMO_AADHAAR_MESSAGE, isDemoAadhaar } from "./config/aadhaar";

export type FieldSpec = {
  name: string;
  labelHi: string;
  labelEn: string;
  hintHi?: string;
  hintEn?: string;
  type: "text" | "number" | "date" | "select" | "checkbox" | "tel";
  section: SectionId;
  options?: { value: string; hi: string; en: string }[];
  requiredWhen?: (ctx: { track: TrackId; cycle: Cycle }) => boolean;
  maxLen?: number;
  /** Comes from a verified source (Aadhaar, master data, last year) — never patchable by a student. */
  readOnly?: boolean;
  validate?: (value: unknown, form: Record<string, unknown>) => string | null;
};

const always = () => true;

export const FIELDS: Record<string, FieldSpec> = {
  // identity — read-only, from the OTR profile
  aadhaarDemo: {
    name: "aadhaarDemo",
    labelHi: "डेमो आधार संख्या",
    labelEn: "Demo Aadhaar number",
    hintHi: "0000 से शुरू होने वाला 12 अंकों का डेमो नंबर — असली आधार यहाँ काम नहीं करेगा",
    hintEn: "12-digit demo number starting 0000 — a real Aadhaar will not work here",
    type: "text",
    section: "identity",
    maxLen: 12,
    readOnly: true,
    validate: (v) => (isDemoAadhaar(String(v)) ? null : DEMO_AADHAAR_MESSAGE),
  },
  otr: {
    name: "otr",
    labelHi: "OTR (स्थायी पहचान — ट्रैकिंग नंबर भी)",
    labelEn: "OTR (lifetime ID — also a tracking number)",
    hintHi: "एक बार बनता है। आवेदन संख्या या पंजीकरण की जगह भी इससे फ़ाइल खोली जा सकती है।",
    hintEn: "Minted once. You can also track the file with this number.",
    type: "text",
    section: "identity",
    readOnly: true,
  },
  districtCode: {
    name: "districtCode",
    labelHi: "जिला",
    labelEn: "District",
    type: "text",
    section: "identity",
    readOnly: true,
  },

  // education
  courseType: {
    name: "courseType",
    labelHi: "पाठ्यक्रम का प्रकार",
    labelEn: "Course type",
    type: "select",
    section: "education",
    options: [
      { value: "regular", hi: "नियमित", en: "Regular" },
      { value: "self", hi: "स्वयं-वित्तपोषित", en: "Self-financed" },
    ],
    requiredWhen: always,
  },
  yearOfStudy: {
    name: "yearOfStudy",
    labelHi: "अध्ययन का वर्ष",
    labelEn: "Year of study",
    type: "number",
    section: "education",
    requiredWhen: always,
    validate: (v) =>
      Number(v) >= 1 && Number(v) <= 6 ? null : "Year of study must be between 1 and 6 / वर्ष 1 से 6 के बीच होना चाहिए",
  },
  admissionDate: {
    name: "admissionDate",
    labelHi: "प्रवेश की तिथि",
    labelEn: "Admission date",
    type: "date",
    section: "education",
    requiredWhen: always,
  },
  hosteller: {
    name: "hosteller",
    labelHi: "आवासीय छात्र (छात्रावास में रहते हैं)",
    labelEn: "Hosteller",
    hintHi: "रखरखाव भत्ता इसी से तय होता है",
    hintEn: "This is what the maintenance allowance uses",
    type: "checkbox",
    section: "education",
  },
  boardName: {
    name: "boardName",
    labelHi: "हाई स्कूल बोर्ड",
    labelEn: "High-school board",
    type: "select",
    section: "education",
    options: [
      { value: "upmsp", hi: "यू.पी. बोर्ड", en: "UP Board" },
      { value: "cbse", hi: "सी.बी.एस.ई.", en: "CBSE" },
      { value: "icse", hi: "आई.सी.एस.ई.", en: "ICSE" },
    ],
    requiredWhen: always,
  },
  boardRollNo: {
    name: "boardRollNo",
    labelHi: "हाई स्कूल रोल नंबर",
    labelEn: "High-school roll number",
    hintHi: "मार्कशीट पर जैसा छपा है वैसा ही — यही नंबर बोर्ड डेटाबेस से मिलाया जाता है",
    hintEn: "Exactly as printed on the marksheet — this is matched against the board database",
    type: "text",
    section: "education",
    maxLen: 20,
    requiredWhen: always,
  },
  enrolmentNo: {
    name: "enrolmentNo",
    labelHi: "नामांकन संख्या",
    labelEn: "Enrolment number",
    hintHi: "कॉलेज की नामांकन पर्ची से — स्पेस या डैश न डालें",
    hintEn: "From the college enrolment slip — no spaces or dashes",
    type: "text",
    section: "education",
    maxLen: 30,
    requiredWhen: ({ track }) => track === "dashmottar" || track === "outside_state",
  },

  // previous result
  resultStatus: {
    name: "resultStatus",
    labelHi: "पिछले वर्ष का परिणाम",
    labelEn: "Previous year result",
    type: "select",
    section: "previous_result",
    options: [
      { value: "passed", hi: "उत्तीर्ण", en: "Passed" },
      { value: "promoted", hi: "बैक पेपर के साथ प्रोन्नत", en: "Promoted with back paper" },
      { value: "failed", hi: "अनुत्तीर्ण", en: "Failed" },
    ],
    requiredWhen: ({ cycle }) => cycle === "renewal",
  },
  marksObtained: {
    name: "marksObtained",
    labelHi: "प्राप्तांक",
    labelEn: "Marks obtained",
    type: "number",
    section: "previous_result",
    requiredWhen: ({ cycle }) => cycle === "renewal",
    validate: (v, form) => {
      const total = Number(form.marksTotal ?? 0);
      if (total > 0 && Number(v) > total)
        return "Marks cannot exceed the total / प्राप्तांक कुल अंकों से अधिक नहीं हो सकते";
      return null;
    },
  },
  marksTotal: {
    name: "marksTotal",
    labelHi: "कुल अंक",
    labelEn: "Marks total",
    hintHi: "पूरे वर्ष के कुल अंक — CGPA या एक सेमेस्टर के अंक नहीं",
    hintEn: "Full-year total marks — not CGPA or a single semester",
    type: "number",
    section: "previous_result",
    requiredWhen: ({ cycle }) => cycle === "renewal",
    validate: (v) =>
      Number(v) > 0 && Number(v) < 50
        ? "This looks like CGPA. Enter full-year total marks (e.g. 600 or 1200). / यह CGPA जैसा दिख रहा है। कुल अंक भरें।"
        : null,
  },
  semesterCombined: {
    name: "semesterCombined",
    labelHi: "दोनों सेमेस्टर के अंक जोड़कर भरे हैं",
    labelEn: "Both semesters combined",
    type: "checkbox",
    section: "previous_result",
  },

  // family and documents
  annualIncome: {
    name: "annualIncome",
    labelHi: "वार्षिक पारिवारिक आय (₹)",
    labelEn: "Annual family income",
    type: "number",
    section: "family_docs",
    requiredWhen: always,
    validate: (v) => (Number(v) >= 0 ? null : "Income cannot be negative / आय ऋणात्मक नहीं हो सकती"),
  },
  rationCard: {
    name: "rationCard",
    labelHi: "राशन कार्ड संख्या",
    labelEn: "Ration card number",
    hintHi: "न हो तो 0 भरें — यही आधिकारिक तरीका है",
    hintEn: "If you have none, enter 0 — that is the official placeholder",
    type: "text",
    section: "family_docs",
    maxLen: 20,
    requiredWhen: always,
  },
  incomeAppNo: {
    name: "incomeAppNo",
    labelHi: "आय प्रमाणपत्र आवेदन संख्या",
    labelEn: "Income certificate application number",
    type: "text",
    section: "family_docs",
    maxLen: 24,
    requiredWhen: always,
  },
  incomeCertNo: {
    name: "incomeCertNo",
    labelHi: "आय प्रमाणपत्र संख्या",
    labelEn: "Income certificate number",
    type: "text",
    section: "family_docs",
    maxLen: 24,
    requiredWhen: always,
  },
  casteAppNo: {
    name: "casteAppNo",
    labelHi: "जाति प्रमाणपत्र आवेदन संख्या",
    labelEn: "Caste certificate application number",
    type: "text",
    section: "family_docs",
    maxLen: 24,
  },
  casteCertNo: {
    name: "casteCertNo",
    labelHi: "जाति प्रमाणपत्र संख्या",
    labelEn: "Caste certificate number",
    type: "text",
    section: "family_docs",
    maxLen: 24,
  },

  // declarations
  declAttendance: {
    name: "declAttendance",
    labelHi: "मेरी उपस्थिति 75% या अधिक है",
    labelEn: "My attendance is 75% or more",
    hintHi: "संस्थान इसे अलग से प्रमाणित करता है; 75% से कम पर फ़ाइल आगे नहीं बढ़ती",
    hintEn: "The institute certifies this separately; below 75% the file does not move",
    type: "checkbox",
    section: "declaration",
    requiredWhen: always,
  },
  declNoOtherScholarship: {
    name: "declNoOtherScholarship",
    labelHi: "मैं कोई अन्य राज्य या केंद्रीय छात्रवृत्ति नहीं ले रहा/रही हूँ",
    labelEn: "I hold no other state or central scholarship",
    type: "checkbox",
    section: "declaration",
    requiredWhen: always,
  },
  declTruthful: {
    name: "declTruthful",
    labelHi: "भरी गई जानकारी सही है; गलत जानकारी पर आवेदन निरस्त हो सकता है",
    labelEn: "The information is correct; false information can void the application",
    type: "checkbox",
    section: "declaration",
    requiredWhen: always,
  },
};

/** The section's fields. Section *visibility* per track comes from SCHEMES[track].sections. */
export function fieldsFor(_track: TrackId, _cycle: Cycle, section: SectionId): FieldSpec[] {
  return Object.values(FIELDS).filter((f) => f.section === section);
}

export function isRequired(spec: FieldSpec, ctx: { track: TrackId; cycle: Cycle }): boolean {
  return spec.requiredWhen ? spec.requiredWhen(ctx) : false;
}

export function validateField(
  name: string,
  value: unknown,
  form: Record<string, unknown>,
): string | null {
  const spec = FIELDS[name];
  if (!spec) return "Unknown field / अज्ञात फ़ील्ड";
  if (spec.maxLen && String(value).length > spec.maxLen)
    return `Maximum ${spec.maxLen} characters / अधिकतम ${spec.maxLen} अक्षर`;
  if (spec.options && value !== "" && value !== null && value !== undefined) {
    if (!spec.options.some((o) => o.value === String(value))) return "Choose from the list / सूची में से चुनें";
  }
  return spec.validate ? spec.validate(value, form) : null;
}

export function validateAll(c: Case): { field: string; messageHi: string; messageEn: string }[] {
  const scheme = SCHEMES[c.track];
  const out: { field: string; messageHi: string; messageEn: string }[] = [];
  for (const spec of Object.values(FIELDS)) {
    if (!scheme.sections.includes(spec.section)) continue;
    if (spec.section === "previous_result" && c.cycle !== "renewal" && !scheme.needsMarks) continue;
    const required = isRequired(spec, { track: c.track, cycle: c.cycle });
    const value = c.form[spec.name];
    if (required && (value === undefined || value === null || value === "" || value === false)) {
      out.push({
        field: spec.name,
        messageHi: `${spec.labelHi} भरना ज़रूरी है`,
        messageEn: `${spec.labelEn} is required`,
      });
      continue;
    }
    if (value !== undefined && value !== null && value !== "") {
      const msg = validateField(spec.name, value, c.form);
      if (msg) out.push({ field: spec.name, messageHi: msg, messageEn: msg });
    }
  }
  return out;
}

