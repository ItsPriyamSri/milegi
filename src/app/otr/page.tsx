import { Shell } from "@/ui/Shell";
import { getLang } from "@/lib/lang";
import { OtrForm } from "./OtrForm";

export default async function OtrPage() {
  const lang = await getLang();
  return (
    <Shell lang={lang} narrow>
      <p className="eyebrow">एक बार की पहचान</p>
      <h1 style={{ marginTop: "var(--s3)" }}>OTR बनाएँ</h1>
      <p className="measure muted" style={{ margin: "var(--s3) 0 var(--s5)" }}>
        असली पोर्टल पर यह एक अलग पॉपअप है, तीन टैब में बँटा हुआ, और उसके बाद अलग पंजीकरण पृष्ठ है।
        यहाँ यह उसी रास्ते का हिस्सा है — और अगर आपका OTR पहले से बना है, तो नया बनाने की जगह वही
        वापस मिल जाएगा।
      </p>
      <OtrForm />
    </Shell>
  );
}
