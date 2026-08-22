import Link from "next/link";
import { Shell } from "@/ui/Shell";
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

  return (
    <Shell lang={lang} wide>
      <div className="row-between">
        <div>
          <p className="eyebrow">{districtHi(session.subjectId)}</p>
          <h1 style={{ marginTop: "var(--s2)" }}>जिला छात्रवृत्ति कतार</h1>
        </div>
        <Link className="btn" href="/dwo/svikriti">
          स्वीकृति बैच
        </Link>
      </div>

      <p className="row tnum" style={{ marginTop: "var(--s4)", gap: "var(--s4)" }}>
        <span>कुल {all.length}</span>
        <span>जाँच में {all.filter((r) => r.stage === "dwo_review").length}</span>
        <span style={{ color: "var(--breach)" }}>
          समय सीमा पार {all.filter((r) => r.breachDays > 0).length}
        </span>
        <span style={{ color: "var(--waiting)" }}>
          आपत्ति {all.filter((r) => r.stage === "correction_required").length}
        </span>
      </p>

      <nav className="row" style={{ margin: "var(--s4) 0" }} aria-label="छाँट">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            className={`btn btn-sm${active === f.id ? " btn-primary" : ""}`}
            href={`/dwo/kaksh?filter=${f.id}`}
          >
            {f.labelHi}
          </Link>
        ))}
      </nav>

      <QueueTable rows={rows} />

      <p className="faint" style={{ marginTop: "var(--s5)", fontSize: "var(--step-s)" }}>
        जाँच परिणाम स्तंभ में ✓ मेल, ✕ अमेल, ? सेवा बंद — अमेल को छात्र की गलती नहीं माना जाता जब सेवा
        बंद हो।
      </p>
    </Shell>
  );
}
