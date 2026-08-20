import { AppError } from "../errors";
import { getSim } from "../store";
import type { UpstreamName } from "../types";

export const UPSTREAM_LABEL_HI: Record<UpstreamName, string> = {
  ekyc: "आधार e-KYC सेवा",
  digilocker: "डिजिलॉकर",
  edistrict: "ई-डिस्ट्रिक्ट प्रमाणपत्र सेवा",
  boards: "बोर्ड / विश्वविद्यालय डेटाबेस",
  npci: "NPCI आधार-DBT मैपर",
  pfms: "PFMS भुगतान प्रणाली",
};

export const UPSTREAM_LABEL_EN: Record<UpstreamName, string> = {
  ekyc: "Aadhaar e-KYC",
  digilocker: "DigiLocker",
  edistrict: "e-District certificate service",
  boards: "Board / university database",
  npci: "NPCI Aadhaar-DBT mapper",
  pfms: "PFMS payment system",
};

export function gate(system: UpstreamName): void {
  const cfg = getSim().upstream[system];
  const down = cfg.health === "down" || (cfg.failureRate > 0 && Math.random() < cfg.failureRate);
  if (!down) return;
  throw new AppError("UPSTREAM_DOWN", {
    hi: `${UPSTREAM_LABEL_HI[system]} अभी जवाब नहीं दे रही। आपका डेटा सुरक्षित है — कुछ मिनट बाद दोबारा कोशिश करें।`,
    en: `${UPSTREAM_LABEL_EN[system]} is not responding. Your data is safe — retry in a few minutes.`,
    retryable: true,
    status: 503,
    retryAfterSec: 120,
    upstream: `${system}:health=${cfg.health}`,
  });
}

/** Surfaced to the UI as a "this is slow right now" hint. Never an actual sleep. */
export function slowHintMs(system: UpstreamName): number {
  return getSim().upstream[system].health === "slow" ? 2500 : 0;
}
