"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { patchDraft, resolveDoor, type DoorEnvelope, type Envelope } from "@/lib/api";
import { t, type Lang } from "@/lib/i18n";

type Studying = "9-10" | "11-12" | "college" | "outside";
type Got = "yes" | "no" | "dunno";

export default function ChooseStep({
  lang,
  currentId,
  onEnv,
}: {
  lang: Lang;
  currentId: string;
  onEnv: (env: Envelope) => void;
}) {
  const router = useRouter();
  const [studying, setStudying] = useState<Studying | null>(null);
  const [firstYear, setFirstYear] = useState<boolean | null>(null);
  const [gotLastYear, setGotLastYear] = useState<Got | null>(null);
  const [door, setDoor] = useState<DoorEnvelope | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    if (!studying || firstYear === null || !gotLastYear) return;
    setBusy(true);
    setErr(null);
    try {
      setDoor(await resolveDoor({ studying, firstYear, gotLastYear }));
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : "resolve failed");
    } finally {
      setBusy(false);
    }
  }

  async function openCase(id: string) {
    setBusy(true);
    try {
      const env = await patchDraft(id, {});
      if (id === currentId) onEnv(env);
      else router.push(`/apply/${id}`);
    } catch (cause) {
      setErr(cause instanceof Error ? cause.message : "open failed");
      setBusy(false);
    }
  }

  if (door) {
    const label = lang === "hi" ? door.messageHi : door.messageEn;
    const altLabel = door.alt ? (lang === "hi" ? door.alt.labelHi : door.alt.labelEn) : "";
    return (
      <>
        <h2>{t(lang, "whoAreYou")}</h2>
        <p className="lead">{label}</p>
        {door.otrs.length > 1 ? (
          <ul>
            {door.otrs.map((otr) => (
              <li key={otr} className="code">{otr}</li>
            ))}
          </ul>
        ) : null}
        {door.completable && door.appId ? (
          <button type="button" className="primary" disabled={busy} onClick={() => void openCase(door.appId!)}>
            {t(lang, "openCase")}
          </button>
        ) : null}
        {door.alt ? (
          <button type="button" className={door.completable ? "quiet" : "primary"} disabled={busy} onClick={() => void openCase(door.alt!.appId)}>
            {altLabel}
          </button>
        ) : null}
        {err ? <p className="err">{err}</p> : null}
      </>
    );
  }

  return (
    <>
      <h2>{t(lang, "whoAreYou")}</h2>
      <p className="lead">{t(lang, "qStudy")}</p>
      {([
        ["college", "tDash"],
        ["11-12", "tInter"],
        ["9-10", "tPre"],
        ["outside", "tOut"],
      ] as const).map(([value, key]) => (
        <button
          key={value}
          type="button"
          className={studying === value ? "picked" : undefined}
          aria-pressed={studying === value}
          onClick={() => {
            setStudying(value);
            setFirstYear(null);
            setGotLastYear(null);
          }}
        >
          {t(lang, key)}
        </button>
      ))}

      {studying ? (
        <>
          <p className="lead block-q">{t(lang, "qFirst")}</p>
          <button type="button" className={firstYear === true ? "picked" : undefined} aria-pressed={firstYear === true} onClick={() => setFirstYear(true)}>
            {t(lang, "yes")}
          </button>
          <button type="button" className={firstYear === false ? "picked" : undefined} aria-pressed={firstYear === false} onClick={() => setFirstYear(false)}>
            {t(lang, "no")}
          </button>
        </>
      ) : null}

      {studying && firstYear !== null ? (
        <>
          <p className="lead block-q">{t(lang, "qGot")}</p>
          <button type="button" className={gotLastYear === "yes" ? "picked" : undefined} aria-pressed={gotLastYear === "yes"} onClick={() => setGotLastYear("yes")}>
            {t(lang, "yes")}
          </button>
          <button type="button" className={gotLastYear === "no" ? "picked" : undefined} aria-pressed={gotLastYear === "no"} onClick={() => setGotLastYear("no")}>
            {t(lang, "no")}
          </button>
          <button type="button" className={gotLastYear === "dunno" ? "picked" : undefined} aria-pressed={gotLastYear === "dunno"} onClick={() => setGotLastYear("dunno")}>
            {t(lang, "dunno")}
          </button>
          <button type="button" className="primary" disabled={busy || !gotLastYear} onClick={() => void go()}>
            {t(lang, "next")}
          </button>
        </>
      ) : null}
      {err ? <p className="err">{err}</p> : null}
    </>
  );
}
