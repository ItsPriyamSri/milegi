"use client";

import { useEffect, useState } from "react";

import { t, type Lang } from "@/lib/i18n";

const LANGUAGE_CHANGE_EVENT = "milegi-language-change";

function storedLanguage(): Lang {
  return localStorage.milegiLang === "en" ? "en" : "hi";
}

export default function Banner() {
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

  return <div className="banner">{t(lang, "banner")}</div>;
}
