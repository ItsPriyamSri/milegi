import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { getLang } from "@/lib/lang";
import { loadOwnCase } from "@/lib/loadCase.server";
import { Callout } from "@/ui/bits";
import { grievanceDraft } from "@/server/grievance";
import { getCase, getProfile } from "@/server/store";
import { CopyDraft } from "./CopyDraft";

export default async function Shikayat({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const lang = await getLang();
  const c = await loadOwnCase(caseId);
  const raw = getCase(c.id)!;
  const profile = getProfile(raw.profileId)!;
  const draft = grievanceDraft(raw, {
    nameHi: profile.nameHi,
    otr: profile.otr,
    mobile: profile.mobile,
  });

  return (
    <Shell lang={lang} narrow>
      <p className="eyebrow">{c.id}</p>
      <h1 style={{ marginTop: "var(--s3)" }}>शिकायत का मसौदा</h1>
      <p className="measure muted" style={{ margin: "var(--s3) 0 var(--s4)" }}>
        एक दर्ज मामले (GOVUP/E/2026/0035742) में फ़ाइल तीन महीने एक ही चरण पर रुकी रही और तभी चली जब
        छात्र ने खुद जनसुनवाई पर शिकायत लिखी। वही चिट्ठी यहाँ अपने आप बन जाती है — तारीख़ें, ज़िम्मेदार
        और देरी सब फ़ाइल से।
      </p>
      <Callout tone="info" title="भेजना आपके हाथ में है">
        <p style={{ fontSize: "var(--step-s)" }}>
          यह प्रोटोटाइप आपकी ओर से कोई शिकायत दर्ज नहीं करता और किसी सरकारी प्रणाली से जुड़ा नहीं है।
          असली रास्ते: जनसुनवाई पोर्टल, जिला समाज कल्याण कार्यालय, और विभागीय हेल्पलाइन।
        </p>
      </Callout>

      <div className="sheet" style={{ marginTop: "var(--s5)" }}>
        <p className="eyebrow">विषय</p>
        <p style={{ marginBottom: "var(--s4)" }}>{draft.subjectHi}</p>
        <pre
          className="mono"
          style={{
            whiteSpace: "pre-wrap",
            fontSize: "var(--step-s)",
            background: "var(--surface-sunk)",
            padding: "var(--s3)",
            borderRadius: "var(--radius)",
            margin: 0,
          }}
        >
          {draft.bodyHi}
        </pre>
        <div style={{ marginTop: "var(--s4)" }}>
          <CopyDraft text={draft.bodyHi} caseId={c.id} />
        </div>
      </div>

      <details className="sheet" style={{ marginTop: "var(--s4)" }}>
        <summary>English copy (for the record)</summary>
        <pre className="mono" style={{ whiteSpace: "pre-wrap", fontSize: "var(--step-s)" }}>
          {draft.bodyEn}
        </pre>
      </details>

      <p style={{ marginTop: "var(--s5)" }}>
        <Link href={`/f/${c.id}`}>← फ़ाइल पर लौटें</Link>
      </p>
    </Shell>
  );
}
