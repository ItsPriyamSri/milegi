import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";
import { OperatorLogin } from "@/ui/OperatorLogin";
import { OPERATOR_LOGINS } from "@/server/seeds";

export default async function SansthanLogin() {
  const lang = await getLang();
  const isEn = lang === "en";
  const options = OPERATOR_LOGINS.filter((o) => o.role === "institute");
  return (
    <Shell lang={lang} narrow>
      <PageHead
        eyebrow="INSTITUTE OPERATOR CELL · संस्थान लॉगिन"
        title={isEn ? "Institute Scholarship Cell Login" : "संस्थान छात्रवृत्ति कक्ष"}
        meta={
          <p className="measure muted">
            {isEn
              ? "Colleges process hard copies, attendance verification (75%+), and file forwarding here. Demo PIN: 1234."
              : "फ़ाइलें असल में यहीं रुकती हैं। यह पटल तीन काम आसान करता है: कागज़ मिलने का रिकॉर्ड, उपस्थिति, और एक क्लिक में अग्रसारण।"}
          </p>
        }
      />
      <OperatorLogin role="institute" next="/sansthan/kaksh" options={options} />
    </Shell>
  );
}


