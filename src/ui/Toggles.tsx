"use client";

import { useEffect, useState } from "react";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 180}`;
}

export function LangToggle({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="toggle"
      onClick={() => {
        const next = document.cookie.includes("mlg_lang=en") ? "hi" : "en";
        setCookie("mlg_lang", next);
        window.location.reload();
      }}
    >
      {label}
    </button>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");

  useEffect(() => {
    const stored = window.localStorage.getItem("mlg_theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.dataset.theme = stored;
    }
  }, []);

  function cycle() {
    const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
    if (next === "system") {
      delete document.documentElement.dataset.theme;
      window.localStorage.removeItem("mlg_theme");
    } else {
      document.documentElement.dataset.theme = next;
      window.localStorage.setItem("mlg_theme", next);
    }
  }

  const glyph = theme === "dark" ? "◐" : theme === "light" ? "○" : "◑";
  return (
    <button type="button" className="toggle" onClick={cycle} aria-label={`रंग: ${theme}`}>
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}
