import type { Institute } from "./types";

// All names, numbers and registries below are invented. No real person, officer or student appears.

const P = (s: string) => `${s}T00:00:00.000Z`;

export const SEED_INSTITUTES: Institute[] = [
  {
    id: "inst-csjmu-arts",
    nameHi: "राजकीय महाविद्यालय, कल्याणपुर",
    nameEn: "Government Degree College, Kalyanpur",
    districtCode: "70",
    kind: "college",
    affiliatedTo: "छत्रपति शाहू जी महाराज विश्वविद्यालय, कानपुर",
    clerk: {
      role: "institute",
      nameHi: "श्री आर. के. वर्मा",
      designationHi: "छात्रवृत्ति लिपिक",
      orgHi: "राजकीय महाविद्यालय, कल्याणपुर",
      contactHint: "छात्रवृत्ति प्रकोष्ठ, कक्ष 12",
    },
    loginPin: "1234",
    masterDataPublishedAt: P("2026-08-10"),
    courses: [
      {
        code: "BA",
        nameHi: "बी.ए.",
        nameEn: "B.A.",
        group: "general",
        years: 3,
        feeHeads: { tuition: 8500, exam: 1200, hostel: 0, mess: 0, caution: 500, library: 300, other: 0 },
        publishedAt: P("2026-08-10"),
      },
      {
        code: "BSC",
        nameHi: "बी.एस-सी.",
        nameEn: "B.Sc.",
        group: "general",
        years: 3,
        feeHeads: { tuition: 19800, exam: 1500, hostel: 12000, mess: 9000, caution: 1000, library: 400, other: 0 },
        publishedAt: P("2026-08-10"),
      },
      {
        // The master-data failure a student cannot fix: never published for this session.
        code: "BED",
        nameHi: "बी.एड.",
        nameEn: "B.Ed.",
        group: "tech",
        years: 2,
        feeHeads: { tuition: 51250, exam: 2000, hostel: 0, mess: 0, caution: 2000, library: 500, other: 0 },
        publishedAt: null,
      },
    ],
  },
  {
    id: "inst-akt-engg",
    nameHi: "श्री गंगा प्रसाद अभियंत्रण संस्थान, उन्नाव",
    nameEn: "Shri Ganga Prasad Institute of Engineering, Unnao",
    districtCode: "70",
    kind: "college",
    affiliatedTo: "प्राविधिक विश्वविद्यालय (एफिलियेटिंग एजेंसी)",
    clerk: {
      role: "institute",
      nameHi: "श्रीमती एस. निगम",
      designationHi: "नोडल अधिकारी (छात्रवृत्ति)",
      orgHi: "श्री गंगा प्रसाद अभियंत्रण संस्थान, उन्नाव",
      contactHint: "प्रशासनिक भवन, प्रथम तल",
    },
    loginPin: "1234",
    masterDataPublishedAt: P("2026-08-12"),
    courses: [
      {
        code: "BTECHCS",
        nameHi: "बी.टेक (कंप्यूटर साइंस)",
        nameEn: "B.Tech (Computer Science)",
        group: "prof",
        years: 4,
        feeHeads: { tuition: 74500, exam: 3200, hostel: 46000, mess: 32000, caution: 5000, library: 1200, other: 0 },
        publishedAt: P("2026-08-12"),
      },
      {
        code: "DIPME",
        nameHi: "डिप्लोमा (मैकेनिकल)",
        nameEn: "Diploma (Mechanical)",
        group: "tech",
        years: 3,
        feeHeads: { tuition: 26400, exam: 1800, hostel: 21000, mess: 18000, caution: 2500, library: 600, other: 0 },
        publishedAt: P("2026-08-12"),
      },
    ],
  },
  {
    id: "inst-inter-lko",
    nameHi: "नगर पालिका इंटर कॉलेज, लखनऊ",
    nameEn: "Nagar Palika Inter College, Lucknow",
    districtCode: "72",
    kind: "school",
    affiliatedTo: null,
    clerk: {
      role: "institute",
      nameHi: "श्री डी. पी. मिश्रा",
      designationHi: "प्रधानाचार्य कार्यालय लिपिक",
      orgHi: "नगर पालिका इंटर कॉलेज, लखनऊ",
      contactHint: "कार्यालय, मुख्य द्वार के पास",
    },
    loginPin: "1234",
    masterDataPublishedAt: P("2026-08-05"),
    courses: [
      {
        code: "CLASS11",
        nameHi: "कक्षा 11 (विज्ञान)",
        nameEn: "Class 11 (Science)",
        group: "school",
        years: 1,
        feeHeads: { tuition: 4200, exam: 600, hostel: 0, mess: 0, caution: 0, library: 200, other: 0 },
        publishedAt: P("2026-08-05"),
      },
      {
        code: "CLASS12",
        nameHi: "कक्षा 12 (विज्ञान)",
        nameEn: "Class 12 (Science)",
        group: "school",
        years: 1,
        feeHeads: { tuition: 4600, exam: 700, hostel: 0, mess: 0, caution: 0, library: 200, other: 0 },
        publishedAt: P("2026-08-05"),
      },
    ],
  },
  {
    id: "inst-school-gkp",
    nameHi: "राजकीय जूनियर हाई स्कूल, चौरी चौरा",
    nameEn: "Government Junior High School, Chauri Chaura",
    districtCode: "13",
    kind: "school",
    affiliatedTo: null,
    clerk: {
      role: "institute",
      nameHi: "श्री बी. के. यादव",
      designationHi: "प्रधानाध्यापक",
      orgHi: "राजकीय जूनियर हाई स्कूल, चौरी चौरा",
      contactHint: "विद्यालय कार्यालय",
    },
    loginPin: "1234",
    masterDataPublishedAt: P("2026-08-04"),
    courses: [
      {
        code: "CLASS9",
        nameHi: "कक्षा 9",
        nameEn: "Class 9",
        group: "school",
        years: 1,
        feeHeads: { tuition: 0, exam: 300, hostel: 0, mess: 0, caution: 0, library: 0, other: 0 },
        publishedAt: P("2026-08-04"),
      },
      {
        code: "CLASS10",
        nameHi: "कक्षा 10",
        nameEn: "Class 10",
        group: "school",
        years: 1,
        feeHeads: { tuition: 0, exam: 350, hostel: 0, mess: 0, caution: 0, library: 0, other: 0 },
        publishedAt: P("2026-08-04"),
      },
    ],
  },
  {
    id: "inst-os-delhi",
    nameHi: "दिल्ली महाविद्यालय (उ0प्र0 के बाहर)",
    nameEn: "Delhi College (outside UP)",
    districtCode: "OS",
    kind: "college",
    affiliatedTo: null,
    clerk: {
      role: "institute",
      nameHi: "श्री पी. जोशी",
      designationHi: "छात्रवृत्ति समन्वयक",
      orgHi: "दिल्ली महाविद्यालय",
      contactHint: "छात्र कल्याण कार्यालय",
    },
    loginPin: "1234",
    masterDataPublishedAt: P("2026-08-18"),
    courses: [
      {
        code: "BCOM",
        nameHi: "बी.कॉम",
        nameEn: "B.Com",
        group: "general",
        years: 3,
        feeHeads: { tuition: 15600, exam: 1400, hostel: 38000, mess: 26000, caution: 3000, library: 800, other: 0 },
        publishedAt: P("2026-08-18"),
      },
    ],
  },
];

