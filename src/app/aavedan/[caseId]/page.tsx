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

  const isEn = lang === "en";

  return (
    <Shell lang={lang} narrow hideFooter>
      <PageHead
        eyebrow={`UNIFIED FORM · ${c.trackHi} · ${c.id}`}
        title={isEn ? "Single Page Application Form / एक फ़ॉर्म, एक पेज" : "एक फ़ॉर्म, एक पेज / Application Form"}
        meta={
          <p className="measure muted">
            {prefilled
              ? isEn
                ? "Previous year data has been pre-filled. Only result, marks, and current fee need updating for renewals."
                : "पिछले वर्ष की जानकारी भर दी गई है। नवीनीकरण में असल में तीन ही चीज़ें बदलती हैं — परिणाम, अंक और इस वर्ष का शुल्क।"
              : isEn
                ? "All inputs live on this single page. Every keystroke is saved locally first, then synced seamlessly."
                : "हर खाना यहीं भरा जाता है, कोई अलग डैशबोर्ड नहीं। जो कुछ भी टाइप करते हैं वह हर कीस्ट्रोक पर सहेजा जाता है।"}
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
          {
            label: isEn ? "Name" : "नाम",
            value: isEn ? (c.studentNameEn ?? c.studentNameHi) : c.studentNameHi,
            provenance: isEn ? "From Aadhaar" : "आधार से",
          },
          { label: "OTR", value: c.otr ?? "—", provenance: isEn ? "Lifetime ID" : "जीवनभर" },
          { label: isEn ? "Category" : "वर्ग", value: String(c.categoryHi ?? "—"), provenance: isEn ? "Certificate" : "प्रमाणपत्र" },
          {
            label: isEn ? "District" : "जिला",
            value: isEn ? (c.districtEn ?? c.districtHi) : c.districtHi,
            provenance: isEn ? "From institute" : "संस्थान से",
          },
          {
            label: isEn ? "Institute" : "संस्थान",
            value: isEn ? (c.instituteNameEn ?? c.instituteNameHi) : c.instituteNameHi,
            provenance: isEn ? "Master data" : "मास्टर डेटा",
          },
          {
            label: isEn ? "Course" : "कोर्स",
            value: isEn ? (c.courseNameEn ?? c.courseNameHi) : c.courseNameHi,
            provenance: isEn ? "Master data" : "मास्टर डेटा",
          },
        ]}
        fee={{
          nonRefundable: c.fee.nonRefundable,
          excluded: c.excludedHeads,
          disputed: c.fee.disputed ?? null,
          courseNameHi: c.courseNameHi,
          instituteNameHi: c.instituteNameHi,
        }}
        estimate={{
          total: c.estimate.total,
          basisHi: isEn ? (c.estimate.basisEn ?? c.estimate.basisHi) : c.estimate.basisHi,
        }}
        lang={lang}
        deadline={c.dueAt}
      />
    </Shell>
  );
}
