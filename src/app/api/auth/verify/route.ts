import { handler, ok, readJson, str } from "@/server/http";
import { AppError } from "@/server/errors";
import { setSession } from "@/server/session-cookie";
import { caseSummary } from "@/server/cases";
import { casesForProfile, findProfileByMobile, getSim } from "@/server/store";
import { requireMobile } from "@/server/mobile";

export const POST = handler(async (req) => {
  const body = await readJson(req);
  const mobile = requireMobile(body.mobile);
  const otp = str(body.otp, "OTP", 6);
  const expected = getSim().otpFor[mobile];
  if (!expected || expected !== otp) {
    throw new AppError("OTP_WRONG", {
      hi: "OTP मेल नहीं खाया। स्क्रीन पर दिख रहा नकली OTP दोबारा डालें।",
      en: "The OTP did not match.",
      status: 401,
    });
  }
  const profile = findProfileByMobile(mobile);
  await setSession("student", profile?.id ?? `pending:${mobile}`);
  return ok({
    mobile,
    profile: profile
      ? { id: profile.id, otr: profile.otr, nameHi: profile.nameHi, category: profile.category }
      : null,
    cases: profile ? casesForProfile(profile.id).map((c) => caseSummary(c)) : [],
  });
});
