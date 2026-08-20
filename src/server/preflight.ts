import type { Category, Cycle, PreflightItem, TrackId } from "./types";
import { daysBetween, iso, isBefore } from "./clock";
import { calendarFor } from "./config/calendar";
import { incomeCapFor } from "./config/rates";
import { REASONS } from "./config/reasons";
import { SCHEMES } from "./config/schemes";
import { AppError } from "./errors";
import { getInstitute, getSim, putSim } from "./store";
import { verifyCertificate } from "./external/edistrict";
import { checkDbt } from "./external/npci";

export type PreflightCtx = {
  track: TrackId;
  cycle: Cycle;
  category: Category;
  instituteId: string;
  courseCode: string;
  annualIncome: number | null;
  incomeCertNo?: string;
  incomeAppNo?: string;
  casteCertNo?: string;
  casteAppNo?: string;
  aadhaarDemo: string;
  otr: string;
  duplicateOtrs: string[];
  hosteller: boolean;
  previousResult?: "passed" | "promoted" | "failed" | null;
  /** tests only */
  todayOverride?: string;
  /** tests only */
  simulateEdistrictDown?: boolean;
};

const MONTHS_HI = ["जन", "फ़र", "मार्च", "अप्रैल", "मई", "जून", "जुल", "अग", "सित", "अक्तू", "नव", "दिस"];

