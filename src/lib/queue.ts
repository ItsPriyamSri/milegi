export type Patch = Record<string, unknown>;

/** Last write wins per field; unrelated fields survive. */
export function mergePatches(list: Patch[]): Patch {
  return list.reduce<Patch>((acc, p) => ({ ...acc, ...p }), {});
}

export function nextBackoffMs(attempt: number): number {
  return Math.min(30000, 1000 * 2 ** Math.max(0, attempt));
}

const KEY = (caseId: string) => `milegi:draft:${caseId}`;

export function readLocal(caseId: string): Patch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY(caseId));
    return raw ? (JSON.parse(raw) as Patch) : null;
  } catch {
    return null;
  }
}

export function writeLocal(caseId: string, values: Patch): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY(caseId), JSON.stringify(values));
  } catch {
    // A full or blocked localStorage must never break typing.
  }
}

export function clearLocal(caseId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY(caseId));
  } catch {
    // ignored on purpose
  }
}
