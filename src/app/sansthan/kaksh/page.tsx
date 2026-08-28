import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { StatSlab } from "@/ui/StatSlab";
import { Segmented } from "@/ui/Segmented";
import { getLang } from "@/lib/lang";
import { requireOperator } from "@/lib/operator.server";
import { instituteQueue } from "@/server/institute";
import { getInstitute } from "@/server/store";
import { fmtDate } from "@/lib/format";
import { QueueTable } from "./QueueTable";

const FILTERS = [
  { id: "all", labelHi: "सभी" },
  { id: "pending", labelHi: "संस्थान में लंबित" },
  { id: "breach", labelHi: "समय सीमा पार" },
  { id: "hardcopy", labelHi: "हार्ड कॉपी बाकी" },
  { id: "forwarded", labelHi: "आगे भेजी गईं" },
] as const;

export default async function Kaksh({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const lang = await getLang();
  const session = await requireOperator("institute");
  const { filter } = await searchParams;
  const active = (FILTERS.find((f) => f.id === filter)?.id ?? "all") as (typeof FILTERS)[number]["id"];
  const rows = instituteQueue(session.subjectId, active);
  const all = instituteQueue(session.subjectId, "all");
  const inst = getInstitute(session.subjectId);

  const breachCount = all.filter((r) => r.breachDays > 0).length;
  const hardcopyCount = all.filter((r) => r.stage === "institute_review" && !r.hardCopyReceived).length;

  return (
    <Shell lang={lang} wide>
      <div className="row-between">
        <PageHead
          eyebrow={inst?.nameHi}
          title="छात्रवृत्ति प्रकोष्ठ · कतार"
          meta={
            rows[0]?.dueAt ? (
              <span className="faint tnum">
                अग्रसारण की अंतिम तारीख़: {fmtDate(rows[0]?.dueAt)}
              </span>
            ) : undefined
          }
        />
        <Link className="btn" href="/sansthan/master">
          मास्टर डेटा (कोर्स और शुल्क)
        </Link>
      </div>

      <div className="row" style={{ gap: "var(--s3)", margin: "var(--s4) 0" }}>
        <StatSlab n={all.length} labelHi="कुल आवेदन" tone="neutral" />
        <StatSlab n={breachCount} labelHi="समय सीमा पार" tone={breachCount > 0 ? "breach" : "neutral"} />
        <StatSlab n={hardcopyCount} labelHi="हार्ड कॉपी लंबित" tone={hardcopyCount > 0 ? "waiting" : "neutral"} />
      </div>

      <div style={{ margin: "var(--s4) 0" }}>
        <Segmented
          ariaLabel="कतार फ़िल्टर"
          value={active}
          options={FILTERS.map((f) => ({
            id: f.id,
            labelHi: f.labelHi,
            href: `/sansthan/kaksh?filter=${f.id}`,
          }))}
        />
      </div>

      <QueueTable rows={rows} />

      <p className="faint" style={{ marginTop: "var(--s5)", fontSize: "var(--step-s)" }}>
        क्रम जान-बूझकर समय सीमा के हिसाब से है, तारीख़ के हिसाब से नहीं — जो फ़ाइल स्वतः निरस्त होने के
        सबसे करीब है, वह सबसे ऊपर।
      </p>
    </Shell>
  );
}

