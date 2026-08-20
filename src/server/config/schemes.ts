import type { Category, TrackId } from "../types";

export type SectionId =
  | "identity"
  | "education"
  | "previous_result"
  | "family_docs"
  | "fee"
  | "declaration";

export type Scheme = {
  id: TrackId;
  nameHi: string;
  nameEn: string;
  classesHi: string;
  sections: SectionId[];
  needsMarks: boolean;
  feeReimbursement: boolean;
  needsBonafide: boolean;
  needsUniversityScrutiny: boolean;
  completable: true;
};

const FULL: SectionId[] = [
  "identity",
  "education",
  "previous_result",
  "family_docs",
  "fee",
  "declaration",
];

export const SCHEMES: Record<TrackId, Scheme> = {
  pre_9_10: {
    id: "pre_9_10",
    nameHi: "पूर्वदशम (कक्षा 9-10)",
    nameEn: "Pre-Matric (Class 9-10)",
    classesHi: "कक्षा 9 और 10",
    sections: FULL,
    needsMarks: true,
    feeReimbursement: false,
    needsBonafide: false,
    needsUniversityScrutiny: false,
    completable: true,
  },
  post_inter: {
    id: "post_inter",
    nameHi: "दशमोत्तर इंटर (कक्षा 11-12)",
    nameEn: "Post-Matric Inter (Class 11-12)",
    classesHi: "कक्षा 11 और 12",
    sections: FULL,
    needsMarks: true,
    feeReimbursement: true,
    needsBonafide: false,
    needsUniversityScrutiny: false,
    completable: true,
  },
  dashmottar: {
    id: "dashmottar",
    nameHi: "दशमोत्तर (इंटर के अतिरिक्त)",
    nameEn: "Post-Matric other than Inter",
    classesHi: "डिग्री, डिप्लोमा, आई.टी.आई.",
    sections: FULL,
    needsMarks: true,
    feeReimbursement: true,
    needsBonafide: true,
    needsUniversityScrutiny: true,
    completable: true,
  },
  outside_state: {
    id: "outside_state",
    nameHi: "उत्तर प्रदेश के बाहर अध्ययनरत",
    nameEn: "Studying outside UP",
    classesHi: "दूसरे राज्य का संस्थान",
    sections: FULL,
    needsMarks: true,
    feeReimbursement: true,
    needsBonafide: true,
    needsUniversityScrutiny: false,
    completable: true,
  },
};

export const CATEGORIES: { id: Category; hi: string; en: string }[] = [
  { id: "sc", hi: "अनुसूचित जाति", en: "SC" },
  { id: "st", hi: "अनुसूचित जनजाति", en: "ST" },
  { id: "obc", hi: "अन्य पिछड़ा वर्ग", en: "OBC" },
  { id: "general", hi: "सामान्य", en: "General" },
  { id: "minority", hi: "अल्पसंख्यक", en: "Minority" },
];

export const STAGE_LABELS_HI: Record<string, string> = {
  draft: "ड्राफ़्ट — आपके पास",
  institute_review: "संस्थान में लंबित",
  university_scrutiny: "विश्वविद्यालय में शुल्क सत्यापन",
  dwo_review: "जिला समाज कल्याण कार्यालय में",
  correction_required: "सुधार आवश्यक",
  returned_to_student: "संस्थान ने वापस भेजा",
  sanctioned: "स्वीकृत — भुगतान के लिए",
  pfms_processing: "PFMS/बैंक में भुगतान",
  payment_failed: "भुगतान बैंक से लौटा",
  paid: "भुगतान हो गया",
  rejected: "अस्वीकृत",
  lapsed: "समय सीमा बीत गई",
};

export const STAGE_LABELS_EN: Record<string, string> = {
  draft: "Draft — with you",
  institute_review: "Pending at institute",
  university_scrutiny: "University fee scrutiny",
  dwo_review: "With the district welfare office",
  correction_required: "Correction required",
  returned_to_student: "Returned by the institute",
  sanctioned: "Sanctioned for payment",
  pfms_processing: "Payment processing (PFMS)",
  payment_failed: "Payment returned by bank",
  paid: "Paid",
  rejected: "Rejected",
  lapsed: "Deadline lapsed",
};
