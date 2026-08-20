import { handler, ok, readJson, str } from "@/server/http";
import { AppError } from "@/server/errors";
import { setSession } from "@/server/session-cookie";
import { OPERATOR_LOGINS } from "@/server/seeds";

export const POST = handler(async (req) => {
  const body = await readJson(req);
  const role = str(body.role, "भूमिका", 12);
  const code = str(body.code, "कोड", 40);
  const pin = str(body.pin, "पिन", 8);
  if (role !== "institute" && role !== "dwo") {
    throw new AppError("BAD_ROLE", { hi: "भूमिका गलत है।", en: "Unknown role.", status: 422 });
  }
  const match = OPERATOR_LOGINS.find((o) => o.role === role && o.code === code && o.pin === pin);
  if (!match) {
    throw new AppError("BAD_OPERATOR_LOGIN", {
      hi: "कोड या पिन मेल नहीं खाया। डेमो लॉगिन इसी पृष्ठ पर लिखे हैं।",
      en: "Code or PIN did not match; the demo credentials are printed on this page.",
      status: 401,
    });
  }
  await setSession(role, code);
  return ok({ role, code, labelHi: match.labelHi });
});
