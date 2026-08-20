"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function CopyDraft({ text, caseId }: { text: string; caseId: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="row">
      <button
        type="button"
        className="btn btn-primary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
          } catch {
            setCopied(false);
          }
          // Recorded on the case so the timeline shows the escalation was prepared.
          void api.post(`/api/cases/${caseId}/grievance`).catch(() => undefined);
        }}
      >
        {copied ? "कॉपी हो गया" : "मसौदा कॉपी करें"}
      </button>
      <span className="faint" style={{ fontSize: "var(--step-s)" }}>
        भेजने से पहले विवरण एक बार पढ़ लें।
      </span>
    </div>
  );
}