export const OPERATOR_LOGINS: { role: "institute" | "dwo"; code: string; pin: string; labelHi: string }[] = [
  { role: "institute", code: "inst-csjmu-arts", pin: "1234", labelHi: "राजकीय महाविद्यालय, कल्याणपुर" },
  { role: "institute", code: "inst-akt-engg", pin: "1234", labelHi: "श्री गंगा प्रसाद अभियंत्रण संस्थान" },
  { role: "institute", code: "inst-inter-lko", pin: "1234", labelHi: "नगर पालिका इंटर कॉलेज, लखनऊ" },
  { role: "institute", code: "inst-school-gkp", pin: "1234", labelHi: "राजकीय जूनियर हाई स्कूल" },
  { role: "institute", code: "inst-os-delhi", pin: "1234", labelHi: "दिल्ली महाविद्यालय (बाहर)" },
  { role: "dwo", code: "70", pin: "1234", labelHi: "जिला समाज कल्याण कार्यालय, कानपुर नगर" },
  { role: "dwo", code: "72", pin: "1234", labelHi: "जिला समाज कल्याण कार्यालय, लखनऊ" },
  { role: "dwo", code: "13", pin: "1234", labelHi: "जिला समाज कल्याण कार्यालय, गोरखपुर" },
];

// Synthetic e-District certificate registry. Deliberately incomplete: a number that is not here
// verifies as not_found, which is the real failure students hit.
export const CERT_REGISTRY: Record<
  string,
  {
    kind: "income" | "caste";
    applicationNo: string;
    certNo: string;
    issuedOn: string;
    annualIncome?: number;
    holderDob: string;
  }
