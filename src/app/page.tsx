"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getApp } from "@/lib/api";
import { AMIT_OTR, DUP_OTR, normalizeResume } from "@/lib/demoCodes";
import { t } from "@/lib/i18n";
import { caseHref, statusLine } from "@/lib/statusLine";
import { useLang } from "@/lib/useLang";
import type { Application } from "@/server/types";

const ROWS = [
  { id: "app-priya", name: "प्रिया वर्मा", metaKey: "casePriyaMeta" as const, code: null as string | null },
  { id: "app-amit", name: "अमित यादव", metaKey: "caseAmitMeta" as const, code: AMIT_OTR },
  { id: "app-amit-dup", name: "अमित (गलत Fresh)", metaKey: "caseDupMeta" as const, code: DUP_OTR },
];

export default function Home() {
  const router = useRouter();
  const lang = useLang();
  const [code, setCode] = useState("");
  const [apps, setApps] = useState<Record<string, Application>>({});

  useEffect(() => {
    let live = true;
    void Promise.all(
      ROWS.map((row) =>
        getApp(row.id)
          .then((env) => [row.id, env.app] as const)
          .catch(() => null),
      ),
    ).then((pairs) => {
      if (!live) return;
      const next: Record<string, Application> = {};
      for (const pair of pairs) if (pair) next[pair[0]] = pair[1];
      setApps(next);
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <main>
      <h1>{t(lang, "title")}</h1>
      <p className="lead">{t(lang, "sub")}</p>

      <h2>{t(lang, "casesHeading")}</h2>
      <div className="caselist">
        {ROWS.map((row) => {
          const app = apps[row.id];
          const href = app ? caseHref(app) : `/apply/${row.id}`;
          return (
            <a className="case" href={href} key={row.id}>
              <strong>{row.name}</strong>
              <span>
                {app ? statusLine(app, lang) : t(lang, row.metaKey)}
                {row.code ? ` · ${row.code}` : ""}
              </span>
            </a>
          );
        })}
      </div>

      <div className="slip">
        <label htmlFor="resume">{t(lang, "resume")}</label>
        <input
          id="resume"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={t(lang, "resumeHint")}
          autoCapitalize="characters"
          autoComplete="off"
        />
        <button
          className="primary"
          type="button"
          onClick={() => {
            const normalizedCode = normalizeResume(code);
            if (normalizedCode) router.push(`/r/${encodeURIComponent(normalizedCode)}`);
          }}
        >
          {t(lang, "openCase")}
        </button>
      </div>
    </main>
  );
}
