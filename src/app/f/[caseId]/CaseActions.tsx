"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { ErrorNote } from "@/ui/bits";

type Action = "nudge" | "retry-payment" | "resubmit";

const LABEL: Record<Action, { idle: string; busy: string }> = {
  nudge: { idle: "अनुस्मारक भेजें", busy: "भेज रहे हैं…" },
  "retry-payment": { idle: "बैंक ठीक हो गया — भुगतान दोबारा भेजें", busy: "भेज रहे हैं…" },
  resubmit: { idle: "सुधार के बाद दोबारा जमा करें", busy: "जमा कर रहे हैं…" },
};

export function CaseActions({ caseId, actions }: { caseId: string; actions: Action[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function run(action: Action) {
    setBusy(action);
    setError(null);
    try {
      await api.post(`/api/cases/${caseId}/${action}`);
      setDone(
        action === "nudge"
          ? "अनुस्मारक दर्ज हो गया — प्रतीक्षा की गिनती जान-बूझकर वहीं रहती है।"
          : "हो गया।",
      );
      router.refresh();
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack" style={{ ["--gap" as string]: "var(--s2)" }}>
      <div className="row">
        {actions.map((a) => (
          <button
            key={a}
            type="button"
            className={a === "nudge" ? "btn" : "btn btn-primary"}
            disabled={busy !== null}
            onClick={() => run(a)}
          >
            {busy === a ? LABEL[a].busy : LABEL[a].idle}
          </button>
        ))}
      </div>
      {done ? (
        <p className="faint" style={{ fontSize: "var(--step-s)" }}>
          {done}
        </p>
      ) : null}
      {error ? <ErrorNote error={error} /> : null}
    </div>
  );
}
