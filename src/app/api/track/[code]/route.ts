import { handler, ok } from "@/server/http";
import { AppError } from "@/server/errors";
import { trackView } from "@/server/cases";
import { getCase } from "@/server/store";

/** Public, shareable, login-free status view. No form data, no certificate numbers. */
export const GET = handler(async (_req, { params }) => {
  const { code } = await params;
  const existing = getCase(decodeURIComponent(code).trim().toUpperCase());
  if (!existing) {
    throw new AppError("CASE_NOT_FOUND", {
      hi: "इस नंबर से कोई फ़ाइल नहीं मिली। आवेदन संख्या (MLG-26-…) दोबारा जाँचें।",
      en: "No file for that tracking code.",
      status: 404,
    });
  }
  return ok({ case: trackView(existing) });
});
