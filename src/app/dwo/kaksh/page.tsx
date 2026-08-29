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
  { id: "all", labelHi: "सभी जिला फ़ाइलें" },
  { id: "pending", labelHi: "जाँच में (DWO Review)" },
  { id: "flagged", labelHi: "आपत्ति दर्ज" },
  { id: "breach", labelHi: "समय सीमा पार (SLA Breach)" },
  { id: "verified", labelHi: "सत्यापित / स्वीकृत" },
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
      {/* Top DWO Context Header Strip */}
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
                जिला समाज कल्याण अधिकारी पोर्टल (DWO PORTAL)
              </span>
              <span style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.75rem", fontWeight: 600 }}>
                सत्र: 2026-27
              </span>
            </div>
            <h2 style={{ color: "#ffffff", fontWeight: 800, fontSize: "clamp(1.25rem, 3vw, 1.75rem)" }}>
              जिला समाज कल्याण कार्यालय, {districtHi(session.subjectId)}
            </h2>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", marginTop: "4px" }}>
              प्राधिकृत अधिकारी: <strong>जिला समाज कल्याण अधिकारी ({districtHi(session.subjectId)})</strong> · उत्तर प्रदेश सरकार
            </div>
          </div>

          <div className="row" style={{ gap: "var(--s3)" }}>
            <Link className="btn btn-primary" style={{ fontWeight: 700 }} href="/dwo/svikriti">
              ⚡ स्वीकृति बैच डिजिटल हस्ताक्षर (Bulk Sanction) →
            </Link>
          </div>
        </div>
      </div>

      <div className="row-between" style={{ marginBottom: "var(--s4)" }}>
        <PageHead
          eyebrow="विभाग: समाज कल्याण विभाग, उत्तर प्रदेश"
          title="जिला छात्रवृत्ति कतार व सत्यापन कक्ष"
        />
      </div>

      {/* 4-Column Metric Bento Grid */}
      <div
        className="bento-grid bento-grid-4"
        style={{ gap: "var(--s3)", margin: "var(--s4) 0" }}
      >
        <StatSlab n={all.length} labelHi="कुल प्राप्त जिला फ़ाइलें" tone="neutral" />
        <StatSlab n={inReviewCount} labelHi="समीक्षाधीन (DWO Review)" tone={inReviewCount > 0 ? "waiting" : "neutral"} />
        <StatSlab n={breachCount} labelHi="समय सीमा पार (SLA Breach)" tone={breachCount > 0 ? "breach" : "neutral"} />
        <StatSlab n={flaggedCount} labelHi="आपत्ति दर्ज फ़ाइलें" tone={flaggedCount > 0 ? "waiting" : "neutral"} />
      </div>

      {/* Segmented Filter Control */}
      <div style={{ margin: "var(--s5) 0 var(--s4) 0" }}>
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
        💡 <strong>डिजिटल सत्यापन संकेत:</strong> जाँच परिणाम स्तंभ में <strong>✓</strong> स्वचालित डेटाबेस मेल, <strong>✕</strong> अमेल, <strong>?</strong> सेवा बंद दर्शाते हैं। सर्वर डाउन होने पर छात्र का आवेदन निरस्त नहीं किया जाता।
      </div>
    </Shell>
  );
}
