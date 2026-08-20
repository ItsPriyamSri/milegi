"use client";

import Link from "next/link";

import { t, type StrKey } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

export default function HubStub({ title, body }: { title: StrKey; body: StrKey }) {
  const lang = useLang();
  return (
    <main>
      <h1>{t(lang, title)}</h1>
      <p className="lead">{t(lang, body)}</p>
      <a className="btn primary" href="/">
        {t(lang, "hubToStudent")}
      </a>
      <p>
        <Link href="/limitations">{t(lang, "limits")}</Link>
      </p>
    </main>
  );
}
