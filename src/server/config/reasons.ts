export type ReasonCode = {
  id: string;
  hi: string;
  en: string;
  fixHi: string;
  fixedBy: "student" | "institute" | "bank" | "revenue_office" | "none";
  correctable: boolean;
  raisedBy: "institute" | "dwo" | "system";
  source: string;
};

const SRC = "https://upscholarshiip.com/correction/";
const PAY_SRC = "https://upscholarshiip.com/payment-status/";
const APPLY_SRC = "https://upscholarshiip.com/apply-online/";

export const REASONS: Record<string, ReasonCode> = {
  BOARD_ROLL_MISMATCH: {
    id: "BOARD_ROLL_MISMATCH",
    hi: "हाई स्कूल रोल नंबर या बोर्ड का नाम बोर्ड के डेटाबेस से मेल नहीं खा रहा",
    en: "High-school roll number or board name does not match the board database",
    fixHi: "सुधार विंडो में सही बोर्ड चुनें और मार्कशीट पर छपा रोल नंबर वैसे ही भरें।",
    fixedBy: "student",
    correctable: true,
    raisedBy: "dwo",
    source: SRC,
  },
  ENROLMENT_MISMATCH: {
    id: "ENROLMENT_MISMATCH",
    hi: "नामांकन संख्या विश्वविद्यालय के मास्टर डेटा से मेल नहीं खा रही",
    en: "Enrolment number does not match university master data",
    fixHi:
      "कॉलेज की नामांकन पर्ची से संख्या मिलाएँ और सुधार विंडो में दोबारा भरें (स्पेस या डैश न डालें)।",
    fixedBy: "student",
    correctable: true,
    raisedBy: "dwo",
    source: SRC,
  },
  DUPLICATE_INCOME_CERT: {
    id: "DUPLICATE_INCOME_CERT",
    hi: "यही आय प्रमाणपत्र किसी और आवेदन में भी लगा है (अक्सर भाई-बहन)",
    en: "The same income certificate is used on another application (usually a sibling)",
    fixHi:
      "नंबर बदलने की ज़रूरत नहीं। भाई-बहन का शपथ-पत्र और उनके आवेदन की कॉपी कॉलेज लिपिक को दें।",
    fixedBy: "student",
    correctable: false,
    raisedBy: "dwo",
    source: SRC,
  },
  BLOCKED_BY_DIRECTORATE: {
    id: "BLOCKED_BY_DIRECTORATE",
    hi: "निदेशालय स्तर पर रोक — कॉलेज की स्वीकृत सीट सीमा या सम्बद्धता का मामला",
    en: "Blocked by directorate — sanctioned intake exceeded or affiliation pending",
    fixHi:
      "यह छात्र के स्तर पर ठीक नहीं होता। कॉलेज प्रशासन को सम्बद्धता या सीट क्षमता का प्रमाण विभाग को भेजना होगा।",
    fixedBy: "institute",
    correctable: false,
    raisedBy: "dwo",
    source: SRC,
  },
  ATTENDANCE_BELOW_75: {
    id: "ATTENDANCE_BELOW_75",
    hi: "उपस्थिति 75% से कम दर्ज है",
    en: "Attendance recorded below 75%",
    fixHi:
      "ऑनलाइन ठीक नहीं होगा। विभागाध्यक्ष से हस्ताक्षरित उपस्थिति विवरण लेकर कॉलेज से दोबारा अपलोड कराएँ।",
    fixedBy: "institute",
    correctable: false,
    raisedBy: "institute",
    source: SRC,
  },
  INCOME_CERT_EXPIRED: {
    id: "INCOME_CERT_EXPIRED",
    hi: "आय प्रमाणपत्र की 3 साल की वैधता पूरी हो गई है",
    en: "Income certificate is past its 3-year validity",
    fixHi:
      "ई-डिस्ट्रिक्ट से नया आय प्रमाणपत्र बनवाएँ (आम तौर पर 7-15 दिन), फिर प्रमाणीकरण दोबारा चलाएँ।",
    fixedBy: "revenue_office",
    correctable: true,
    raisedBy: "system",
    source: SRC,
  },
  HARDCOPY_NOT_RECEIVED: {
    id: "HARDCOPY_NOT_RECEIVED",
    hi: "लॉक की गई प्रति कॉलेज में जमा नहीं हुई",
    en: "The locked printout never reached the institute",
    fixHi:
      "अंतिम प्रिंट, शुल्क रसीद और मार्कशीट कॉलेज छात्रवृत्ति प्रकोष्ठ में जमा करें और रसीद लें।",
    fixedBy: "student",
    correctable: true,
    raisedBy: "institute",
    source: SRC,
  },
  FEE_MISMATCH: {
    id: "FEE_MISMATCH",
    hi: "फॉर्म का गैर-वापसी योग्य शुल्क कॉलेज की रसीद से मेल नहीं खा रहा",
    en: "Non-refundable fee does not match the institute receipt",
    fixHi: "रसीद कॉलेज लिपिक को दिखाएँ — मास्टर डेटा का शुल्क कॉलेज ही ठीक कर सकता है।",
    fixedBy: "institute",
    correctable: true,
    raisedBy: "institute",
    source: SRC,
  },
  NPCI_NOT_SEEDED: {
    id: "NPCI_NOT_SEEDED",
    hi: "बैंक खाता आधार-DBT (NPCI) से जुड़ा नहीं है, इसलिए भुगतान वापस लौट आया",
    en: "Bank account is not NPCI/Aadhaar-DBT seeded, so the payment bounced",
    fixHi:
      "बैंक शाखा जाकर 'NPCI Aadhaar Seeding / DBT Mapping' फॉर्म भरें। 'KYC हो चुका है' पर्याप्त नहीं है।",
    fixedBy: "bank",
    correctable: false,
    raisedBy: "system",
    source: PAY_SRC,
  },
  ACCOUNT_DORMANT: {
    id: "ACCOUNT_DORMANT",
    hi: "बैंक खाता निष्क्रिय (dormant) है, इसलिए भुगतान नहीं पहुँचा",
    en: "The bank account is dormant, so the credit failed",
    fixHi: "शाखा में आधार और पासबुक लेकर खाता सक्रिय कराएँ, फिर DBT मैपिंग जाँचें।",
    fixedBy: "bank",
    correctable: false,
    raisedBy: "system",
    source: PAY_SRC,
  },
  TXN_LIMIT_EXCEEDED: {
    id: "TXN_LIMIT_EXCEEDED",
    hi: "राशि खाते की प्रति-लेनदेन सीमा से अधिक है, इसलिए क्रेडिट लौट गया",
    en: "The amount exceeds the account's per-transaction limit",
    fixHi: "शाखा से बेसिक सेविंग्स खाते को नियमित खाते में बदलवाएँ या क्रेडिट सीमा बढ़वाएँ।",
    fixedBy: "bank",
    correctable: false,
    raisedBy: "system",
    source: PAY_SRC,
  },
  COURSE_NOT_PUBLISHED: {
    id: "COURSE_NOT_PUBLISHED",
    hi: "आपका कोर्स कॉलेज के मास्टर डेटा में इस सत्र के लिए नहीं है",
    en: "Your course is missing from the institute's master data for this session",
    fixHi:
      "कॉलेज के छात्रवृत्ति नोडल अधिकारी से कहें: 'कृपया मास्टर डेटा में यह कोर्स और शुल्क प्रकाशित करें।'",
    fixedBy: "institute",
    correctable: false,
    raisedBy: "system",
    source: APPLY_SRC,
  },
};

export function reasonsRaisedBy(who: ReasonCode["raisedBy"]): ReasonCode[] {
  return Object.values(REASONS).filter((r) => r.raisedBy === who);
}
