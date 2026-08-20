import type { Confidence, Cycle, TrackId } from "../types";

export type Calendar = {
  registrationOpen: string;
  studentDeadline: string;
  instituteForwardFrom: string;
  instituteForwardDeadline: string;
  dwoWindowFrom: string;
  dwoWindowEnd: string;
  correctionOpen: string;
  correctionClose: string;
  disbursementFrom: string;
  disbursementTo: string;
  source: string;
  confidence: Confidence;
};

const SRC =
  "https://upscholarshiip.com/apply-online/ (2026-27 schedule, attributed to GO 91/2026/1941)";

const d = (s: string) => `${s}T00:00:00.000Z`;

const SCHOOL_FRESH: Calendar = {
  registrationOpen: d("2026-08-11"),
  studentDeadline: d("2026-09-21"),
  instituteForwardFrom: d("2026-08-12"),
  instituteForwardDeadline: d("2026-09-26"),
  dwoWindowFrom: d("2026-09-27"),
  dwoWindowEnd: d("2026-10-20"),
  correctionOpen: d("2026-11-16"),
  correctionClose: d("2026-12-14"),
  disbursementFrom: d("2027-01-25"),
  disbursementTo: d("2027-01-31"),
  source: SRC,
  confidence: "AGG",
};

const SCHOOL_RENEWAL: Calendar = {
  ...SCHOOL_FRESH,
  studentDeadline: d("2026-08-25"),
  correctionOpen: d("2026-09-17"),
  correctionClose: d("2026-10-10"),
  disbursementFrom: d("2026-09-29"),
  disbursementTo: d("2026-10-05"),
};

const DEGREE_FRESH: Calendar = {
  registrationOpen: d("2026-09-15"),
  studentDeadline: d("2026-10-31"),
  instituteForwardFrom: d("2026-09-16"),
  instituteForwardDeadline: d("2026-11-07"),
  dwoWindowFrom: d("2026-11-08"),
  dwoWindowEnd: d("2026-12-15"),
  correctionOpen: d("2026-12-06"),
  correctionClose: d("2026-12-31"),
  disbursementFrom: d("2026-12-21"),
  disbursementTo: d("2026-12-31"),
  source: SRC,
  confidence: "AGG",
};

const DEGREE_RENEWAL: Calendar = {
  ...DEGREE_FRESH,
  studentDeadline: d("2026-10-15"),
  correctionOpen: d("2026-11-21"),
  correctionClose: d("2026-12-20"),
  disbursementFrom: d("2026-12-01"),
  disbursementTo: d("2026-12-10"),
};

const TABLE: Record<TrackId, Record<Cycle, Calendar>> = {
  pre_9_10: { fresh: SCHOOL_FRESH, renewal: SCHOOL_RENEWAL },
  post_inter: { fresh: SCHOOL_FRESH, renewal: SCHOOL_RENEWAL },
  dashmottar: { fresh: DEGREE_FRESH, renewal: DEGREE_RENEWAL },
  outside_state: { fresh: DEGREE_FRESH, renewal: DEGREE_RENEWAL },
};

export function calendarFor(track: TrackId, cycle: Cycle): Calendar {
  return TABLE[track][cycle];
}

export const PHASE_TWO_PAYMENT = {
  from: d("2027-01-16"),
  to: d("2027-01-31"),
  labelHi: "सुधार के बाद (फेज़ 2) भुगतान",
  source: SRC,
  confidence: "AGG" as Confidence,
};
