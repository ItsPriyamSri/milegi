"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, postAction, type Envelope } from "@/lib/api";
import { useAutosave } from "@/lib/useAutosave";
import { t, type Lang } from "@/lib/i18n";
import type { Application, Institute } from "@/server/types";

function rupees(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function ReviewStep({
  id,
  app,
  institute,
  lang,
  onEnv,
}: {
  id: string;
  app: Application;
  institute: Institute;
  lang: Lang;
  onEnv: (env: Envelope) => void;
}) {
  const router = useRouter();
  const { flush } = useAutosave(id);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function lock() {
    if (!window.confirm(t(lang, "lockConfirm"))) return;
    setBusy(true);
    setErr(null);
    await flush();
    try {
      onEnv(await postAction(id, "lock"));
      router.push(`/status/${id}`);
    } catch (cause) {
      if (cause instanceof ApiError) {
        setErr(
          (cause.body.blockers ?? []).map((b) => (lang === "hi" ? b.hi : b.en)).join(" ") ||
            cause.message,
        );
      } else {
        setErr(cause instanceof Error ? cause.message : "lock failed");
      }
      setBusy(false);
    }
  }

  return (
    <>
      <h2>{t(lang, "reviewTitle")}</h2>
      <dl className="dl">
        <dt>{lang === "hi" ? "नाम" : "Name"}</dt>
        <dd>{app.studentName}</dd>
        <dt>OTR</dt>
        <dd className="code">{app.otr}</dd>
        <dt>{lang === "hi" ? "रजिस्ट्रेशन" : "Registration"}</dt>
        <dd className="code">{app.registrationNo}</dd>
        <dt>{lang === "hi" ? "कोर्स" : "Course"}</dt>
        <dd>{app.courseName} · {app.instituteName}</dd>
        <dt>{lang === "hi" ? "कॉलेज मास्टर ट्यूशन" : "College master tuition"}</dt>
        <dd>{rupees(institute.tuition)}</dd>
        <dt>{t(lang, "feeLabel")}</dt>
        <dd className="money">{rupees(app.expectedAmount)}</dd>
      </dl>
      <p className="lead">{t(lang, "feeNotPromise")}</p>
      {app.cycle === "renewal" ? (
        <p>
          {t(lang, "marksObtained")}: {app.marksObtained}/{app.marksTotal}
        </p>
      ) : (
        <p>
          {t(lang, "enrollment")}: {app.enrollmentNo}
        </p>
      )}
      {err ? <p className="err">{err}</p> : null}
      <button type="button" className="primary" disabled={busy} onClick={() => void lock()}>
        {t(lang, "lock")}
      </button>
    </>
  );
}
