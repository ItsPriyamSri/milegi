"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { ErrorNote, StatusChip } from "@/ui/bits";
import { fmtDate } from "@/lib/format";

export type Check = {
  id: string;
  labelHi: string;
  matched: boolean;
  unknown?: boolean;
  submitted: string;
  registry: string;
  detailHi: string;
  reasonCode?: string;
};

export type FlagReason = {
  id: string;
  hi: string;
  fixHi: string;
  correctable: boolean;
  fixedBy: string;
};

export function ReviewActions({
  caseId,
  canAct,
  checks,
  reasons,
}: {
  caseId: string;
  canAct: boolean;
  checks: Check[];
  reasons: FlagReason[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [rejectCode, setRejectCode] = useState(reasons[0]?.id ?? "");
  const [flagResult, setFlagResult] = useState<{ openAt: string; closeAt: string } | null>(null);

  async function run(action: string, body?: unknown) {
    setBusy(action);
    setError(null);
    try {
      const res = await api.post<{ case: { correction: { openAt: string; closeAt: string } | null } }>(
        `/api/dwo/cases/${caseId}/${action}`,
        body,
      );
      if (action === "flag" && res.case.correction) {
        setFlagResult({ openAt: res.case.correction.openAt, closeAt: res.case.correction.closeAt });
      }
      router.refresh();
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(null);
    }
  }

  function toggle(code: string) {
    setSelected((prev) => (prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]));
  }

  return (
    <div className="stack">
      {error ? <ErrorNote error={error} /> : null}

      <section className="sheet stack">
        <p className="eyebrow">क्रॉस-चेक — भरी गई बनाम रजिस्ट्री</p>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">जाँच</th>
                <th scope="col">भरी गई</th>
                <th scope="col">रजिस्ट्री</th>
                <th scope="col">परिणाम</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.labelHi}
                    <div className="faint" style={{ fontSize: "var(--step-s)" }}>
                      {c.detailHi}
                    </div>
                  </td>
                  <td className="mono">{c.submitted}</td>
                  <td className="mono">{c.registry}</td>
                  <td>
                    {c.unknown ? (
                      <StatusChip tone="waiting">जाँच नहीं हो सकी</StatusChip>
                    ) : c.matched ? (
                      <StatusChip tone="verified">मेल</StatusChip>
                    ) : (
                      <StatusChip tone="breach">{c.reasonCode ?? "अमेल"}</StatusChip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          className="btn btn-sm"
          type="button"
          disabled={busy !== null}
          onClick={() => run("crosscheck")}
        >
          {busy === "crosscheck" ? "जाँच…" : "दोबारा क्रॉस-चेक चलाएँ"}
        </button>
      </section>

      {canAct ? (
        <>
          <div className="sheet stack">
            <p className="eyebrow">सत्यापित करें</p>
            <button
              className="btn btn-primary"
              type="button"
              disabled={busy !== null}
              onClick={() => run("verify")}
            >
              {busy === "verify" ? "सत्यापित…" : "सत्यापित करें — स्वीकृति के लिए"}
            </button>
          </div>

          <div className="sheet stack">
            <p className="eyebrow">आपत्ति दर्ज करें</p>
            <div className="stack" style={{ ["--gap" as string]: "var(--s2)" }}>
              {reasons.map((r) => (
                <label className="check" key={r.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                  <span>
                    {r.hi}
                    <span className="field-hint" style={{ display: "block" }}>
                      छात्र को दिखेगा: {r.fixHi}
                      {!r.correctable ? " · सुधार विंडो से ठीक नहीं होगा" : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <div className="field">
              <label htmlFor="note">टिप्पणी (वैकल्पिक)</label>
              <input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <button
              className="btn btn-danger"
              type="button"
              disabled={busy !== null || selected.length === 0}
              onClick={() => run("flag", { codes: selected, note })}
            >
              {busy === "flag" ? "दर्ज…" : "आपत्ति दर्ज करें"}
            </button>
            {flagResult ? (
              <p className="tnum" style={{ fontSize: "var(--step-s)" }}>
                सुधार विंडो: {fmtDate(flagResult.openAt)} – {fmtDate(flagResult.closeAt)}
              </p>
            ) : null}
          </div>

          <div className="sheet stack">
            <p className="eyebrow">अस्वीकृत करें</p>
            <div className="field">
              <label htmlFor="reject">कारण कोड</label>
              <select
                id="reject"
                value={rejectCode}
                onChange={(e) => setRejectCode(e.target.value)}
              >
                {reasons.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.hi}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-danger"
              type="button"
              disabled={busy !== null || !rejectCode}
              onClick={() => run("reject", { code: rejectCode, note })}
            >
              {busy === "reject" ? "अस्वीकृत…" : "अस्वीकृत करें"}
            </button>
          </div>
        </>
      ) : (
        <p className="sheet muted">यह फ़ाइल जाँच चरण पर नहीं है — कार्रवाई बंद है।</p>
      )}
    </div>
  );
}
