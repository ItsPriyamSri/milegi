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
      <div className="stamp">
        <div className="stamp-kicker">फ़ाइल स्थिति · FILE DISPOSITION</div>
        <div className="stamp-name">प्रक्रिया पूर्ण / आगे कोई कार्रवाई लंबित नहीं</div>
      </div>
    );
  }
  return (
    <div className="stamp">
      <div className="row-between">
        <div className="stamp-kicker">ज़िम्मेदार अधिकारी · FILE CUSTODIAN</div>
        {props.breachDays > 0 ? (
          <span className="chip" data-tone="breach">
            ▲ समय सीमा से {fmtDays(props.breachDays, "hi")} देर
          </span>
        ) : props.waitingDays > 0 ? (
          <span className="faint" style={{ fontSize: "var(--step-s)" }}>
            {fmtDays(props.waitingDays, "hi")} से इसी चरण पर
          </span>
        ) : null}
      </div>
      <div className="stamp-name">{props.owner.nameHi}</div>
      <div className="stamp-meta">
        {props.owner.designationHi} · {props.owner.orgHi}
      </div>
      {props.owner.contactHint ? (
        <div className="stamp-meta faint">{props.owner.contactHint}</div>
      ) : null}
      {props.dueAt ? (
        <div
          className="row-between"
          style={{
            marginTop: "var(--s3)",
            paddingTop: "var(--s2)",
            borderTop: "1px solid var(--rule)",
          }}
        >
          <span className="faint" style={{ fontSize: "var(--step-s)" }}>
            कार्रवाई की अंतिम तारीख़
          </span>
          <span className="tnum" style={{ fontWeight: 700 }}>
            {fmtWeekday(props.dueAt, "hi")}
          </span>
        </div>
      ) : null}
    </div>
  );
}
