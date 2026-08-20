// The ONLY place in the codebase allowed to read wall-clock time.
// The simulator moves `offsetDays` so the whole application can time-travel together.
let offsetDays = 0;

export function setClockOffset(days: number): void {
  offsetDays = Math.trunc(days);
}

export function getClockOffset(): number {
  return offsetDays;
}

export function now(): Date {
  return new Date(Date.now() + offsetDays * 86400000);
}

export function iso(d: Date = now()): string {
  return d.toISOString();
}

export function today(): string {
  return iso().slice(0, 10);
}

export function addDays(isoStamp: string, days: number): string {
  return new Date(new Date(isoStamp).getTime() + days * 86400000).toISOString();
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86400000);
}

export function isBefore(a: string, b: string): boolean {
  return new Date(a).getTime() < new Date(b).getTime();
}

export function earliest(...stamps: (string | null | undefined)[]): string {
  const valid = stamps.filter((s): s is string => typeof s === "string" && s.length > 0);
  if (valid.length === 0) throw new Error("earliest() needs at least one timestamp");
  return valid.reduce((a, b) => (isBefore(a, b) ? a : b));
}

export function latest(...stamps: (string | null | undefined)[]): string {
  const valid = stamps.filter((s): s is string => typeof s === "string" && s.length > 0);
  if (valid.length === 0) throw new Error("latest() needs at least one timestamp");
  return valid.reduce((a, b) => (isBefore(a, b) ? b : a));
}

/** Calendar-accurate year arithmetic. Certificate validity is stated in years, not days. */
export function addYears(isoStamp: string, years: number): string {
  const d = new Date(isoStamp);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString();
}
