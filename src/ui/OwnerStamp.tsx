import type { JSX } from "react";
import { fmtWeekday, fmtDays } from "@/lib/format";

export function OwnerStamp(props: {
  owner: { nameHi: string; designationHi: string; orgHi: string; contactHint?: string } | null;
  dueAt: string | null;
  breachDays: number;
  waitingDays: number;
}): JSX.Element {
  if (!props.owner) {
    return (
      <div className="stamp sheet">
        <div className="stamp-kicker eyebrow">File Status · स्थिति</div>
        <div className="stamp-name" style={{ fontSize: "var(--step-1)", fontWeight: 700, color: "var(--ink)", marginTop: "var(--s1)" }}>
          Process Completed / No Pending Action
        </div>
      </div>
    );
  }
  return (
    <div className="stamp sheet stack" style={{ ["--gap" as string]: "var(--s2)" }}>
      <div className="row-between">
        <div className="stamp-kicker eyebrow">Assigned Officer · ज़िम्मेदार अधिकारी</div>
        {props.breachDays > 0 ? (
          <span className="chip" data-tone="breach">
            ▲ Overdue by {fmtDays(props.breachDays, "en")}
          </span>
        ) : props.waitingDays > 0 ? (
          <span className="faint" style={{ fontSize: "var(--step-s)" }}>
            At this stage for {fmtDays(props.waitingDays, "en")}
          </span>
        ) : null}
      </div>
      <div className="stamp-name" style={{ fontSize: "var(--step-2)", fontWeight: 800, color: "var(--ink)" }}>
        {props.owner.nameHi}
      </div>
      <div className="stamp-meta muted" style={{ fontSize: "var(--step-s)" }}>
        {props.owner.designationHi} · {props.owner.orgHi}
      </div>
      {props.owner.contactHint ? (
        <div className="stamp-meta faint" style={{ fontSize: "var(--step-s)" }}>{props.owner.contactHint}</div>
      ) : null}
      {props.dueAt ? (
        <div
          className="row-between"
          style={{
            marginTop: "var(--s2)",
            paddingTop: "var(--s2)",
            borderTop: "1px solid var(--rule)",
          }}
        >
          <span className="faint" style={{ fontSize: "var(--step-s)" }}>
            Action Deadline
          </span>
          <span className="tnum" style={{ fontWeight: 700, color: "var(--ink)" }}>
            {fmtWeekday(props.dueAt, "en")}
          </span>
        </div>
      ) : null}
    </div>
  );
}

