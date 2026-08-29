import type { JSX } from "react";

export function NewsTicker(): JSX.Element {
  return (
    <div
      style={{
        background: "var(--brand-gold-subtle)",
        border: "1px solid var(--brand-gold-border)",
        borderRadius: "14px",
        padding: "var(--s4) var(--s5)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s3)",
      }}
    >
      <div className="row-between">
        <div className="row" style={{ gap: "var(--s2)" }}>
          <span className="pulse-dot" style={{ background: "var(--brand-gold)" }} />
          <span className="eyebrow" style={{ color: "var(--brand-gold)", fontWeight: 800 }}>
            SESSION 2026-27 · PUBLISHED CALENDAR (SYNTHETIC DEMO)
          </span>
        </div>
        <span className="chip" data-tone="waiting" style={{ fontSize: "0.75rem" }}>
          DEMO NOTICE
        </span>
      </div>

      <div className="bento-grid bento-grid-3" style={{ gap: "var(--s3)" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--rule)",
            borderRadius: "10px",
            padding: "var(--s3) var(--s4)",
          }}
        >
          <div className="row-between">
            <span className="chip" data-tone="verified" style={{ fontSize: "0.7rem" }}>
              POSTMATRIC TIMETABLE
            </span>
            <span className="faint" style={{ fontSize: "0.75rem" }}>Session 2026-27</span>
          </div>
          <p style={{ fontSize: "var(--step-s)", fontWeight: 600, marginTop: "6px", color: "var(--ink)" }}>
            Application submission window open for SC, ST, OBC, General & Minority students.
          </p>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--rule)",
            borderRadius: "10px",
            padding: "var(--s3) var(--s4)",
          }}
        >
          <div className="row-between">
            <span className="chip" data-tone="paid" style={{ fontSize: "0.7rem" }}>
              AADHAAR & NPCI MANDATE
            </span>
            <span className="faint" style={{ fontSize: "0.75rem" }}>Mandatory</span>
          </div>
          <p style={{ fontSize: "var(--step-s)", fontWeight: 600, marginTop: "6px", color: "var(--ink)" }}>
            Ensure your bank account is seeded with Aadhaar for Direct Benefit Transfer (DBT) credit.
          </p>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--rule)",
            borderRadius: "10px",
            padding: "var(--s3) var(--s4)",
          }}
        >
          <div className="row-between">
            <span className="chip" data-tone="breach" style={{ fontSize: "0.7rem" }}>
              INSTITUTE VERIFICATION
            </span>
            <span className="faint" style={{ fontSize: "0.75rem" }}>Strict SLA</span>
          </div>
          <p style={{ fontSize: "var(--step-s)", fontWeight: 600, marginTop: "6px", color: "var(--ink)" }}>
            Institutes must verify student hard copies & 75%+ attendance before forwarding to DWO.
          </p>
        </div>
      </div>
    </div>
  );
}
