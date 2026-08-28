import type { JSX } from "react";
import { fmtDate, fmtDays } from "@/lib/format";
import { STAGE_LABELS_HI } from "@/server/config/schemes";
import type { Stage } from "@/server/types";

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
  calendar: {
    instituteForwardDeadline: string;
    dwoWindowEnd: string;
    disbursementFrom: string;
    disbursementTo: string;
  };
  events: { at: string; type: string }[];
}): JSX.Element {
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
    if (e.type === "university_verified" || e.type === "correction_submitted")
      entered.set("dwo_review", e.at);
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
        const state = isCurrent
          ? breachDays > 0
            ? "breach"
            : "current"
          : idx < terminalIndex
            ? "done"
            : "future";
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
