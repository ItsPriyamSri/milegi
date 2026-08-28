import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";
import { OperatorLogin } from "@/ui/OperatorLogin";
import { OPERATOR_LOGINS } from "@/server/seeds";

export default async function SansthanLogin() {
  const lang = await getLang();
  const options = OPERATOR_LOGINS.filter((o) => o.role === "institute");
  return (
    <Shell lang={lang} narrow>
      <PageHead
        eyebrow="संस्थान लॉगिन"
        title="छात्रवृत्ति प्रकोष्ठ"
        meta={
          <p className="measure muted">
            फ़ाइलें असल में यहीं रुकती हैं। यह पटल तीन काम आसान करता है: कागज़ मिलने का रिकॉर्ड, उपस्थिति,
            और एक क्लिक में अग्रसारण — साथ ही यह दिखाता है कि कौन-सी फ़ाइलें समय सीमा पार करने वाली हैं।
          </p>
        }
      />
      <OperatorLogin role="institute" next="/sansthan/kaksh" options={options} />
    </Shell>
  );
}

