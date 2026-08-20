"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { t, type Lang } from "@/lib/i18n";

const LANGUAGE_CHANGE_EVENT = "milegi-language-change";

function storedLanguage(): Lang {
  return localStorage.milegiLang === "en" ? "en" : "hi";
}

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [lang, setLang] = useState<Lang>("hi");

  useEffect(() => {
    const updateLanguage = () => setLang(storedLanguage());
    updateLanguage();
    window.addEventListener(LANGUAGE_CHANGE_EVENT, updateLanguage);
    window.addEventListener("storage", updateLanguage);
    return () => {
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, updateLanguage);
      window.removeEventListener("storage", updateLanguage);
    };
  }, []);

  return (
    <main>
      <h1>{t(lang, "title")}</h1>
      <p className="lead">{t(lang, "sub")}</p>
      <a className="btn primary" href="/apply/app-priya">
        {t(lang, "startPriya")}
      </a>
      <a className="btn" href="/apply/app-amit">
        {t(lang, "startAmit")}
      </a>
      <a className="btn quiet" href="/apply/app-amit-dup">
        {t(lang, "startDup")}
      </a>
      <div className="slip">
        <label htmlFor="resume">{t(lang, "resume")}</label>
        <input
          id="resume"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="MLG-PRIYA"
          autoCapitalize="characters"
          autoComplete="off"
        />
        <button
          className="primary"
          type="button"
          onClick={() => {
            const normalizedCode = code.trim().toUpperCase();
            if (normalizedCode) router.push(`/r/${normalizedCode}`);
          }}
        >
          {t(lang, "openCase")}
        </button>
      </div>
      <p>
        <Link href="/limitations">{t(lang, "limits")}</Link>
      </p>
    </main>
  );
}
