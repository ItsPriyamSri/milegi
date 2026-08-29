import { AppError } from "./errors";

/** Indian mobile: 10 digits starting 6, 7, 8 or 9. Strips +91 / 91 / leading 0. */
const TEN = /^[6-9]\d{9}$/;

export function normalizeMobile(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return TEN.test(d) ? d : null;
}

export function requireMobile(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new AppError("BAD_MOBILE", {
      hi: "10 अंकों का मोबाइल नंबर डालें (6, 7, 8 या 9 से शुरू)।",
      en: "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.",
      status: 422,
    });
  }
  const n = normalizeMobile(raw);
  if (!n) {
    throw new AppError("BAD_MOBILE", {
      hi: "10 अंकों का मोबाइल नंबर डालें (6, 7, 8 या 9 से शुरू)। +91 भी चलता है।",
      en: "Enter a 10-digit Indian mobile starting with 6, 7, 8 or 9. +91 is allowed.",
      status: 422,
    });
  }
  return n;
}
