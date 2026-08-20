import Link from "next/link";
import { Callout, Money, StatusChip, type Tone } from "@/ui/bits";
import { fmtDate, fmtDays, fmtWeekday } from "@/lib/format";
import { STAGE_LABELS_HI } from "@/server/config/schemes";
import type { Stage } from "@/server/types";

type Owner = { nameHi: string; designationHi: string; orgHi: string; contactHint?: string } | null;

export const STAGE_TONE: Record<string, Tone> = {
  draft: "waiting",
  institute_review: "waiting",
  university_scrutiny: "waiting",
  dwo_review: "waiting",
  correction_required: "breach",
  returned_to_student: "breach",
  sanctioned: "verified",
  pfms_processing: "verified",
  payment_failed: "breach",
  paid: "paid",
  rejected: "breach",
  lapsed: "breach",
};

const CHAIN_BASE: Stage[] = [
  "draft",
  "institute_review",
  "university_scrutiny",
  "dwo_review",
  "sanctioned",
  "pfms_processing",
  "paid",
];

export function chainFor(hasUniversity: boolean): Stage[] {
  return CHAIN_BASE.filter((s) => (s === "university_scrutiny" ? hasUniversity : true));
}

export function OwnerCard({
  owner,
  dueAt,
  breachDays,
  waitingDays,
}: {
  owner: Owner;
  dueAt: string | null;
  breachDays: number;
  waitingDays: number;
}) {
  if (!owner) {
    return (
      <div className="sheet">
        <p className="eyebrow">फ़ाइल किसके पास है</p>
        <p className="muted">यह चरण पूरा हो चुका है — अब किसी के पास लंबित नहीं।</p>
      </div>
    );
  }
  return (
    <div className="sheet stack" style={{ ["--gap" as string]: "var(--s2)" }}>
      <p className="eyebrow">फ़ाइल किसके पास है</p>
      <p style={{ fontSize: "var(--step-1)", fontWeight: 600 }}>{owner.nameHi}</p>
      <p className="muted">
        {owner.designationHi} · {owner.orgHi}
      </p>
      {owner.contactHint ? <p className="faint">{owner.contactHint}</p> : null}
      <p className="tnum">
        {waitingDays > 0 ? `${fmtDays(waitingDays)} से इसी चरण पर` : "आज ही इस चरण पर आई"}
        {dueAt ? ` · समय सीमा ${fmtDate(dueAt)}` : ""}
        {breachDays > 0 ? ` · ${fmtDays(breachDays)} पार` : ""}
      </p>
    </div>
  );
}

export function StageLedger({
  stage,
  hasUniversity,
  stageEnteredAt,
  dueAt,
  breachDays,
  calendar,
  events,
}: {
  stage: Stage;
  hasUniversity: boolean;
  stageEnteredAt: string;
  dueAt: string | null;
  breachDays: number;
  calendar: { instituteForwardDeadline: string; dwoWindowEnd: string; disbursementFrom: string; disbursementTo: string };
  events: { at: string; type: string }[];
}) {
  const chain = chainFor(hasUniversity);
  const terminalIndex =
    stage === "paid"
      ? chain.length - 1
      : stage === "rejected" || stage === "lapsed"
        ? chain.length
        : chain.indexOf(stage);
  const entered = new Map<string, string>();
  for (const e of [...events].reverse()) {
    if (e.type === "locked") entered.set("institute_review", e.at);
    if (e.type === "institute_forwarded") entered.set("university_scrutiny", e.at);
    if (e.type === "university_verified" || e.type === "correction_submitted") entered.set("dwo_review", e.at);
    if (e.type === "entered_sanctioned") entered.set("sanctioned", e.at);
    if (e.type === "entered_pfms_processing") entered.set("pfms_processing", e.at);
    if (e.type === "entered_paid") entered.set("paid", e.at);
    if (e.type === "created") entered.set("draft", e.at);
  }

  const FUTURE_NOTE: Partial<Record<Stage, string>> = {
    institute_review: `संस्थान को ${fmtDate(calendar.instituteForwardDeadline)} तक अग्रसारित करना है`,
    dwo_review: `जिला सत्यापन विंडो ${fmtDate(calendar.dwoWindowEnd)} तक`,
    sanctioned: `भुगतान अवधि ${fmtDate(calendar.disbursementFrom)} – ${fmtDate(calendar.disbursementTo)}`,
    pfms_processing: "PFMS बैच में 3–7 कार्यदिवस",
    paid: "आधार से जुड़े खाते में",
  };

  return (
    <ol className="ledger">
      {chain.map((s, idx) => {
        const isCurrent = s === stage;
        const state = isCurrent ? (breachDays > 0 ? "breach" : "current") : idx < terminalIndex ? "done" : "future";
        const at = entered.get(s);
        return (
          <li key={s} data-state={state}>
            <p className="ledger-title">{STAGE_LABELS_HI[s]}</p>
            {isCurrent ? (
              <p className="muted tnum">
                {fmtDate(stageEnteredAt)} से{dueAt ? ` · समय सीमा ${fmtDate(dueAt)}` : ""}
                {breachDays > 0 ? ` · ${fmtDays(breachDays)} पार` : ""}
              </p>
            ) : at ? (
              <p className="muted tnum">{fmtDate(at)}</p>
            ) : (
              <p className="faint">{FUTURE_NOTE[s] ?? "आगे"}</p>
            )}
          </li>
        );
      })}
      {stage === "rejected" || stage === "lapsed" ? (
        <li data-state="breach">
          <p className="ledger-title">{STAGE_LABELS_HI[stage]}</p>
          <p className="muted tnum">{fmtDate(stageEnteredAt)}</p>
        </li>
      ) : null}
    </ol>
  );
}

