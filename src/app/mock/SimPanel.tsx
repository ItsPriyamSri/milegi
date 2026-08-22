"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { ErrorNote, StatusChip } from "@/ui/bits";
import { fmtDate, fmtMoney } from "@/lib/format";
import type { UpstreamName, PfmsStatus } from "@/server/types";

type SimState = {
  clockOffsetDays: number;
  nowIso: string;
  upstream: Record<UpstreamName, { health: "up" | "slow" | "down"; failureRate: number }>;
  forcedPfmsOutcome: PfmsStatus | null;
  outageLog: { system: string; from: string; to: string | null }[];
  stageCounts: Record<string, number>;
  caseCount: number;
  downSystems: string[];
  labelsHi: Record<string, string>;
};

type SweepReport = {
  atIso: string;
  offsetDays: number;
  escalated: string[];
  autoAdvanced: string[];
  lapsed: string[];
  notified: string[];
};

const SYSTEMS: UpstreamName[] = ["ekyc", "digilocker", "edistrict", "boards", "npci", "pfms"];
const OUTCOMES: (PfmsStatus | "")[] = [
  "",
  "processing_with_bank",
  "credited",
  "beneficiary_pending",
  "rejected_not_seeded",
  "rejected_dormant",
  "limit_exceeded",
];

