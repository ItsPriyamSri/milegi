import Link from "next/link";
import { Shell } from "@/ui/Shell";
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

  return (
    <Shell lang={lang} wide>
      <div className="row-between">
        <div>
          <p className="eyebrow">{inst?.nameHi}</p>
          <h1 style={{ marginTop: "var(--s2)" }}>छात्रवृत्ति प्रकोष्ठ</h1>
        </div>
        <Link className="btn" href="/sansthan/master">
          मास्टर डेटा (कोर्स और शुल्क)
        </Link>
      </div>

      <p className="row tnum" style={{ marginTop: "var(--s4)", gap: "var(--s4)" }}>
        <span>कुल {all.length}</span>
        <span style={{ color: "var(--breach)" }}>
          समय सीमा पार {all.filter((r) => r.breachDays > 0).length}
        </span>
        <span style={{ color: "var(--waiting)" }}>
          हार्ड कॉपी बाकी{" "}
          {all.filter((r) => r.stage === "institute_review" && !r.hardCopyReceived).length}
        </span>
        <span className="faint">
          अग्रसारण की अंतिम तारीख़ {fmtDate(rows[0]?.dueAt ?? null)}
        </span>
      </p>

      <nav className="row" style={{ margin: "var(--s4) 0" }} aria-label="छाँट">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            className={`btn btn-sm${active === f.id ? " btn-primary" : ""}`}
            href={`/sansthan/kaksh?filter=${f.id}`}
          >
            {f.labelHi}
          </Link>
        ))}
      </nav>

      <QueueTable rows={rows} />

      <p className="faint" style={{ marginTop: "var(--s5)", fontSize: "var(--step-s)" }}>
        क्रम जान-बूझकर समय सीमा के हिसाब से है, तारीख़ के हिसाब से नहीं — जो फ़ाइल स्वतः निरस्त होने के
        सबसे करीब है, वह सबसे ऊपर।
      </p>
    </Shell>
  );
}
