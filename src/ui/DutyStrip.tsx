import type { JSX } from "react";
import type { Tone } from "./bits";
import { StatusChip } from "./bits";
import { fmtWeekday } from "@/lib/format";

export function DutyStrip(props: {
  stageHi: string;
  tone: Tone;
  ownerNameHi: string | null;
  dueAt: string | null;
  action?: { href: string; labelHi: string };
}): JSX.Element {
  return (
    <div className="duty" style={{ background: "var(--surface)", border: "1px solid var(--rule-strong)", borderRadius: "10px", padding: "10px var(--s4)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--s3)", boxShadow: "0 1px 2px 0 rgba(15, 23, 42, 0.03)" }}>
      <StatusChip tone={props.tone}>{props.stageHi}</StatusChip>
      {props.ownerNameHi ? (
        <span className="duty-owner" style={{ fontSize: "var(--step-s)" }}>
          <span className="muted">Assigned:</span> <b>{props.ownerNameHi}</b>
        </span>
      ) : null}
      {props.dueAt ? (
        <span className="duty-due tnum" style={{ fontSize: "var(--step-s)", color: "var(--muted)" }}>
          Due by {fmtWeekday(props.dueAt, "en")}
        </span>
      ) : null}
      {props.action ? (
        <a className="btn btn-primary btn-sm" href={props.action.href} style={{ marginLeft: "auto" }}>
          {props.action.labelHi}
        </a>
      ) : null}
    </div>
  );
}

