"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getApp, resetSeed, type Envelope } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";
import type { Application, Blocker, Institute } from "@/server/types";
import ChooseStep from "@/components/steps/ChooseStep";
import PreflightStep from "@/components/steps/PreflightStep";
import FormStep from "@/components/steps/FormStep";
import ReviewStep from "@/components/steps/ReviewStep";

const TERMINAL = new Set(["institute", "dwo", "paid", "rejected"]);

export default function Wizard({ id }: { id: string }) {
  const router = useRouter();
  const lang = useLang();
  const [env, setEnv] = useState<Envelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  function apply(next: Envelope) {
    setEnv(next);
  }

  useEffect(() => {
    let active = true;
    setEnv(null);
    setError(null);
    void getApp(id)
      .then((next) => {
        if (active) setEnv(next);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "लोड नहीं हुआ");
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (env && TERMINAL.has(env.app.status)) router.replace(`/status/${id}`);
  }, [env, id, router]);

  async function reset() {
    setResetting(true);
    try {
      await resetSeed();
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "सीड रीसेट नहीं हुआ");
      setResetting(false);
    }
  }

  if (error) {
    return (
      <main>
        <p className="lead err">{error}</p>
        <button type="button" onClick={() => void reset()} disabled={resetting}>
          {t(lang, "seedReset")}
        </button>
      </main>
    );
  }

  if (!env) {
    return (
      <main>
        <p className="lead">{t(lang, "loading")}</p>
      </main>
    );
  }

  const app: Application = env.app;
  const blockers: Blocker[] = env.blockers;
  const missing: Blocker[] = env.missing;
  const institute: Institute = env.institute;

  if (TERMINAL.has(app.status)) {
    return (
      <main>
        <p className="lead">{t(lang, "loading")}</p>
      </main>
    );
  }

  const progress =
    app.status === "choose" ? 0 : app.status === "preflight" ? 1 : app.status === "draft" ? 2 : 3;

  return (
    <main>
      <div className="progress" aria-label={`${progress + 1} / 6`}>
        {Array.from({ length: 6 }, (_, index) => (
          <span className={index <= progress ? "on" : undefined} key={index} />
        ))}
      </div>
      <h1>{app.studentName}</h1>
      {app.status === "choose" ? (
        <ChooseStep lang={lang} currentId={id} onEnv={apply} />
      ) : null}
      {app.status === "preflight" ? (
        <PreflightStep
          id={id}
          app={app}
          blockers={blockers}
          institute={institute}
          lang={lang}
          preflightOk={env.preflightOk}
          onEnv={apply}
        />
      ) : null}
      {app.status === "draft" ? (
        <FormStep id={id} app={app} missing={missing} institute={institute} lang={lang} onEnv={apply} />
      ) : null}
      {app.status === "review" ? (
        <ReviewStep id={id} app={app} institute={institute} lang={lang} onEnv={apply} />
      ) : null}
    </main>
  );
}
