"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { ErrorNote } from "@/ui/bits";

export function FileActions({
  caseId,
  hardCopyReceived,
  attendancePercent,
  reasons,
  canForward,
}: {
  caseId: string;
  hardCopyReceived: boolean;
  attendancePercent: number | null;
  reasons: { id: string; hi: string; fixHi: string; correctable: boolean }[];
  canForward: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [percent, setPercent] = useState(attendancePercent === null ? "" : String(attendancePercent));
  const [code, setCode] = useState(reasons[0]?.id ?? "");
  const [note, setNote] = useState("");

  async function run(action: string, body?: unknown) {
    setBusy(action);
    setError(null);
    try {
      await api.post(`/api/institute/cases/${caseId}/${action}`, body);
      router.refresh();
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack">
      {error ? <ErrorNote error={error} /> : null}

      <div className="sheet stack">
        <p className="eyebrow">1. कागज़ मिला?</p>
        <button
          className="btn"
          type="button"
          disabled={hardCopyReceived || busy !== null}
          onClick={() => run("hardcopy")}
        >
          {hardCopyReceived ? "हार्ड कॉपी दर्ज है" : busy === "hardcopy" ? "दर्ज कर रहे हैं…" : "हार्ड कॉपी मिली — दर्ज करें"}
        </button>
        <p className="field-hint">
          कागज़ के बिना फ़ाइल आगे नहीं जाती। यही वह जगह है जहाँ असली प्रणाली में महीनों निकल जाते हैं।
        </p>
      </div>

      <div className="sheet stack">
        <p className="eyebrow">2. उपस्थिति</p>
        <div className="field">
          <label htmlFor="percent">उपस्थिति प्रतिशत</label>
          <input
            id="percent"
            type="number"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
          />
          <span className="field-hint">
            75% से कम पर प्रणाली फ़ाइल आगे नहीं भेजती, और यह ऑनलाइन ठीक नहीं होता।
          </span>
        </div>
        <button
          className="btn"
          type="button"
          disabled={busy !== null || percent === ""}
          onClick={() => run("attendance", { percent: Number(percent) })}
        >
          {busy === "attendance" ? "दर्ज कर रहे हैं…" : "उपस्थिति दर्ज करें"}
        </button>
      </div>

      <div className="sheet stack">
        <p className="eyebrow">3. आगे भेजें या वापस करें</p>
        <button
          className="btn btn-primary"
          type="button"
          disabled={busy !== null || !canForward}
          onClick={() => run("forward")}
        >
          {busy === "forward" ? "भेज रहे हैं…" : "अग्रसारित करें"}
        </button>
        <div className="field">
          <label htmlFor="code">वापस करने का कारण</label>
          <select id="code" value={code} onChange={(e) => setCode(e.target.value)}>
            {reasons.map((r) => (
              <option key={r.id} value={r.id}>
                {r.hi}
              </option>
            ))}
          </select>
          <span className="field-hint">
            छात्र को यही कारण और उसका उपाय दिखेगा — &ldquo;{reasons.find((r) => r.id === code)?.fixHi}&rdquo;
          </span>
        </div>
        <div className="field">
          <label htmlFor="note">टिप्पणी (वैकल्पिक)</label>
          <input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button
          className="btn btn-danger"
          type="button"
          disabled={busy !== null || !code}
          onClick={() => run("return", { code, note })}
        >
          {busy === "return" ? "वापस कर रहे हैं…" : "सुधार के लिए वापस करें"}
        </button>
      </div>
    </div>
  );
}
