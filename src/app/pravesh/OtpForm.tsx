"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { Callout, ErrorNote } from "@/ui/bits";
import { OtpBoxes } from "@/ui/OtpBoxes";

type VerifyResponse = {
  profile: { id: string; otr: string; nameHi: string } | null;
  cases: { id: string; stageHi: string; trackHi: string; cycleHi: string }[];
};

export function OtpForm({ mode }: { mode: "apply" | "track" }) {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpDemo, setOtpDemo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [code, setCode] = useState("");
  const [noProfileError, setNoProfileError] = useState(false);

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNoProfileError(false);
    try {
      const res = await api.post<{ otpDemo: string }>("/api/auth/otp", { mobile });
      setOtpDemo(res.otpDemo);
    } catch (err) {
      setError(errorOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNoProfileError(false);
    try {
      const res = await api.post<VerifyResponse>("/api/auth/verify", { mobile, otp });
      if (!res.profile) {
        setNoProfileError(true);
        return;
      }
      if (res.cases.length > 0) {
        router.push(`/f/${res.cases[0].id}`);
        return;
      }
      router.push("/raasta");
    } catch (err) {
      setError(errorOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ ["--gap" as string]: "var(--s5)" }}>
      {mode === "track" ? (
        <form
          className="sheet stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) {
              router.push(`/t/${code.trim().toUpperCase()}`);
            }
          }}
        >
          <h2>Track Application / फ़ाइल देखें</h2>
          <p className="muted" style={{ fontSize: "var(--step-s)" }}>
            Enter any of your three identifiers below to view live stage, assigned officer, and deadline. No password or captcha required.
          </p>
          <div className="field">
            <label htmlFor="code">Case ID, 15-digit Registration No, or OTR / पहचान संख्या</label>
            <input
              id="code"
              name="code"
              value={code}
              placeholder="e.g. MLG-26-000137, 15-digit Reg No, or UP26-000137"
              onChange={(e) => setCode(e.target.value)}
              autoCapitalize="characters"
            />
            <span className="field-hint">
              Accepts Case ID (MLG-26-...), 15-digit Registration Number, or OTR (UP26-...).
            </span>
          </div>
          <button className="btn btn-primary" type="submit" disabled={code.trim().length < 4}>
            Track File / फ़ाइल खोलें →
          </button>
        </form>
      ) : null}

      {noProfileError ? (
        <Callout tone="warn" title="No OTR Profile Found / OTR नहीं मिला">
          <p style={{ fontSize: "var(--step-0)", fontWeight: 600, color: "var(--ink)" }}>
            Create an OTR first before applying for a scholarship.
          </p>
          <p style={{ fontSize: "var(--step-s)", marginTop: "var(--s2)" }}>
            The registered mobile <code className="mono">{mobile}</code> has no existing OTR profile. Please complete One-Time Registration first.
          </p>
          <div style={{ marginTop: "var(--s3)" }}>
            <Link className="btn btn-primary" href="/otr">
              Create an OTR First →
            </Link>
          </div>
        </Callout>
      ) : null}

      {otpDemo === null ? (
        <form className="sheet stack" onSubmit={sendOtp}>
          <div className="row-between">
            <h2>{mode === "track" ? "Or Track via Mobile OTP" : "Mobile OTP Login / मोबाइल लॉगिन"}</h2>
            <button
              className="btn btn-sm"
              type="button"
              onClick={() => setMobile("9876543210")}
            >
              Fill Demo Mobile (9876543210)
            </button>
          </div>
          <div className="field">
            <label htmlFor="mobile">10-Digit Mobile Number (starts 6, 7, 8, or 9)</label>
            <input
              id="mobile"
              name="mobile"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              placeholder="e.g. 9876543210 or 7890123456"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
            <span className="field-hint">
              This is a synthetic prototype — no SMS is sent. The OTP will print directly on screen.
            </span>
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy || mobile.length !== 10}>
            {busy ? "Sending OTP…" : "Send OTP / OTP भेजें"}
          </button>
          {error ? <ErrorNote error={error} /> : null}
        </form>
      ) : (
        <form className="sheet stack" onSubmit={verify}>
          <div className="row-between">
            <h2>Enter Security OTP / OTP दर्ज करें</h2>
            <button
              className="btn btn-sm"
              type="button"
              onClick={() => setOtp(otpDemo)}
            >
              Auto-Fill Demo OTP ({otpDemo})
            </button>
          </div>
          <Callout tone="info" title={`DEMO OTP: ${otpDemo}`}>
            <p style={{ fontSize: "var(--step-s)" }}>
              Synthetic OTP generated automatically — paste or click auto-fill above.
            </p>
          </Callout>
          <div className="field">
            <label htmlFor="otp-boxes">6-Digit Security OTP Code</label>
            <OtpBoxes
              id="otp-boxes"
              value={otp}
              onChange={setOtp}
              disabled={busy}
            />
          </div>
          <div className="row">
            <button className="btn btn-primary" type="submit" disabled={busy || otp.length !== 6}>
              {busy ? "Verifying OTP…" : "Verify & Continue / आगे बढ़ें"}
            </button>
            <button
              className="btn btn-quiet"
              type="button"
              onClick={() => {
                setOtpDemo(null);
                setOtp("");
              }}
            >
              Change Mobile Number
            </button>
          </div>
          {error ? <ErrorNote error={error} /> : null}
        </form>
      )}
    </div>
  );
}

