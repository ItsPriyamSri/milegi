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

  return (
    <div className="stack">
      {selected.length > 0 ? (
        <div className="row-between sheet sheet-tight">
          <span>{selected.length} चुनी गईं</span>
          <button className="btn btn-primary btn-sm" type="button" onClick={bulkForward} disabled={busy}>
            {busy ? "भेज रहे हैं…" : "चुनी हुई फ़ाइलें अग्रसारित करें"}
          </button>
        </div>
      ) : null}

      {error ? <ErrorNote error={error} /> : null}

      {result ? (
        <div className="sheet stack" style={{ ["--gap" as string]: "var(--s2)" }}>
          <p>
            <strong>{result.forwarded.length}</strong> अग्रसारित ·{" "}
            <strong>{result.refused.length}</strong> रोकी गईं
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
            रोकी गई फ़ाइलें चुपचाप गिराई नहीं जातीं — कारण यहीं दिखता है।
          </p>
        </div>
      ) : null}

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">
                <span className="faint">चुनें</span>
              </th>
              <th scope="col">आवेदन</th>
              <th scope="col">छात्र</th>
              <th scope="col">कोर्स</th>
              <th scope="col">चरण</th>
              <th scope="col" className="num">
                प्रतीक्षा
              </th>
              <th scope="col">समय सीमा</th>
              <th scope="col">हार्ड कॉपी</th>
              <th scope="col" className="num">
                उपस्थिति
              </th>
              <th scope="col">आपत्ति</th>
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
                    disabled={r.stage !== "institute_review"}
                  />
                </td>
                <td className="mono nowrap">
                  <Link href={`/sansthan/kaksh/${r.caseId}`}>{r.caseId}</Link>
                </td>
                <td>{r.studentNameHi}</td>
                <td>{r.courseNameHi}</td>
                <td className="nowrap">{r.stageHi}</td>
                <td className="num tnum">
                  {r.waitingDays}
                  {r.breachDays > 0 ? <span style={{ color: "var(--breach)" }}> (+{r.breachDays})</span> : null}
                </td>
                <td className="tnum nowrap">{fmtDate(r.dueAt)}</td>
                <td>
                  {r.hardCopyReceived ? (
                    <StatusChip tone="verified">मिली</StatusChip>
                  ) : (
                    <StatusChip tone="waiting">बाकी</StatusChip>
                  )}
                </td>
                <td className="num tnum">{r.attendancePercent === null ? "—" : `${r.attendancePercent}%`}</td>
                <td>{r.flags.length > 0 ? r.flags.join(", ") : r.feeDisputed ? "शुल्क आपत्ति" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <p className="sheet muted">इस छाँट में कोई फ़ाइल नहीं।</p> : null}
    </div>
  );
}
