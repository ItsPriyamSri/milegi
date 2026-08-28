import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { StatSlab } from "@/ui/StatSlab";
import { Segmented } from "@/ui/Segmented";
import { getLang } from "@/lib/lang";
import { requireOperator } from "@/lib/operator.server";
import { dwoQueue } from "@/server/dwo";
import { districtHi } from "@/server/config/districts";
import { QueueTable } from "./QueueTable";

const FILTERS = [
  { id: "all", labelHi: "सभी" },
  { id: "pending", labelHi: "जाँच में" },
  { id: "flagged", labelHi: "जाँच में आपत्ति" },
  { id: "breach", labelHi: "समय सीमा पार" },
  { id: "verified", labelHi: "सत्यापित" },
] as const;

export default async function DwoKaksh({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const lang = await getLang();
  const session = await requireOperator("dwo");
  const { filter } = await searchParams;
  const active = (FILTERS.find((f) => f.id === filter)?.id ?? "all") as (typeof FILTERS)[number]["id"];
  const rows = dwoQueue(session.subjectId, active);
  const all = dwoQueue(session.subjectId, "all");

  const inReviewCount = all.filter((r) => r.stage === "dwo_review").length;
  const breachCount = all.filter((r) => r.breachDays > 0).length;
  const flaggedCount = all.filter((r) => r.stage === "correction_required").length;

  return (
    <Shell lang={lang} wide>
      <div className="row-between">
        <PageHead
          eyebrow={`जिला समाज कल्याण अधिकारी · ${districtHi(session.subjectId)}`}
          title="जिला छात्रवृत्ति कतार"
        />
        <Link className="btn btn-primary" href="/dwo/svikriti">
          स्वीकृति बैच
        </Link>
      </div>

      <div className="row" style={{ gap: "var(--s3)", margin: "var(--s4) 0" }}>
        <StatSlab n={all.length} labelHi="कुल फ़ाइलें" tone="neutral" />
        <StatSlab n={inReviewCount} labelHi="समीक्षाधीन" tone="neutral" />
        <StatSlab n={breachCount} labelHi="समय सीमा पार" tone={breachCount > 0 ? "breach" : "neutral"} />
        <StatSlab n={flaggedCount} labelHi="आपत्ति दर्ज" tone={flaggedCount > 0 ? "waiting" : "neutral"} />
      </div>

      <div style={{ margin: "var(--s4) 0" }}>
        <Segmented
          ariaLabel="कतार फ़िल्टर"
          value={active}
          options={FILTERS.map((f) => ({
            id: f.id,
            labelHi: f.labelHi,
            href: `/dwo/kaksh?filter=${f.id}`,
          }))}
        />
      </div>

      <QueueTable rows={rows} />

      <p className="faint" style={{ marginTop: "var(--s5)", fontSize: "var(--step-s)" }}>
        जाँच परिणाम स्तंभ में ✓ मेल, ✕ अमेल, ? सेवा बंद — अमेल को छात्र की गलती नहीं माना जाता जब सेवा
        बंद हो।
      </p>
    </Shell>
  );
}

