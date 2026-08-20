import { handler, ok, readJson, str } from "@/server/http";
import { mintOtr } from "@/server/otr";
import { readSession, setSession } from "@/server/session-cookie";
import type { Category } from "@/server/types";

const CATEGORIES = ["sc", "st", "obc", "general", "minority"];

export const POST = handler(async (req) => {
  const body = await readJson(req);
  const session = await readSession();
  const category = str(body.category, "वर्ग", 10);
  const result = mintOtr({
    aadhaarDemo: str(body.aadhaarDemo, "डेमो आधार संख्या", 14),
    mobile: str(body.mobile, "मोबाइल नंबर", 10),
    dob: str(body.dob, "जन्मतिथि", 10),
    category: (CATEGORIES.includes(category) ? category : "general") as Category,
    nameHi: str(body.nameHi, "नाम", 80),
    nameEn: typeof body.nameEn === "string" && body.nameEn.trim() ? body.nameEn.trim() : "—",
    fatherNameHi: str(body.fatherNameHi, "पिता का नाम", 80),
    motherNameHi: str(body.motherNameHi, "माता का नाम", 80),
    districtCode: str(body.districtCode, "जिला", 4),
    addressHi: str(body.addressHi, "पता", 160),
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
  });
});
