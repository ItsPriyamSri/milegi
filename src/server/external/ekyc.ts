import { gate } from "./gate";

export function verifyEkyc(aadhaarDemo: string): { ok: true; otpDemo: string; sourceHi: string } {
  gate("ekyc");
  const seed = Number(aadhaarDemo.slice(-4)) || 1;
  return {
    ok: true,
    otpDemo: String(100000 + ((seed * 7919) % 899999)),
    sourceHi: "आधार e-KYC (नकली)",
  };
}
