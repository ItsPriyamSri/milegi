"use client";

import { t } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

const ROWS: { hi: string; en: string; when: string }[] = [
  { hi: "कक्षा 9–12 नवीनीकरण", en: "Class 9–12 renewal", when: "11–25 अगस्त 2026" },
  { hi: "कक्षा 9–12 Fresh", en: "Class 9–12 fresh", when: "11 अगस्त–21 सितम्बर 2026" },
  { hi: "दशमोत्तर नवीनीकरण", en: "Dashmottar renewal", when: "15 सितम्बर–15 अक्टूबर 2026" },
  { hi: "दशमोत्तर Fresh", en: "Dashmottar fresh", when: "15 सितम्बर–31 अक्टूबर 2026" },
  { hi: "दशमोत्तर नवीनीकरण संशोधन", en: "Dashmottar renewal correction", when: "21 नवम्बर–20 दिसम्बर 2026" },
  { hi: "दशमोत्तर Fresh संशोधन", en: "Dashmottar fresh correction", when: "16 दिसम्बर 2026–10 जनवरी 2027" },
];

export default function CircularsPage() {
  const lang = useLang();
  return (
    <main>
      <h1>{t(lang, "navCirculars")}</h1>
      <p className="lead">{t(lang, "datesSource")}</p>
      <dl className="limits">
        {ROWS.map((row) => (
          <div key={row.when}>
            <dt>{lang === "hi" ? row.hi : row.en}</dt>
            <dd>{row.when}</dd>
          </div>
        ))}
      </dl>
      <a className="btn primary" href="/">{t(lang, "hubToStudent")}</a>
    </main>
  );
}
