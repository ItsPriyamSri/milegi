export type Lang = "hi" | "en";

type Entry = { hi: string; en: string };

export const BANNER: Entry = {
  hi: "स्वतंत्र हैकथॉन प्रोटोटाइप · नकली डेटा · सरकारी वेबसाइट नहीं",
  en: "Independent hackathon prototype · synthetic data · not a government website",
};

export const DICT: Record<string, Entry> = {
  brand: { hi: "मिलेगी", en: "Milegi" },
  brandSub: { hi: "छात्रवृत्ति फ़ाइल, नाम और तारीख़ के साथ", en: "A scholarship file with a name and a date" },
  langToggle: { hi: "English", en: "हिन्दी" },
  themeToggle: { hi: "रंग", en: "Theme" },
  skip: { hi: "मुख्य सामग्री पर जाएँ", en: "Skip to main content" },

  landingLede: {
    hi: "छात्रवृत्ति का असली सवाल यह नहीं है कि फ़ॉर्म कैसा दिखता है। सवाल यह है कि पैसा कब आएगा, कितना आएगा, फ़ाइल किसके पास है, और चुप्पी में मरने से पहले आपको क्या करना है।",
    en: "The real question is not what the form looks like. It is when the money arrives, how much, who is holding your file, and what you must do before it dies in silence.",
  },
  landingWhat: {
    hi: "यह उत्तर प्रदेश की छात्रवृत्ति सेवा (Saksham) का एक स्वतंत्र प्रोटोटाइप है। पूरा डेटा नकली है और कोई सरकारी प्रणाली नहीं छुई गई है।",
    en: "This is an independent prototype of Uttar Pradesh's Saksham scholarship service. All data is synthetic and no government system was touched.",
  },
  doorNew: { hi: "नया आवेदन शुरू करें", en: "Start a new application" },
  doorNewSub: { hi: "मोबाइल OTP से — आठ अलग लॉगिन नहीं", en: "Mobile OTP — not eight separate logins" },
  doorTrack: { hi: "अपनी फ़ाइल देखें", en: "Track my file" },
  doorTrackSub: { hi: "आवेदन संख्या से, बिना लॉगिन", en: "By application number, no login" },

  claim1Fig: { hi: "8 → 1", en: "8 → 1" },
  claim1: {
    hi: "आठ अलग लॉगिन (पूर्वदशम, इंटर, दशमोत्तर, बाहर × नया, नवीनीकरण) की जगह एक दरवाज़ा जो तीन सवाल पूछकर बताता है कि आप कौन-सा आवेदन हैं।",
    en: "One door replaces eight logins; three plain questions decide which application you are.",
  },
  claim1Was: {
    hi: "गलत दरवाज़े पर असली पोर्टल कहता है: No Record Found.",
    en: "On the real portal the wrong door says: No Record Found.",
  },
  claim2Fig: { hi: "30 मिनट", en: "30 min" },
  claim2: {
    hi: "जाँच पहले, टाइपिंग बाद में। आय प्रमाणपत्र की 3 साल की वैधता, वर्ग की आय सीमा, कॉलेज के मास्टर डेटा में कोर्स, और बैंक की आधार-DBT सीडिंग — सब फ़ॉर्म खोलने से पहले।",
    en: "Checks first, typing second: certificate validity, the income cap, whether your course exists in master data, and DBT seeding — all before the form opens.",
  },
  claim2Was: {
    hi: "असली पोर्टल पर आय-जाति प्रमाणीकरण 30 मिनट टाइप करने के बाद, अलग डैशबोर्ड पर होता है।",
    en: "Today certificate authentication is a separate dashboard step after the long form.",
  },
  claim3Fig: { hi: "3 महीने", en: "3 months" },
  claim3: {
    hi: "हर चरण का एक नाम वाला ज़िम्मेदार और एक तारीख़ होती है। समय सीमा बीतने पर अनुरोध स्वतः ऊपर जाता है और शिकायत का मसौदा तैयार मिलता है — प्रतीक्षा की गिनती कभी शून्य नहीं होती।",
    en: "Every stage has a named owner and a deadline. A breach escalates automatically and a grievance draft is ready — the waiting counter never resets.",
  },
  claim3Was: {
    hi: "एक दर्ज शिकायत (GOVUP/E/2026/0035742): फ़ाइल तीन महीने एक ही चरण पर रुकी, कोई कारण नहीं, कोई ज़िम्मेदार नहीं।",
    en: "A filed grievance (GOVUP/E/2026/0035742): three months at one stage, no reason, nobody accountable.",
  },

  howToTry: {
    hi: "अज़माने का तरीक़ा: अगले स्क्रीन पर OTP दिखेगा · डेमो आधार 000012340001 (सीडेड)",
    en: "How to try: OTP prints on the next screen · demo Aadhaar 000012340001 (seeded)",
  },
  fakeChip: { hi: "नकली", en: "MOCK" },
  demoStripKicker: {
    hi: "नकली फ़ाइल — ऐसा दिखता है जब किसी के पास ज़िम्मेदारी होती है",
    en: "Synthetic file — this is what accountability looks like",
  },
  demoStripOwner: { hi: "श्री आर. के. वर्मा", en: "Shri R. K. Verma" },
  demoStripRole: {
    hi: "छात्रवृत्ति लिपिक · छत्रपति शाहू जी महाराज विश्वविद्यालय, कानपुर",
    en: "Scholarship clerk · CSJMU Kanpur",
  },
  demoStripDue: { hi: "समय सीमा शुक्रवार 12 सितम्बर", en: "Due Friday 12 Sep" },
  demoStripWait: { hi: "14 दिन से इसी चरण पर", en: "14 days at this stage" },

  navLimits: { hi: "सीमाएँ — क्या सॉफ़्टवेयर ठीक नहीं कर सकता", en: "Limits — what software cannot fix" },
  navHelp: { hi: "मदद: OTR, शुल्क, तारीख़ें", en: "Help: OTR, fees, dates" },
  navSim: { hi: "मॉक प्रणाली पैनल", en: "Mock system panel" },
  navInstitute: { hi: "संस्थान लॉगिन", en: "Institute login" },
  navDwo: { hi: "जिला कार्यालय लॉगिन", en: "District office login" },
  footNote: {
    hi: "यह प्रोटोटाइप Build What Moves India (2026) के लिए बनाया गया है। किसी सरकारी विभाग से सम्बन्ध नहीं। सारा डेटा नकली है।",
    en: "Built for Build What Moves India (2026). No affiliation with any government department. All data is synthetic.",
  },

  errTitle: { hi: "कुछ गड़बड़ हुई", en: "Something went wrong" },
  errRetry: { hi: "दोबारा कोशिश करें", en: "Try again" },
  errRef: { hi: "संदर्भ", en: "Reference" },
  errDraftSafe: {
    hi: "आपका ड्राफ़्ट इस फ़ोन पर सुरक्षित है।",
    en: "Your draft is safe on this phone.",
  },
  notFound: {
    hi: "यह पता नहीं मिला। लिंक अधूरा हो सकता है।",
    en: "That address does not exist. The link may be incomplete.",
  },

  saveLocal: { hi: "इस फोन पर सेव है", en: "Saved on this phone" },
  savePending: { hi: "अभी सिंक नहीं हुआ", en: "Not synced yet" },
  saveSaved: { hi: "सेव हो गया", en: "Saved" },

  stateOk: { hi: "ठीक है", en: "OK" },
  stateWarn: { hi: "ध्यान दें", en: "Attention" },
  stateBlocked: { hi: "रुकावट", en: "Blocker" },
  stateUnknown: { hi: "पता नहीं चला", en: "Unknown" },

  fixedByStudent: { hi: "आपको करना है", en: "You must do this" },
  fixedByInstitute: { hi: "कॉलेज को करना है", en: "The institute must do this" },
  fixedByBank: { hi: "बैंक में करना है", en: "Do this at your bank" },
  fixedByRevenue: { hi: "तहसील / ई-डिस्ट्रिक्ट से", en: "At the tehsil / e-District" },
  eta: { hi: "समय", en: "Takes" },
  source: { hi: "स्रोत", en: "Source" },
};

export function t(key: keyof typeof DICT | string, lang: Lang): string {
  const entry = DICT[key];
  if (!entry) return String(key);
  return lang === "en" ? entry.en : entry.hi;
}

export function pick(entry: Entry, lang: Lang): string {
  return lang === "en" ? entry.en : entry.hi;
}

/** Hindi copy from the API with an English counterpart where the domain provides one. */
export function bi(hi: string, en: string | null | undefined, lang: Lang): string {
  if (lang === "en" && en && en.trim().length > 0) return en;
  return hi;
}
