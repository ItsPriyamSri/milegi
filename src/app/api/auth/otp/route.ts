import { handler, ok, readJson, str } from "@/server/http";
import { AppError } from "@/server/errors";
import { getSim, putSim } from "@/server/store";

export const POST = handler(async (req) => {
  const body = await readJson(req);
  const mobile = str(body.mobile, "मोबाइल नंबर", 10);
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    throw new AppError("BAD_MOBILE", {
      hi: "10 अंकों का मोबाइल नंबर डालें (6-9 से शुरू)।",
      en: "Enter a 10-digit mobile number starting 6-9.",
      status: 422,
    });
  }
  const otp = String(100000 + Math.floor(Math.random() * 899999));
  const sim = getSim();
  sim.otpFor[mobile] = otp;
  putSim(sim);
  return ok({
    mobile,
    otpDemo: otp,
    noteHi: "यह नकली OTP है — कोई SMS नहीं भेजा गया।",
    noteEn: "This is a mock OTP. No SMS was sent.",
  });
});
