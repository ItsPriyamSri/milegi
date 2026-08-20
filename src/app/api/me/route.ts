import { handler, ok } from "@/server/http";
import { readSession } from "@/server/session-cookie";
import { caseSummary } from "@/server/cases";
import { casesForProfile, getProfile } from "@/server/store";
import { OPERATOR_LOGINS } from "@/server/seeds";

export const GET = handler(async () => {
  const session = await readSession();
  if (!session) return ok({ session: null, profile: null, cases: [] });
  if (session.role !== "student") {
    const label = OPERATOR_LOGINS.find(
      (o) => o.role === session.role && o.code === session.subjectId,
    )?.labelHi;
    return ok({ session, profile: null, cases: [], operatorLabelHi: label ?? session.subjectId });
  }
  const profile = session.subjectId.startsWith("pending:") ? null : getProfile(session.subjectId);
  return ok({
    session,
    profile: profile
      ? {
          id: profile.id,
          otr: profile.otr,
          nameHi: profile.nameHi,
          category: profile.category,
          districtCode: profile.districtCode,
          duplicateOtrs: profile.duplicateOtrs,
        }
      : null,
    cases: profile ? casesForProfile(profile.id).map((c) => caseSummary(c)) : [],
  });
});
