"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtMoney } from "@/lib/format";
import { StatusChip } from "@/ui/bits";

export type DwoRow = {
  caseId: string;
  studentNameHi: string;
  instituteNameHi: string;
  courseNameHi: string;
  categoryHi: string;
  stage: string;
  stageHi: string;
  waitingDays: number;
  breachDays: number;
  estimateTotal: number;
  checks: { id: string; matched: boolean; unknown: boolean }[];
  flags: string[];
};

const CHECK_LABEL: Record<string, string> = {
  board: "बोर्ड रोल",
  enrolment: "नामांकन",
  income: "आय प्रमाणपत्र",
  duplicate_income: "आय पुनरावृत्ति",
  attendance: "उपस्थिति",
};

function CheckGlyphs({ checks }: { checks: DwoRow["checks"] }) {
  if (checks.length === 0) return <span className="faint">—</span>;
  return (
    <div className="row" style={{ gap: "4px" }} aria-label="स्वचालित डिजिटल जाँच परिणाम">
      {checks.map((c) => {
        const label = CHECK_LABEL[c.id] ?? c.id;
        const glyph = c.unknown ? "?" : c.matched ? "✓" : "✕";
        const tone = c.unknown ? undefined : c.matched ? "verified" : "breach";
        return (
          <span
            key={c.id}
            className="chip"
            data-tone={tone}
            title={`${label}: ${c.unknown ? "जाँच नहीं हो सकी" : c.matched ? "सत्यापित मेल" : "अमेल"}`}
            aria-label={`${label}: ${c.unknown ? "अज्ञात" : c.matched ? "मेल" : "अमेल"}`}
            style={{ fontSize: "0.75rem", padding: "2px 6px", fontWeight: 700 }}
          >
            <span className="chip-glyph" aria-hidden="true" style={{ marginRight: "2px" }}>
              {glyph}
            </span>
            {label}
          </span>
        );
      })}
    </div>
  );
}

