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
  { id: "all", labelHi: "सभी आवेदन" },
  { id: "pending", labelHi: "संस्थान में लंबित" },
  { id: "breach", labelHi: "समय सीमा पार (SLA Breach)" },
  { id: "hardcopy", labelHi: "हार्ड कॉपी लंबित" },
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

  const pendingCount = all.filter((r) => r.stage === "institute_review").length;
  const breachCount = all.filter((r) => r.breachDays > 0).length;
  const hardcopyCount = all.filter((r) => r.stage === "institute_review" && !r.hardCopyReceived).length;

  return (
    <Shell lang={lang} wide>
      {/* Top Officer Context Header Strip */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          borderRadius: "16px",
          padding: "var(--s4) var(--s5)",
          marginBottom: "var(--s5)",
          boxShadow: "var(--shadow-lift)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="row-between" style={{ gap: "var(--s4)", flexWrap: "wrap" }}>
          <div>
            <div className="row" style={{ gap: "var(--s2)", marginBottom: "4px" }}>
              <span
                className="chip"
                style={{ background: "var(--brand-gold)", color: "#000000", fontWeight: 800, border: "none" }}
              >
                संस्थान नोडल डैशबोर्ड (INSTITUTE DASHBOARD)
              </span>
              <span style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.75rem", fontWeight: 600 }}>
                सत्र: 2026-27
              </span>
            </div>
            <h2 style={{ color: "#ffffff", fontWeight: 800, fontSize: "clamp(1.25rem, 3vw, 1.75rem)" }}>
              {inst?.nameHi ?? "राजकीय महाविद्यालय, कल्याणपुर"}
            </h2>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", marginTop: "4px" }}>
              नोडल अधिकारी: <strong>{inst?.clerk.nameHi ?? "श्री आर. के. वर्मा"}</strong> ({inst?.clerk.designationHi}) · {inst?.affiliatedTo}
            </div>
          </div>

          <div className="row" style={{ gap: "var(--s3)" }}>
            <Link className="btn btn-primary" style={{ fontWeight: 700 }} href="/sansthan/master">
              ⚙️ मास्टर डेटा (कोर्स और शुल्क)
            </Link>
          </div>
        </div>
      </div>

      <div className="row-between" style={{ marginBottom: "var(--s4)" }}>
        <PageHead
          eyebrow="छात्रवृत्ति एवं शुल्क प्रतिपूर्ति योजना"
          title="संस्थान कतार व सत्यापन कक्ष"
          meta={
            rows[0]?.dueAt ? (
              <span className="faint tnum" style={{ fontWeight: 700, color: "var(--brand-navy)" }}>
                ⏱️ अगले अग्रसारण की अंतिम तारीख़: {fmtDate(rows[0]?.dueAt)}
              </span>
            ) : undefined
          }
        />
      </div>

      {/* 4-Column Metric Bento Grid */}
      <div
        className="bento-grid bento-grid-4"
        style={{ gap: "var(--s3)", margin: "var(--s4) 0" }}
      >
        <StatSlab n={all.length} labelHi="कुल प्राप्त आवेदन" tone="neutral" />
        <StatSlab n={pendingCount} labelHi="संस्थान में समीक्षाधीन" tone={pendingCount > 0 ? "waiting" : "neutral"} />
        <StatSlab n={breachCount} labelHi="समय सीमा पार (SLA Breach)" tone={breachCount > 0 ? "breach" : "neutral"} />
        <StatSlab n={hardcopyCount} labelHi="हार्ड कॉपी प्राप्त बाकी" tone={hardcopyCount > 0 ? "waiting" : "neutral"} />
      </div>

      {/* Segmented Filter Control */}
      <div style={{ margin: "var(--s5) 0 var(--s4) 0" }}>
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

      {/* Main Queue Table */}
      <QueueTable rows={rows} />

      <div
        style={{
          marginTop: "var(--s5)",
          padding: "var(--s3) var(--s4)",
          background: "var(--surface-sunk)",
          borderRadius: "8px",
          border: "1px solid var(--rule)",
          fontSize: "var(--step-s)",
          color: "var(--ink-secondary)",
        }}
      >
        📌 <strong>कार्यप्रणाली नियम:</strong> कतार स्वतः समय सीमा के हिसाब से प्राथमिकता क्रमबद्ध है। जो फ़ाइल स्वतः निरस्त या SLA उल्लंघन के सबसे करीब है, वह सबसे ऊपर प्रदर्शित होगी।
      </div>
    </Shell>
  );
}
