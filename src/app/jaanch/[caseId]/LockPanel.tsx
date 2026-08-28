"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { ErrorNote } from "@/ui/bits";

export function LockPanel({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function lock() {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/api/cases/${caseId}/lock`);
      router.push(`/f/${caseId}?locked=1`);
    } catch (e) {
      setError(errorOf(e));
      document.getElementById("lock-errors")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" id="lock-errors">
      {error ? <ErrorNote error={error} /> : null}
      <div className="row" style={{ width: "100%" }}>
        <button className="btn btn-primary btn-block" type="button" onClick={lock} disabled={busy}>
          {busy ? "लॉक कर रहे हैं…" : "फ़ॉर्म लॉक करें"}
        </button>
        <button className="btn btn-block" type="button" onClick={() => window.print()}>
          प्रिंट करें
        </button>
      </div>
    </div>
  );
}
