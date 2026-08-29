import type { JSX } from "react";
import { fmtDate, fmtDays } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import { STAGE_LABELS_EN, STAGE_LABELS_HI } from "@/server/config/schemes";
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
  lang = "en",
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
  lang?: Lang;
}): JSX.Element {
  const isEn = lang === "en";
  const labels = isEn ? STAGE_LABELS_EN : STAGE_LABELS_HI;
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

  const d = (iso: string) => fmtDate(iso, lang);
  const FUTURE_NOTE: Partial<Record<Stage, string>> = isEn
    ? {
        institute_review: `Institute must forward by ${d(calendar.instituteForwardDeadline)}`,
        dwo_review: `District verification window until ${d(calendar.dwoWindowEnd)}`,
        sanctioned: `Payment window ${d(calendar.disbursementFrom)} – ${d(calendar.disbursementTo)}`,
        pfms_processing: "3–7 working days in the PFMS batch",
        paid: "To the Aadhaar-linked account",
      }
    : {
        institute_review: `संस्थान को ${d(calendar.instituteForwardDeadline)} तक अग्रसारित करना है`,
        dwo_review: `जिला सत्यापन विंडो ${d(calendar.dwoWindowEnd)} तक`,
        sanctioned: `भुगतान अवधि ${d(calendar.disbursementFrom)} – ${d(calendar.disbursementTo)}`,
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
            <p className="ledger-title">{labels[s]}</p>
            {isCurrent ? (
              <p className="muted tnum">
                {isEn
                  ? `Since ${d(stageEnteredAt)}${dueAt ? ` · deadline ${d(dueAt)}` : ""}${
                      breachDays > 0 ? ` · ${fmtDays(breachDays, "en")} past` : ""
                    }`
                  : `${d(stageEnteredAt)} से${dueAt ? ` · समय सीमा ${d(dueAt)}` : ""}${
                      breachDays > 0 ? ` · ${fmtDays(breachDays, "hi")} पार` : ""
                    }`}
              </p>
            ) : at ? (
              <p className="muted tnum">{d(at)}</p>
            ) : (
              <p className="faint">{FUTURE_NOTE[s] ?? (isEn ? "Next" : "आगे")}</p>
            )}
          </li>
        );
      })}
      {stage === "rejected" || stage === "lapsed" ? (
        <li data-state="breach">
          <p className="ledger-title">{labels[stage]}</p>
          <p className="muted tnum">{d(stageEnteredAt)}</p>
        </li>
      ) : null}
    </ol>
  );
}
