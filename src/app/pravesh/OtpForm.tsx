"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { Callout, ErrorNote } from "@/ui/bits";

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

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ otpDemo: string }>("/api/auth/otp", { mobile });
      setOtpDemo(res.otpDemo);
    } catch (err) {
      setError(errorOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<VerifyResponse>("/api/auth/verify", { mobile, otp });
      if (res.profile && res.cases.length > 0) {
        router.push(`/f/${res.cases[0].id}`);
        return;
      }
      router.push(res.profile ? "/raasta" : "/otr");
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
            router.push(`/t/${code.trim().toUpperCase()}`);
          }}
        >
          <h2>आवेदन संख्या से देखें</h2>
          <p className="muted" style={{ fontSize: "var(--step-s)" }}>
            बिना लॉगिन। असली पोर्टल पर स्थिति देखने के लिए भी पंजीकरण नंबर, पासवर्ड और कैप्चा चाहिए —
            और वह बटन तभी दिखता है जब कॉलेज फ़ाइल अग्रसारित कर दे।
          </p>
          <div className="field">
            <label htmlFor="code">आवेदन संख्या</label>
            <input
              id="code"
              name="code"
              value={code}
              placeholder="MLG-26-000137"
              onChange={(e) => setCode(e.target.value)}
              autoCapitalize="characters"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={code.trim().length < 6}>
            फ़ाइल खोलें
          </button>
        </form>
      ) : null}

      {otpDemo === null ? (
        <form className="sheet stack" onSubmit={sendOtp}>
          <h2>{mode === "track" ? "या मोबाइल से लॉगिन करें" : "मोबाइल नंबर"}</h2>
          <div className="field">
            <label htmlFor="mobile">10 अंकों का मोबाइल नंबर</label>
            <input
              id="mobile"
              name="mobile"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
            <span className="field-hint">
              यह नकली प्रणाली है — कोई SMS नहीं जाता, OTP स्क्रीन पर ही दिखेगा।
            </span>
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy || mobile.length !== 10}>
            {busy ? "भेज रहे हैं…" : "OTP भेजें"}
          </button>
          {error ? <ErrorNote error={error} /> : null}
        </form>
      ) : (
        <form className="sheet stack" onSubmit={verify}>
          <h2>OTP डालें</h2>
          <Callout tone="info" title={`नकली OTP: ${otpDemo}`}>
            <p style={{ fontSize: "var(--step-s)" }}>
              यह नकली OTP है — कोई SMS नहीं भेजा गया। असली पोर्टल पर यहीं 120 सेकंड का टाइमर और
              कैप्चा भी होता है।
            </p>
          </Callout>
          <div className="field">
            <label htmlFor="otp">6 अंकों का OTP</label>
            <input
              id="otp"
              name="otp"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
          <div className="row">
            <button className="btn btn-primary" type="submit" disabled={busy || otp.length !== 6}>
              {busy ? "जाँच रहे हैं…" : "आगे बढ़ें"}
            </button>
            <button
              className="btn btn-quiet"
              type="button"
              onClick={() => {
                setOtpDemo(null);
                setOtp("");
              }}
            >
              नंबर बदलें
            </button>
          </div>
          {error ? <ErrorNote error={error} /> : null}
        </form>
      )}
    </div>
  );
}
