/** 2026-27 Dashmottar correction windows (GO schedule, public guides 20 Aug 2026). */

export type Cycle = "fresh" | "renewal";

export type CorrectionWindow = {
  open: boolean;
  start: string;
  end: string;
};

const RENEWAL = { start: "2026-11-21", end: "2026-12-20" };
const FRESH = { start: "2026-12-16", end: "2027-01-10" };

export function correctionWindow(cycle: Cycle, now = new Date()): CorrectionWindow {
  const w = cycle === "renewal" ? RENEWAL : FRESH;
  const day = now.toISOString().slice(0, 10);
  return { ...w, open: day >= w.start && day <= w.end };
}
