"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { ErrorNote, StatusChip } from "@/ui/bits";
import { fmtDate } from "@/lib/format";

export type Row = {
  caseId: string;
  studentNameHi: string;
  courseNameHi: string;
  stage: string;
  stageHi: string;
  waitingDays: number;
  breachDays: number;
  dueAt: string | null;
  hardCopyReceived: boolean;
  attendancePercent: number | null;
  feeDisputed: boolean;
  flags: string[];
};

export function QueueTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<{ forwarded: string[]; refused: { id: string; reasonHi: string }[] } | null>(
    null,
  );

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAll() {
    const selectable = rows.filter((r) => r.stage === "institute_review").map((r) => r.caseId);
    if (selected.length === selectable.length) {
      setSelected([]);
    } else {
      setSelected(selectable);
    }
  }

  async function bulkForward() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ forwarded: string[]; refused: { id: string; reasonHi: string }[] }>(
        "/api/institute/bulk-forward",
        { caseIds: selected },
      );
      setResult(res);
      setSelected([]);
      router.refresh();
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(false);
    }
  }

  const selectableRows = rows.filter((r) => r.stage === "institute_review");

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
            ⚡ {selected.length} फ़ाइलें चुनी गईं (संस्थान स्तर पर अग्रसारण हेतु तैयार)
          </span>
          <button className="btn btn-primary btn-sm" type="button" onClick={bulkForward} disabled={busy}>
            {busy ? "अग्रसारित हो रही हैं…" : "चुनी हुई फ़ाइलें आगे भेजें →"}
          </button>
        </div>
      ) : null}

      {error ? <ErrorNote error={error} /> : null}

      {result ? (
        <div
          className="sheet stack"
          style={{
            ["--gap" as string]: "var(--s2)",
            borderLeft: "4px solid var(--verified)",
            background: "var(--verified-subtle)",
          }}
        >
          <p style={{ fontWeight: 700 }}>
            ✅ <strong>{result.forwarded.length}</strong> फ़ाइलें सफलतापूर्वक अग्रसारित ·{" "}
            <strong>{result.refused.length}</strong> रोकी गईं
          </p>
          {result.refused.length > 0 ? (
            <ul>
              {result.refused.map((r) => (
                <li key={r.id} style={{ fontSize: "var(--step-s)" }}>
                  <span className="mono" style={{ fontWeight: 700 }}>{r.id}</span> — {r.reasonHi}
                </li>
              ))}
            </ul>
          ) : null}
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
              <th scope="col" style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>आवेदन संख्या</th>
              <th scope="col" style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>छात्र का नाम</th>
              <th scope="col" style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>कोर्स</th>
              <th scope="col" style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>वर्तमान चरण</th>
              <th scope="col" className="num" style={{ padding: "12px 16px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>प्रतीक्षा</th>
              <th scope="col" style={{ padding: "12px 16px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>समय सीमा</th>
              <th scope="col" style={{ padding: "12px 16px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>हार्ड कॉपी</th>
              <th scope="col" className="num" style={{ padding: "12px 16px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>उपस्थिति</th>
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
                    disabled={r.stage !== "institute_review"}
                  />
                </td>
                <td className="mono nowrap" style={{ padding: "12px 16px" }}>
                  <Link
                    href={`/sansthan/kaksh/${r.caseId}`}
                    style={{
                      fontWeight: 800,
                      color: "var(--brand-blue)",
                      background: "var(--action-subtle)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      textDecoration: "none",
                    }}
                  >
                    {r.caseId}
                  </Link>
                </td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--ink)" }}>{r.studentNameHi}</td>
                <td style={{ padding: "12px 16px", color: "var(--ink-secondary)", fontSize: "0.85rem" }}>{r.courseNameHi}</td>
                <td className="nowrap" style={{ padding: "12px 16px" }}>
                  <StatusChip tone={r.stage === "institute_review" ? "waiting" : r.stage === "correction_required" ? "breach" : "verified"}>
                    {r.stageHi}
                  </StatusChip>
                </td>
                <td className="num tnum" style={{ padding: "12px 16px", fontWeight: 700 }}>
                  {r.waitingDays} दिन
                  {r.breachDays > 0 ? <span style={{ color: "var(--breach)", display: "block", fontSize: "0.7rem", fontWeight: 800 }}>⚠️ +{r.breachDays} SLA Breach</span> : null}
                </td>
                <td className="tnum nowrap" style={{ padding: "12px 16px", fontSize: "0.85rem" }}>{fmtDate(r.dueAt)}</td>
                <td style={{ padding: "12px 16px" }}>
                  {r.hardCopyReceived ? (
                    <StatusChip tone="verified">✓ मिली</StatusChip>
                  ) : (
                    <StatusChip tone="waiting">⏳ बाकी</StatusChip>
                  )}
                </td>
                <td className="num tnum" style={{ padding: "12px 16px", fontWeight: 700 }}>
                  {r.attendancePercent === null ? (
                    "—"
                  ) : (
                    <span style={{ color: r.attendancePercent < 75 ? "var(--breach)" : "var(--verified)" }}>
                      {r.attendancePercent}%
                    </span>
                  )}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <Link
                    href={`/sansthan/kaksh/${r.caseId}`}
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
          <div style={{ fontSize: "2rem", marginBottom: "var(--s2)" }}>📂</div>
          <h4 style={{ fontWeight: 700, color: "var(--ink)" }}>इस फ़िल्टर श्रेणी में कोई फ़ाइल उपलब्ध नहीं है</h4>
          <p className="faint" style={{ maxWidth: "40ch", margin: "var(--s2) auto" }}>
            कृपया अन्य फ़िल्टर टैब ("सभी" या "संस्थान में लंबित") चुनें अथवा नया आवेदन दर्ज करें।
          </p>
          <Link href="/sansthan/kaksh?filter=all" className="btn btn-sm">
            सभी फ़ाइलें देखें →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
