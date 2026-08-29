import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";

export default async function ReportsPage() {
  const lang = await getLang();
  const isEn = lang === "en";

  return (
    <Shell lang={lang} narrow>
      <PageHead
        eyebrow="SESSION REPORTS · सत्र रिपोर्ट"
        title={isEn ? "All Session Reports & Operator Queues" : "सत्र रिपोर्ट एवं ऑपरेटर कतार"}
        meta={
          <p className="measure muted">
            {isEn
              ? "Milegi does not publish fabricated statewide lakh counters. Real-time session status reports are live operator queues maintained inside Institute and District Welfare Officer consoles."
              : "मिलेगी पर कोई नकली राज्यव्यापी लाख काउंटर नहीं हैं। सत्र रिपोर्ट ऑपरेटर कतारों की वास्तविक स्थिति है।"}
          </p>
        }
      />

      <div className="sheet stack" style={{ margin: "var(--s4) 0", ["--gap" as string]: "var(--s4)" }}>
        <h2>{isEn ? "Live Operator Consoles" : "कार्यशील ऑपरेटर कंसोल"}</h2>
        <p className="muted" style={{ fontSize: "var(--step-s)" }}>
          {isEn
            ? "Log in with demo PIN 1234 to inspect active file counts, overdue SLA queues, attendance status, and sanction batches."
            : "सक्रिय फ़ाइलों, SLA कतारों, और स्वीकृति बैचों को देखने के लिए PIN 1234 के साथ लॉगिन करें।"}
        </p>

        <div className="row" style={{ gap: "var(--s3)" }}>
          <Link className="btn btn-primary" href="/sansthan">
            {isEn ? "Institute Cell Login (/sansthan) →" : "संस्थान लॉगिन (/sansthan) →"}
          </Link>
          <Link className="btn btn-primary" href="/dwo">
            {isEn ? "District Welfare Login (/dwo) →" : "जिला कार्यालय लॉगिन (/dwo) →"}
          </Link>
        </div>
      </div>
    </Shell>
  );
}
