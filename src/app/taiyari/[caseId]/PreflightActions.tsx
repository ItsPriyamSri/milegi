"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { ErrorNote } from "@/ui/bits";

export function CertificateCheck({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<"income" | "caste">("income");
  const [applicationNo, setApplicationNo] = useState("");
  const [certNo, setCertNo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post(`/api/cases/${caseId}/verify-certificate`, { kind, applicationNo, certNo });
      router.refresh();
    } catch (err) {
      setError(errorOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="sheet stack" onSubmit={verify}>
      <p className="eyebrow">प्रमाणपत्र प्रमाणीकरण (ई-डिस्ट्रिक्ट, नकली)</p>
      <div className="field">
        <label htmlFor="kind">कौन-सा प्रमाणपत्र</label>
        <select id="kind" value={kind} onChange={(e) => setKind(e.target.value as "income" | "caste")}>
          <option value="income">आय प्रमाणपत्र</option>
          <option value="caste">जाति प्रमाणपत्र</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="applicationNo">आवेदन संख्या</label>
        <input
          id="applicationNo"
          className="mono"
          value={applicationNo}
          placeholder={kind === "income" ? "APP-2024-771201" : "APP-2019-118834"}
          onChange={(e) => setApplicationNo(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="certNo">प्रमाणपत्र संख्या</label>
        <input
          id="certNo"
          className="mono"
          value={certNo}
          placeholder={kind === "income" ? "IC-2024-771201" : "CC-2019-118834"}
          onChange={(e) => setCertNo(e.target.value)}
        />
        <span className="field-hint">
          डेमो रिकॉर्ड: वैध आय IC-2024-771201 · वैधता बीत चुकी IC-2021-330077 · सीमा से ऊपर आय
          IC-2026-909090 · जाति CC-2019-118834
        </span>
      </div>
      {error ? <ErrorNote error={error} /> : null}
      <button className="btn" type="submit" disabled={busy || !certNo || !applicationNo}>
        {busy ? "जाँच रहे हैं…" : "प्रमाणित करें"}
      </button>
    </form>
  );
}

export function RerunPreflight({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  return (
    <>
      <button
        className="btn"
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await api.post(`/api/cases/${caseId}/preflight`);
            router.refresh();
          } catch (e) {
            setError(errorOf(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "जाँच रहे हैं…" : "दोबारा जाँचें"}
      </button>
      {error ? <ErrorNote error={error} /> : null}
    </>
  );
}
