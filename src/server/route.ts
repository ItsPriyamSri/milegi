import type { Cycle, TrackId } from "./types";

export type RouteAnswers = {
  studying: "class_9_10" | "class_11_12" | "college";
  firstYear: boolean;
  gotLastYear: "yes" | "no" | "dunno";
  changedCourse: boolean;
  rejectedLastYear: boolean;
  inUp: boolean;
};

export type RouteResult = {
  track: TrackId;
  cycle: Cycle;
  reasonHi: string;
  reasonEn: string;
  /** Always present: how to recover an old registration number instead of minting a second OTR. */
  recoveryHi: string;
  warnHi: string | null;
};

const RECOVERY_HI =
  "पिछले साल का पंजीकरण नंबर भूल गए? हाई स्कूल रोल नंबर, पासिंग ईयर और पंजीकृत मोबाइल से वह वापस मिल जाता है — " +
  "नया OTR कभी न बनाएँ।";

export function routeStudent(a: RouteAnswers): RouteResult {
  const track: TrackId = !a.inUp
    ? "outside_state"
    : a.studying === "class_9_10"
      ? "pre_9_10"
      : a.studying === "class_11_12"
        ? "post_inter"
        : "dashmottar";

  // Fresh-forcing facts, in priority order. Each is a real portal rule.
  if (a.changedCourse) {
    return {
      track,
      cycle: "fresh",
      recoveryHi: RECOVERY_HI,
      warnHi: null,
      reasonHi: "कोर्स बदला है — इसलिए यह नया (Fresh) आवेदन है, नवीनीकरण नहीं।",
      reasonEn: "Course changed, so this is a Fresh application, not a Renewal.",
    };
  }
  if (a.rejectedLastYear) {
    return {
      track,
      cycle: "fresh",
      recoveryHi: RECOVERY_HI,
      warnHi: null,
      reasonHi: "पिछले साल आवेदन अस्वीकृत हुआ था — नियम के मुताबिक यह नया आवेदन है।",
      reasonEn: "Last year was rejected, so this is a Fresh application.",
    };
  }
  if (a.firstYear) {
    return {
      track,
      cycle: "fresh",
      recoveryHi: RECOVERY_HI,
      warnHi: null,
      reasonHi: "इस कोर्स का पहला साल — नया (Fresh) आवेदन।",
      reasonEn: "First year of this course — Fresh application.",
    };
  }
  if (a.gotLastYear === "yes") {
    return {
      track,
      cycle: "renewal",
      recoveryHi: RECOVERY_HI,
      warnHi:
        "नवीनीकरण में दूसरा OTR बनाना सबसे बड़ी गलती है — इससे दोनों आवेदन ब्लॉक हो सकते हैं।",
      reasonHi: "पिछले साल इसी कोर्स पर छात्रवृत्ति मिली थी — यह नवीनीकरण (Renewal) है।",
      reasonEn: "Scholarship received last year on the same course — this is a Renewal.",
    };
  }
  // "no" without a rejection, and "dunno", both resolve to the renewal side: minting a second OTR is
  // the failure that blocks BOTH applications, so the safe default is to look for the old file first.
  return {
    track,
    cycle: "renewal",
    recoveryHi: RECOVERY_HI,
    warnHi:
      "अगर पिछला आवेदन मौजूद है और आप नया OTR बना लेते हैं, तो दोनों आवेदन ब्लॉक हो सकते हैं।",
    reasonHi:
      a.gotLastYear === "dunno"
        ? "पक्का याद नहीं — इसलिए पहले पुराना आवेदन खोजा जाएगा (यही सुरक्षित रास्ता है)।"
        : "पहला साल नहीं है — पहले पुराना आवेदन खोजा जाएगा, तभी तय होगा कि नवीनीकरण है या नया आवेदन।",
    reasonEn:
      "Not the first year — the old file is looked up first before deciding Fresh vs Renewal.",
  };
}
