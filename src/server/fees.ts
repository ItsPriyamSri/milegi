import type { ActorRef, Case, FeeHeads, Stage } from "./types";
import { iso } from "./clock";
import { getInstitute } from "./store";
import { AMOUNT_DISCLAIMER_EN, AMOUNT_DISCLAIMER_HI, maintenanceFor } from "./config/rates";
import { SCHEMES } from "./config/schemes";
import { AppError } from "./errors";
import { appendEvent } from "./machine";

type ExcludedKey = "exam" | "hostel" | "mess" | "caution" | "library";

const EXCLUDED_LABELS: Record<ExcludedKey, string> = {
  exam: "परीक्षा शुल्क",
  hostel: "छात्रावास",
  mess: "मेस",
  caution: "कॉशन मनी",
  library: "पुस्तकालय जमानत",
};

export const EXCLUDED_NOTE_HI =
  "छात्रवृत्ति में केवल गैर-वापसी योग्य शुल्क आता है — छात्रावास, मेस, कॉशन मनी, पुस्तकालय और परीक्षा शुल्क नहीं।";

export const DISPUTABLE_STAGES: Stage[] = [
  "draft",
  "institute_review",
  "university_scrutiny",
  "dwo_review",
];

export type FeeView = {
  heads: FeeHeads;
  nonRefundable: number;
  excluded: { key: ExcludedKey; label: string; amount: number }[];
};

export function feeFor(instituteId: string, courseCode: string): FeeView {
  const inst = getInstitute(instituteId);
  if (!inst) throw new Error(`institute ${instituteId} not found`);
  const course = inst.courses.find((c) => c.code === courseCode);
  if (!course) throw new Error(`course ${courseCode} not found at ${instituteId}`);
  if (!course.publishedAt) {
    throw new Error(`course ${courseCode} is not published in master data`);
  }
  const excluded = (Object.keys(EXCLUDED_LABELS) as ExcludedKey[])
    .filter((k) => course.feeHeads[k] > 0)
    .map((k) => ({ key: k, label: EXCLUDED_LABELS[k], amount: course.feeHeads[k] }));
  return { heads: course.feeHeads, nonRefundable: course.feeHeads.tuition, excluded };
}

export function estimateFor(c: Case): Case["estimate"] {
  const inst = getInstitute(c.instituteId);
  const course = inst?.courses.find((x) => x.code === c.courseCode);
  const scheme = SCHEMES[c.track];
  const group = course?.group ?? "general";
  const hosteller = c.form.hosteller === true;
  const band = maintenanceFor(group, hosteller);
  const feeReimbursement =
    scheme.feeReimbursement && course?.publishedAt ? course.feeHeads.tuition : 0;
  return {
    feeReimbursement,
    maintenancePerMonth: band.perMonth,
    months: band.months,
    total: feeReimbursement + band.perMonth * band.months,
    basisHi:
      (feeReimbursement > 0
        ? `कॉलेज मास्टर डेटा के अनुसार गैर-वापसी योग्य शुल्क ₹${feeReimbursement.toLocaleString(
            "en-IN",
          )} + `
        : "") +
      `रखरखाव भत्ता ₹${band.perMonth}/माह × ${band.months} माह। ${AMOUNT_DISCLAIMER_HI}`,
    basisEn:
      (feeReimbursement > 0
        ? `Non-refundable tuition ₹${feeReimbursement.toLocaleString("en-IN")} from college master data + `
        : "") +
      `maintenance ₹${band.perMonth}/month × ${band.months} months. ${AMOUNT_DISCLAIMER_EN}`,
  };
}

export function raiseFeeDispute(
  input: Case,
  note: string,
  actor: ActorRef,
  amount?: number,
): Case {
  if (!DISPUTABLE_STAGES.includes(input.stage)) {
    throw new AppError("DISPUTE_TOO_LATE", {
      hi: "इस चरण पर शुल्क आपत्ति दर्ज नहीं की जा सकती — भुगतान प्रक्रिया शुरू हो चुकी है।",
      en: "A fee dispute cannot be raised at this stage.",
      status: 409,
    });
  }
  const c: Case = structuredClone(input);
  const at = iso();
  c.fee.disputed = { note, at, ...(amount !== undefined ? { amount } : {}) };
  appendEvent(c, {
    at,
    type: "fee_disputed",
    actor,
    summaryHi: `शुल्क आपत्ति दर्ज: ${note}`,
    summaryEn: `Fee dispute raised: ${note}`,
  });
  return c;
}
