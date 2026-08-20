import { handler, ok } from "@/server/http";
import { requireRole } from "@/server/session-cookie";
import { instituteQueue } from "@/server/institute";
import { getInstitute } from "@/server/store";
import { reasonsRaisedBy } from "@/server/config/reasons";

export const GET = handler(async (req) => {
  const session = await requireRole("institute");
  const url = new URL(req.url);
  const filter = (url.searchParams.get("filter") ?? "all") as
    | "all"
    | "pending"
    | "breach"
    | "hardcopy"
    | "forwarded";
  const rows = instituteQueue(session.subjectId, filter);
  const all = instituteQueue(session.subjectId, "all");
  const inst = getInstitute(session.subjectId);
  return ok({
    institute: inst
      ? {
          id: inst.id,
          nameHi: inst.nameHi,
          districtCode: inst.districtCode,
          affiliatedTo: inst.affiliatedTo,
          clerk: inst.clerk,
          masterDataPublishedAt: inst.masterDataPublishedAt,
          courses: inst.courses.map((c) => ({
            code: c.code,
            nameHi: c.nameHi,
            group: c.group,
            tuition: c.feeHeads.tuition,
            feeHeads: c.feeHeads,
            published: Boolean(c.publishedAt),
            publishedAt: c.publishedAt,
          })),
        }
      : null,
    counts: {
      total: all.length,
      breach: all.filter((r) => r.breachDays > 0).length,
      hardcopy: all.filter((r) => r.stage === "institute_review" && !r.hardCopyReceived).length,
      pending: all.filter((r) => r.stage === "institute_review").length,
    },
    rows,
    returnReasons: reasonsRaisedBy("institute").map((r) => ({
      id: r.id,
      hi: r.hi,
      fixHi: r.fixHi,
      correctable: r.correctable,
    })),
  });
});
