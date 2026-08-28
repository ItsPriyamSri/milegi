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

export { StageLedger, chainFor } from "@/ui/StageLedger";

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
