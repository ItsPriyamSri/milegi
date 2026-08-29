import type { Case } from "./types";
import {
  casesForProfile,
  findCaseByRegistrationNo,
  findProfileByOtr,
  getCase,
} from "./store";

export type TrackingHit =
  | { kind: "case"; case: Case }
  | { kind: "otr_no_case"; otr: string }
  | { kind: "missing" };

/** Public track: case id MLG-26-…, 15-digit registration, or OTR UP26-… */
export function resolveTracking(raw: string): TrackingHit {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (!trimmed) return { kind: "missing" };
  const upper = trimmed.toUpperCase();

  const byId = getCase(upper);
  if (byId) return { kind: "case", case: byId };

  const byReg = findCaseByRegistrationNo(trimmed);
  if (byReg) return { kind: "case", case: byReg };

  const profile = findProfileByOtr(upper);
  if (!profile) return { kind: "missing" };
  const cases = casesForProfile(profile.id);
  if (cases.length === 0) return { kind: "otr_no_case", otr: profile.otr };
  return { kind: "case", case: cases[0] };
}
