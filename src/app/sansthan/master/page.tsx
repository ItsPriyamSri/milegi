import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { getLang } from "@/lib/lang";
import { requireOperator } from "@/lib/operator.server";
import { getInstitute } from "@/server/store";
import { Callout } from "@/ui/bits";
import { MasterTable } from "./MasterTable";

export default async function Master() {
  const lang = await getLang();
  const session = await requireOperator("institute");
  const inst = getInstitute(session.subjectId)!;

  return (
    <Shell lang={lang} wide>
      <p className="eyebrow">
        <Link href="/sansthan/kaksh">← कतार</Link> · {inst.nameHi}
      </p>
      <h1 style={{ marginTop: "var(--s3)" }}>मास्टर डेटा — कोर्स और शुल्क</h1>
      <p className="measure muted" style={{ margin: "var(--s3) 0 var(--s5)" }}>
        छात्र की सबसे आम शिकायत — &ldquo;मेरा कोर्स सूची में नहीं है&rdquo; — असल में इसी पृष्ठ की बात
        है। जो कोर्स यहाँ प्रकाशित नहीं है, वह छात्र को दिखता ही नहीं, और छात्र उसे ठीक भी नहीं कर सकता।
      </p>
      <Callout tone="info" title="शुल्क छात्र नहीं भरता">
        <p style={{ fontSize: "var(--step-s)" }}>
          यहाँ दर्ज गैर-वापसी योग्य शुल्क सीधे आवेदन में जाता है। छात्रावास, मेस, कॉशन मनी, पुस्तकालय
          और परीक्षा शुल्क अलग दिखाए जाते हैं और छात्रवृत्ति में नहीं गिने जाते।
        </p>
      </Callout>
      <div style={{ marginTop: "var(--s5)" }}>
        <MasterTable
          courses={inst.courses.map((c) => ({
            code: c.code,
            nameHi: c.nameHi,
            tuition: c.feeHeads.tuition,
            published: Boolean(c.publishedAt),
            publishedAt: c.publishedAt,
            feeHeads: c.feeHeads as unknown as Record<string, number>,
          }))}
        />
      </div>
    </Shell>
  );
}