function fmt(isoStamp: string): string {
  const d = new Date(isoStamp);
  return `${d.getUTCDate()} ${MONTHS_HI[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

function item(p: Partial<PreflightItem> & Pick<PreflightItem, "id" | "state" | "titleHi" | "titleEn" | "detailHi" | "detailEn">): PreflightItem {
  return {
    actionHi: null,
    etaHi: null,
    fixedBy: "none",
    ...p,
  } as PreflightItem;
}

export function runPreflight(ctx: PreflightCtx): PreflightItem[] {
  const today = ctx.todayOverride ?? iso();
  const cal = calendarFor(ctx.track, ctx.cycle);
  const scheme = SCHEMES[ctx.track];
  const items: PreflightItem[] = [];

  // 1. Is the portal window even open for this track and cycle?
  if (isBefore(today, cal.registrationOpen)) {
    items.push(
      item({
        id: "window_open",
        state: "warn",
        titleHi: "आवेदन विंडो अभी खुली नहीं है",
        titleEn: "The application window has not opened yet",
        detailHi: `इस वर्ग की विंडो ${fmt(cal.registrationOpen)} को खुलती है और ${fmt(
          cal.studentDeadline,
        )} को बंद होती है। आप अभी फ़ॉर्म भरकर तैयार रख सकते हैं।`,
        detailEn: `Opens ${cal.registrationOpen.slice(0, 10)}, closes ${cal.studentDeadline.slice(0, 10)}.`,
        actionHi: "फ़ॉर्म अभी भरें — विंडो खुलते ही लॉक कर दें",
        source: cal.source,
      }),
    );
  } else if (isBefore(cal.studentDeadline, today)) {
    items.push(
      item({
        id: "window_open",
        state: "blocked",
        titleHi: "आवेदन की अंतिम तारीख़ बीत चुकी है",
        titleEn: "The application deadline has passed",
        detailHi: `इस वर्ग की अंतिम तारीख़ ${fmt(cal.studentDeadline)} थी। विभाग की विंडो बढ़ने पर ही आवेदन हो सकेगा।`,
        detailEn: `The deadline was ${cal.studentDeadline.slice(0, 10)}.`,
        actionHi: "जिला समाज कल्याण कार्यालय से विंडो बढ़ने की जानकारी लें",
        fixedBy: "student",
        source: cal.source,
      }),
    );
  } else {
    const left = daysBetween(today, cal.studentDeadline);
    items.push(
      item({
        id: "window_open",
        state: "ok",
        titleHi: "आवेदन विंडो खुली है",
        titleEn: "The application window is open",
        detailHi: `अंतिम तारीख़ ${fmt(cal.studentDeadline)} — ${left} दिन बाकी हैं।`,
        detailEn: `Deadline ${cal.studentDeadline.slice(0, 10)}, ${left} days left.`,
        source: cal.source,
      }),
    );
  }

  // 2. Identity
  items.push(
    /^UP26-\d{10}$/.test(ctx.otr)
      ? item({
          id: "otr_identity",
          state: "ok",
          titleHi: "OTR तैयार है",
          titleEn: "OTR ready",
          detailHi: `आपका OTR ${ctx.otr} है। यह जीवनभर की पहचान है — दोबारा कभी न बनाएँ।`,
          detailEn: `Your OTR is ${ctx.otr}. It is a lifetime id.`,
        })
      : item({
          id: "otr_identity",
          state: "blocked",
          titleHi: "OTR नहीं बना है",
          titleEn: "No OTR yet",
          detailHi: "फ़ॉर्म लॉक करने से पहले OTR ज़रूरी है।",
          detailEn: "An OTR is required before locking the form.",
          actionHi: "पहले OTR बनाएँ — यही आपकी जीवनभर की पहचान है।",
          fixedBy: "student",
        }),
  );

  if (ctx.duplicateOtrs.length > 0) {
    items.push(
      item({
        id: "duplicate_otr",
        state: "warn",
        titleHi: "एक से ज़्यादा OTR बनने की कोशिश दर्ज है",
        titleEn: "A duplicate OTR attempt is on record",
        detailHi: `आपके आधार पर यह OTR भी बनाया गया था: ${ctx.duplicateOtrs.join(
          ", ",
        )}. आगे इसी मूल OTR (${ctx.otr}) से चलें।`,
        detailEn: `Duplicate attempt(s): ${ctx.duplicateOtrs.join(", ")}.`,
        actionHi:
          "दूसरा OTR इस्तेमाल न करें। असली पोर्टल पर दो OTR दोनों आवेदन ब्लॉक करा सकते हैं।",
        fixedBy: "student",
      }),
    );
  }

  // 3. Income against the category cap
  const cap = incomeCapFor(ctx.track, ctx.category);
  if (ctx.annualIncome === null) {
    items.push(
      item({
        id: "category_income_cap",
        state: "warn",
        titleHi: "पारिवारिक आय भरी नहीं है",
        titleEn: "Family income not entered",
        detailHi: `इस वर्ग की सीमा ${inr(cap.cap)} है। ${cap.note}`.trim(),
        detailEn: `The cap for this category is ${cap.cap}.`,
        actionHi: "फ़ॉर्म में वार्षिक पारिवारिक आय भरें",
        fixedBy: "student",
        source: cap.source,
      }),
    );
  } else if (ctx.annualIncome > cap.cap) {
    items.push(
      item({
        id: "category_income_cap",
        state: "blocked",
        titleHi: "आय इस वर्ग की सीमा से अधिक है",
        titleEn: "Income is above the category cap",
        detailHi: `भरी गई आय ${inr(ctx.annualIncome)} है और सीमा ${inr(cap.cap)}. ${cap.note}`.trim(),
        detailEn: `Entered ${ctx.annualIncome}, cap ${cap.cap}.`,
        actionHi: "प्रमाणपत्र की आय दोबारा जाँचें — सीमा से अधिक आवेदन DWO स्तर पर अस्वीकृत होता है",
        fixedBy: "student",
        source: cap.source,
      }),
    );
  } else {
    items.push(
      item({
        id: "category_income_cap",
        state: "ok",
        titleHi: "आय सीमा के भीतर है",
        titleEn: "Income is within the cap",
        detailHi: `${inr(ctx.annualIncome)} — इस वर्ग की सीमा ${inr(cap.cap)}. ${cap.note}`.trim(),
        detailEn: `${ctx.annualIncome} against a cap of ${cap.cap}.`,
        source: cap.source,
      }),
    );
  }

  // 4. Certificates, checked against the payment window rather than today
  items.push(certificateItem(ctx, cal.disbursementTo, "income"));
  if (ctx.category !== "general") items.push(certificateItem(ctx, cal.disbursementTo, "caste"));

  // 5. Institute and master data
  const inst = getInstitute(ctx.instituteId);
  items.push(
    inst && inst.masterDataPublishedAt
      ? item({
          id: "institute_registered",
          state: "ok",
          titleHi: "संस्थान पोर्टल पर पंजीकृत है",
          titleEn: "Institute is registered",
          detailHi: `${inst.nameHi} — मास्टर डेटा ${fmt(inst.masterDataPublishedAt)} को प्रकाशित।`,
          detailEn: `${inst.nameEn} published master data.`,
        })
      : item({
          id: "institute_registered",
          state: "blocked",
          titleHi: "संस्थान का मास्टर डेटा प्रकाशित नहीं है",
          titleEn: "Institute master data is not published",
          detailHi:
            "जब तक संस्थान इस सत्र का मास्टर डेटा प्रकाशित नहीं करता, आवेदन आगे नहीं बढ़ सकता।",
          detailEn: "The institute must publish master data for this session.",
          actionHi: "कॉलेज के छात्रवृत्ति नोडल अधिकारी से मास्टर डेटा प्रकाशित कराने को कहें",
          etaHi: "2-7 दिन",
          fixedBy: "institute",
        }),
  );

  const course = inst?.courses.find((c) => c.code === ctx.courseCode);
  items.push(
    course?.publishedAt
      ? item({
          id: "course_published",
          state: "ok",
          titleHi: "कोर्स मास्टर डेटा में है",
          titleEn: "Course is in master data",
          detailHi: `${course.nameHi} — ${fmt(course.publishedAt)} को प्रकाशित।`,
          detailEn: `${course.nameEn} published.`,
        })
      : item({
          id: "course_published",
          state: "blocked",
          titleHi: "कोर्स इस सत्र में प्रकाशित नहीं है",
          titleEn: "Course is not published this session",
          detailHi: REASONS.COURSE_NOT_PUBLISHED.hi,
          detailEn: REASONS.COURSE_NOT_PUBLISHED.en,
          actionHi: REASONS.COURSE_NOT_PUBLISHED.fixHi,
          etaHi: "2-7 दिन",
          fixedBy: "institute",
          source: REASONS.COURSE_NOT_PUBLISHED.source,
        }),
  );

  items.push(
    course?.publishedAt && course.feeHeads.tuition >= 0
      ? item({
          id: "fee_heads_published",
          state: "ok",
          titleHi: "शुल्क कॉलेज मास्टर डेटा से आएगा",
          titleEn: "Fee comes from institute master data",
          detailHi: `गैर-वापसी योग्य शुल्क ${inr(
            course.feeHeads.tuition,
          )} — आपको कोई राशि टाइप नहीं करनी है।`,
          detailEn: `Non-refundable fee ${course.feeHeads.tuition}; you never type an amount.`,
        })
      : item({
          id: "fee_heads_published",
          state: "warn",
          titleHi: "शुल्क विवरण उपलब्ध नहीं",
          titleEn: "Fee heads unavailable",
          detailHi: "कोर्स प्रकाशित होने के बाद शुल्क अपने आप भर जाएगा।",
          detailEn: "The fee fills in automatically once the course is published.",
          fixedBy: "institute",
        }),
  );

  // 6. Payment address
  items.push(dbtItem(ctx));

  // 7. Rules the student should know before, not after
  items.push(
    item({
      id: "attendance_rule",
      state: "ok",
      titleHi: "उपस्थिति 75% अनिवार्य है",
      titleEn: "75% attendance is mandatory",
      detailHi:
        "उपस्थिति संस्थान भरता है। 75% से कम होने पर फ़ाइल आगे नहीं बढ़ती और यह ऑनलाइन ठीक नहीं होती।",
      detailEn: "The institute certifies attendance; below 75% the file cannot move.",
      fixedBy: "institute",
      source: REASONS.ATTENDANCE_BELOW_75.source,
    }),
  );

  if (scheme.needsBonafide) {
    items.push(
      item({
        id: "bonafide_format",
        state: "ok",
        titleHi: "बोनाफ़ाइड कॉलेज लेटरहेड पर चाहिए",
        titleEn: "Bonafide must be on college letterhead",
        detailHi:
          "2026-27 से हस्तलिखित बोनाफ़ाइड मान्य नहीं। लेटरहेड, नामांकन संख्या, मोहर और डिजिटल हस्ताक्षर ज़रूरी हैं।",
        detailEn: "Handwritten bonafide certificates are rejected for 2026-27.",
        actionHi: "कॉलेज से लेटरहेड पर बोनाफ़ाइड बनवाकर हार्ड कॉपी के साथ रखें",
        fixedBy: "student",
      }),
    );
  }

  if (ctx.cycle === "renewal") {
    items.push(previousResultItem(ctx));
  }

  return items;
}

function certificateItem(
  ctx: PreflightCtx,
  disbursementTo: string,
  kind: "income" | "caste",
): PreflightItem {
  const certNo = kind === "income" ? ctx.incomeCertNo : ctx.casteCertNo;
  const appNo = kind === "income" ? ctx.incomeAppNo : ctx.casteAppNo;
  const id = kind === "income" ? "income_certificate" : "caste_certificate";
  const labelHi = kind === "income" ? "आय प्रमाणपत्र" : "जाति प्रमाणपत्र";

  if (!certNo || !appNo) {
    return item({
      id,
      state: "warn",
      titleHi: `${labelHi} का प्रमाणीकरण बाकी है`,
      titleEn: `${kind} certificate not verified yet`,
      detailHi: "फ़ॉर्म में प्रमाणपत्र संख्या और आवेदन संख्या भरते ही यहीं जाँच हो जाएगी।",
      detailEn: "Enter the certificate and application numbers to verify inline.",
      actionHi: "प्रमाणपत्र संख्या भरें",
      fixedBy: "student",
    });
  }

  const sim = getSim();
  const before = sim.upstream.edistrict.health;
  if (ctx.simulateEdistrictDown) {
    sim.upstream.edistrict.health = "down";
    putSim(sim);
  }
  try {
    const res = verifyCertificate({ kind, applicationNo: appNo, certNo });
    if (res.state === "not_found") {
      return item({
        id,
        state: "blocked",
        titleHi: `${labelHi} ई-डिस्ट्रिक्ट रिकॉर्ड में नहीं मिला`,
        titleEn: `${kind} certificate not found in e-District records`,
        detailHi: `संख्या ${certNo} और आवेदन संख्या ${appNo} से कोई रिकॉर्ड नहीं मिला। प्रमाणपत्र पर छपी संख्या दोबारा मिलाएँ।`,
        detailEn: `No record for ${certNo}.`,
        actionHi: "प्रमाणपत्र से दोनों संख्याएँ दोबारा मिलाएँ, या ई-डिस्ट्रिक्ट से नया बनवाएँ",
        etaHi: "7-15 दिन",
        fixedBy: "revenue_office",
      });
    }
    if (kind === "caste") {
      return item({
        id,
        state: "ok",
        titleHi: "जाति प्रमाणपत्र सत्यापित",
        titleEn: "Caste certificate verified",
        detailHi: `जारी ${fmt(res.issuedOn)} — रिकॉर्ड मिल गया।`,
        detailEn: `Issued ${res.issuedOn.slice(0, 10)}.`,
      });
    }
    const expired = isBefore(res.expiresOn, disbursementTo);
    if (expired) {
      return item({
        id,
        state: "blocked",
        titleHi: "आय प्रमाणपत्र भुगतान से पहले खत्म हो जाएगा",
        titleEn: "Income certificate expires before payment",
        detailHi: `जारी ${fmt(res.issuedOn)}, वैधता ${fmt(
          res.expiresOn,
        )} तक (3 साल)। इस वर्ग का भुगतान ${fmt(
          disbursementTo,
        )} तक होता है, इसलिए यह प्रमाणपत्र DWO स्तर पर अस्वीकृत हो जाएगा।`,
        detailEn: `Valid to ${res.expiresOn.slice(0, 10)}, payment runs to ${disbursementTo.slice(0, 10)}.`,
        actionHi: REASONS.INCOME_CERT_EXPIRED.fixHi,
        etaHi: "7-15 दिन",
        fixedBy: "revenue_office",
        source: REASONS.INCOME_CERT_EXPIRED.source,
      });
    }
    return item({
      id,
      state: "ok",
      titleHi: "आय प्रमाणपत्र वैध है",
      titleEn: "Income certificate is valid",
      detailHi: `जारी ${fmt(res.issuedOn)}, वैधता ${fmt(res.expiresOn)} तक — भुगतान अवधि (${fmt(
        disbursementTo,
      )}) तक चलेगा। दर्ज आय ${inr(res.annualIncome ?? 0)}.`,
      detailEn: `Valid to ${res.expiresOn.slice(0, 10)}; recorded income ${res.annualIncome}.`,
    });
  } catch (e) {
    const hi =
      e instanceof AppError ? e.hi : "जाँच नहीं हो सकी। थोड़ी देर बाद दोबारा कोशिश करें।";
    return item({
      id,
      state: "unknown",
      titleHi: `${labelHi} की जाँच नहीं हो सकी`,
      titleEn: `${kind} certificate check could not run`,
      detailHi: hi,
      detailEn: e instanceof AppError ? e.en : "The check could not run.",
      actionHi: "दोबारा जाँचें — जब तक जाँच नहीं होती, हम इसे 'ठीक है' नहीं मानेंगे",
      fixedBy: "student",
    });
  } finally {
    if (ctx.simulateEdistrictDown) {
      const s = getSim();
      s.upstream.edistrict.health = before;
      putSim(s);
    }
  }
}

function dbtItem(ctx: PreflightCtx): PreflightItem {
  try {
    const dbt = checkDbt(ctx.aadhaarDemo);
    if (dbt.state === "seeded") {
      return item({
        id: "dbt_seeding",
        state: "ok",
        titleHi: "भुगतान का पता तैयार है (आधार-DBT)",
        titleEn: "Payment address ready (Aadhaar-DBT)",
        detailHi: `${dbt.hi} इसीलिए खाता संख्या या IFSC कहीं नहीं पूछा जाता।`,
        detailEn: "Payment routes through the Aadhaar-NPCI mapper, so no account number is needed.",
      });
    }
    return item({
      id: "dbt_seeding",
      state: "warn",
      titleHi: "बैंक खाता आधार-DBT से जुड़ा नहीं दिख रहा",
      titleEn: "Bank account does not look DBT-seeded",
      detailHi: `${dbt.hi} आवेदन अब भी भरा जा सकता है, पर भुगतान से पहले यह ठीक होना चाहिए।`,
      detailEn: "You can still apply, but this must be fixed before payment.",
      actionHi: dbt.actionHi,
      etaHi: "3-5 दिन",
      fixedBy: "bank",
      source: REASONS.NPCI_NOT_SEEDED.source,
    });
  } catch (e) {
    return item({
      id: "dbt_seeding",
      state: "unknown",
      titleHi: "बैंक सीडिंग की जाँच नहीं हो सकी",
      titleEn: "DBT seeding check could not run",
      detailHi: e instanceof AppError ? e.hi : "NPCI जाँच नहीं हो सकी।",
      detailEn: e instanceof AppError ? e.en : "The NPCI check could not run.",
      actionHi: "दोबारा जाँचें",
      fixedBy: "student",
    });
  }
}

function previousResultItem(ctx: PreflightCtx): PreflightItem {
  if (ctx.previousResult === "failed") {
    return item({
      id: "previous_result",
      state: "blocked",
      titleHi: "अनुत्तीर्ण वर्ष पर नवीनीकरण नहीं होता",
      titleEn: "A failed year cannot be renewed",
      detailHi:
        "नियम के मुताबिक असफल वर्ष पर नवीनीकरण नहीं मिलता। बैक पेपर के साथ प्रोन्नत हुए हों तो 'बैक पेपर के साथ प्रोन्नत' चुनें।",
      detailEn: "A failed year is ineligible; 'promoted with back paper' is eligible.",
      actionHi: "परिणाम की स्थिति दोबारा जाँचें",
      fixedBy: "student",
    });
  }
  if (!ctx.previousResult) {
    return item({
      id: "previous_result",
      state: "warn",
      titleHi: "पिछले वर्ष का परिणाम भरा नहीं है",
      titleEn: "Previous year result not entered",
      detailHi: "नवीनीकरण में परिणाम, प्राप्तांक और कुल अंक भरना ज़रूरी है।",
      detailEn: "Renewal requires the result and marks.",
      actionHi: "फ़ॉर्म के 'पिछला परिणाम' भाग में भरें",
      fixedBy: "student",
    });
  }
  return item({
    id: "previous_result",
    state: "ok",
    titleHi: ctx.previousResult === "promoted" ? "बैक पेपर के साथ प्रोन्नत — पात्र" : "उत्तीर्ण — पात्र",
    titleEn: ctx.previousResult === "promoted" ? "Promoted with back paper — eligible" : "Passed — eligible",
    detailHi:
      "पूरे वर्ष के कुल अंक भरें (CGPA या एक सेमेस्टर के अंक नहीं) — यही सबसे आम अस्वीकृति का कारण है।",
    detailEn: "Enter full-year totals, not CGPA or a single semester.",
  });
}

export function blockers(items: PreflightItem[]): PreflightItem[] {
  return items.filter((i) => i.state === "blocked");
}

export function warnings(items: PreflightItem[]): PreflightItem[] {
  return items.filter((i) => i.state === "warn");
}
