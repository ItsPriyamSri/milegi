import { handler, ok, readJson } from "@/server/http";
import { recoverIdentity } from "@/server/otr";

export const POST = handler(async (req) => {
  const body = await readJson(req);
  const found = recoverIdentity({
    ...(typeof body.mobile === "string" ? { mobile: body.mobile.trim() } : {}),
    ...(typeof body.boardRollNo === "string" ? { boardRollNo: body.boardRollNo.trim() } : {}),
    ...(body.passingYear ? { passingYear: Number(body.passingYear) } : {}),
  });
  return ok({
    found: Boolean(found.profile),
    otr: found.profile?.otr ?? null,
    hintHi: found.hintHi,
  });
});
