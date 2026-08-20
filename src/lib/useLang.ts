"use client";

import { useEffect, useState } from "react";
import type { Lang } from "./i18n";

const EVENT = "milegi-language-change";

export function useLang(): Lang {
  const [lang, setLang] = useState<Lang>("hi");
  useEffect(() => {
    const update = () => setLang(localStorage.milegiLang === "en" ? "en" : "hi");
    update();
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return lang;
}
