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
  return (
    <Shell lang={lang} narrow>
      <PageHead
        eyebrow={track ? "फ़ाइल देखें" : "एक दरवाज़ा"}
        title={track ? "अपनी छात्रवृत्ति फ़ाइल देखें" : "मोबाइल से शुरू करें"}
        meta={
          <p className="measure muted">
            {track
              ? "आवेदन संख्या डालें, या मोबाइल OTP से लॉगिन करें।"
              : "असली पोर्टल पर आठ अलग लॉगिन हैं — पूर्वदशम, इंटर, दशमोत्तर और दूसरे राज्य, हर एक के नया और नवीनीकरण। यहाँ एक ही रास्ता है; कौन-सा आवेदन बनेगा, वह तीन सवालों से तय होता है।"}
          </p>
        }
      />
      <OtpForm mode={track ? "track" : "apply"} />
      <p className="faint" style={{ marginTop: "var(--s5)", fontSize: "var(--step-s)" }}>
        संस्थान या जिला कार्यालय हैं? <Link href="/sansthan">संस्थान लॉगिन</Link> ·{" "}
        <Link href="/dwo">जिला कार्यालय लॉगिन</Link>
      </p>
    </Shell>
  );
}

