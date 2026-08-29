import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";
import { OperatorLogin } from "@/ui/OperatorLogin";
import { OPERATOR_LOGINS } from "@/server/seeds";

export default async function DwoLogin() {
  const lang = await getLang();
  const isEn = lang === "en";
  const options = OPERATOR_LOGINS.filter((o) => o.role === "dwo");
  return (
    <Shell lang={lang} narrow>
      <PageHead
        eyebrow="DISTRICT WELFARE OFFICER · जिला समाज कल्याण"
        title={isEn ? "District Welfare Officer (DWO) Portal" : "जिला छात्रवृत्ति कक्ष"}
        meta={
          <p className="measure muted">
            {isEn
              ? "Cross-checks records against database rules, codes objections, and executes sanction batches. Demo PIN: 1234."
              : "यहाँ फ़ाइलें असली डेटाबेस से मिलाई जाती हैं। हर आपत्ति एक कोड है — छात्र को वही कारण और वही उपाय दिखता है।"}
          </p>
        }
      />
      <OperatorLogin role="dwo" next="/dwo/kaksh" options={options} />
    </Shell>
  );
}


