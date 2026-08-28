import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";
import { requireOperator } from "@/lib/operator.server";
import { dwoQueue } from "@/server/dwo";
import { districtHi } from "@/server/config/districts";
import { AMOUNT_DISCLAIMER_HI } from "@/server/config/rates";
import { SanctionPanel } from "./SanctionPanel";

export default async function Svikriti({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const lang = await getLang();
  const session = await requireOperator("dwo");
  const { ids } = await searchParams;
  const wanted = new Set(
    (ids ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const all = dwoQueue(session.subjectId, "all");
  const rows = (
    wanted.size > 0 ? all.filter((r) => wanted.has(r.caseId)) : all.filter((r) => r.stage === "sanctioned")
  ).map((r) => ({
    caseId: r.caseId,
    studentNameHi: r.studentNameHi,
    instituteNameHi: r.instituteNameHi,
    estimateTotal: r.estimateTotal,
    stage: r.stage,
    stageHi: r.stageHi,
  }));

  return (
    <Shell lang={lang} wide>
      <PageHead
        eyebrow={`जिला समाज कल्याण · ${districtHi(session.subjectId)}`}
        title="स्वीकृति बैच (Sanction Batch)"
        meta={
          <div className="stack" style={{ ["--gap" as string]: "var(--s2)" }}>
            <p className="measure muted">
              केवल सत्यापित फ़ाइलें भुगतान बैच में जाती हैं। आंशिक इनकार कारण सहित यहीं दिखते हैं — चुपचाप
              गिराए नहीं जाते।
            </p>
            <p>
              <Link className="btn btn-quiet btn-sm" href="/dwo/kaksh">
                ← कतार पर लौटें
              </Link>
            </p>
          </div>
        }
      />
      {rows.length === 0 ? (
        <p className="sheet muted">
          कोई सत्यापित फ़ाइल नहीं। पहले{" "}
          <Link href="/dwo/kaksh?filter=pending">जाँच कतार</Link> से सत्यापित करें।
        </p>
      ) : (
        <SanctionPanel rows={rows} basisHi={AMOUNT_DISCLAIMER_HI} />
      )}
    </Shell>
  );
}
