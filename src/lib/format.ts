import type { Lang } from "./i18n";

const MONTHS_HI = ["जन", "फ़र", "मार्च", "अप्रैल", "मई", "जून", "जुल", "अग", "सित", "अक्तू", "नव", "दिस"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS_HI = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function fmtMoney(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function fmtDate(iso: string | null | undefined, lang: Lang = "en"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const months = lang === "en" ? MONTHS_EN : MONTHS_HI;
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function fmtWeekday(iso: string | null | undefined, lang: Lang = "en"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const days = lang === "en" ? WEEKDAYS_EN : WEEKDAYS_HI;
  return `${days[d.getUTCDay()]}, ${fmtDate(iso, lang)}`;
}

export function fmtDays(n: number, lang: Lang = "hi"): string {
  return lang === "en" ? `${n} ${n === 1 ? "day" : "days"}` : `${n} दिन`;
}

export function daysUntil(iso: string | null | undefined, nowIso?: string): number | null {
  if (!iso) return null;
  const now = nowIso ? new Date(nowIso) : new Date();
  return Math.round((new Date(iso).getTime() - now.getTime()) / 86400000);
}
