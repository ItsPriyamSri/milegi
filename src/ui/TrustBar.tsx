import type { JSX } from "react";

export function TrustBar(): JSX.Element {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--rule-strong)",
        borderRadius: "14px",
        padding: "var(--s4) var(--s5)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="row-between" style={{ flexWrap: "wrap", gap: "var(--s3)" }}>
        <div className="row" style={{ gap: "var(--s2)" }}>
          <span className="chip" data-tone="verified" style={{ fontWeight: 700 }}>
            MOCKED INTEGRATIONS · NOT A GOVERNMENT SITE
          </span>
          <span className="faint" style={{ fontSize: "var(--step-s)" }}>
            Proactive e-Governance Stack · Direct Benefit Transfer (DBT)
          </span>
        </div>

        <div className="row" style={{ gap: "var(--s4)", flexWrap: "wrap", fontSize: "var(--step-s)", fontWeight: 600 }}>
          <div className="row" style={{ gap: "6px", color: "var(--ink-secondary)" }}>
            <span style={{ color: "var(--verified)" }}>✓</span>
            <span>Aadhaar UIDAI (e-KYC)</span>
          </div>

          <span style={{ color: "var(--rule-strong)" }}>•</span>

          <div className="row" style={{ gap: "6px", color: "var(--ink-secondary)" }}>
            <span style={{ color: "var(--action)" }}>🔒</span>
            <span>DigiLocker Verified</span>
          </div>

          <span style={{ color: "var(--rule-strong)" }}>•</span>

          <div className="row" style={{ gap: "6px", color: "var(--ink-secondary)" }}>
            <span style={{ color: "#d97706" }}>⚡</span>
            <span>PFMS / NPCI DBT Gateway</span>
          </div>

          <span style={{ color: "var(--rule-strong)" }}>•</span>

          <div className="row" style={{ gap: "6px", color: "var(--ink-secondary)" }}>
            <span style={{ color: "var(--verified)" }}>✍</span>
            <span>Digital Signature Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
