import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";
import { loadOwnCase } from "@/lib/loadCase.server";
import { notificationsFor } from "@/server/store";
import { fmtDate } from "@/lib/format";

export default async function Outbox({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const lang = await getLang();
  const c = await loadOwnCase(caseId);
  const list = notificationsFor(c.id).reverse();

  return (
    <Shell lang={lang} narrow>
      <PageHead
        eyebrow={`आउटबॉक्स · ${c.id}`}
        title="भेजी गई सूचनाएँ"
        meta={
          <p className="measure muted">
            असली पोर्टल किसी भी चरण पर SMS नहीं भेजता — फ़ाइल रुकी है या नहीं, यह छात्र को खुद लॉगिन करके
            देखना पड़ता है। यहाँ हर सूचना दर्ज होती है, और यह सूची ही सबूत है।
          </p>
        }
      />

      {list.length === 0 ? (
        <p className="sheet muted">अभी कोई सूचना दर्ज नहीं हुई।</p>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">तारीख़</th>
                <th scope="col">माध्यम</th>
                <th scope="col">संदेश</th>
              </tr>
            </thead>
            <tbody>
              {list.map((n) => (
                <tr key={n.id}>
                  <td className="tnum nowrap">{fmtDate(n.createdAt)}</td>
                  <td className="nowrap">{n.channel === "sms" ? "SMS (नकली)" : "WhatsApp (नकली)"}</td>
                  <td>{n.textHi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: "var(--s5)" }}>
        <Link href={`/f/${c.id}`}>← फ़ाइल पर लौटें</Link>
      </p>
    </Shell>
  );
}
