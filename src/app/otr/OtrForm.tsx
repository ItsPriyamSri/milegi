"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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

  if (result) {
    return (
      <div className="stack" style={{ ["--gap" as string]: "var(--s5)" }}>
        {result.duplicate ? (
          <div className="stamp" style={{ borderLeft: "4px solid var(--waiting)" }}>
            <div className="row-between">
              <span className="stamp-kicker">पहचान पुनःप्राप्ति · IDENTITY RECOVERY</span>
              <span className="chip" data-tone="waiting">
                पूर्व-पंजीकृत OTR
              </span>
            </div>
            <div className="stamp-name">
              आपका OTR पहले से मौजूद है: <span className="mono">{result.profile.otr}</span>
            </div>
            <p style={{ marginTop: "var(--s2)" }}>{result.duplicateNoteHi}</p>
            {result.profile.duplicateOtrs.length > 0 ? (
              <p className="mono faint" style={{ fontSize: "var(--step-s)", marginTop: "var(--s2)" }}>
                रोकी गई डुप्लीकेट कोशिश: {result.profile.duplicateOtrs.join(", ")}
              </p>
            ) : null}
            <p className="muted" style={{ marginTop: "var(--s2)", fontSize: "var(--step-s)" }}>
              असली पोर्टल पर दूसरा OTR बनते ही दोनों आवेदन रद्द हो जाते हैं और छात्र साल खो देता है। यहाँ आपकी मूल पहचान वापस दे दी गई है ताकि आप नवीनीकरण (Renewal) के तौर पर आगे बढ़ सकें।
            </p>
          </div>
        ) : (
          <div className="sheet stack">
            <p className="eyebrow">आपकी जीवनभर की पहचान</p>
            <p className="row" style={{ alignItems: "baseline" }}>
              <span className="mono" style={{ fontSize: "var(--step-3)", fontWeight: 600 }}>
                {result.profile.otr}
              </span>
              <span className="chip">नकली</span>
            </p>
            <p className="muted" style={{ fontSize: "var(--step-s)" }}>
              OTR एक बार बनता है और जीवनभर चलता है। यह सत्र-वार पंजीकरण संख्या (15 अंक) से अलग चीज़ है —
              असली पोर्टल पर छात्र सबसे ज़्यादा यहीं उलझते हैं।
            </p>
          </div>
        )}

        <div className="row">
          <button className="btn btn-primary" type="button" onClick={() => router.push("/raasta")}>
            {result.duplicate ? "नवीनीकरण के रूप में आगे बढ़ें" : "आगे बढ़ें — कौन-सा आवेदन बनेगा"}
          </button>
          <Link className="btn btn-quiet" href="/madad">
            OTR और पंजीकरण संख्या में अंतर पढ़ें
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="stack" style={{ ["--gap" as string]: "var(--s5)" }} onSubmit={submit}>
      <fieldset className="sheet stack" style={{ border: "1px solid var(--rule)" }}>
        <legend className="eyebrow">आधार e-KYC (नकली)</legend>
        <Callout tone="info" title="यह प्रोटोटाइप असली आधार नंबर स्वीकार नहीं करता">
          <p style={{ fontSize: "var(--step-s)" }}>
            0000 से शुरू होने वाला 12 अंकों का डेमो नंबर डालें। UIDAI कभी 0 या 1 से शुरू होने वाला
            नंबर जारी नहीं करता, इसलिए यहाँ असली नंबर डाला ही नहीं जा सकता।{" "}
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => set("aadhaarDemo", DEMO_AADHAAR)}
            >
              डेमो नंबर भरें ({DEMO_AADHAAR})
            </button>
          </p>
        </Callout>
        <div className="field">
          <label htmlFor="aadhaarDemo">डेमो आधार संख्या</label>
          <input
            id="aadhaarDemo"
            className="mono"
            inputMode="numeric"
            maxLength={12}
            value={form.aadhaarDemo}
            onChange={(e) => set("aadhaarDemo", e.target.value.replace(/\D/g, "").slice(0, 12))}
          />
        </div>
        <div className="field">
          <label htmlFor="mobile">आधार से जुड़ा मोबाइल नंबर</label>
          <input
            id="mobile"
            inputMode="numeric"
            maxLength={10}
            value={form.mobile}
            onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
          />
          <span className="field-hint">
            असली पोर्टल पर यह नंबर OTR से हमेशा के लिए जुड़ जाता है और ऑनलाइन बदला नहीं जा सकता।
          </span>
        </div>
      </fieldset>

      <fieldset className="sheet stack" style={{ border: "1px solid var(--rule)" }}>
        <legend className="eyebrow">OTR विवरण</legend>
        <div className="field">
          <label htmlFor="nameHi">पूरा नाम (आधार जैसा)</label>
          <input id="nameHi" value={form.nameHi} onChange={(e) => set("nameHi", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="fatherNameHi">पिता का नाम</label>
          <input
            id="fatherNameHi"
            value={form.fatherNameHi}
            onChange={(e) => set("fatherNameHi", e.target.value)}
          />
          <span className="field-hint">
            हाई स्कूल मार्कशीट जैसा ही — असली पोर्टल पर यह बाद में बदला नहीं जा सकता।
          </span>
        </div>
        <div className="field">
          <label htmlFor="motherNameHi">माता का नाम</label>
          <input
            id="motherNameHi"
            value={form.motherNameHi}
            onChange={(e) => set("motherNameHi", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="dob">जन्मतिथि</label>
          <input id="dob" type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="gender">लिंग</label>
          <select id="gender" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="f">महिला</option>
            <option value="m">पुरुष</option>
            <option value="o">अन्य</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="category">वर्ग</label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.hi}
              </option>
            ))}
          </select>
          <span className="field-hint">
            प्रमाणपत्र के अनुसार ही चुनें — आय सीमा इसी से तय होती है।
          </span>
        </div>
        <div className="field">
          <label htmlFor="districtCode">जिला</label>
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
          <label htmlFor="addressHi">पता</label>
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
          {busy ? "बना रहे हैं…" : "OTR बनाएँ"}
        </button>
        <button className="btn btn-quiet" type="button" onClick={recover} disabled={busy}>
          पहले से OTR है? इस मोबाइल से खोजें
        </button>
      </div>
    </form>
  );
}
