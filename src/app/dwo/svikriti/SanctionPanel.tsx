"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { ErrorNote, Money } from "@/ui/bits";
import { fmtMoney } from "@/lib/format";

export type SanctionRow = {
  caseId: string;
  studentNameHi: string;
  instituteNameHi: string;
  estimateTotal: number;
  stage: string;
  stageHi: string;
};

export function SanctionPanel({
  rows,
  basisHi,
}: {
  rows: SanctionRow[];
  basisHi: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(() =>
    rows.filter((r) => r.stage === "sanctioned").map((r) => r.caseId),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<{
    sanctioned: string[];
    refused: { id: string; reasonHi: string }[];
    totalEstimate: number;
  } | null>(null);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const total = rows
    .filter((r) => selected.includes(r.caseId))
    .reduce((sum, r) => sum + r.estimateTotal, 0);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{
        sanctioned: string[];
        refused: { id: string; reasonHi: string }[];
        totalEstimate: number;
      }>("/api/dwo/sanction", { caseIds: selected });
      setResult(res);
      router.refresh();
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="sheet">
        <Money amount={total} label={`${selected.length} फ़ाइलों का बैच कुल`} basis={basisHi} />
      </div>

      {error ? <ErrorNote error={error} /> : null}

      {result ? (
        <div className="sheet stack" style={{ ["--gap" as string]: "var(--s2)" }}>
          <p>
            <strong>{result.sanctioned.length}</strong> भुगतान बैच में ·{" "}
            <strong>{result.refused.length}</strong> रोकी गईं · कुल{" "}
            {fmtMoney(result.totalEstimate)}
          </p>
          {result.refused.length > 0 ? (
            <ul>
              {result.refused.map((r) => (
                <li key={r.id} style={{ fontSize: "var(--step-s)" }}>
                  <span className="mono">{r.id}</span> — {r.reasonHi}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="faint" style={{ fontSize: "var(--step-s)" }}>
            अगला चरण PFMS है — मॉक पैनल से बैच चलाएँ।
          </p>
        </div>
      ) : null}

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">चुनें</th>
              <th scope="col">आवेदन</th>
              <th scope="col">छात्र</th>
              <th scope="col">संस्थान</th>
              <th scope="col">चरण</th>
              <th scope="col" className="num">
                अनुमान
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.caseId}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`${r.caseId} चुनें`}
                    checked={selected.includes(r.caseId)}
                    onChange={() => toggle(r.caseId)}
                    disabled={r.stage !== "sanctioned"}
                  />
                </td>
                <td className="mono nowrap">{r.caseId}</td>
                <td>{r.studentNameHi}</td>
                <td>{r.instituteNameHi}</td>
                <td>{r.stageHi}</td>
                <td className="num tnum">{fmtMoney(r.estimateTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        className="btn btn-primary"
        type="button"
        disabled={busy || selected.length === 0}
        onClick={run}
      >
        {busy ? "भेज रहे हैं…" : "स्वीकृति जारी करें — PFMS बैच में"}
      </button>
    </div>
  );
}
