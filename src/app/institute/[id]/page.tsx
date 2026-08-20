"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getApp, postAction } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

export default function InstitutePage() {
  const { id } = useParams<{ id: string }>();
  const lang = useLang();
  const [name, setName] = useState<string | null>(null);
  const [attendance, setAttendance] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getApp(id)
      .then((env) => {
        setName(env.app.studentName);
        setAttendance(env.app.attendancePct);
        setStatus(env.app.status);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "error"));
  }, [id]);

  async function attest() {
    setBusy(true);
    try {
      const env = await postAction(id, "attest");
      setStatus(env.app.status);
      setAttendance(env.app.attendancePct);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  if (err) return <main><p className="lead err">{err}</p></main>;
  if (!status) return <main><p className="lead">…</p></main>;

  if (status !== "institute" && status !== "dwo" && status !== "paid") {
    return (
      <main>
        <p className="lead">{t(lang, "notLocked")}</p>
        <a className="btn" href={`/status/${id}`}>{t(lang, "backToCase")}</a>
      </main>
    );
  }

  return (
    <main>
      <h1>राम प्रकाश, छात्रवृत्ति क्लर्क</h1>
      <p className="lead">{name}</p>
      <p>
        {t(lang, "attendance")}: {attendance || 0}%
      </p>
      {status === "institute" ? (
        <button type="button" className="primary" disabled={busy} onClick={() => void attest()}>
          {t(lang, "attest")}
        </button>
      ) : (
        <p className="ok">{t(lang, "attest")}</p>
      )}
      <a className="btn" href={`/status/${id}`}>
        {t(lang, "backToCase")}
      </a>
    </main>
  );
}
