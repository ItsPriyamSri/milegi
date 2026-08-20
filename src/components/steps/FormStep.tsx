"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      <p>{t(lang, "otrLabel")}: <span className="code">{app.otr}</span></p>
      <p>{t(lang, "regLabel")}: <span className="code">{app.registrationNo}</span></p>
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
  const router = useRouter();
  const { update, flush, dirty, saveKey } = useAutosave(id);
  const [crash, setCrash] = useState(false);
  const [crashMsg, setCrashMsg] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const merged = { ...app, ...dirty };
  const fresh = app.cycle === "fresh";
  const saveLine = saveKey ? t(lang, saveKey) : null;

  async function finish() {
    setBusy(true);
    setErr(null);
    await flush();
    try {
      if (app.status !== "review") {
        onEnv(await postAction(id, "review"));
      }
      if (!window.confirm(t(lang, "lockConfirm"))) {
        setBusy(false);
        return;
      }
      onEnv(await postAction(id, "lock"));
      router.push(`/status/${id}`);
    } catch (cause) {
      if (cause instanceof ApiError) {
        const list = cause.body.blockers ?? [];
        setErr(list.map((b) => (lang === "hi" ? b.hi : b.en)).join(" ") || cause.message);
      } else {
        setErr(cause instanceof Error ? cause.message : "lock failed");
      }
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

  return (
    <>
      {crash ? (
        <CrashOverlay message={crashMsg} onReload={() => window.location.reload()} />
      ) : null}

      {fresh ? (
        <>
          <h2>{t(lang, "academic")}</h2>
          <label htmlFor="year">{t(lang, "year")}</label>
          <input
            id="year"
            type="number"
            min={1}
            value={merged.yearOfStudy}
            onChange={(e) => update({ yearOfStudy: Number(e.target.value) })}
          />
          <p>{merged.courseName} · {merged.instituteName}</p>

          <h2>{t(lang, "personal")}</h2>
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
      ) : (
        <>
          <h2>{t(lang, "resultTab")}</h2>
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
      )}

      {missing.length ? (
        <>
          <h2>{t(lang, "leftover")}</h2>
          {missing.map((b) => (
            <p key={b.code} className="err">{lang === "hi" ? b.hi : b.en}</p>
          ))}
        </>
      ) : null}

      <FeePanel app={merged} institute={institute} lang={lang} id={id} />

      {saveLine ? <p className="save">{saveLine}</p> : null}
      {err ? <p className="err">{err}</p> : null}

      <button type="button" className="primary" disabled={busy} onClick={() => void finish()}>
        {t(lang, "lock")}
      </button>
      <button type="button" className="danger" onClick={() => void boom()}>
        {t(lang, "crash")}
      </button>
    </>
  );
}
