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
    <span className="row" style={{ gap: 4 }} aria-label="जाँच परिणाम">
      {checks.map((c) => {
        const label = CHECK_LABEL[c.id] ?? c.id;
        const glyph = c.unknown ? "?" : c.matched ? "✓" : "✕";
        const tone = c.unknown ? undefined : c.matched ? "verified" : "breach";
        return (
          <span
            key={c.id}
            className="chip"
            data-tone={tone}
            title={`${label}: ${c.unknown ? "जाँच नहीं हो सकी" : c.matched ? "मेल" : "अमेल"}`}
            aria-label={`${label}: ${c.unknown ? "अज्ञात" : c.matched ? "मेल" : "अमेल"}`}
          >
            <span className="chip-glyph" aria-hidden="true">
              {glyph}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function QueueTable({ rows }: { rows: DwoRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="stack">
      {selected.length > 0 ? (
        <div className="row-between sheet sheet-tight">
          <span>{selected.length} चुनी गईं (सत्यापित फ़ाइलें स्वीकृति के लिए)</span>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() =>
              router.push(`/dwo/svikriti?ids=${encodeURIComponent(selected.join(","))}`)
            }
          >
            स्वीकृति बैच खोलें
          </button>
        </div>
      ) : null}

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">चुनें</th>
              <th scope="col">आवेदन</th>
              <th scope="col">संस्थान</th>
              <th scope="col">कोर्स</th>
              <th scope="col">वर्ग</th>
              <th scope="col" className="num">
                प्रतीक्षा
              </th>
              <th scope="col">जाँच परिणाम</th>
              <th scope="col" className="num">
                अनुमानित राशि
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.caseId} data-breach={r.breachDays > 0 ? "1" : "0"}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`${r.caseId} चुनें`}
                    checked={selected.includes(r.caseId)}
                    onChange={() => toggle(r.caseId)}
                    disabled={r.stage !== "sanctioned" && r.stage !== "dwo_review"}
                  />
                </td>
                <td className="mono nowrap">
                  <Link href={`/dwo/kaksh/${r.caseId}`}>{r.caseId}</Link>
                  <div className="faint" style={{ fontSize: "var(--step-s)" }}>
                    {r.studentNameHi}
                  </div>
                </td>
                <td>{r.instituteNameHi}</td>
                <td>{r.courseNameHi}</td>
                <td className="nowrap">{r.categoryHi}</td>
                <td className="num tnum">
                  {r.waitingDays}
                  {r.breachDays > 0 ? (
                    <span style={{ color: "var(--breach)" }}> (+{r.breachDays})</span>
                  ) : null}
                </td>
                <td>
                  {r.stage === "dwo_review" ? (
                    <CheckGlyphs checks={r.checks} />
                  ) : (
                    <StatusChip tone={r.stage === "correction_required" ? "breach" : "waiting"}>
                      {r.stageHi}
                    </StatusChip>
                  )}
                </td>
                <td className="num tnum">{fmtMoney(r.estimateTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <p className="sheet muted">इस छाँट में कोई फ़ाइल नहीं।</p> : null}
    </div>
  );
}
