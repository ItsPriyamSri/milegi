import type { Category, Profile } from "./types";
import { iso } from "./clock";
import { AppError } from "./errors";
import { findProfileByAadhaar, findProfileByMobile, putProfile } from "./store";
import { BOARD_REGISTRY } from "./seeds";
import { DEMO_AADHAAR_MESSAGE_HI, isDemoAadhaar } from "./config/aadhaar";
import { fetchDigilockerProfile } from "./external/digilocker";
import { verifyEkyc } from "./external/ekyc";

export { isDemoAadhaar, DEMO_AADHAAR_MESSAGE_HI };


export type MintInput = {
  aadhaarDemo: string;
  mobile: string;
  dob: string;
  category: Category;
  nameHi: string;
  nameEn: string;
  fatherNameHi: string;
  motherNameHi: string;
  districtCode: string;
  addressHi: string;
  gender: "f" | "m" | "o";
};

function newOtr(): string {
  return `UP26-${String(8_000_000_000 + Math.floor(Math.random() * 999_999_999))}`;
}

export function mintOtr(input: MintInput): { profile: Profile; duplicateOf?: Profile } {
  const aadhaarDemo = String(input.aadhaarDemo).replace(/\s/g, "");
  if (!isDemoAadhaar(aadhaarDemo)) {
    throw new AppError("AADHAAR_NOT_DEMO", {
      hi: DEMO_AADHAAR_MESSAGE_HI,
      en: "This prototype only accepts demo Aadhaar numbers beginning 0000.",
      status: 422,
    });
  }
  verifyEkyc(aadhaarDemo);
  const existing = findProfileByAadhaar(aadhaarDemo);
  if (existing) {
    // The real portal debars you here. Milegi recovers: same identity, the duplicate attempt recorded.
    const attempted = newOtr();
    if (!existing.duplicateOtrs.includes(attempted)) existing.duplicateOtrs.push(attempted);
    putProfile(existing);
    return { profile: existing, duplicateOf: existing };
  }
  const doc = fetchDigilockerProfile(aadhaarDemo);
  const profile: Profile = {
    id: `prf_${Math.random().toString(16).slice(2, 10)}`,
    otr: newOtr(),
    mobile: input.mobile,
    aadhaarDemo,
    nameHi: input.nameHi,
    nameEn: input.nameEn,
    fatherNameHi: input.fatherNameHi,
    motherNameHi: input.motherNameHi,
    dob: input.dob,
    gender: input.gender,
    category: input.category,
    districtCode: input.districtCode,
    addressHi: input.addressHi,
    photoRef: doc.photoRef,
    ekycAt: iso(),
    duplicateOtrs: [],
    createdAt: iso(),
  };
  putProfile(profile);
  return { profile };
}

export function recoverIdentity(input: {
  mobile?: string;
  boardRollNo?: string;
  passingYear?: number;
}): { profile?: Profile; hintHi: string } {
  const byMobile = input.mobile ? findProfileByMobile(input.mobile) : undefined;
  if (byMobile) {
    return {
      profile: byMobile,
      hintHi: `आपका OTR मिल गया: ${byMobile.otr}. नया OTR बनाने की ज़रूरत नहीं है।`,
    };
  }
  const rollKnown =
    input.boardRollNo !== undefined &&
    Object.values(BOARD_REGISTRY).some((r) => r.rollNo === String(input.boardRollNo));
  return {
    hintHi: rollKnown
      ? "रोल नंबर बोर्ड रिकॉर्ड में मिला, पर इस मोबाइल पर कोई OTR दर्ज नहीं है। " +
        "जिला समाज कल्याण कार्यालय में मोबाइल अपडेट कराएँ — दूसरा OTR न बनाएँ।"
      : "इन विवरणों से कोई पुराना OTR नहीं मिला। नया OTR बनाने से पहले जिला समाज कल्याण कार्यालय " +
        "में एक बार पुष्टि कर लें — दूसरा OTR बन जाने पर दोनों आवेदन ब्लॉक हो सकते हैं।",
  };
}
