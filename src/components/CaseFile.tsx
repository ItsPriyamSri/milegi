"use client";

import { useEffect, useState } from "react";
import { getApp, postAction, type Envelope } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import type { Application } from "@/server/types";

function rupees(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function holderLine(app: Application, lang: "hi" | "en"): string {
  if (app.status === "paid") return t(lang, "paidOk");
  if (app.status === "rejected") return t(lang, "rejectedMsg");
  const holder = app.actors.find((a) => !a.done) ?? app.actors[0];
  if (!holder) return app.status;
  if (app.status === "institute") {
    return lang === "hi"
      ? `${holder.name}, छात्रवृत्ति क्लर्क, ${app.instituteName}`
      : `${holder.name}, scholarship clerk, ${app.instituteName}`;
  }
  return `${holder.name} · ${holder.role}`;
}

function npciLabel(app: Application, lang: "hi" | "en"): string {
  if (app.npci === "ok") return lang === "hi" ? "जुड़ा हुआ" : "Mapped";
  if (app.npci === "pending") return lang === "hi" ? "लंबित" : "Pending";
  return lang === "hi" ? "जवाब नहीं आया" : "No response";
}

export default function CaseFile({ id }: { id: string }) {
  const lang = useLang();
  const [env, setEnv] = useState<Envelope | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setEnv(await getApp(id));
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "error");
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function act(action: string) {
    setBusy(true);
    try {
      setEnv(await postAction(id, action));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  if (err) return <p className="lead err">{err}</p>;
  if (!env) return <p className="lead">{lang === "hi" ? "लोड हो रहा है…" : "Loading…"}</p>;

  const app = env.app;
  const early = ["choose", "preflight", "draft", "review"].includes(app.status);
  const waiting = app.actors.some((a) => a.waitingDays > 0);
  const attested = app.status !== "institute";

  if (early) {
    return (
      <main>
        <h1>{app.studentName}</h1>
        <p className="lead">{t(lang, "notLocked")}</p>
        <a className="btn primary" href={`/apply/${id}`}>
          {t(lang, "openFormLink")}
        </a>
        <p>
          {t(lang, "resumeCodeIs")}: <strong>{app.resumeCode}</strong>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>{app.studentName}</h1>

      <h2>{t(lang, "fileWhere")}</h2>
      <p>{holderLine(app, lang)}</p>
      {waiting ? (
        <p className="lead">
          {app.actors.find((a) => a.waitingDays > 0)?.waitingDays}{" "}
          {lang === "hi" ? "दिन से प्रतीक्षा" : "days waiting"}
        </p>
      ) : null}

      <h2>{t(lang, "youMust")}</h2>
      {app.hardCopyDueAt ? (
        <p className={attested ? "struck" : undefined}>
          {lang === "hi"
            ? `हार्ड कॉपी कॉलेज में ${app.hardCopyDueAt} तक`
            : `Hard copy to college by ${app.hardCopyDueAt}`}
        </p>
      ) : null}

      <h2>{t(lang, "feeLabel")}</h2>
      <p className="money">{rupees(app.expectedAmount)}</p>
      <p className="lead">{t(lang, "feeNotPromise")}</p>
      {app.lastYearPaid != null ? (
        <p>
          {t(lang, "lastYearPaid")}: {rupees(app.lastYearPaid)}
        </p>
      ) : null}

      <h2>{t(lang, "npciNamed")}</h2>
      <p>{npciLabel(app, lang)}</p>
      <p className="lead">{t(lang, "npciNoBank")}</p>
      {app.npci !== "ok" ? (
        <button type="button" className="primary" disabled={busy} onClick={() => void act("npci")}>
          {t(lang, "npciRetry")}
        </button>
      ) : null}

      {waiting ? (
        <button type="button" disabled={busy} onClick={() => void act("ping")}>
          {t(lang, "ping")}
        </button>
      ) : null}
      {app.nudgeSentAt ? <p className="ok">{t(lang, "nudged")}</p> : null}

      {app.status === "institute" ? (
        <a className="btn" href={`/institute/${id}`}>
          {t(lang, "clerkHat")}
        </a>
      ) : null}
      {app.status === "dwo" ? (
        <>
          <button type="button" className="primary" disabled={busy} onClick={() => void act("pay")}>
            {t(lang, "pay")}
          </button>
          <button type="button" className="danger" disabled={busy} onClick={() => void act("reject")}>
            {t(lang, "reject")}
          </button>
        </>
      ) : null}
      {app.status === "rejected" ? (
        <a className="btn" href={`/apply/${id}`}>
          {t(lang, "openFormLink")}
        </a>
      ) : null}

      <p>
        {t(lang, "resumeCodeIs")}: <strong>{app.resumeCode}</strong>
      </p>

      <hr className="rule" />
      <h2>{t(lang, "chain")}</h2>
      <ol>
        {app.actors.map((a) => (
          <li key={a.role}>
            {a.done ? "✓ " : ""}
            {a.name}
            {a.waitingDays > 0 ? ` · ${a.waitingDays}` : ""}
          </li>
        ))}
      </ol>
    </main>
  );
}
