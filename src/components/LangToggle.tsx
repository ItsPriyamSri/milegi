"use client";

import { useEffect, useState } from "react";

import type { Lang } from "@/lib/i18n";

const LANGUAGE_CHANGE_EVENT = "milegi-language-change";

function storedLanguage(): Lang {
  return localStorage.milegiLang === "en" ? "en" : "hi";
}

export default function LangToggle() {
  const [lang, setLang] = useState<Lang>("hi");

  useEffect(() => {
    const savedLanguage = storedLanguage();
    setLang(savedLanguage);
    document.documentElement.lang = savedLanguage;
  }, []);

  function toggleLanguage() {
    const nextLanguage: Lang = lang === "hi" ? "en" : "hi";
    localStorage.milegiLang = nextLanguage;
    document.documentElement.lang = nextLanguage;
    setLang(nextLanguage);
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
  }

  return (
    <button type="button" onClick={toggleLanguage} aria-label="Change language">
      {lang === "hi" ? "EN" : "हिं"}
    </button>
  );
}
