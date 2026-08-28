import type { JSX } from "react";
import type { Tone } from "./bits";
import { StatusChip } from "./bits";
import { fmtWeekday } from "@/lib/format";

export function DutyStrip(props: {
  stageHi: string;
  tone: Tone;
  ownerNameHi: string | null;
  dueAt: string | null; // ISO; format inside with fmtWeekday
  action?: { href: string; labelHi: string };
}): JSX.Element {
  return (
    <div className="duty">
      <StatusChip tone={props.tone}>{props.stageHi}</StatusChip>
      {props.ownerNameHi ? (
        <span className="duty-owner">
          <span className="muted">ज़िम्मेदार:</span> <b>{props.ownerNameHi}</b>
        </span>
      ) : null}
      {props.dueAt ? (
        <span className="duty-due">
          तक {fmtWeekday(props.dueAt, "hi")}
        </span>
      ) : null}
      {props.action ? (
        <a className="btn btn-primary btn-sm" href={props.action.href}>
          {props.action.labelHi}
        </a>
      ) : null}
    </div>
  );
}
