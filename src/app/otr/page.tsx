import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";
import { OtrForm } from "./OtrForm";

export default async function OtrPage() {
  const lang = await getLang();
  return (
    <Shell lang={lang} narrow>
      <PageHead
        eyebrow="एक बार की पहचान"
        title="OTR बनाएँ"
        meta={
          <p className="measure muted">
            असली पोर्टल पर यह एक अलग पॉपअप है, तीन टैब में बँटा हुआ, और उसके बाद अलग पंजीकरण पृष्ठ है।
            यहाँ यह उसी रास्ते का हिस्सा है — और अगर आपका OTR पहले से बना है, तो नया बनाने की जगह वही
            वापस मिल जाएगा।
          </p>
        }
      />
      <OtrForm />
    </Shell>
  );
}