export function QueueTable({ rows }: { rows: DwoRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll() {
    const selectable = rows.filter((r) => r.stage === "sanctioned" || r.stage === "dwo_review").map((r) => r.caseId);
    if (selected.length === selectable.length) {
      setSelected([]);
    } else {
      setSelected(selectable);
    }
  }

  const selectableRows = rows.filter((r) => r.stage === "sanctioned" || r.stage === "dwo_review");

  return (
    <div className="stack" style={{ ["--gap" as string]: "var(--s3)" }}>
      {selected.length > 0 ? (
        <div
          className="row-between sheet sheet-tight"
          style={{
            background: "var(--brand-navy)",
            color: "#ffffff",
            borderRadius: "12px",
            padding: "var(--s3) var(--s4)",
            boxShadow: "var(--shadow-lift)",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: "var(--step-s)" }}>
            ⚡ {selected.length} फ़ाइलें चुनी गईं (स्वीकृति एवं डिजिटल हस्ताक्षर हेतु तैयार)
          </span>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() =>
              router.push(`/dwo/svikriti?ids=${encodeURIComponent(selected.join(","))}`)
            }
          >
            स्वीकृति बैच बनाएं →
          </button>
        </div>
      ) : null}

      <div
        className="tbl-wrap"
        style={{
          border: "1px solid var(--rule-strong)",
          borderRadius: "12px",
          background: "#ffffff",
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
        }}
      >
        <table className="tbl" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-sunk)", borderBottom: "1px solid var(--rule-strong)" }}>
              <th scope="col" style={{ padding: "12px 16px", width: "40px" }}>
                {selectableRows.length > 0 ? (
                  <input
                    type="checkbox"
                    aria-label="सभी फ़ाइलें चुनें"
                    checked={selected.length === selectableRows.length && selectableRows.length > 0}
                    onChange={toggleAll}
                  />
                ) : null}
              </th>
              <th scope="col" style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>आवेदन व छात्र</th>
              <th scope="col" style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>संस्थान का नाम</th>
              <th scope="col" style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>कोर्स</th>
              <th scope="col" style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>वर्ग</th>
              <th scope="col" className="num" style={{ padding: "12px 16px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>प्रतीक्षा</th>
              <th scope="col" style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>डिजिटल जाँच परिणाम</th>
              <th scope="col" className="num" style={{ padding: "12px 16px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>अनुमानित छात्रवृत्ति</th>
              <th scope="col" style={{ padding: "12px 16px", textAlign: "right", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>कार्रवाई</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.caseId}
                style={{
                  borderBottom: "1px solid var(--rule-subtle)",
                  background: r.breachDays > 0 ? "rgba(239, 68, 68, 0.03)" : "transparent",
                  transition: "background var(--ease-fast)",
                }}
              >
                <td style={{ padding: "12px 16px" }}>
                  <input
                    type="checkbox"
                    aria-label={`${r.caseId} चुनें`}
                    checked={selected.includes(r.caseId)}
                    onChange={() => toggle(r.caseId)}
                    disabled={r.stage !== "sanctioned" && r.stage !== "dwo_review"}
                  />
                </td>
                <td className="mono nowrap" style={{ padding: "12px 16px" }}>
                  <Link
                    href={`/dwo/kaksh/${r.caseId}`}
                    style={{
                      fontWeight: 800,
                      color: "var(--brand-blue)",
                      background: "var(--action-subtle)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    {r.caseId}
                  </Link>
                  <div style={{ fontWeight: 700, color: "var(--ink)", marginTop: "4px", fontSize: "0.85rem" }}>
                    {r.studentNameHi}
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--ink)", fontSize: "0.85rem", fontWeight: 600 }}>{r.instituteNameHi}</td>
                <td style={{ padding: "12px 16px", color: "var(--ink-secondary)", fontSize: "0.85rem" }}>{r.courseNameHi}</td>
                <td className="nowrap" style={{ padding: "12px 16px" }}>
                  <span className="chip" style={{ fontSize: "0.75rem", fontWeight: 700 }}>{r.categoryHi}</span>
                </td>
                <td className="num tnum" style={{ padding: "12px 16px", fontWeight: 700 }}>
                  {r.waitingDays} दिन
                  {r.breachDays > 0 ? <span style={{ color: "var(--breach)", display: "block", fontSize: "0.7rem", fontWeight: 800 }}>⚠️ +{r.breachDays} SLA Breach</span> : null}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  {r.stage === "dwo_review" ? (
                    <CheckGlyphs checks={r.checks} />
                  ) : (
                    <StatusChip tone={r.stage === "correction_required" ? "breach" : "waiting"}>
                      {r.stageHi}
                    </StatusChip>
                  )}
                </td>
                <td className="num tnum" style={{ padding: "12px 16px", fontWeight: 800, color: "var(--brand-navy)", fontSize: "0.95rem" }}>
                  {fmtMoney(r.estimateTotal)}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <Link
                    href={`/dwo/kaksh/${r.caseId}`}
                    className="btn btn-sm btn-ghost"
                    style={{ fontSize: "0.75rem", fontWeight: 700, padding: "4px 10px" }}
                  >
                    समीक्षा करें →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <div
          className="sheet stack"
          style={{
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--s7)",
            textAlign: "center",
            background: "#ffffff",
            borderRadius: "12px",
            border: "1px dashed var(--rule-strong)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "var(--s2)" }}>🏛️</div>
          <h4 style={{ fontWeight: 700, color: "var(--ink)" }}>इस फ़िल्टर श्रेणी में कोई फ़ाइल उपलब्ध नहीं है</h4>
          <p className="faint" style={{ maxWidth: "40ch", margin: "var(--s2) auto" }}>
            जिला कार्यालय की इस कतार में वर्तमान में कोई लंबित फ़ाइल नहीं है।
          </p>
          <Link href="/dwo/kaksh?filter=all" className="btn btn-sm">
            सभी जिला फ़ाइलें देखें →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
