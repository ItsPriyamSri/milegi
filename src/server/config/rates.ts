import type { Category, Confidence, TrackId } from "../types";

export type CourseGroup = "prof" | "tech" | "general" | "school";

const CAP_SRC_A = "https://upscholarshiip.com/apply-online/";
const CAP_SRC_B = "https://www.buddy4study.com/article/up-scholarship";
const RATE_SRC = "https://www.buddy4study.com/article/up-scholarship (2026-27 benefit ranges)";

export function incomeCapFor(
  _track: TrackId,
  category: Category,
): { cap: number; note: string; source: string; confidence: Confidence } {
  const contested =
    "स्रोत आपस में मेल नहीं खाते — कुछ गाइड सामान्य वर्ग के लिए ₹2,50,000 बताते हैं, कुछ ₹2,00,000। " +
    "अंतिम सीमा आपके वर्ग की शासनादेश-अधिसूचना से तय होती है।";
  if (category === "sc" || category === "st") {
    return { cap: 250000, note: "", source: `${CAP_SRC_A} · ${CAP_SRC_B}`, confidence: "AGG" };
  }
  if (category === "minority") {
    return {
      cap: 200000,
      note:
        "अल्पसंख्यक योजनाओं में सीमा ₹1,00,000 से ₹2,00,000 तक बताई जाती है; यहाँ ऊपरी सीमा ली गई है।",
      source: `${CAP_SRC_A} · ${CAP_SRC_B}`,
      confidence: "AGG",
    };
  }
  return { cap: 200000, note: contested, source: `${CAP_SRC_A} · ${CAP_SRC_B}`, confidence: "AGG" };
}

// Maintenance allowance bands. Monthly figures are mid-points of publicly reported ranges and are
// labelled as estimates wherever they are shown.
export function maintenanceFor(
  group: CourseGroup,
  hosteller: boolean,
): { perMonth: number; months: number; source: string; confidence: Confidence } {
  const table: Record<CourseGroup, { day: number; hostel: number }> = {
    prof: { day: 750, hostel: 1200 },
    tech: { day: 550, hostel: 820 },
    general: { day: 300, hostel: 570 },
    school: { day: 290, hostel: 660 },
  };
  const row = table[group];
  return {
    perMonth: hosteller ? row.hostel : row.day,
    months: 10,
    source: RATE_SRC,
    confidence: "AGG",
  };
}

export const AMOUNT_DISCLAIMER_HI =
  "यह अनुमान है। स्वीकृत राशि विभाग तय करता है — निजी संस्थान का पूरा शुल्क वापस मिलना ज़रूरी नहीं है।";

export const AMOUNT_DISCLAIMER_EN =
  "This is an estimate. The department decides the sanctioned amount; a private institution's full fee is not necessarily reimbursed.";
