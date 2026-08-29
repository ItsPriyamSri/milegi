"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { Callout, ErrorNote } from "@/ui/bits";
import { CATEGORIES } from "@/server/config/schemes";
import { DISTRICTS } from "@/server/config/districts";

type OtrResponse = {
  profile: { id: string; otr: string; nameHi: string; duplicateOtrs: string[] };
  duplicate: boolean;
  duplicateNoteHi: string | null;
};

const DEMO_AADHAAR = "000012340002";

export function OtrForm() {
  const [form, setForm] = useState({
    aadhaarDemo: "",
    mobile: "",
    dob: "",
    category: "obc",
    nameHi: "",
    fatherNameHi: "",
    motherNameHi: "",
    districtCode: "70",
    addressHi: "",
    gender: "m",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<OtrResponse | null>(null);
  const [copied, setCopied] = useState(false);

  function set(name: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setResult(await api.post<OtrResponse>("/api/otr", form));
    } catch (err) {
      setError(errorOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function recover() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ found: boolean; otr: string | null; hintHi: string }>(
        "/api/otr/recover",
        { mobile: form.mobile },
      );
      setError({
        code: "RECOVERY",
        hi: res.hintHi,
        en: res.hintHi,
        retryable: false,
        ref: "RECOVERY",
      });
    } catch (err) {
      setError(errorOf(err));
    } finally {
      setBusy(false);
    }
  }

  function copyOtr() {
    if (!result) return;
    navigator.clipboard.writeText(result.profile.otr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (result) {
    return (
      <div className="stack" style={{ ["--gap" as string]: "var(--s5)" }}>
        {result.duplicate ? (
          <div className="stamp" style={{ borderLeft: "4px solid var(--waiting)" }}>
            <div className="row-between">
              <span className="stamp-kicker">IDENTITY RECOVERY · पहचान पुनःप्राप्ति</span>
              <span className="chip" data-tone="waiting">
                Existing OTR Recovered
              </span>
            </div>
            <p className="eyebrow" style={{ marginTop: "var(--s3)" }}>
              lifetime ID — also a tracking number
            </p>
            <div className="mono" style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 800, color: "var(--ink)", margin: "var(--s1) 0" }}>
              {result.profile.otr}
            </div>
            <p style={{ marginTop: "var(--s2)", fontWeight: 600 }}>{result.duplicateNoteHi}</p>
            {result.profile.duplicateOtrs.length > 0 ? (
              <p className="mono faint" style={{ fontSize: "var(--step-s)", marginTop: "var(--s2)" }}>
                Intercepted duplicate attempt: {result.profile.duplicateOtrs.join(", ")}
              </p>
            ) : null}
            <p className="muted" style={{ marginTop: "var(--s2)", fontSize: "var(--step-s)" }}>
              Your original OTR profile was safely recovered. Never mint a second OTR — duplicate OTRs trigger rejection.
            </p>
          </div>
        ) : (
          <div className="sheet stack" style={{ textAlign: "center", padding: "var(--s7) var(--s5)" }}>
            <span className="chip" data-tone="verified" style={{ margin: "0 auto" }}>
              ✓ OTR Profile Minted
            </span>
            <p className="eyebrow" style={{ marginTop: "var(--s3)" }}>
              lifetime ID — also a tracking number
            </p>
            <div className="mono" style={{ fontSize: "clamp(2.2rem, 6vw, 3.5rem)", fontWeight: 800, color: "var(--action)", letterSpacing: "-0.02em" }}>
              {result.profile.otr}
            </div>
            <p className="muted measure" style={{ margin: "var(--s2) auto 0", fontSize: "var(--step-s)" }}>
              This is your permanent single-student ID across all academic years and sessions. Save this OTR safely.
            </p>
          </div>
        )}

        <div className="row" style={{ justifyContent: "center", gap: "var(--s3)" }}>
          <button className="btn btn-primary" type="button" onClick={copyOtr}>
            {copied ? "✓ Copied OTR to Clipboard" : "Copy OTR Number"}
          </button>
          <Link className="btn" href="/">
            Back to Home / मुख्य पृष्ठ पर जाएँ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="stack" style={{ ["--gap" as string]: "var(--s5)" }} onSubmit={submit}>
      <fieldset className="sheet stack">
        <legend className="eyebrow">Aadhaar e-KYC (Demo / Mock)</legend>
        <Callout tone="info" title="Synthetic Demo Aadhaar Only">
          <p style={{ fontSize: "var(--step-s)" }}>
            Enter a 12-digit demo number starting with 0000. Real Aadhaar numbers are never accepted.{" "}
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => set("aadhaarDemo", DEMO_AADHAAR)}
            >
              Auto-fill Demo Aadhaar ({DEMO_AADHAAR})
            </button>
          </p>
        </Callout>
        <div className="field">
          <label htmlFor="aadhaarDemo">Demo Aadhaar Number / 12-Digit Code</label>
          <input
            id="aadhaarDemo"
            className="mono"
            inputMode="numeric"
            maxLength={12}
            placeholder="000012340002"
            value={form.aadhaarDemo}
            onChange={(e) => set("aadhaarDemo", e.target.value.replace(/\D/g, "").slice(0, 12))}
          />
        </div>
        <div className="field">
          <label htmlFor="mobile">Aadhaar Linked Mobile Number / मोबाइल नंबर</label>
          <input
            id="mobile"
            inputMode="numeric"
            maxLength={10}
            placeholder="e.g. 9876543210"
            value={form.mobile}
            onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
          />
          <span className="field-hint">
            Must be 10 Indian digits starting 6, 7, 8, or 9. Bound permanently to your OTR profile.
          </span>
        </div>
      </fieldset>

      <fieldset className="sheet stack">
        <legend className="eyebrow">Student OTR Profile Details</legend>
        <div className="field">
          <label htmlFor="nameHi">Full Name (As on Aadhaar / Marksheet)</label>
          <input id="nameHi" value={form.nameHi} placeholder="e.g. Rahul Sharma" onChange={(e) => set("nameHi", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="fatherNameHi">Father&apos;s Name / पिता का नाम</label>
          <input
            id="fatherNameHi"
            value={form.fatherNameHi}
            onChange={(e) => set("fatherNameHi", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="motherNameHi">Mother&apos;s Name / माता का नाम</label>
          <input
            id="motherNameHi"
            value={form.motherNameHi}
            onChange={(e) => set("motherNameHi", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="dob">Date of Birth / जन्मतिथि</label>
          <input id="dob" type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="gender">Gender / लिंग</label>
          <select id="gender" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="m">Male / पुरुष</option>
            <option value="f">Female / महिला</option>
            <option value="o">Other / अन्य</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="category">Social Category / वर्ग</label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.en || c.hi} ({c.hi})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="districtCode">Home District / जिला</label>
          <select
            id="districtCode"
            value={form.districtCode}
            onChange={(e) => set("districtCode", e.target.value)}
          >
            {DISTRICTS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.hi}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="addressHi">Permanent Address / पता</label>
          <input
            id="addressHi"
            value={form.addressHi}
            onChange={(e) => set("addressHi", e.target.value)}
          />
        </div>
      </fieldset>

      {error ? <ErrorNote error={error} /> : null}

      <div className="row">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Generating OTR Profile…" : "Create OTR Profile"}
        </button>
        <button className="btn btn-quiet" type="button" onClick={recover} disabled={busy}>
          Already registered? Recover OTR by Mobile
        </button>
      </div>
    </form>
  );
}

