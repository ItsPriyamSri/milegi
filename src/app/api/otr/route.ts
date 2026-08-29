import { handler, ok, readJson, str } from "@/server/http";
import { mintOtr } from "@/server/otr";
import { readSession, setSession } from "@/server/session-cookie";
import type { Category } from "@/server/types";
import { requireMobile } from "@/server/mobile";

const CATEGORIES = ["sc", "st", "obc", "general", "minority"];

export const POST = handler(async (req) => {
  const body = await readJson(req);
  const session = await readSession();
  const category = str(body.category, { en: "Category", hi: "वर्ग" }, 10);
  const result = mintOtr({
    aadhaarDemo: str(body.aadhaarDemo, { en: "Demo Aadhaar number", hi: "डेमो आधार संख्या" }, 14),
    mobile: requireMobile(body.mobile),
    dob: str(body.dob, { en: "Date of birth", hi: "जन्मतिथि" }, 10),
    category: (CATEGORIES.includes(category) ? category : "general") as Category,
    nameHi: str(body.nameHi, { en: "Name", hi: "नाम" }, 80),
    nameEn:
      typeof body.nameEn === "string" && body.nameEn.trim()
        ? body.nameEn.trim()
        : str(body.nameHi, { en: "Name", hi: "नाम" }, 80),
    fatherNameHi: str(body.fatherNameHi, { en: "Father's name", hi: "पिता का नाम" }, 80),
    motherNameHi: str(body.motherNameHi, { en: "Mother's name", hi: "माता का नाम" }, 80),
    districtCode: str(body.districtCode, { en: "District", hi: "जिला" }, 4),
    addressHi: str(body.addressHi, { en: "Address", hi: "पता" }, 160),
    gender: (["f", "m", "o"].includes(String(body.gender)) ? String(body.gender) : "o") as
      | "f"
      | "m"
      | "o",
  });
  // The session may have been opened before a profile existed ("pending:<mobile>").
  if (!session || session.subjectId !== result.profile.id) {
    await setSession("student", result.profile.id);
  }
  return ok({
    profile: {
      id: result.profile.id,
      otr: result.profile.otr,
      nameHi: result.profile.nameHi,
      category: result.profile.category,
      districtCode: result.profile.districtCode,
      photoRef: result.profile.photoRef,
      duplicateOtrs: result.profile.duplicateOtrs,
    },
    duplicate: Boolean(result.duplicateOf),
    duplicateNoteHi: result.duplicateOf
      ? "आपका OTR पहले से मौजूद है — नया बनाने की ज़रूरत नहीं। असली पोर्टल पर दूसरा OTR दोनों आवेदन ब्लॉक करा सकता है।"
      : null,
    duplicateNoteEn: result.duplicateOf
      ? "Your OTR already exists — you do not need a new one. On the real portal a second OTR can block both applications."
      : null,
  });
});
