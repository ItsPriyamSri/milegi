"use client";

import { useState } from "react";
import { ApiError, patchDraft, postAction, type Envelope } from "@/lib/api";
import { t, type Lang } from "@/lib/i18n";
import type { Application, Blocker, Institute } from "@/server/types";

function has(list: Blocker[], code: string) {
  return list.some((b) => b.code === code);
}

export default function PreflightStep({
  id,
  app,
  blockers,
  institute,
  lang,
  preflightOk,
  onEnv,
}: {
  id: string;
  app: Application;
  blockers: Blocker[];
  institute: Institute;
  lang: Lang;
  preflightOk: boolean;
  onEnv: (env: Envelope) => void;
}) {
  const copy = (b: Blocker) => (lang === "hi" ? b.hi : b.en);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function patch(partial: Partial<Application>) {
    setBusy(true);
    setErr(null);
    try {
      onEnv(await patchDraft(id, partial));
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : "save failed");
    } finally {
      setBusy(false);
    }
  }

  async function act(action: string) {
    setBusy(true);
    setErr(null);
    try {
      onEnv(await postAction(id, action));
    } catch (cause) {
      if (cause instanceof ApiError) {
        setErr(cause.body.blockers?.map((b) => copy(b)).join(" ") ?? cause.message);
      } else {
        setErr(cause instanceof Error ? cause.message : "failed");
      }
    } finally {
      setBusy(false);
    }
  }

  const otrBad = !app.otr;
  const incomeBad = has(blockers, "income_expired");
  const npciBad = app.npci !== "ok";
  const listed = app.instituteListed && institute.listed;
  const dup = has(blockers, "duplicate_fresh") || Boolean(app.duplicateOtrs?.length);

  return (
    <>
      <h2>{t(lang, "papers")}</h2>
      <p className="lead">{app.studentName}</p>

      <div className="row">
        <p className={otrBad ? "mark bad" : "mark ok"}>OTR</p>
        {otrBad ? (
          <button type="button" className="primary" disabled={busy} onClick={() => void act("kyc")}>
            {t(lang, "kyc")}
          </button>
        ) : (
          <>
            <p className="code">{app.otr}</p>
            <p className="ok">{t(lang, "otrKeep")}</p>
          </>
        )}
      </div>

      <div className="row">
        <p className={incomeBad ? "mark bad" : "mark ok"}>{lang === "hi" ? "आय प्रमाण पत्र (3 साल)" : "Income certificate (3 years)"}</p>
        {incomeBad ? <p className="err">{copy(blockers.find((b) => b.code === "income_expired")!)}</p> : null}
        <label htmlFor="incomeIssuedOn">{t(lang, "incomeDate")}</label>
        <input id="incomeIssuedOn" type="date" value={app.incomeIssuedOn.slice(0, 10)} onChange={(e) => void patch({ incomeIssuedOn: e.target.value })} />
        <label htmlFor="incomeAppNo">{t(lang, "incomeApp")}</label>
        <input id="incomeAppNo" value={app.incomeAppNo} onChange={(e) => void patch({ incomeAppNo: e.target.value })} />
        <label htmlFor="incomeCertNo">{t(lang, "incomeCert")}</label>
        <input id="incomeCertNo" value={app.incomeCertNo} onChange={(e) => void patch({ incomeCertNo: e.target.value })} />
      </div>

      {app.category !== "general" ? (
        <div className="row">
          <p className="mark ok">{lang === "hi" ? "जाति प्रमाण पत्र" : "Caste certificate"}</p>
          <label htmlFor="casteAppNo">{t(lang, "casteApp")}</label>
          <input id="casteAppNo" value={app.casteAppNo ?? ""} onChange={(e) => void patch({ casteAppNo: e.target.value })} />
          <label htmlFor="casteCertNo">{t(lang, "casteCert")}</label>
          <input id="casteCertNo" value={app.casteCertNo ?? ""} onChange={(e) => void patch({ casteCertNo: e.target.value })} />
        </div>
      ) : null}

      <div className="row">
        <p className={npciBad ? "mark bad" : "mark ok"}>{t(lang, "npciNamed")}</p>
        <p className="lead">{t(lang, "npciNoBank")}</p>
        {npciBad ? (
          <button type="button" className="primary" disabled={busy} onClick={() => void act("npci")}>
            {t(lang, "npciRetry")}
          </button>
        ) : (
          <p className="ok">{lang === "hi" ? "जुड़ा हुआ" : "Mapped"}</p>
        )}
      </div>

      <div className="row">
        <p className={listed ? "mark ok" : "mark bad"}>{listed ? t(lang, "listedOk") : t(lang, "unlisted")}</p>
        <p>{app.instituteName}</p>
      </div>

      <div className="row">
        <p className={dup ? "mark bad" : "mark ok"}>{lang === "hi" ? "दोहरा आवेदन" : "Duplicate application"}</p>
        {dup ? (
          <>
            <ul>
              {(app.duplicateOtrs ?? []).map((otr) => (
                <li key={otr} className="code">{otr}</li>
              ))}
            </ul>
            <a className="btn" href="/apply/app-amit">{lang === "hi" ? "असली नवीनीकरण खोलें" : "Open the real renewal"}</a>
          </>
        ) : (
          <p className="ok">{lang === "hi" ? "एक ही केस" : "One case"}</p>
        )}
      </div>

      {err ? <p className="err">{err}</p> : null}
      <button type="button" className="primary" disabled={busy || !preflightOk} onClick={() => void act("open")}>
        {t(lang, "openFormBtn")}
      </button>
    </>
  );
}