export function AlertList({
  alerts,
  caseId,
}: {
  alerts: {
    id: string;
    kind: string;
    severity: "info" | "warn" | "danger";
    titleHi: string;
    detailHi: string;
    actionHi: string | null;
    actionHref: string | null;
    dueAt: string | null;
  }[];
  caseId: string;
}) {
  return (
    <div className="stack" style={{ ["--gap" as string]: "var(--s3)" }}>
      {alerts.map((a) => (
        <Callout
          key={a.id}
          tone={a.severity === "danger" ? "danger" : a.severity === "warn" ? "warn" : "info"}
          title={a.titleHi}
        >
          <p style={{ fontSize: "var(--step-s)" }}>{a.detailHi}</p>
          {a.dueAt && a.kind.startsWith("hardcopy") ? (
            <p className="tnum" style={{ fontSize: "var(--step-s)" }}>
              {fmtWeekday(a.dueAt)}
            </p>
          ) : null}
          {a.actionHi ? (
            <p style={{ marginTop: "var(--s2)", fontSize: "var(--step-s)" }}>
              <strong>करना है:</strong> {a.actionHi}
              {a.actionHref ? (
                <>
                  {" "}
                  <Link href={a.actionHref.replace("[caseId]", caseId)}>खोलें →</Link>
                </>
              ) : null}
            </p>
          ) : null}
        </Callout>
      ))}
    </div>
  );
}

export function CaseHead({
  stage,
  stageHi,
  waitingDays,
  estimate,
}: {
  stage: string;
  stageHi: string;
  waitingDays: number;
  estimate: { total: number; basisHi: string };
}) {
  return (
    <div className="stack" style={{ ["--gap" as string]: "var(--s3)" }}>
      <div className="row">
        <StatusChip tone={STAGE_TONE[stage] ?? "neutral"}>{stageHi}</StatusChip>
        <span className="faint tnum">{fmtDays(waitingDays)} से इसी चरण पर</span>
      </div>
      <div className="sheet">
        <Money amount={estimate.total} label="अनुमानित लाभ" basis={estimate.basisHi} />
      </div>
    </div>
  );
}

export function Timeline({
  events,
}: {
  events: { at: string; type: string; actor: { nameHi: string; role: string }; summaryHi: string }[];
}) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <caption className="eyebrow" style={{ textAlign: "left", padding: "var(--s3)" }}>
          फ़ाइल का इतिहास — क्या हुआ, कब, और किसने किया
        </caption>
        <thead>
          <tr>
            <th scope="col">तारीख़</th>
            <th scope="col">किसने</th>
            <th scope="col">क्या हुआ</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, i) => (
            <tr key={`${e.at}-${i}`}>
              <td className="tnum nowrap">{fmtDate(e.at)}</td>
              <td>
                {e.actor.nameHi}
                {e.actor.role === "treasury" || e.type === "auto_forwarded" || e.type === "escalated" ? (
                  <span className="faint"> · स्वचालित</span>
                ) : null}
              </td>
              <td>{e.summaryHi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
