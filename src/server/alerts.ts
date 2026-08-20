import type { ActorRef, Alert, Case } from "./types";
import { addDays, daysBetween, iso, isBefore } from "./clock";
import { calendarFor } from "./config/calendar";
import { REASONS } from "./config/reasons";
import { appendEvent, isTerminal, MONITOR_ACTOR } from "./machine";
import { sendNotification } from "./notify";

export const ESCALATE_AFTER_DAYS = 3;

const MONTHS_HI = ["जन", "फ़र", "मार्च", "अप्रैल", "मई", "जून", "जुल", "अग", "सित", "अक्तू", "नव", "दिस"];
const WEEKDAYS_HI = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];

function fmt(isoStamp: string): string {
  const d = new Date(isoStamp);
  return `${d.getUTCDate()} ${MONTHS_HI[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function fmtWeekday(isoStamp: string): string {
  return `${WEEKDAYS_HI[new Date(isoStamp).getUTCDay()]}, ${fmt(isoStamp)}`;
}

export function deriveAlerts(c: Case, nowIso: string = iso()): Alert[] {
  const out: Alert[] = [];
  const cal = calendarFor(c.track, c.cycle);

  out.push({
    id: "estimate",
    kind: "estimate_note",
    severity: "info",
    titleHi: "राशि एक अनुमान है",
    titleEn: "The amount is an estimate",
    detailHi: c.estimate.basisHi,
    detailEn: "The estimate's basis is shown wherever the amount appears.",
    actionHi: null,
    actionHref: null,
    dueAt: null,
  });

  if (c.stage === "draft") {
    const left = daysBetween(nowIso, cal.studentDeadline);
    if (left <= 7) {
      out.push({
        id: "deadline",
        kind: "deadline_soon",
        severity: left < 0 ? "danger" : "warn",
        titleHi: left < 0 ? "आवेदन की तारीख़ बीत गई" : `आवेदन की अंतिम तारीख़ ${left} दिन में`,
        titleEn: left < 0 ? "Student deadline passed" : `Deadline in ${left} days`,
        detailHi: `अंतिम तारीख़: ${fmt(cal.studentDeadline)}.`,
        detailEn: `Deadline: ${cal.studentDeadline.slice(0, 10)}.`,
        actionHi: left < 0 ? null : "फ़ॉर्म पूरा करके लॉक करें",
        actionHref: `/jaanch/${c.id}`,
        dueAt: cal.studentDeadline,
      });
    }
  }

  if (c.hardCopy.dueAt && !c.hardCopy.receivedAt && !isTerminal(c.stage)) {
    const left = daysBetween(nowIso, c.hardCopy.dueAt);
    out.push(
      left < 0
        ? {
            id: "hardcopy",
            kind: "hardcopy_overdue",
            severity: "danger",
            titleHi: "हार्ड कॉपी की 3 दिन की समय सीमा बीत गई",
            titleEn: "The 3-day hard-copy window has passed",
            detailHi: `${fmtWeekday(
              c.hardCopy.dueAt,
            )} तक जमा होनी थी। अब भी जमा करें — फ़ाइल इसके बिना आगे नहीं बढ़ती।`,
            detailEn: "It was due earlier; submit anyway, the file cannot move without it.",
            actionHi: "अंतिम प्रिंट, शुल्क रसीद और मार्कशीट कॉलेज छात्रवृत्ति प्रकोष्ठ में जमा करें",
            actionHref: null,
            dueAt: c.hardCopy.dueAt,
          }
        : {
            id: "hardcopy",
            kind: "hardcopy_due",
            severity: "info",
            titleHi: `हार्ड कॉपी ${fmtWeekday(c.hardCopy.dueAt)} तक जमा करें`,
            titleEn: `Submit the hard copy by ${c.hardCopy.dueAt.slice(0, 10)}`,
            detailHi: `${left} दिन बचे हैं। जमा करते समय रसीद ज़रूर लें।`,
            detailEn: `${left} days left. Get an acknowledgement.`,
            actionHi: "अंतिम प्रिंट, शुल्क रसीद और मार्कशीट जमा करें",
            actionHref: null,
            dueAt: c.hardCopy.dueAt,
          },
    );
  }

  if (!isTerminal(c.stage) && c.dueAt && c.owner && isBefore(c.dueAt, nowIso)) {
    const late = Math.abs(daysBetween(c.dueAt, nowIso));
    const escalated = c.escalations.length > 0;
    out.push({
      id: "breach",
      kind: "stage_breach",
      severity: "danger",
      titleHi: `यह चरण ${late} दिन से समय सीमा पार कर चुका है`,
      titleEn: `This stage is ${late} days past its deadline`,
      detailHi:
        `फ़ाइल ${c.owner.nameHi} (${c.owner.designationHi}, ${c.owner.orgHi}) के पास है। ` +
        `समय सीमा ${fmt(c.dueAt)} थी, ${late} दिन बीत चुके हैं।` +
        (escalated
          ? ` स्वतः अनुरोध ${fmt(c.escalations[c.escalations.length - 1].at)} को ${
              c.escalations[c.escalations.length - 1].to.nameHi
            } को भेजा गया — प्रतीक्षा गिनती वहीं से जारी है।`
          : ""),
      detailEn: `Held by ${c.owner.nameHi}; the deadline was ${c.dueAt.slice(0, 10)}, ${late} days ago.`,
      actionHi: escalated ? "शिकायत का मसौदा देखें" : "अनुस्मारक भेजें",
      actionHref: escalated ? `/shikayat/${c.id}` : null,
      dueAt: c.dueAt,
    });
  }

  if (c.correction) {
    const opensIn = daysBetween(nowIso, c.correction.openAt);
    const closesIn = daysBetween(nowIso, c.correction.closeAt);
    const codes = c.flags.map((f) => REASONS[f.code]?.hi ?? f.code).join("; ");
    out.push(
      opensIn > 0
        ? {
            id: "correction",
            kind: "correction_opens",
            severity: "info",
            titleHi: `सुधार विंडो ${fmt(c.correction.openAt)} को खुलेगी`,
            titleEn: `Correction window opens ${c.correction.openAt.slice(0, 10)}`,
            detailHi: `आपत्ति: ${codes}. तब तक कागज़ तैयार रखें — विंडो ${fmt(
              c.correction.closeAt,
            )} को बंद हो जाएगी।`,
            detailEn: `Flags: ${codes}.`,
            actionHi: null,
            actionHref: `/f/${c.id}`,
            dueAt: c.correction.openAt,
          }
        : {
            id: "correction",
            kind: "correction_closing",
            severity: closesIn <= 3 ? "danger" : "warn",
            titleHi: `सुधार विंडो ${closesIn} दिन में बंद`,
            titleEn: `Correction closes in ${closesIn} days`,
            detailHi: `आपत्ति: ${codes}. सुधार के बाद नई प्रति 3 दिन में कॉलेज जमा करनी होगी।`,
            detailEn: `Flags: ${codes}. A corrected printout is due at the institute within 3 days.`,
            actionHi: "सुधार भरें",
            actionHref: `/aavedan/${c.id}`,
            dueAt: c.correction.closeAt,
          },
    );
  }

  if (c.stage === "payment_failed") {
    const code = c.payment.failureCode ?? "NPCI_NOT_SEEDED";
    out.push({
      id: "payfail",
      kind: "payment_action_needed",
      severity: "danger",
      titleHi: "भुगतान बैंक स्तर पर लौट आया",
      titleEn: "Payment bounced at the bank",
      detailHi: REASONS[code]?.hi ?? code,
      detailEn: REASONS[code]?.en ?? code,
      actionHi: REASONS[code]?.fixHi ?? null,
      actionHref: null,
      dueAt: c.dueAt,
    });
  }

  if (c.stage === "paid") {
    out.push({
      id: "paid",
      kind: "paid",
      severity: "info",
      titleHi: "भुगतान आपके आधार-जुड़े खाते में भेजा गया",
      titleEn: "Payment sent to your Aadhaar-linked account",
      detailHi: `${c.payment.amount ? `राशि ₹${c.payment.amount.toLocaleString("en-IN")}. ` : ""}संदर्भ ${
        c.payment.pfmsRef ?? "—"
      }. बैंक में जमा दिखने में 3-7 कार्यदिवस लग सकते हैं।`,
      detailEn: `Reference ${c.payment.pfmsRef ?? "—"}; bank credit can take 3-7 working days.`,
      actionHi: null,
      actionHref: null,
      dueAt: null,
    });
  }

  return out;
}

export function escalate(input: Case): Case {
  const c: Case = structuredClone(input);
  const nowIso = iso();
  if (isTerminal(c.stage) || !c.dueAt || !c.owner || !isBefore(c.dueAt, nowIso)) return c;
  const breachDays = Math.abs(daysBetween(c.dueAt, nowIso));
  if (breachDays < ESCALATE_AFTER_DAYS) return c;
  const already = c.escalations.some(
    (e) => e.stage === c.stage && daysBetween(e.at, nowIso) < 1,
  );
  if (already) return c;

  const to: ActorRef =
    c.owner.role === "institute"
      ? {
          role: "dwo",
          nameHi: "जिला समाज कल्याण कार्यालय",
          designationHi: "अनुश्रवण",
          orgHi: c.owner.orgHi,
        }
      : {
          role: "dwo",
          nameHi: "निदेशालय अनुश्रवण प्रकोष्ठ",
          designationHi: "उच्च स्तर",
          orgHi: "समाज कल्याण निदेशालय",
        };

  c.escalations.push({ at: nowIso, stage: c.stage, breachDays, to });
  appendEvent(c, {
    at: nowIso,
    type: "escalated",
    actor: MONITOR_ACTOR,
    summaryHi: `${breachDays} दिन की देरी पर स्वतः अनुरोध ${to.nameHi} को भेजा गया — प्रतीक्षा गिनती जारी है`,
    summaryEn: `Auto-escalated after ${breachDays} days; the waiting counter keeps running`,
    data: { breachDays },
  });
  sendNotification(
    c,
    "escalation",
    `आपकी फ़ाइल ${c.id} ${breachDays} दिन से ${c.owner.nameHi} के पास रुकी है। अनुरोध ${to.nameHi} को भेज दिया गया`,
  );
  return c;
}

export function nudge(input: Case, actor: ActorRef): Case {
  const c: Case = structuredClone(input);
  const at = iso();
  appendEvent(c, {
    at,
    type: "nudge_sent",
    actor,
    summaryHi: `अनुस्मारक ${c.owner?.nameHi ?? "—"} को भेजा गया (प्रतीक्षा गिनती नहीं बदलती)`,
    summaryEn: "Reminder sent; the waiting counter is unchanged",
  });
  sendNotification(c, "nudge", `अनुस्मारक भेजा गया: फ़ाइल ${c.id} — ${c.owner?.nameHi ?? "—"}`);
  return c;
}

export function waitingDays(c: Case, nowIso: string = iso()): number {
  return Math.max(0, daysBetween(c.stageEnteredAt, nowIso));
}

export function breachDays(c: Case, nowIso: string = iso()): number {
  if (!c.dueAt || isTerminal(c.stage)) return 0;
  const late = daysBetween(c.dueAt, nowIso);
  return late > 0 ? late : 0;
}

export { addDays };
