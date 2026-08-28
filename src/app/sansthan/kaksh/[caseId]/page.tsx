import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";
import { requireOperator } from "@/lib/operator.server";
import { caseView } from "@/server/cases";
import { getCase } from "@/server/store";
import { reasonsRaisedBy } from "@/server/config/reasons";
import { Callout, Money, StatusChip } from "@/ui/bits";
import { fmtDate, fmtMoney } from "@/lib/format";
import { FIELDS } from "@/server/fields";
import { FileActions } from "./FileActions";

export default async function InstituteFile({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const lang = await getLang();
  const session = await requireOperator("institute");
  const raw = getCase(caseId);
  if (!raw || raw.instituteId !== session.subjectId) redirect("/sansthan/kaksh");
  const c = caseView(raw);
  const reasons = reasonsRaisedBy("institute").map((r) => ({
    id: r.id,
    hi: r.hi,
    fixHi: r.fixHi,
    correctable: r.correctable,
  }));

  return (
    <Shell lang={lang} wide>
      <PageHead
        eyebrow={`संस्थान प्रकोष्ठ · ${c.id}${c.registrationNo ? ` · पंजीकरण ${c.registrationNo}` : ""}`}
        title={c.studentNameHi}
        meta={
          <div className="row" style={{ gap: "var(--s3)", marginTop: "var(--s2)" }}>
            <Link className="btn btn-quiet btn-sm" href="/sansthan/kaksh">
              ← कतार पर लौटें
            </Link>
            <StatusChip tone={c.breachDays > 0 ? "breach" : "waiting"}>
              {c.stageHi}
              {c.breachDays > 0 ? ` · ${c.breachDays} दिन पार` : ` · ${c.waitingDays} दिन`}
            </StatusChip>
          </div>
        }
      />

      <div className="split split-side" style={{ marginTop: "var(--s5)" }}>
        <div className="stack">
          {c.fee.disputed ? (
            <Callout tone="warn" title="छात्र ने शुल्क आपत्ति दर्ज की है">
              <p>{c.fee.disputed.note}</p>
              <p className="faint" style={{ fontSize: "var(--step-s)" }}>
                मास्टर डेटा का शुल्क {fmtMoney(c.fee.nonRefundable)} है। रसीद मिलाकर मास्टर डेटा
                पृष्ठ से ठीक करें — छात्र इसे बदल नहीं सकता।
              </p>
            </Callout>
          ) : null}

          <div className="sheet">
            <Money
              amount={c.estimate.total}
              label={`गैर-वापसी योग्य शुल्क ${fmtMoney(c.fee.nonRefundable)} · अनुमानित कुल`}
              basis={c.estimate.basisHi}
            />
          </div>

          <section>
            <h2>छात्र का भरा हुआ विवरण</h2>
            <dl className="sheet" style={{ margin: "var(--s2) 0 0" }}>
              <div className="datarow">
                <dt>कोर्स</dt>
                <dd>{c.courseNameHi}</dd>
              </div>
              <div className="datarow">
                <dt>OTR</dt>
                <dd className="mono">{c.otr ?? "—"}</dd>
              </div>
              {Object.values(FIELDS)
                .filter((f) => !f.readOnly && f.section !== "declaration")
                .map((f) => {
                  const v = c.form[f.name];
                  if (v === undefined || v === null || v === "") return null;
                  return (
                    <div className="datarow" key={f.name}>
                      <dt>{f.labelHi}</dt>
                      <dd>
                        {v === true
                          ? "हाँ"
                          : f.options
                            ? (f.options.find((o) => o.value === String(v))?.hi ?? String(v))
                            : String(v)}
                      </dd>
                    </div>
                  );
                })}
            </dl>
          </section>

          <section>
            <h2>फ़ाइल का इतिहास</h2>
            <div className="tbl-wrap" style={{ marginTop: "var(--s2)" }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th scope="col">तारीख़</th>
                    <th scope="col">किसने</th>
                    <th scope="col">क्या हुआ</th>
                  </tr>
                </thead>
                <tbody>
                  {c.events.map((e, i) => (
                    <tr key={i}>
                      <td className="tnum nowrap">{fmtDate(e.at)}</td>
                      <td>{e.actor.nameHi}</td>
                      <td>{e.summaryHi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <FileActions
          caseId={c.id}
          hardCopyReceived={Boolean(c.hardCopy.receivedAt)}
          attendancePercent={c.attendancePercent}
          reasons={reasons}
          canForward={c.stage === "institute_review"}
        />
      </div>
    </Shell>
  );
}
