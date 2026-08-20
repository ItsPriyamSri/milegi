import { BOARD_REGISTRY, ENROLMENT_REGISTRY } from "../seeds";
import { gate } from "./gate";

export function matchBoardRoll(q: { board: string; rollNo: string }): {
  matched: boolean;
  registryValue?: string;
  reasonCode?: "BOARD_ROLL_MISMATCH";
} {
  gate("boards");
  const row = BOARD_REGISTRY[`${q.board}:${String(q.rollNo).trim()}`];
  if (row) return { matched: true, registryValue: row.rollNo };
  const anyForBoard = Object.values(BOARD_REGISTRY).find((r) => r.board === q.board);
  return {
    matched: false,
    ...(anyForBoard ? { registryValue: "—" } : {}),
    reasonCode: "BOARD_ROLL_MISMATCH",
  };
}

export function matchEnrolment(q: { instituteId: string; enrolmentNo: string }): {
  matched: boolean;
  registryValue?: string;
  reasonCode?: "ENROLMENT_MISMATCH";
} {
  gate("boards");
  const key = `${q.instituteId}:${String(q.enrolmentNo).trim()}`;
  const row = ENROLMENT_REGISTRY[key];
  if (row) return { matched: true, registryValue: row.enrolmentNo };
  const known = Object.values(ENROLMENT_REGISTRY)
    .filter((r) => r.instituteId === q.instituteId)
    .map((r) => r.enrolmentNo);
  return {
    matched: false,
    ...(known.length > 0 ? { registryValue: known.join(", ") } : {}),
    reasonCode: "ENROLMENT_MISMATCH",
  };
}
