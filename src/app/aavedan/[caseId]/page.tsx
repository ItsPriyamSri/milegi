import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";
import { loadOwnCase } from "@/lib/loadCase.server";
import { CORRECTABLE_FIELDS } from "@/server/patch";
import { FormShell } from "./FormShell";

export default async function Aavedan({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const lang = await getLang();
  const c = await loadOwnCase(caseId);
  const prefilled = c.events.some((e) => e.type === "prefilled_from_last_year");

  return (
    <Shell lang={lang} narrow>
      <PageHead
        eyebrow={`${c.trackHi} · ${c.cycleHi} · ${c.id}`}
        title="एक फ़ॉर्म, एक पेज"
        meta={
          <p className="measure muted">
            {prefilled
              ? "पिछले वर्ष की जानकारी भर दी गई है। नवीनीकरण में असल में तीन ही चीज़ें बदलती हैं — परिणाम, अंक और इस वर्ष का शुल्क।"
              : "हर खाना यहीं भरा जाता है, कोई अलग डैशबोर्ड नहीं। जो कुछ भी टाइप करते हैं वह हर कीस्ट्रोक पर इस फ़ोन पर सेव होता है, फिर सर्वर पर।"}
          </p>
        }
      />
      <FormShell
        caseId={c.id}
        track={c.track}
        cycle={c.cycle}
        stage={c.stage}
        initial={c.form}
        provenance={{}}
        correctionFields={(c.flags ?? []).flatMap((f) => CORRECTABLE_FIELDS[f.code] ?? [])}
        identityRows={[
          { label: "नाम", value: c.studentNameHi, provenance: "आधार से" },
          { label: "OTR", value: c.otr ?? "—", provenance: "जीवनभर" },
          { label: "वर्ग", value: String(c.categoryHi ?? "—"), provenance: "प्रमाणपत्र" },
          { label: "जिला", value: c.districtHi, provenance: "संस्थान से" },
          { label: "संस्थान", value: c.instituteNameHi, provenance: "मास्टर डेटा" },
          { label: "कोर्स", value: c.courseNameHi, provenance: "मास्टर डेटा" },
        ]}
        fee={{
          nonRefundable: c.fee.nonRefundable,
          excluded: c.excludedHeads,
          disputed: c.fee.disputed ?? null,
          courseNameHi: c.courseNameHi,
          instituteNameHi: c.instituteNameHi,
        }}
        estimate={{ total: c.estimate.total, basisHi: c.estimate.basisHi }}
        deadline={c.dueAt}
      />
    </Shell>
  );
}
