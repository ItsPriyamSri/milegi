import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";
import { OperatorLogin } from "@/ui/OperatorLogin";
import { OPERATOR_LOGINS } from "@/server/seeds";

export default async function DwoLogin() {
  const lang = await getLang();
  const options = OPERATOR_LOGINS.filter((o) => o.role === "dwo");
  return (
    <Shell lang={lang} narrow>
      <PageHead
        eyebrow="जिला समाज कल्याण कार्यालय"
        title="जिला छात्रवृत्ति कक्ष"
        meta={
          <p className="measure muted">
            यहाँ फ़ाइलें असली डेटाबेस से मिलाई जाती हैं। हर आपत्ति एक कोड है — छात्र को वही कारण और वही
            उपाय दिखता है। स्वीकृति बैच में सिर्फ़ सत्यापित फ़ाइलें जाती हैं।
          </p>
        }
      />
      <OperatorLogin role="dwo" next="/dwo/kaksh" options={options} />
    </Shell>
  );
}

