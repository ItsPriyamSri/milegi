import { handler, ok } from "@/server/http";
import { requireRole } from "@/server/session-cookie";
import { dwoQueue } from "@/server/dwo";
import { districtHi } from "@/server/config/districts";
import { reasonsRaisedBy } from "@/server/config/reasons";

export const GET = handler(async (req) => {
  const session = await requireRole("dwo");
  const url = new URL(req.url);
  const filter = (url.searchParams.get("filter") ?? "all") as
    | "all"
    | "pending"
    | "flagged"
    | "breach"
    | "verified";
  const rows = dwoQueue(session.subjectId, filter);
  const all = dwoQueue(session.subjectId, "all");
  return ok({
    district: { code: session.subjectId, nameHi: districtHi(session.subjectId) },
    counts: {
      total: all.length,
      pending: all.filter((r) => r.stage === "dwo_review").length,
      breach: all.filter((r) => r.breachDays > 0).length,
      flagged: all.filter((r) => r.stage === "correction_required").length,
      verified: all.filter((r) => ["sanctioned", "pfms_processing", "paid"].includes(r.stage)).length,
    },
    rows,
    flagReasons: reasonsRaisedBy("dwo").map((r) => ({
      id: r.id,
      hi: r.hi,
      fixHi: r.fixHi,
      correctable: r.correctable,
      fixedBy: r.fixedBy,
    })),
  });
});
