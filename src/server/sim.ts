import type { Case, PfmsStatus, UpstreamName } from "./types";
import { iso, isBefore, setClockOffset } from "./clock";
import { calendarFor } from "./config/calendar";
import { REASONS } from "./config/reasons";
import { escalate, deriveAlerts } from "./alerts";
import { MONITOR_ACTOR, transition, isTerminal } from "./machine";
import { sendOnce } from "./notify";
import { runPfmsBatch } from "./external/pfms";
import { allCases, getProfile, getSim, putCase, putSim, reseed } from "./store";

export type SweepReport = {
  atIso: string;
  offsetDays: number;
  escalated: string[];
  autoAdvanced: string[];
  lapsed: string[];
  notified: string[];
};

const UNIVERSITY_ACTOR = {
  role: "university" as const,
  nameHi: "सम्बद्धता अनुभाग",
  designationHi: "शुल्क सत्यापन",
  orgHi: "सम्बद्ध विश्वविद्यालय",
};

export function setUpstream(system: UpstreamName, health: "up" | "slow" | "down", failureRate = 0) {
  const sim = getSim();
  const previous = sim.upstream[system].health;
  sim.upstream[system] = { health, failureRate };
  if (health === "down" && previous !== "down") {
    sim.outageLog.push({ system, from: iso(), to: null });
  }
  if (health !== "down" && previous === "down") {
    const open = [...sim.outageLog].reverse().find((o) => o.system === system && o.to === null);
    if (open) open.to = iso();
  }
  putSim(sim);
  return sim;
}

export function setForcedPfmsOutcome(outcome: PfmsStatus | null) {
  const sim = getSim();
  sim.forcedPfmsOutcome = outcome;
  putSim(sim);
  return sim;
}

/**
 * One pass over every case: lapse expired drafts, auto-advance the university step (this prototype has
 * no university console, and that is disclosed), escalate breaches, and message newly-crossed alerts.
 */
export function sweep(): SweepReport {
  const nowIso = iso();
  const report: SweepReport = {
    atIso: nowIso,
    offsetDays: getSim().clockOffsetDays,
    escalated: [],
    autoAdvanced: [],
    lapsed: [],
    notified: [],
  };

  for (const original of allCases()) {
    let c: Case = original;

    if (c.stage === "draft") {
      const cal = calendarFor(c.track, c.cycle);
      if (isBefore(cal.studentDeadline, nowIso)) {
        c = transition(c, "lapsed", MONITOR_ACTOR);
        report.lapsed.push(c.id);
        putCase(c);
        continue;
      }
    }

    if (c.stage === "university_scrutiny" && c.dueAt && isBefore(c.dueAt, nowIso)) {
      c = transition(c, "dwo_review", UNIVERSITY_ACTOR);
      c.events.push({
        at: nowIso,
        type: "auto_forwarded",
        actor: MONITOR_ACTOR,
        summaryHi:
          "सम्बद्धता अनुभाग का चरण समय सीमा पर स्वतः आगे बढ़ा — इस प्रोटोटाइप में विश्वविद्यालय का अलग लॉगिन नहीं है (सीमाएँ देखें)",
        summaryEn:
          "University scrutiny auto-advanced at its SLA; this prototype has no university console (see limits)",
      });
      report.autoAdvanced.push(c.id);
    }

    if (!isTerminal(c.stage)) {
      const before = c.escalations.length;
      c = escalate(c);
      if (c.escalations.length > before) report.escalated.push(c.id);
    }

    for (const alert of deriveAlerts(c, nowIso)) {
      if (alert.severity === "danger" && alert.kind !== "estimate_note") {
        const sent = sendOnce(c, `alert_${alert.kind}`, `${alert.titleHi} — फ़ाइल ${c.id}`);
        if (sent) report.notified.push(c.id);
      }
    }

    putCase(c);
  }

  return report;
}

export function advanceDays(days: number): SweepReport {
  const sim = getSim();
  sim.clockOffsetDays += Math.trunc(days);
  putSim(sim);
  setClockOffset(sim.clockOffsetDays);
  return sweep();
}

export function setClockOffsetDays(days: number): SweepReport {
  const sim = getSim();
  sim.clockOffsetDays = Math.trunc(days);
  putSim(sim);
  setClockOffset(sim.clockOffsetDays);
  return sweep();
}

export function runPayments(): { rows: ReturnType<typeof runPfmsBatch>; cases: Case[] } {
  const pending = allCases().filter((c) => c.stage === "pfms_processing");
  if (pending.length === 0) return { rows: [], cases: [] };
  const rows = runPfmsBatch(
    pending.map((c) => ({
      caseRec: c,
      aadhaarDemo: getProfile(c.profileId)?.aadhaarDemo ?? "000000000000",
    })),
  );
  const out: Case[] = [];
  for (const row of rows) {
    const target = pending.find((c) => c.id === row.caseId)!;
    const credited = row.status === "credited";
    let updated = transition(target, credited ? "paid" : "payment_failed", {
      role: "bank",
      nameHi: "बैंक / PFMS",
      designationHi: "भुगतान",
      orgHi: "PFMS (नकली)",
    });
    updated = {
      ...updated,
      payment: {
        pfmsRef: row.pfmsRef,
        status: row.status,
        ...(row.failureCode ? { failureCode: row.failureCode } : {}),
        ...(row.amount ? { amount: row.amount } : {}),
        at: row.at,
      },
    };
    sendOnce(
      updated,
      credited ? "paid" : `payfail_${row.failureCode}`,
      credited
        ? `भुगतान भेजा गया: ₹${(row.amount ?? 0).toLocaleString("en-IN")} — संदर्भ ${row.pfmsRef}`
        : `भुगतान लौटा: ${REASONS[row.failureCode ?? "NPCI_NOT_SEEDED"]?.hi ?? row.status}. ${
            REASONS[row.failureCode ?? "NPCI_NOT_SEEDED"]?.fixHi ?? ""
          }`,
    );
    putCase(updated);
    out.push(updated);
  }
  return { rows, cases: out };
}

export function resetAll(): void {
  reseed();
}

export function simState() {
  const sim = getSim();
  const counts: Record<string, number> = {};
  for (const c of allCases()) counts[c.stage] = (counts[c.stage] ?? 0) + 1;
  return {
    clockOffsetDays: sim.clockOffsetDays,
    nowIso: iso(),
    upstream: sim.upstream,
    forcedPfmsOutcome: sim.forcedPfmsOutcome,
    outageLog: sim.outageLog.slice(-20),
    stageCounts: counts,
    caseCount: allCases().length,
    downSystems: (Object.keys(sim.upstream) as UpstreamName[]).filter(
      (k) => sim.upstream[k].health === "down",
    ),
  };
}
