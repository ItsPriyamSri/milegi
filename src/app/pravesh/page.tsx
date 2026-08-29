import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";
import { OtpForm } from "./OtpForm";

export default async function Pravesh({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const lang = await getLang();
  const { mode } = await searchParams;
  const track = mode === "track";
  const isEn = lang === "en";

  return (
    <Shell lang={lang} narrow hideFooter>
      <PageHead
        eyebrow={track ? "FILE ACCESS · फ़ाइल देखें" : "ONE DOOR GATEWAY · एक दरवाज़ा"}
        title={
          track
            ? isEn ? "Track Your Scholarship File / फ़ाइल देखें" : "अपनी छात्रवृत्ति फ़ाइल देखें / Track File"
            : isEn ? "Start with Mobile OTP / मोबाइल से शुरू करें" : "मोबाइल से शुरू करें / Mobile Access"
        }
        meta={
          <p className="measure muted">
            {track
              ? isEn
                ? "Enter application reference code or login using your registered mobile number."
                : "आवेदन संख्या डालें, या मोबाइल OTP से लॉगिन करें।"
              : isEn
                ? "One door replaces eight separate portal logins. Three simple questions route your file automatically."
                : "असली पोर्टल पर आठ अलग लॉगिन हैं — पूर्वदशम, इंटर, दशमोत्तर और दूसरे राज्य। यहाँ एक ही रास्ता है; कौन-सा आवेदन बनेगा, वह तीन सवालों से तय होता है।"}
          </p>
        }
      />
      <OtpForm mode={track ? "track" : "apply"} />
      <p className="faint" style={{ marginTop: "var(--s5)", fontSize: "var(--step-s)" }}>
        {isEn ? "Operator login:" : "संस्थान या जिला कार्यालय हैं?"}{" "}
        <Link href="/sansthan">Institute Login / संस्थान लॉगिन</Link> ·{" "}
        <Link href="/dwo">District Office Login / जिला कार्यालय लॉगिन</Link>
      </p>
    </Shell>
  );
}

