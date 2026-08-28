import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";
import { RouteWizard } from "./RouteWizard";

export default async function Raasta() {
  const lang = await getLang();
  return (
    <Shell lang={lang} narrow>
      <PageHead
        eyebrow="आठ लॉगिन की जगह तीन सवाल"
        title="आप कौन-सा आवेदन हैं?"
        meta={
          <p className="measure muted">
            असली पोर्टल पर यह फ़ैसला आपको खुद करना पड़ता है — और गलत दरवाज़े पर जवाब मिलता है
            &ldquo;No Record Found&rdquo;, जबकि रिकॉर्ड दूसरे डेटाबेस में मौजूद होता है। यहाँ कोई जवाब
            अंतिम मृत रास्ता नहीं है।
          </p>
        }
      />
      <RouteWizard />
    </Shell>
  );
}

