"use client";

import Link from "next/link";

import { t } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

const ITEMS: { hi: string; en: string }[] = [
  {
    hi: "नकली OTP, DigiLocker/OTR, e-District आय–जाति सत्यापन, NPCI, PFMS — कोई लाइव सरकारी सिस्टम नहीं",
    en: "Mock OTP, DigiLocker/OTR, e-District income–caste, NPCI, PFMS — no live government systems",
  },
  {
    hi: "बैंक खाता नंबर या IFSC कभी नहीं माँगते; असली पोर्टल भी अब आधार-DBT से भुगतान करता है (पासबुक फिर भी हार्ड कॉपी में लगती है)",
    en: "We never ask for account number or IFSC; the real portal now pays via Aadhaar DBT (the passbook is still in the hard-copy pile)",
  },
  {
    hi: "पूरा जर्नी सिर्फ़ दशमोत्तर Fresh + एक Renewal। कक्षा 9–12 और दूसरे राज्य का दरवाज़ा सवाल पूछता है और यहीं ईमानदारी से रुक जाता है",
    en: "Completable journeys are Dashmottar Fresh + one Renewal only. Class 9–12 and outside-state still get asked, then we stop honestly",
  },
  {
    hi: "दरवाज़ा तीन सवालों से तय करता है; असली पोर्टल पर पुराना रजिस्ट्रेशन नंबर हाई स्कूल रोल नंबर से निकाला जाता है। यहाँ तीन नकली छात्र हैं, कोई खोज नहीं",
    en: "The door decides from three answers; the real portal recovers last year's registration via high-school roll number. Here there are three synthetic students, no search",
  },
  {
    hi: "शुल्क कॉलेज मास्टर डेटा से आता है — छात्र टाइप नहीं करता। दिखाई गई रकम अनुमान है, स्वीकृत राशि नहीं",
    en: "Fee comes from college master data — the student does not type it. The amount on screen is an estimate, not a sanctioned amount",
  },
  {
    hi: "हार्ड कॉपी 3 दिन की घड़ी दिखती है; इस प्रोटोटाइप का हैपी पाथ डिजिटल अटेस्ट है",
    en: "The 3-day hard-copy clock is shown; this prototype's happy path is digital attest",
  },
  {
    hi: "सम्बद्ध विश्वविद्यालय असली चेन का हिस्सा है — यहाँ वह दिखता है पर अपने-आप आगे बढ़ जाता है, उसका कोई डैशबोर्ड नहीं बनाया",
    en: "The affiliating university is a real actor — shown here and auto-forwarded; there is no university dashboard",
  },
  {
    hi: "उपस्थिति अटेस्ट पर 80% मान ली जाती है; असली नियम 75% न्यूनतम है",
    en: "Attendance is assumed 80% on attest; the real rule is 75% minimum",
  },
  {
    hi: "लॉक के बाद बदलाव सिर्फ़ विभाग की संशोधन विंडो में — यह प्रोटोटाइप वह विंडो नहीं बनाता",
    en: "After lock, changes only in the department correction window — this prototype does not build that window",
  },
  {
    hi: "कोई भी व्यक्ति जिसके पास MLG- कोड है, वह केस खोल सकता है। डेमो के लिए जानबूझकर — इसमें असली डेटा नहीं है",
    en: "Anyone with an MLG- code can open that case. Deliberate for the demo — there is no real data here",
  },
  {
    hi: "Codex (ChatGPT Go) ने शेल और विज़ार्ड होस्ट लिखा; बाकी इनटेक UI, केस पेज, डोमेन लॉजिक और API Cursor में लिखे गए — Go कोटा Task 2 के बाद ख़त्म हो गया",
    en: "Codex (ChatGPT Go) wrote the shell and wizard host; remaining intake UI, case page, domain logic and API were written in Cursor — Go quota ended after Task 2",
  },
];

export default function LimitationsPage() {
  const lang = useLang();
  return (
    <main>
      <h1>{t(lang, "limits")}</h1>
      <dl className="limits">
        {ITEMS.map((item) => (
          <div key={item.hi}>
            <dt>{item.hi}</dt>
            <dd>{item.en}</dd>
          </div>
        ))}
      </dl>
      <p>
        <Link href="/">{t(lang, "homeLink")}</Link>
      </p>
    </main>
  );
}
