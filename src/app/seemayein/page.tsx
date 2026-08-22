import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { getLang } from "@/lib/lang";

export default async function Seemayein() {
  const lang = await getLang();
  return (
    <Shell lang={lang}>
      <p className="eyebrow">सीमाएँ</p>
      <h1 style={{ marginTop: "var(--s3)" }}>क्या सॉफ़्टवेयर ठीक कर सकता है, और क्या नहीं</h1>
      <p className="measure muted" style={{ margin: "var(--s3) 0 var(--s5)" }}>
        मिलेगी intake, डेटा खोने, त्रुटि की भाषा, दृश्यता, स्वामित्व, SLA मापन, एस्केलेशन, पूर्व-जाँच,
        शुल्क सही होना, निर्देशित सुधार और शिकायत का मसौदा ठीक करती है। नीचे वह है जो वह जान-बूझकर
        दावा नहीं करती — और हर दावे का असली स्क्रीन लिंक।
      </p>

      <h2>जो प्लेटफ़ॉर्म ठीक कर सकता है</h2>
      <div className="tbl-wrap" style={{ marginTop: "var(--s3)" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">दर्द</th>
              <th scope="col">मिलेगी में कहाँ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>आठ अलग लॉगिन दरवाज़े</td>
              <td>
                <Link href="/pravesh">एक दरवाज़ा</Link> → <Link href="/raasta">तीन सवाल</Link>
              </td>
            </tr>
            <tr>
              <td>डुप्लिकेट OTR दोनों आवेदन ब्लॉक करता है</td>
              <td>
                <Link href="/otr">OTR पृष्ठ</Link> — वही पहचान वापस
              </td>
            </tr>
            <tr>
              <td>पात्रता की विफलता टाइपिंग के बाद</td>
              <td>
                <Link href="/raasta">तैयारी जाँच</Link> फ़ॉर्म से पहले
              </td>
            </tr>
            <tr>
              <td>502 पर फ़ॉर्म मिटना</td>
              <td>प्रति-कीस्ट्रोक स्थानीय ड्राफ़्ट + सेव इंडिकेटर</td>
            </tr>
            <tr>
              <td>कच्चा NPCI स्ट्रिंग</td>
              <td>
                मानव-पठनीय त्रुटि + केस फ़ाइल पर बैंक कदम (
                <Link href="/pravesh?mode=track">ट्रैक</Link>)
              </td>
            </tr>
            <tr>
              <td>छात्र शुल्क टाइप करता है</td>
              <td>
                मास्टर डेटा से पढ़ा शुल्क · <Link href="/sansthan/master">संस्थान पटल</Link>
              </td>
            </tr>
            <tr>
              <td>कोई मालिक, कोई घड़ी, कोई SMS नहीं</td>
              <td>
                <Link href="/f">केस फ़ाइल</Link> · आउटबॉक्स · स्वतः एस्केलेशन ·{" "}
                <Link href="/shikayat">शिकायत मसौदा</Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: "var(--s7)" }}>जो सॉफ़्टवेयर ठीक नहीं कर सकता</h2>
      <div className="tbl-wrap" style={{ marginTop: "var(--s3)" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">सॉफ़्टवेयर से नहीं</th>
              <th scope="col">मिलेगी का ईमानदार जवाब</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>अधिकारी/लिपिक की संख्या और थ्रूपुट</td>
              <td>प्रति चरण मापें, मालिक नामें, उल्लंघन पर ऊपर भेजें, उम्र बढ़ती कतार दिखाएँ</td>
            </tr>
            <tr>
              <td>बैंक में आधार-DBT सीडिंग</td>
              <td>आवेदन से पहले पकड़ें, शाखा फॉर्म का नाम बताएँ, फ़ाइल घड़ी के साथ खुली रखें</td>
            </tr>
            <tr>
              <td>कोषागार / बजट रिलीज़ का समय</td>
              <td>प्रकाशित भुगतान विंडो और फ़ाइल की स्थिति दिखाएँ — नकली ETA नहीं</td>
            </tr>
            <tr>
              <td>वैधानिक आय सीमा, 75% उपस्थिति, उत्तीर्ण अंक</td>
              <td>नियम स्रोत के साथ बताएँ, टाइपिंग से पहले जाँचें</td>
            </tr>
            <tr>
              <td>कॉलेज जो मास्टर डेटा प्रकाशित ही नहीं करता</td>
              <td>जल्दी रोकें, संस्थान का काम बताएँ, छात्र को कहने का वाक्य दें</td>
            </tr>
            <tr>
              <td>आउटेज के दौरान बीत गई समय सीमा</td>
              <td>आउटेज फ़ाइल पर दर्ज हो ताकि एस्केलेशन के पास सबूत हो</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: "var(--s7)" }}>क्या नकली है, क्या असली</h2>
      <div className="tbl-wrap" style={{ marginTop: "var(--s3)" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">क्षमता</th>
              <th scope="col">मिलेगी में</th>
              <th scope="col">वास्तविकता में</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>आधार e-KYC + OTP</td>
              <td>मॉक एडाप्टर, डेमो नंबर, स्क्रीन पर OTP</td>
              <td>UIDAI</td>
            </tr>
            <tr>
              <td>DigiLocker फोटो/जनसांख्यिकी</td>
              <td>मॉक एडाप्टर, बीज संपत्तियाँ</td>
              <td>DigiLocker</td>
            </tr>
            <tr>
              <td>आय / जाति प्रमाणपत्र</td>
              <td>मॉक e-District + असली 3-वर्ष अंकगणित</td>
              <td>e-District / e-Sathi</td>
            </tr>
            <tr>
              <td>बोर्ड रोल + नामांकन</td>
              <td>मॉक रजिस्ट्री, असली अमेल कोड</td>
              <td>बोर्ड / विश्वविद्यालय मास्टर डेटा</td>
            </tr>
            <tr>
              <td>NPCI DBT सीडिंग</td>
              <td>seeded / KYC-only / dormant</td>
              <td>NPCI मैपर</td>
            </tr>
            <tr>
              <td>PFMS भुगतान</td>
              <td>मॉक बैच, छह दस्तावेज़ी परिणाम</td>
              <td>PFMS</td>
            </tr>
            <tr>
              <td>SMS / WhatsApp</td>
              <td>आउटबॉक्स तालिका, UI में</td>
              <td>टेलीकॉम गेटवे</td>
            </tr>
            <tr>
              <td>संस्थान मास्टर डेटा</td>
              <td>असली संपादन योग्य कंसोल</td>
              <td>Saksham संस्थान लॉगिन</td>
            </tr>
            <tr>
              <td>विश्वविद्यालय जाँच</td>
              <td>SLA वाला अभिनेता, स्वतः आगे</td>
              <td>सम्बद्ध विश्वविद्यालय कंसोल</td>
            </tr>
            <tr>
              <td>स्टेज मशीन, SLA, एस्केलेशन, सुधार चक्र, शुल्क, फ़ॉर्म</td>
              <td>
                <strong>पूरी तरह लागू</strong>
              </td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="measure" style={{ marginTop: "var(--s6)", fontSize: "var(--step-s)" }}>
        पैमाने पर यही इंजन दूसरे राज्यों के लिए कॉन्फ़िग बन जाता है — SLA और एस्केलेशन संरचनात्मक बदलाव
        हैं; कैलेंडर, दरें और कारण कोड प्रति राज्य कॉन्फ़िग।{" "}
        <Link href="/mock">मॉक पैनल</Link> · <Link href="/madad">मदद</Link>
      </p>
    </Shell>
  );
}
