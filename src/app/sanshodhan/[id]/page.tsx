"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { ApiError, getApp, postAction } from "@/lib/api";
import { correctionWindow } from "@/lib/calendar";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import type { Application } from "@/server/types";

export default function SanshodhanPage() {
  const { id } = useParams<{ id: string }>();
  const lang = useLang();
  const [app, setApp] = useState<Application | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getApp(id)
      .then((env) => setApp(env.app))
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "error"));
  }, [id]);

  async function ask() {
    setBusy(true);
    setErr(null);
    try {
      await postAction(id, "correct");
    } catch (e) {
      if (e instanceof ApiError) {
        const code = e.body.code;
        if (code === "not_locked") setErr(t(lang, "sanshodhanNotLocked"));
        else if (code === "correction_closed") setErr(t(lang, "sanshodhanClosed"));
        else if (code === "correction_not_built") setErr(t(lang, "sanshodhanOpen"));
        else setErr(e.message);
      } else {
        setErr(e instanceof Error ? e.message : "error");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!app && !err) return <main><p className="lead">{t(lang, "loading")}</p></main>;

  const w = app ? correctionWindow(app.cycle) : null;
  const early = app ? ["choose", "preflight", "draft", "review"].includes(app.status) : true;

  return (
    <main>
      <h1>{t(lang, "sanshodhan")}</h1>
      {app ? <p className="lead">{app.studentName}</p> : null}
      {w ? (
        <p>
          {t(lang, "windowDates")} ({app?.cycle}): {w.start} – {w.end}
        </p>
      ) : null}
      <p className="lead">{t(lang, "datesSource")}</p>
      {err ? <p className="err">{err}</p> : null}
      {early ? (
        <a className="btn primary" href={`/apply/${id}`}>{t(lang, "openFormLink")}</a>
      ) : (
        <button type="button" className="primary" disabled={busy} onClick={() => void ask()}>
          {t(lang, "sanshodhan")}
        </button>
      )}
    </main>
  );
}
