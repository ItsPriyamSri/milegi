import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";
import { OtrForm } from "./OtrForm";

export default async function OtrPage() {
  const lang = await getLang();
  const isEn = lang === "en";
  return (
    <Shell lang={lang} narrow hideFooter>
      <PageHead
        eyebrow="ONE-TIME REGISTRATION · एक बार की पहचान"
        title={isEn ? "Generate OTR Profile / OTR बनाएँ" : "OTR बनाएँ / Generate OTR"}
        meta={
          <p className="measure muted">
            {isEn
              ? "One-Time Registration binds your profile once. If you already have an OTR, your existing profile will be safely recovered instead of creating duplicates."
              : "असली पोर्टल पर यह एक अलग पॉपअप है, तीन टैब में बँटा हुआ। यहाँ यह उसी रास्ते का हिस्सा है — और अगर आपका OTR पहले से बना है, तो वही वापस मिल जाएगा।"}
          </p>
        }
      />
      <OtrForm />
    </Shell>
  );
}

