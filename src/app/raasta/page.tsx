import { Shell } from "@/ui/Shell";
import { getLang } from "@/lib/lang";
import { RouteWizard } from "./RouteWizard";

export default async function Raasta() {
  const lang = await getLang();
  return (
    <Shell lang={lang} narrow>
      <p className="eyebrow">आठ लॉगिन की जगह तीन सवाल</p>
      <h1 style={{ marginTop: "var(--s3)" }}>आप कौन-सा आवेदन हैं?</h1>
      <p className="measure muted" style={{ margin: "var(--s3) 0 var(--s5)" }}>
        असली पोर्टल पर यह फ़ैसला आपको खुद करना पड़ता है — और गलत दरवाज़े पर जवाब मिलता है
        &ldquo;No Record Found&rdquo;, जबकि रिकॉर्ड दूसरे डेटाबेस में मौजूद होता है। यहाँ कोई जवाब
        अंतिम मृत रास्ता नहीं है।
      </p>
      <RouteWizard />
    </Shell>
  );
}
