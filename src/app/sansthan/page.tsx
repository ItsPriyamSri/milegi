import { Shell } from "@/ui/Shell";
import { getLang } from "@/lib/lang";
import { OperatorLogin } from "@/ui/OperatorLogin";
import { OPERATOR_LOGINS } from "@/server/seeds";

export default async function SansthanLogin() {
  const lang = await getLang();
  const options = OPERATOR_LOGINS.filter((o) => o.role === "institute");
  return (
    <Shell lang={lang} narrow>
      <p className="eyebrow">संस्थान लॉगिन</p>
      <h1 style={{ marginTop: "var(--s3)" }}>छात्रवृत्ति प्रकोष्ठ</h1>
      <p className="measure muted" style={{ margin: "var(--s3) 0 var(--s5)" }}>
        फ़ाइलें असल में यहीं रुकती हैं। यह पटल तीन काम आसान करता है: कागज़ मिलने का रिकॉर्ड, उपस्थिति,
        और एक क्लिक में अग्रसारण — साथ ही यह दिखाता है कि कौन-सी फ़ाइलें समय सीमा पार करने वाली हैं।
      </p>
      <OperatorLogin role="institute" next="/sansthan/kaksh" options={options} />
    </Shell>
  );
}
