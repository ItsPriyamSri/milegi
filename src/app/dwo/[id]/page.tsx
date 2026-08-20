"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { getApp, postAction } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

export default function DwoPage() {
  const { id } = useParams<{ id: string }>();
  const lang = useLang();
  const [name, setName] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getApp(id)
      .then((env) => {
        setName(env.app.studentName);
        setStatus(env.app.status);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "error"));
  }, [id]);

  async function act(action: "pay" | "reject") {
    setBusy(true);
    try {
      const env = await postAction(id, action);
      setStatus(env.app.status);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  if (err) return <main><p className="lead err">{err}</p></main>;
  if (!status) return <main><p className="lead">{t(lang, "loading")}</p></main>;

  if (status !== "dwo" && status !== "paid" && status !== "rejected") {
    return (
      <main>
        <p className="lead">{t(lang, "notLocked")}</p>
        <a className="btn" href={`/status/${id}`}>{t(lang, "backToCase")}</a>
      </main>
    );
  }

  return (
    <main>
      <h1>{t(lang, "dwoName")}</h1>
      <p className="lead">{name}</p>
      {status === "dwo" ? (
        <>
          <button type="button" className="primary" disabled={busy} onClick={() => void act("pay")}>
            {t(lang, "pay")}
          </button>
          <button type="button" className="danger" disabled={busy} onClick={() => void act("reject")}>
            {t(lang, "reject")}
          </button>
        </>
      ) : (
        <p className="ok">{status === "paid" ? t(lang, "paidOk") : t(lang, "rejectedMsg")}</p>
      )}
      <a className="btn" href={`/status/${id}`}>
        {t(lang, "backToCase")}
      </a>
    </main>
  );
}
