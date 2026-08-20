/**
 * UIDAI never issues an Aadhaar number starting with 0 or 1, so requiring a `0000` prefix makes it
 * impossible for a demo user to type a real one. This is a safety rule, not a formatting rule.
 * Kept dependency-free so both the server and the browser can import it.
 */
export function isDemoAadhaar(v: string): boolean {
  return /^0000\d{8}$/.test(String(v).replace(/\s/g, ""));
}

export const DEMO_AADHAAR_MESSAGE_HI =
  "यह प्रोटोटाइप असली आधार नंबर स्वीकार नहीं करता — 0000 से शुरू होने वाला डेमो नंबर डालें";
