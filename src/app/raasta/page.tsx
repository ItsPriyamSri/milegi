import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";
import { RouteWizard } from "./RouteWizard";

export default async function Raasta() {
  const lang = await getLang();
  const isEn = lang === "en";
  return (
    <Shell lang={lang} narrow hideFooter>
      <PageHead
        eyebrow="SMART ROUTER · आठ लॉगिन की जगह तीन सवाल"
        title={isEn ? "Which Application Track Are You? / आप कौन-सा आवेदन हैं?" : "आप कौन-सा आवेदन हैं? / Track Selection"}
        meta={
          <p className="measure muted">
            {isEn
              ? "Three plain questions decide your exact scholarship track. No dead-ends or 'No Record Found' surprises."
              : "असली पोर्टल पर यह फ़ैसला आपको खुद करना पड़ता है — और गलत दरवाज़े पर जवाब मिलता है 'No Record Found'। यहाँ कोई जवाब अंतिम मृत रास्ता नहीं है।"}
          </p>
        }
      />
      <RouteWizard />
    </Shell>
  );
}

