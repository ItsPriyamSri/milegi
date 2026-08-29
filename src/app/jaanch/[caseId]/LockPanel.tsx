"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { ErrorNote } from "@/ui/bits";

export function LockPanel({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function lock(crash = false) {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/api/cases/${caseId}/lock${crash ? "?crash=1" : ""}`);
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
      {error ? <ErrorNote error={error} lang="en" /> : null}
      <div className="row" style={{ width: "100%", gap: "var(--s3)" }}>
        <button className="btn btn-primary btn-block" type="button" onClick={() => lock()} disabled={busy}>
          {busy ? "Locking Application…" : "Lock Application / फ़ॉर्म लॉक करें"}
        </button>
        <button className="btn btn-block" type="button" onClick={() => window.print()}>
          Print Draft / प्रिंट करें
        </button>
      </div>
      <button
        className="btn btn-quiet btn-sm"
        type="button"
        disabled={busy}
        onClick={() => lock(true)}
      >
        Simulate 502 / crash — see the human error (draft stays)
      </button>
    </div>
  );
}

