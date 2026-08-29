"use client";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 180}`;
}

export function LangToggle({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="toggle"
      onClick={() => {
        const next = document.cookie.includes("mlg_lang=hi") ? "en" : "hi";
        setCookie("mlg_lang", next);
        window.location.reload();
      }}
    >
      {label}
    </button>
  );
}

export function ThemeToggle() {
  return null;
}

