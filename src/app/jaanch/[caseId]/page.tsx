import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { getLang } from "@/lib/lang";
import { loadOwnCase } from "@/lib/loadCase.server";
import { Callout, Money, StatusChip } from "@/ui/bits";
import { fmtDate, fmtMoney, fmtWeekday } from "@/lib/format";
import { FIELDS, validateAll } from "@/server/fields";
import { SCHEMES, type SectionId } from "@/server/config/schemes";
import { getCase } from "@/server/store";
import { LockPanel } from "./LockPanel";

const SECTION_TITLES: Record<SectionId, string> = {
  identity: "पहचान",
  education: "शिक्षा",
  previous_result: "पिछला परिणाम",
  family_docs: "परिवार और प्रमाणपत्र",
  fee: "शुल्क",
  declaration: "घोषणा",
};

export default async function Jaanch({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const lang = await getLang();
  const c = await loadOwnCase(caseId);
  const raw = getCase(c.id)!;
  const problems = validateAll(raw);
  const blockers = c.preflight.filter((i) => i.state === "blocked");
  const sections = SCHEMES[c.track].sections.filter((s) => s !== "identity" && s !== "fee");
  const threeDaysOut = new Date(Date.now() + 3 * 86400000).toISOString();

  return (
    <Shell lang={lang} narrow>
      <p className="eyebrow">
        {c.trackHi} · {c.cycleHi} · {c.id}
      </p>
      <h1 style={{ marginTop: "var(--s3)" }}>जाँच और लॉक</h1>

      <div className="stack" style={{ ["--gap" as string]: "var(--s5)", marginTop: "var(--s5)" }}>
        {problems.length > 0 ? (
          <Callout tone="danger" title={`${problems.length} जानकारी अभी बाकी है`}>
            <ul>
              {problems.map((p) => (
                <li key={p.field}>
                  <a href={`/aavedan/${c.id}#field-${p.field}`}>{p.messageHi}</a>
                </li>
              ))}
            </ul>
          </Callout>
        ) : null}

        {blockers.length > 0 ? (
          <Callout tone="danger" title="तैयारी जाँच में रुकावट है">
            <ul>
              {blockers.map((b) => (
                <li key={b.id}>
                  {b.titleHi} — {b.actionHi}
                </li>
              ))}
            </ul>
            <p style={{ marginTop: "var(--s2)" }}>
              <Link href={`/taiyari/${c.id}`}>तैयारी जाँच खोलें</Link>
            </p>
          </Callout>
        ) : null}

        {sections.map((section) => (
          <section key={section}>
            <div className="row-between">
              <h2>{SECTION_TITLES[section]}</h2>
              <Link className="btn btn-quiet" href={`/aavedan/${c.id}#sec-${section}`}>
                बदलें
              </Link>
            </div>
            <dl className="sheet" style={{ margin: "var(--s2) 0 0" }}>
              {Object.values(FIELDS)
                .filter((f) => f.section === section && !f.readOnly)
                .map((f) => {
                  const v = c.form[f.name];
                  return (
                    <div className="datarow" key={f.name}>
                      <dt>{f.labelHi}</dt>
                      <dd>
                        {v === true
                          ? "हाँ"
                          : v === false || v === undefined || v === null || v === ""
                            ? "—"
                            : f.options
                              ? (f.options.find((o) => o.value === String(v))?.hi ?? String(v))
                              : String(v)}
                      </dd>
                    </div>
                  );
                })}
            </dl>
          </section>
        ))}

        <section>
          <h2>{SECTION_TITLES.fee}</h2>
          <div className="sheet stack" style={{ marginTop: "var(--s2)" }}>
            <Money
              amount={c.estimate.total}
              label={`गैर-वापसी योग्य शुल्क ${fmtMoney(c.fee.nonRefundable)} · अनुमानित कुल लाभ`}
              basis={c.estimate.basisHi}
            />
          </div>
        </section>

        <section className="sheet stack">
          <h2>लॉक करने का मतलब</h2>
          <ul className="stack" style={{ ["--gap" as string]: "var(--s2)", paddingLeft: "var(--s5)" }}>
            <li>
              लॉक के बाद ऑनलाइन बदलाव सिर्फ़ विभाग की सुधार विंडो में होता है — इस वर्ग के लिए{" "}
              <strong>
                {fmtDate(c.calendar.correctionOpen)} से {fmtDate(c.calendar.correctionClose)}
              </strong>{" "}
              तक।
            </li>
            <li>
              अंतिम प्रिंट, शुल्क रसीद और मार्कशीट <strong>3 दिन</strong> में कॉलेज में जमा करनी होंगी —
              यानी लगभग <strong>{fmtWeekday(threeDaysOut)}</strong> तक।
            </li>
            <li>
              संस्थान को <strong>{fmtDate(c.calendar.instituteForwardDeadline)}</strong> तक अग्रसारित
              करना है। यह तारीख़ बीत जाए तो असली प्रणाली में फ़ॉर्म स्वतः निरस्त हो जाता है — इसीलिए यहाँ
              हर चरण पर घड़ी दिखती है।
            </li>
            <li>
              भुगतान अवधि: {fmtDate(c.calendar.disbursementFrom)} – {fmtDate(c.calendar.disbursementTo)}.
            </li>
          </ul>
          <p className="faint" style={{ fontSize: "var(--step-s)" }}>
            स्रोत: {c.calendar.source} (विश्वसनीयता: {c.calendar.confidence})
          </p>
        </section>

        {c.stage === "draft" || c.stage === "returned_to_student" ? (
          <LockPanel caseId={c.id} />
        ) : (
          <Callout tone="info" title="यह आवेदन पहले ही लॉक हो चुका है">
            <p className="row" style={{ marginTop: "var(--s2)" }}>
              <StatusChip tone="waiting">{c.stageHi}</StatusChip>
              <Link href={`/f/${c.id}`}>फ़ाइल की स्थिति देखें</Link>
            </p>
          </Callout>
        )}
      </div>
    </Shell>
  );
}
