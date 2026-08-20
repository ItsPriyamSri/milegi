"use client";

import { t } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

export default function SchemesPage() {
  const lang = useLang();
  return (
    <main>
      <h1>{t(lang, "navSchemes")}</h1>
      <p className="lead">{t(lang, "stubSchemes")}</p>
      <dl className="limits">
        <div>
          <dt>{lang === "hi" ? "Pre-Matric (कक्षा 9–10)" : "Pre-Matric (class 9–10)"}</dt>
          <dd>{lang === "hi" ? "दरवाज़ा पूछता है, फॉर्म यहाँ नहीं भरता" : "The door asks; this prototype does not fill that form"}</dd>
        </div>
        <div>
          <dt>{lang === "hi" ? "Post-Matric Inter (11–12)" : "Post-Matric Inter (11–12)"}</dt>
          <dd>{lang === "hi" ? "वही — ईमानदार स्टॉप" : "Same — an honest stop"}</dd>
        </div>
        <div>
          <dt>{lang === "hi" ? "दशमोत्तर Fresh + Renewal" : "Dashmottar Fresh + Renewal"}</dt>
          <dd>{lang === "hi" ? "यही पूरा जर्नी है" : "This is the completable journey"}</dd>
        </div>
        <div>
          <dt>{lang === "hi" ? "Outside State" : "Outside State"}</dt>
          <dd>{lang === "hi" ? "अलग लॉगिन; यहाँ नकली नहीं" : "A separate login; not faked here"}</dd>
        </div>
      </dl>
      <a className="btn primary" href="/">{t(lang, "hubToStudent")}</a>
    </main>
  );
}
