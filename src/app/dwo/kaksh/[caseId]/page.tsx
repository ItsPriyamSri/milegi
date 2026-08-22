import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/ui/Shell";
import { getLang } from "@/lib/lang";
import { requireOperator } from "@/lib/operator.server";
import { caseView } from "@/server/cases";
import { crossCheck } from "@/server/dwo";
import { getCase } from "@/server/store";
import { reasonsRaisedBy } from "@/server/config/reasons";
import { Money, StatusChip } from "@/ui/bits";
import { fmtDate, fmtMoney } from "@/lib/format";
import { ReviewActions } from "./ReviewActions";

export default async function DwoFile({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const lang = await getLang();
  const session = await requireOperator("dwo");
  const raw = getCase(caseId);
  if (!raw || String(raw.form.districtCode ?? "") !== session.subjectId) {
    redirect("/dwo/kaksh");
  }
  const c = caseView(raw);
  const checks = c.stage === "dwo_review" ? crossCheck(raw) : [];
  const reasons = reasonsRaisedBy("dwo").map((r) => ({
    id: r.id,
    hi: r.hi,
    fixHi: r.fixHi,
    correctable: r.correctable,
    fixedBy: r.fixedBy,
  }));

  return (
    <Shell lang={lang} wide>
      <p className="eyebrow">
        <Link href="/dwo/kaksh">← कतार</Link> · {c.id}
        {c.registrationNo ? ` · पंजीकरण ${c.registrationNo}` : ""}
      </p>
      <div className="row-between" style={{ marginTop: "var(--s3)" }}>
        <h1>{c.studentNameHi}</h1>
        <StatusChip tone={c.breachDays > 0 ? "breach" : "waiting"}>
          {c.stageHi}
          {c.breachDays > 0 ? ` · ${c.breachDays} दिन पार` : ` · ${c.waitingDays} दिन`}
        </StatusChip>
      </div>

      <div className="split split-side" style={{ marginTop: "var(--s5)" }}>
        <div className="stack">
          <div className="sheet">
            <Money
              amount={c.estimate.total}
              label={`गैर-वापसी योग्य शुल्क ${fmtMoney(c.fee.nonRefundable)} · अनुमानित कुल`}
              basis={c.estimate.basisHi}
            />
          </div>

          <dl className="sheet" style={{ margin: 0 }}>
            <div className="datarow">
              <dt>संस्थान</dt>
              <dd>{c.instituteNameHi}</dd>
            </div>
            <div className="datarow">
              <dt>कोर्स</dt>
              <dd>{c.courseNameHi}</dd>
            </div>
            <div className="datarow">
              <dt>OTR</dt>
              <dd className="mono">{c.otr ?? "—"}</dd>
            </div>
            <div className="datarow">
              <dt>उपस्थिति</dt>
              <dd className="tnum">
                {c.attendancePercent === null ? "दर्ज नहीं" : `${c.attendancePercent}%`}
              </dd>
            </div>
            <div className="datarow">
              <dt>समय सीमा</dt>
              <dd className="tnum">{fmtDate(c.dueAt)}</dd>
            </div>
          </dl>

          {c.flags.length > 0 ? (
            <section className="stack">
              <h2>दर्ज आपत्तियाँ</h2>
              {c.flags.map((f, i) => (
                <div className="sheet" key={`${f.code}-${i}`}>
                  <strong>{f.reason?.hi ?? f.code}</strong>
                  <p className="muted" style={{ fontSize: "var(--step-s)" }}>
                    {f.reason?.fixHi}
                  </p>
                </div>
              ))}
            </section>
          ) : null}

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

        <ReviewActions
          caseId={c.id}
          canAct={c.stage === "dwo_review"}
          checks={checks}
          reasons={reasons}
        />
      </div>
    </Shell>
  );
}
