import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";
import { loadOwnCase } from "@/lib/loadCase.server";
import { Callout, Money, StatusChip } from "@/ui/bits";
import { DutyStrip } from "@/ui/DutyStrip";
import { OwnerStamp } from "@/ui/OwnerStamp";
import { StageLedger } from "@/ui/StageLedger";
import { fmtDate, fmtDays, fmtMoney, fmtWeekday } from "@/lib/format";
import { AlertList, STAGE_TONE, Timeline } from "./parts";
import { CaseActions } from "./CaseActions";

export default async function CaseFile({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ locked?: string }>;
}) {
  const { caseId } = await params;
  const { locked } = await searchParams;
  const lang = await getLang();
  const c = await loadOwnCase(caseId);

  const actions: ("nudge" | "retry-payment" | "resubmit")[] = [];
  if (c.breachDays > 0 && !["paid", "rejected", "lapsed"].includes(c.stage)) actions.push("nudge");
  if (c.stage === "payment_failed") actions.push("retry-payment");
  if (c.stage === "returned_to_student" || (c.stage === "correction_required" && c.correction?.usedAt))
    actions.push("resubmit");

  let dutyNavAction: { href: string; labelHi: string } | undefined;
  if (c.stage === "correction_required" && !c.correction?.usedAt) {
    dutyNavAction = { href: `/aavedan/${c.id}`, labelHi: "सुधार भरें" };
  } else if (c.stage === "returned_to_student") {
    dutyNavAction = { href: `/aavedan/${c.id}`, labelHi: "फ़ॉर्म सुधारें" };
  }

  const isPaid = c.stage === "paid";
  const tone = STAGE_TONE[c.stage] ?? "neutral";

  const isEn = lang === "en";

  return (
    <Shell lang={lang}>
      <DutyStrip
        stageHi={c.stageHi}
        tone={tone}
        ownerNameHi={c.owner ? c.owner.nameHi : null}
        dueAt={c.dueAt}
        action={dutyNavAction}
      />

      {locked ? (
        <Callout tone="ok" title={isEn ? "Application Locked Successfully / आवेदन सफलतापूर्वक लॉक हो गया" : "आवेदन सफलतापूर्वक लॉक हो गया"}>
          <p style={{ fontSize: "var(--step-s)" }}>
            {isEn
              ? `Submit final print, fee receipt & marksheets to college by ${fmtWeekday(c.hardCopy.dueAt)}.`
              : `अंतिम प्रिंट, शुल्क रसीद और मार्कशीट ${fmtWeekday(c.hardCopy.dueAt)} तक कॉलेज में जमा करें और पावती रसीद लें।`}
          </p>
        </Callout>
      ) : null}

      {/* Above-the-fold case card with 3 labelled IDs, Fresh/Renewal, Estimate, and Copyable links */}
      <div className="sheet stack" style={{ margin: "var(--s4) 0 var(--s5)", ["--gap" as string]: "var(--s4)" }}>
        <div className="row-between">
          <div className="stack" style={{ ["--gap" as string]: "4px" }}>
            <span className="eyebrow">
              {c.trackHi} · {c.cycle === "renewal" ? "Renewal Application" : "Fresh Application"}
            </span>
            <h1 style={{ fontSize: "var(--step-2)", fontWeight: 800 }}>
              {isEn ? "Scholarship Application File" : "आपकी छात्रवृत्ति फ़ाइल"}
            </h1>
          </div>
          <StatusChip tone={tone}>
            {c.stageHi}
          </StatusChip>
        </div>

        {/* Three Labelled IDs */}
        <div className="bento-grid bento-grid-3" style={{ gap: "var(--s3)" }}>
          <div className="sheet sheet-tight sheet-sunk stack" style={{ ["--gap" as string]: "2px" }}>
            <span className="faint" style={{ fontSize: "var(--step-s)", fontWeight: 600 }}>1. OTR (Lifetime ID)</span>
            <span className="mono tnum" style={{ fontSize: "var(--step-1)", fontWeight: 700 }}>{c.otr ?? "—"}</span>
          </div>
          <div className="sheet sheet-tight sheet-sunk stack" style={{ ["--gap" as string]: "2px" }}>
            <span className="faint" style={{ fontSize: "var(--step-s)", fontWeight: 600 }}>2. Session Reg No (15-Digit)</span>
            <span className="mono tnum" style={{ fontSize: "var(--step-1)", fontWeight: 700 }}>{c.registrationNo ?? "Pending"}</span>
          </div>
          <div className="sheet sheet-tight sheet-sunk stack" style={{ ["--gap" as string]: "2px" }}>
            <span className="faint" style={{ fontSize: "var(--step-s)", fontWeight: 600 }}>3. Application Case ID</span>
            <span className="mono tnum" style={{ fontSize: "var(--step-1)", fontWeight: 700 }}>{c.id}</span>
          </div>
        </div>

        {/* Estimate with basis */}
        <div className="row-between" style={{ borderTop: "1px solid var(--rule)", paddingTop: "var(--s3)" }}>
          <Money
            amount={c.estimate.total}
            label={isEn ? "Estimated Benefit (Tuition Reimbursement + Maintenance)" : "अनुमानित लाभ (शुल्क प्रतिपूर्ति + रखरखाव भत्ता)"}
            basis={c.estimate.basisHi}
          />
          <div className="row" style={{ gap: "var(--s2)" }}>
            <Link className="btn btn-sm btn-quiet" href={`/t/${c.id}`}>
              Share Track Link (/t/{c.id})
            </Link>
            {c.otr ? (
              <Link className="btn btn-sm btn-quiet" href={`/t/${c.otr}`}>
                Share OTR Link (/t/{c.otr})
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="split split-side" style={{ marginTop: "var(--s4)" }}>

        {/* Main Column */}
        <div className="stack" style={{ ["--gap" as string]: "var(--s5)" }}>
          {/* Mobile-first Owner Stamp & Money */}
          <div className="hide-desktop stack" style={{ ["--gap" as string]: "var(--s4)" }}>
            <OwnerStamp
              owner={c.owner}
              dueAt={c.dueAt}
              breachDays={c.breachDays}
              waitingDays={c.waitingDays}
            />

            <div className="sheet">
              {isPaid ? (
                <div className="stack" style={{ ["--gap" as string]: "var(--s2)" }}>
                  <div className="row-between">
                    <span className="stamp-kicker">भुगतान रसीद · DISBURSEMENT RECEIPT</span>
                    <StatusChip tone="paid" glyph="✓">जमा</StatusChip>
                  </div>
                  <Money
                    hero
                    amount={c.payment.amount ?? c.estimate.total}
                    label="खाते में भेजी गई छात्रवृत्ति"
                    basis={`${c.estimate.basisHi} · PFMS संदर्भ: ${c.payment.pfmsRef ?? "PFMS-2026-OK"}`}
                  />
                </div>
              ) : (
                <Money
                  amount={c.estimate.total}
                  label="अनुमानित लाभ (शुल्क प्रतिपूर्ति + रखरखाव भत्ता)"
                  basis={c.estimate.basisHi}
                />
              )}
            </div>
          </div>

          <AlertList alerts={c.alerts} caseId={c.id} />

          {actions.length > 0 ? <CaseActions caseId={c.id} actions={actions} /> : null}

          {c.escalations.length > 0 ? (
            <Callout tone="warn" title="स्वतः भेजे गए अनुरोध (Escalations)">
              <ul>
                {c.escalations.map((e, i) => (
                  <li key={i} className="tnum">
                    {fmtDate(e.at)} — {fmtDays(e.breachDays)} की देरी पर {e.to.nameHi} को
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: "var(--s2)", fontSize: "var(--step-s)" }}>
                प्रतीक्षा की गिनती इससे शून्य नहीं होती।{" "}
                <Link href={`/shikayat/${c.id}`}>शिकायत का मसौदा देखें →</Link>
              </p>
            </Callout>
          ) : null}

          {c.flags.length > 0 ? (
            <section className="stack">
              <h2>क्या ठीक करना है</h2>
              {c.correction ? (
                <p className="muted">
                  सुधार विंडो: {fmtDate(c.correction.openAt)} – {fmtDate(c.correction.closeAt)}
                  {c.correction.usedAt ? " · सुधार भरा जा चुका है" : ""}
                </p>
              ) : null}
              <div className="stack" style={{ ["--gap" as string]: "var(--s3)" }}>
                {c.flags.map((f, i) => (
                  <div
                    className="sheet stack"
                    key={`${f.code}-${i}`}
                    style={{
                      ["--gap" as string]: "var(--s2)",
                      borderLeft: "3px solid var(--breach)",
                    }}
                  >
                    <div className="row-between">
                      <strong>{f.reason?.hi ?? f.code}</strong>
                      <StatusChip tone={f.reason?.correctable ? "waiting" : "breach"}>
                        {f.reason?.correctable
                          ? "सुधार विंडो में ठीक होगा"
                          : "सुधार विंडो से ठीक नहीं होगा"}
                      </StatusChip>
                    </div>
                    <p style={{ fontSize: "var(--step-s)" }}>
                      <strong>करना है:</strong> {f.reason?.fixHi}
                    </p>
                    <p className="faint" style={{ fontSize: "var(--step-s)" }}>
                      ज़िम्मेदारी:{" "}
                      {f.reason?.fixedBy === "institute"
                        ? "कॉलेज"
                        : f.reason?.fixedBy === "bank"
                          ? "बैंक"
                          : f.reason?.fixedBy === "revenue_office"
                            ? "तहसील / ई-डिस्ट्रिक्ट"
                            : "आप"}
                      {f.note ? ` · टिप्पणी: ${f.note}` : ""}
                    </p>
                  </div>
                ))}
              </div>
              {c.correction && !c.correction.usedAt ? (
                <p>
                  <Link className="btn btn-primary" href={`/aavedan/${c.id}`}>
                    सुधार भरें
                  </Link>
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="stack">
            <h2>फ़ाइल कहाँ तक पहुँची · Stage Ledger</h2>
            <StageLedger
              stage={c.stage}
              hasUniversity={Boolean(c.affiliatedTo)}
              stageEnteredAt={c.stageEnteredAt}
              dueAt={c.dueAt}
              breachDays={c.breachDays}
              calendar={c.calendar}
              events={c.events}
            />
          </section>

          <section className="stack">
            <h2>पहचान और फ़ाइल ब्यौरा</h2>
            <dl className="sheet" style={{ margin: 0 }}>
              <div className="datarow">
                <dt>OTR (स्थायी पहचान)</dt>
                <dd className="mono">{c.otr ?? "—"}</dd>
              </div>
              <div className="datarow">
                <dt>सत्र पंजीकरण संख्या</dt>
                <dd className="mono tnum">{c.registrationNo ?? "—"}</dd>
              </div>
              <div className="datarow">
                <dt>संस्थान</dt>
                <dd>{c.instituteNameHi}</dd>
              </div>
              <div className="datarow">
                <dt>कोर्स</dt>
                <dd>{c.courseNameHi}</dd>
              </div>
              {c.affiliatedTo ? (
                <div className="datarow">
                  <dt>सम्बद्ध</dt>
                  <dd>{c.affiliatedTo}</dd>
                </div>
              ) : null}
              <div className="datarow">
                <dt>गैर-वापसी योग्य शुल्क</dt>
                <dd>{fmtMoney(c.fee.nonRefundable)}</dd>
              </div>
              <div className="datarow">
                <dt>उपस्थिति</dt>
                <dd>
                  {c.attendancePercent === null
                    ? "संस्थान ने दर्ज नहीं की"
                    : `${c.attendancePercent}%`}
                </dd>
              </div>
              <div className="datarow">
                <dt>हार्ड कॉपी</dt>
                <dd>
                  {c.hardCopy.receivedAt
                    ? `मिल गई · ${fmtDate(c.hardCopy.receivedAt)}`
                    : c.hardCopy.dueAt
                      ? `${fmtDate(c.hardCopy.dueAt)} तक जमा करनी है`
                      : "—"}
                </dd>
              </div>
              {c.payment.status ? (
                <div className="datarow">
                  <dt>भुगतान स्थिति</dt>
                  <dd>
                    {c.payment.amount ? fmtMoney(c.payment.amount) : "—"} · {c.payment.status}
                    {c.payment.pfmsRef ? ` · ${c.payment.pfmsRef}` : ""}
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="row" style={{ marginTop: "var(--s3)" }}>
              <Link className="btn btn-quiet" href={`/soochnaayein/${c.id}`}>
                भेजी गई सूचनाएँ
              </Link>
              <Link className="btn btn-quiet" href={`/shikayat/${c.id}`}>
                शिकायत का मसौदा
              </Link>
              <Link className="btn btn-quiet" href={`/t/${c.id}`}>
                साझा करने योग्य लिंक
              </Link>
            </p>
          </section>

          <section className="stack">
            <Timeline events={c.events} />
          </section>
        </div>

        {/* Side Column (Desktop) */}
        <aside className="stack hide-mobile" style={{ ["--gap" as string]: "var(--s4)" }}>
          <OwnerStamp
            owner={c.owner}
            dueAt={c.dueAt}
            breachDays={c.breachDays}
            waitingDays={c.waitingDays}
          />

          <div className="sheet">
            {isPaid ? (
              <div className="stack" style={{ ["--gap" as string]: "var(--s2)" }}>
                <div className="row-between">
                  <span className="stamp-kicker">भुगतान रसीद · DISBURSEMENT</span>
                  <StatusChip tone="paid" glyph="✓">जमा</StatusChip>
                </div>
                <Money
                  hero
                  amount={c.payment.amount ?? c.estimate.total}
                  label="खाते में भेजी गई छात्रवृत्ति"
                  basis={`${c.estimate.basisHi} · PFMS: ${c.payment.pfmsRef ?? "PFMS-2026-OK"}`}
                />
              </div>
            ) : (
              <Money
                amount={c.estimate.total}
                label="अनुमानित लाभ"
                basis={c.estimate.basisHi}
              />
            )}
          </div>
        </aside>
      </div>
    </Shell>
  );
}

