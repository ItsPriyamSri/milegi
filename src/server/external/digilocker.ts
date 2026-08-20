import { gate } from "./gate";

export function fetchDigilockerProfile(aadhaarDemo: string): { photoRef: string; sourceHi: string } {
  gate("digilocker");
  return { photoRef: `dl-photo-${aadhaarDemo.slice(-4)}`, sourceHi: "डिजिलॉकर (नकली)" };
}
