import { handler, ok, readJson } from "@/server/http";
import { getSim, putSim } from "@/server/store";
import { requireMobile } from "@/server/mobile";

export const POST = handler(async (req) => {
  const body = await readJson(req);
  const mobile = requireMobile(body.mobile);
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
