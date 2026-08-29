"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function QuickTracker() {
  const [code, setCode] = useState("");
  const router = useRouter();

  function handleTrack(e: FormEvent) {
    e.preventDefault();
    const clean = code.trim();
    if (!clean) return;
    router.push(`/t/${encodeURIComponent(clean)}`);
  }

  return (
    <form className="hero-quick-track" onSubmit={handleTrack}>
      <div className="row-between">
        <div className="row" style={{ gap: "var(--s2)" }}>
          <span className="pulse-dot" style={{ background: "var(--action-cyan)" }} />
          <span className="eyebrow" style={{ color: "var(--action-cyan)" }}>
            INSTANT FILE TRACKER · 1-CLICK DEMO
          </span>
        </div>
        <span className="faint" style={{ fontSize: "var(--step-s)" }}>
          Case ID (MLG-26-...) · Reg No · OTR
        </span>
      </div>

      <div className="hero-quick-track-row">
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Enter Case ID (MLG-26-...), 15-digit Reg No, or OTR (UP26-...)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              font: "inherit",
              fontSize: "15px",
              minHeight: "46px",
              padding: "10px var(--s4)",
              border: "1px solid var(--rule-strong)",
              borderRadius: "8px",
              background: "#ffffff",
              color: "var(--ink)",
              width: "100%",
            }}
          />
        </div>
        <button
          className="btn btn-cyan"
          type="submit"
          disabled={!code.trim()}
          style={{ whiteSpace: "nowrap" }}
        >
          Track File Instantly →
        </button>
      </div>
    </form>
  );
}
