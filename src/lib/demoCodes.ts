/** Official OTR shape: UP + year + hyphen + 10 digits. Synthetic only. */
export const AMIT_OTR = "UP26-2713703025";
export const DUP_OTR = "UP26-3141592654";

export function normalizeResume(code: string): string {
  const s = code.trim().toUpperCase().replace(/\s+/g, "");
  const m = s.match(/^(UP\d{2})-?(\d{10})$/);
  return m ? `${m[1]}-${m[2]}` : s;
}

/** Lifetime OTR for a persona that does not already have one. */
export function mintOtr(id: string): string {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return `UP26-${String(n).padStart(10, "0").slice(-10)}`;
}
