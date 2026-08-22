import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { getLang } from "@/lib/lang";
import { STAGE_LABELS_HI, STAGE_LABELS_EN } from "@/server/config/schemes";

export default async function Madad() {
  const lang = await getLang();
  return (
    <Shell lang={lang} narrow>
      <p className="eyebrow">मदद</p>
      <h1 style={{ marginTop: "var(--s3)" }}>पाँच बातें जो छात्र सबसे ज़्यादा गलत समझते हैं</h1>
      <p className="measure muted" style={{ margin: "var(--s3) 0 var(--s5)" }}>
        संक्षिप्त जवाब — तीन पंक्तियों में। विस्तार के लिए संबंधित स्क्रीन पर जाएँ।
      </p>

      <div className="stack" style={{ ["--gap" as string]: "var(--s5)" }}>
        <section className="sheet stack">
          <h2>1. OTR और पंजीकरण संख्या अलग चीज़ें हैं</h2>
          <p>
            <strong>OTR</strong> जीवनभर की पहचान है — जैसे <span className="mono">UP26-8123456789</span>.
            एक बार बनता है, दोबारा नहीं।
          </p>
          <p>
            <strong>पंजीकरण संख्या</strong> सत्र की है — 15 अंक, लॉक पर बनती है। हर साल नई।
          </p>
          <p className="faint" style={{ fontSize: "var(--step-s)" }}>
            गलत दरवाज़े पर &ldquo;No Record Found&rdquo; अक्सर इसलिए आता है क्योंकि आपने एक को दूसरे की
            जगह डाला।
          </p>
        </section>

        <section className="sheet stack">
          <h2>2. दूसरा OTR कभी न बनाएँ</h2>
          <p>
            पिछला नंबर भूल गए तो नया OTR मत बनाइए — दोनों आवेदन ब्लॉक हो सकते हैं। हाई स्कूल रोल,
            पासिंग ईयर और पंजीकृत मोबाइल से पुराना OTR वापस मिलता है।
          </p>
          <p>
            मिलेगी में वही आधार दोबारा डालने पर पुरानी पहचान वापस आती है।{" "}
            <Link href="/otr">OTR पृष्ठ</Link>
          </p>
        </section>

        <section className="sheet stack">
          <h2>3. कौन-सा शुल्क गिना जाता है</h2>
          <p>
            केवल <strong>गैर-वापसी योग्य शुल्क</strong> (आमतौर पर ट्यूशन)। छात्रावास, मेस, कॉशन मनी,
            पुस्तकालय और परीक्षा शुल्क छात्रवृत्ति में नहीं आते — यहाँ वे काटे हुए दिखते हैं।
          </p>
          <p>
            राशि कॉलेज मास्टर डेटा से आती है; छात्र टाइप नहीं करता। रसीद मेल न खाए तो आपत्ति दर्ज करें।
          </p>
        </section>

        <section className="sheet stack">
          <h2>4. आय प्रमाणपत्र की 3 साल की वैधता</h2>
          <p>
            जारी तारीख़ से ठीक तीन साल। मिलेगी इसे <em>आज</em> से नहीं, <em>भुगतान विंडो</em> से मिलाती
            है — दिसंबर में भुगतान है और प्रमाणपत्र नवंबर में खत्म हो रहा हो तो अभी ब्लॉक।
          </p>
          <p className="faint" style={{ fontSize: "var(--step-s)" }}>
            नया प्रमाणपत्र ई-डिस्ट्रिक्ट से — आम तौर पर 7–15 दिन।
          </p>
        </section>

        <section className="sheet stack">
          <h2>5. स्थिति शब्द का मतलब</h2>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">चरण</th>
                  <th scope="col">क्या करें</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(STAGE_LABELS_HI) as (keyof typeof STAGE_LABELS_HI)[]).map((s) => (
                  <tr key={s}>
                    <td>
                      {STAGE_LABELS_HI[s]}
                      <span className="faint" style={{ display: "block", fontSize: "var(--step-s)" }}>
                        {STAGE_LABELS_EN[s]}
                      </span>
                    </td>
                    <td style={{ fontSize: "var(--step-s)" }}>
                      {s === "draft"
                        ? "फ़ॉर्म पूरा करके लॉक करें"
                        : s === "institute_review"
                          ? "हार्ड कॉपी जमा करें; कॉलेज की प्रतीक्षा"
                          : s === "correction_required"
                            ? "सुधार विंडो में चिह्नित खाने भरें"
                            : s === "payment_failed"
                              ? "बैंक में DBT सीडिंग / खाता ठीक करें, फिर दोबारा भेजें"
                              : s === "paid"
                                ? "खाते में 3–7 कार्यदिवस में दिख सकता है"
                                : "फ़ाइल देखें — मालिक और समय सीमा वहीं हैं"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <p style={{ marginTop: "var(--s6)" }}>
        <Link href="/seemayein">सीमाएँ पढ़ें →</Link>
      </p>
    </Shell>
  );
}
