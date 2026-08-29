import { handler, ok } from "@/server/http";
import { AppError } from "@/server/errors";
import { trackView } from "@/server/cases";
import { resolveTracking } from "@/server/track";

/** Public, shareable, login-free status view. No form data, no certificate numbers. */
export const GET = handler(async (_req, { params }) => {
  const { code } = await params;
  const hit = resolveTracking(decodeURIComponent(code));
  if (hit.kind === "case") {
    return ok({ kind: "case", case: trackView(hit.case) });
  }
  if (hit.kind === "otr_no_case") {
    return ok({
      kind: "otr_no_case",
      otr: hit.otr,
      noteHi: "OTR मिल गया, पर अभी कोई आवेदन लॉक नहीं हुआ। Apply दरवाज़े से फ़ॉर्म भरें।",
      noteEn: "This OTR exists, but no application is locked yet. Use the Apply door to fill the form.",
    });
  }
  throw new AppError("CASE_NOT_FOUND", {
    hi: "इस नंबर से कोई फ़ाइल नहीं मिली। आवेदन संख्या (MLG-26-…), 15 अंकों का पंजीकरण, या OTR (UP26-…) दोबारा जाँचें।",
    en: "No file for that code. Try the case id (MLG-26-…), the 15-digit registration number, or the OTR (UP26-…).",
    status: 404,
  });
});
