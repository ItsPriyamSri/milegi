import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { getLang } from "@/lib/lang";
import { Callout } from "@/ui/bits";
import { SimPanel } from "./SimPanel";

export default async function MockPage() {
  const lang = await getLang();
  return (
    <Shell lang={lang} wide>
      <p className="eyebrow">मॉक प्रणाली पैनल</p>
      <h1 style={{ marginTop: "var(--s3)" }}>हर सरकारी एकीकरण यहाँ नकली है</h1>
      <p className="measure muted" style={{ margin: "var(--s3) 0 var(--s4)" }}>
        e-KYC, DigiLocker, e-District, बोर्ड/विश्वविद्यालय, NPCI और PFMS — सब सिम्युलेटर हैं। यह पैनल
        इसलिए मौजूद है कि जज और डेमो में आउटेज, देरी और भुगतान विफलता दिखाई जा सकें, छिपाई नहीं। सीमाएँ:{" "}
        <Link href="/seemayein">/seemayein</Link>.
      </p>
      <Callout tone="warn" title="असली पोर्टल चुपचाप गिरता है">
        <p style={{ fontSize: "var(--step-s)" }}>
          यहाँ जब कोई प्रणाली बंद होती है, हर पृष्ठ पर एक पंक्ति दिखती है। असली Saksham पर वही चुप्पी
          महीनों की अस्वीकृति बन जाती है।
        </p>
      </Callout>
      <div style={{ marginTop: "var(--s5)" }}>
        <SimPanel />
      </div>
    </Shell>
  );
}