> = {
  "IC-2024-771201": {
    kind: "income",
    applicationNo: "APP-2024-771201",
    certNo: "IC-2024-771201",
    issuedOn: P("2024-07-12"),
    annualIncome: 96000,
    holderDob: "2007-04-11",
  },
  "IC-2021-330077": {
    kind: "income",
    applicationNo: "APP-2021-330077",
    certNo: "IC-2021-330077",
    issuedOn: P("2021-09-02"),
    annualIncome: 84000,
    holderDob: "2006-01-20",
  },
  "IC-2026-909090": {
    kind: "income",
    applicationNo: "APP-2026-909090",
    certNo: "IC-2026-909090",
    issuedOn: P("2026-02-14"),
    annualIncome: 268000,
    holderDob: "2005-11-03",
  },
  "CC-2019-118834": {
    kind: "caste",
    applicationNo: "APP-2019-118834",
    certNo: "CC-2019-118834",
    issuedOn: P("2019-05-30"),
    holderDob: "2007-04-11",
  },
  "CC-2023-556677": {
    kind: "caste",
    applicationNo: "APP-2023-556677",
    certNo: "CC-2023-556677",
    issuedOn: P("2023-01-19"),
    holderDob: "2006-01-20",
  },
};

export const BOARD_REGISTRY: Record<string, { board: "upmsp" | "cbse" | "icse"; rollNo: string; year: number }> = {
  "upmsp:2404771201": { board: "upmsp", rollNo: "2404771201", year: 2024 },
  "upmsp:2504330077": { board: "upmsp", rollNo: "2504330077", year: 2025 },
  "cbse:9911220044": { board: "cbse", rollNo: "9911220044", year: 2024 },
};

export const ENROLMENT_REGISTRY: Record<string, { instituteId: string; enrolmentNo: string }> = {
  "inst-csjmu-arts:CSJM2426BA0917": { instituteId: "inst-csjmu-arts", enrolmentNo: "CSJM2426BA0917" },
  "inst-csjmu-arts:CSJM2426BS1188": { instituteId: "inst-csjmu-arts", enrolmentNo: "CSJM2426BS1188" },
  "inst-akt-engg:AKTU2426CS4471": { instituteId: "inst-akt-engg", enrolmentNo: "AKTU2426CS4471" },
  "inst-os-delhi:DU2426BC7781": { instituteId: "inst-os-delhi", enrolmentNo: "DU2426BC7781" },
};

// Aadhaar-DBT (NPCI) seeding states, keyed by demo Aadhaar. Unknown numbers default to kyc_only,
// which is the most common real-world trap.
export const DBT_REGISTRY: Record<string, "seeded" | "kyc_only" | "dormant"> = {
  "000012340001": "seeded",
  "000012340002": "kyc_only",
  "000012340003": "dormant",
  "000012340004": "seeded",
  "000012340005": "seeded",
};

export const DEMO_HINTS = {
  aadhaarSeeded: "000012340001",
  aadhaarNotSeeded: "000012340002",
  incomeCertValid: "IC-2024-771201",
  incomeCertExpired: "IC-2021-330077",
  incomeCertOverCap: "IC-2026-909090",
  casteCert: "CC-2019-118834",
  boardRoll: "2404771201",
  enrolment: "CSJM2426BA0917",
};