export function SimPanel() {
  const [state, setState] = useState<SimState | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [report, setReport] = useState<SweepReport | null>(null);
  const [pfmsRows, setPfmsRows] = useState<
    { caseId: string; status: string; failureCode?: string; amount?: number }[]
  >([]);
  const [customDays, setCustomDays] = useState("12");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setState(await api.get<SimState>("/api/sim/state"));
      setError(null);
    } catch (e) {
      setError(errorOf(e));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function setHealth(system: UpstreamName, health: "up" | "slow" | "down") {
    setBusy(true);
    try {
      setState(await api.post<SimState>("/api/sim/config", { system, health }));
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(false);
    }
  }

  async function advance(days: number) {
    setBusy(true);
    try {
      const res = await api.post<{ report: SweepReport; state: SimState }>("/api/sim/advance", {
        days,
      });
      setReport(res.report);
      setState(res.state);
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(false);
    }
  }

  async function forceOutcome(outcome: string) {
    setBusy(true);
    try {
      setState(
        await api.post<SimState>("/api/sim/config", {
          forcedPfmsOutcome: outcome === "" ? null : outcome,
        }),
      );
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(false);
    }
  }

  async function runPfms() {
    setBusy(true);
    try {
      const res = await api.post<{
        rows: { caseId: string; status: string; failureCode?: string; amount?: number }[];
        state: SimState;
      }>("/api/sim/pfms");
      setPfmsRows(res.rows);
      setState(res.state);
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!window.confirm("सब कुछ बीज-डेटा पर लौटा दें? सारे आवेदन मिट जाएँगे।")) return;
    setBusy(true);
    try {
      setState(await api.post<SimState>("/api/sim/reset"));
      setReport(null);
      setPfmsRows([]);
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return error ? <ErrorNote error={error} /> : <p className="muted">लोड हो रहा है…</p>;
  }

  return (
    <div className="stack" style={{ ["--gap" as string]: "var(--s5)" }}>
      <div className="row">
        <StatusChip tone="breach">मॉक पैनल</StatusChip>
        <span className="tnum faint">
          सिम तारीख़ {fmtDate(state.nowIso)} · offset {state.clockOffsetDays} दिन · फ़ाइलें{" "}
          {state.caseCount}
        </span>
      </div>

      {error ? <ErrorNote error={error} /> : null}

      <section className="sheet stack">
        <p className="eyebrow">चरण गणना</p>
        <p className="row tnum" style={{ gap: "var(--s3)", flexWrap: "wrap" }}>
          {Object.entries(state.stageCounts).map(([stage, n]) => (
            <span key={stage} className="chip">
              {stage}: {n}
            </span>
          ))}
          {Object.keys(state.stageCounts).length === 0 ? (
            <span className="faint">अभी कोई फ़ाइल नहीं</span>
          ) : null}
        </p>
      </section>

      <section className="sheet stack">
        <p className="eyebrow">1. उपस्थित प्रणालियाँ</p>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">प्रणाली</th>
                <th scope="col">स्थिति</th>
              </tr>
            </thead>
            <tbody>
              {SYSTEMS.map((s) => (
                <tr key={s}>
                  <td>{state.labelsHi[s] ?? s}</td>
                  <td>
                    <div className="row" role="radiogroup" aria-label={state.labelsHi[s] ?? s}>
                      {(["up", "slow", "down"] as const).map((h) => (
                        <label className="check" key={h} style={{ padding: 0 }}>
                          <input
                            type="radio"
                            name={`health-${s}`}
                            checked={state.upstream[s].health === h}
                            disabled={busy}
                            onChange={() => setHealth(s, h)}
                          />
                          <span>{h}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {state.outageLog.length > 0 ? (
          <p className="faint tnum" style={{ fontSize: "var(--step-s)" }}>
            आखिरी आउटेज: {state.outageLog.at(-1)?.system} · {fmtDate(state.outageLog.at(-1)?.from)}
            {state.outageLog.at(-1)?.to ? ` → ${fmtDate(state.outageLog.at(-1)?.to)}` : " (खुला)"}
          </p>
        ) : null}
      </section>

      <section className="sheet stack">
        <p className="eyebrow">2. घड़ी</p>
        <p className="tnum">
          अभी: <strong>{fmtDate(state.nowIso)}</strong> ({state.clockOffsetDays} दिन आगे)
        </p>
        <div className="row">
          {[1, 7, 30].map((d) => (
            <button
              key={d}
              className="btn btn-sm"
              type="button"
              disabled={busy}
              onClick={() => advance(d)}
            >
              +{d} दिन
            </button>
          ))}
          <input
            type="number"
            aria-label="कस्टम दिन"
            style={{ width: "5rem", minHeight: 32 }}
            value={customDays}
            onChange={(e) => setCustomDays(e.target.value)}
          />
          <button
            className="btn btn-sm btn-primary"
            type="button"
            disabled={busy}
            onClick={() => advance(Number(customDays) || 0)}
          >
            आगे बढ़ाएँ
          </button>
        </div>
        {report ? (
          <div className="callout" data-tone="info">
            <p className="callout-title tnum">स्वीप · {fmtDate(report.atIso)}</p>
            <ul style={{ fontSize: "var(--step-s)", margin: "var(--s2) 0 0" }}>
              <li>एस्केलेट: {report.escalated.join(", ") || "—"}</li>
              <li>स्वतः आगे: {report.autoAdvanced.join(", ") || "—"}</li>
              <li>लैप्स: {report.lapsed.join(", ") || "—"}</li>
              <li>सूचना: {report.notified.join(", ") || "—"}</li>
            </ul>
          </div>
        ) : null}
      </section>

      <section className="sheet stack">
        <p className="eyebrow">3. भुगतान (PFMS)</p>
        <div className="field">
          <label htmlFor="outcome">जबरदस्ती परिणाम</label>
          <select
            id="outcome"
            value={state.forcedPfmsOutcome ?? ""}
            disabled={busy}
            onChange={(e) => forceOutcome(e.target.value)}
          >
            {OUTCOMES.map((o) => (
              <option key={o || "auto"} value={o}>
                {o === "" ? "स्वचालित (DBT स्थिति से)" : o}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" type="button" disabled={busy} onClick={runPfms}>
          {busy ? "चल रहा…" : "बैच चलाएँ"}
        </button>
        {pfmsRows.length > 0 ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">आवेदन</th>
                  <th scope="col">स्थिति</th>
                  <th scope="col">कोड</th>
                  <th scope="col" className="num">
                    राशि
                  </th>
                </tr>
              </thead>
              <tbody>
                {pfmsRows.map((r) => (
                  <tr key={r.caseId}>
                    <td className="mono">{r.caseId}</td>
                    <td>{r.status}</td>
                    <td className="mono">{r.failureCode ?? "—"}</td>
                    <td className="num tnum">{r.amount ? fmtMoney(r.amount) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="sheet stack">
        <p className="eyebrow">4. रीसेट</p>
        <button className="btn btn-danger" type="button" disabled={busy} onClick={reset}>
          बीज-डेटा पर लौटाएँ
        </button>
      </section>
    </div>
  );
}
