"use client";

import { useState } from "react";

import { ApiError, feeDispute, postAction, type Envelope } from "@/lib/api";
import { useAutosave } from "@/lib/useAutosave";
import { t, type Lang } from "@/lib/i18n";
import type { Application, Blocker, Institute } from "@/server/types";
import { CrashOverlay } from "@/components/CrashOverlay";

function rupees(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function FeePanel({
  app,
  institute,
  lang,
  id,
}: {
  app: Application;
  institute: Institute;
  lang: Lang;
  id: string;
}) {
  const [note, setNote] = useState("");
  return (
    <>
      <h2>{t(lang, "feeLabel")}</h2>
      <p className="money">{rupees(app.expectedAmount)}</p>
      <p className="lead">{t(lang, "feeNotPromise")}</p>
      <p className="struck">{t(lang, "hostel")}: {rupees(institute.hostel)}</p>
      <p className="struck">{t(lang, "mess")}: {rupees(institute.mess)}</p>
      <p className="struck">{t(lang, "caution")}: {rupees(institute.caution)}</p>
      <p className="lead">{t(lang, "feeHint")}</p>
      <p>
        {lang === "hi" ? "कोर्स" : "Course"}: {app.courseName} · {app.instituteName}
      </p>
      <p>OTR: <span className="code">{app.otr}</span></p>
      <label htmlFor="dispute">{t(lang, "feeDispute")}</label>
      <input id="dispute" value={note} onChange={(e) => setNote(e.target.value)} />
      <button
        type="button"
        className="quiet"
        onClick={() => void feeDispute(id, note || t(lang, "feeDispute"))}
      >
        {t(lang, "feeDispute")}
      </button>
    </>
  );
}

export default function FormStep({
  id,
  app,
  missing,
  institute,
  lang,
  onEnv,
}: {
  id: string;
  app: Application;
  missing: Blocker[];
  institute: Institute;
  lang: Lang;
  onEnv: (env: Envelope) => void;
}) {
  const { update, flush, dirty, saveKey } = useAutosave(id);
  const [tab, setTab] = useState(0);
  const [crash, setCrash] = useState(false);
  const [crashMsg, setCrashMsg] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const merged = { ...app, ...dirty };
  const fresh = app.cycle === "fresh";
  const tabs = fresh
    ? ([t(lang, "academic"), t(lang, "personal"), t(lang, "feeSection")] as const)
    : ([t(lang, "resultTab"), t(lang, "feeSection")] as const);
  const last = tabs.length - 1;

  async function goReview() {
    setBusy(true);
    setErr(null);
    await flush();
    try {
      onEnv(await postAction(id, "review"));
    } catch (cause) {
      if (cause instanceof ApiError) {
        const list = cause.body.blockers ?? [];
        setErr(list.map((b) => (lang === "hi" ? b.hi : b.en)).join(" ") || cause.message);
      } else {
        setErr(cause instanceof Error ? cause.message : "review failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function boom() {
    await flush();
    try {
      const env = await postAction(id, "crash");
      setCrashMsg(env.messageHi ?? t(lang, "crashBody"));
      setCrash(true);
    } catch {
      setCrashMsg(t(lang, "crashBody"));
      setCrash(true);
    }
  }

  const saveLine = saveKey ? t(lang, saveKey) : null;

  return (
    <>
      {crash ? (
        <CrashOverlay message={crashMsg} onReload={() => window.location.reload()} />
      ) : null}
      <div className="tabs" role="tablist">
        {tabs.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={tab === i}
            className={tab === i ? "on" : undefined}
            onClick={() => setTab(i)}
          >
            {label}
          </button>
        ))}
      </div>

      {fresh && tab === 0 ? (
        <>
          <label htmlFor="year">{t(lang, "year")}</label>
          <input
            id="year"
            type="number"
            min={1}
            value={merged.yearOfStudy}
            onChange={(e) => update({ yearOfStudy: Number(e.target.value) })}
          />
          <p>{merged.courseName} · {merged.instituteName}</p>
        </>
      ) : null}

      {fresh && tab === 1 ? (
        <>
          <label className="tick">
            <input
              type="checkbox"
              checked={merged.dayScholar}
              onChange={(e) => update({ dayScholar: e.target.checked })}
            />
            {t(lang, "dayScholar")}
          </label>
          <label htmlFor="ration">{t(lang, "ration")}</label>
          <input
            id="ration"
            value={merged.rationCard ?? ""}
            onChange={(e) => update({ rationCard: e.target.value })}
          />
          <label htmlFor="enrollment">{t(lang, "enrollment")}</label>
          <input
            id="enrollment"
            value={merged.enrollmentNo ?? ""}
            onChange={(e) => update({ enrollmentNo: e.target.value })}
          />
          <label className="tick">
            <input
              type="checkbox"
              checked={merged.counseling}
              onChange={(e) => update({ counseling: e.target.checked })}
            />
            {t(lang, "counseling")}
          </label>
          {merged.counseling ? (
            <>
              <label htmlFor="counselingNo">{t(lang, "counselingNo")}</label>
              <input
                id="counselingNo"
                value={merged.counselingNo ?? ""}
                onChange={(e) => update({ counselingNo: e.target.value })}
              />
            </>
          ) : null}
          <label className="tick">
            <input
              type="checkbox"
              checked={merged.bonafideOk}
              onChange={(e) => update({ bonafideOk: e.target.checked })}
            />
            {t(lang, "bonafide")}
          </label>
          <label className="tick">
            <input
              type="checkbox"
              checked={merged.photoReady}
              onChange={(e) => update({ photoReady: e.target.checked })}
            />
            {t(lang, "photo")}
          </label>
        </>
      ) : null}

      {!fresh && tab === 0 ? (
        <>
          <label htmlFor="result">{t(lang, "resultTab")}</label>
          <select
            id="result"
            value={merged.resultStatus ?? ""}
            onChange={(e) => update({ resultStatus: e.target.value as Application["resultStatus"] })}
          >
            <option value="">{lang === "hi" ? "चुनें" : "Select"}</option>
            <option value="passed">{t(lang, "passed")}</option>
            <option value="promoted">{t(lang, "promoted")}</option>
          </select>
          <label htmlFor="obt">{t(lang, "marksObtained")}</label>
          <input
            id="obt"
            type="number"
            value={merged.marksObtained ?? ""}
            onChange={(e) => update({ marksObtained: Number(e.target.value) })}
          />
          <label htmlFor="tot">{t(lang, "marksTotal")}</label>
          <input
            id="tot"
            type="number"
            value={merged.marksTotal ?? ""}
            onChange={(e) => update({ marksTotal: Number(e.target.value) })}
          />
          <label className="tick">
            <input
              type="checkbox"
              checked={merged.semesterCombined}
              onChange={(e) => update({ semesterCombined: e.target.checked })}
            />
            {t(lang, "semesterCombined")}
          </label>
        </>
      ) : null}

      {tab === last ? (
        <>
          {missing.length ? (
            <>
              <h2>{t(lang, "leftover")}</h2>
              {missing.map((b) => (
                <p key={b.code} className="err">{lang === "hi" ? b.hi : b.en}</p>
              ))}
            </>
          ) : null}
          <FeePanel app={merged} institute={institute} lang={lang} id={id} />
        </>
      ) : null}

      {saveLine ? <p className="save">{saveLine}</p> : null}
      {err ? <p className="err">{err}</p> : null}

      {tab < last ? (
        <button type="button" className="primary" onClick={() => setTab(tab + 1)}>
          {t(lang, "next")}
        </button>
      ) : (
        <button type="button" className="primary" disabled={busy} onClick={() => void goReview()}>
          {t(lang, "next")}
        </button>
      )}
      {tab > 0 ? (
        <button type="button" className="quiet" onClick={() => setTab(tab - 1)}>
          {t(lang, "back")}
        </button>
      ) : null}
      <button type="button" className="danger" onClick={() => void boom()}>
        {t(lang, "crash")}
      </button>
    </>
  );
}
