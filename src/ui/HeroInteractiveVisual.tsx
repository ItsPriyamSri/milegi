"use client";

import { useState } from "react";
import Link from "next/link";

type CasePreview = {
  id: string;
  tabLabel: string;
  studentName: string;
  course: string;
  stage: string;
  stageBadgeTone: "waiting" | "verified" | "paid";
  owner: string;
  dueAt: string;
  amount: string;
  statusHi: string;
};

const PREVIEWS: CasePreview[] = [
  {
    id: "MLG-26-88941",
    tabLabel: "Fresh Application (नया आवेदन)",
    studentName: "Priya Sharma (प्रिया शर्मा)",
    course: "B.Tech Computer Science · CSJMU Kanpur",
    stage: "University Scrutiny / विश्वविद्यालय जाँच",
    stageBadgeTone: "waiting",
    owner: "Shri R. K. Verma (Scholarship Clerk)",
    dueAt: "Due in 3 Days (12 Sep 2026)",
    amount: "₹28,300",
    statusHi: "उपस्थिति 82% सत्यापित · सत्यापन प्रगति पर",
  },
  {
    id: "MLG-26-10294",
    tabLabel: "Renewal Case (नवीनीकरण)",
    studentName: "Rahul Kumar (राहुल कुमार)",
    course: "B.Sc Agriculture · Lucknow University",
    stage: "District Welfare Officer (DWO) Review / जिला अधिकारी जाँच",
    stageBadgeTone: "waiting",
    owner: "Mr. Anand Kumar Singh (DWO Cell)",
    dueAt: "Due in 1 Day (10 Sep 2026)",
    amount: "₹14,500",
    statusHi: "डिजिटल हस्ताक्षर पूर्ण · स्वीकृति के करीब",
  },
  {
    id: "MLG-26-90412",
    tabLabel: "DBT Paid (हस्तांतरित)",
    studentName: "Amit Gupta (अमित गुप्ता)",
    course: "Polytechnic Diploma · Govt Poly Bareilly",
    stage: "DBT Payment Credited / खाते में क्रेडिट",
    stageBadgeTone: "paid",
    owner: "PFMS NPCI Gateway",
    dueAt: "Completed on 02 Sep 2026",
    amount: "₹18,600",
    statusHi: "Aadhaar Seeded Bank Account Credited (DBT Success)",
  },
];

export function HeroInteractiveVisual() {
  const [activeIdx, setActiveIdx] = useState(0);
  const current = PREVIEWS[activeIdx];

  return (
    <div
      className="stack"
      style={{
        ["--gap" as string]: "var(--s3)",
        background: "#ffffff",
        border: "1px solid var(--rule-strong)",
        borderRadius: "16px",
        padding: "var(--s4)",
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}
    >
      {/* Top Graphic Illustration Header */}
      <div
        style={{
          position: "relative",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid var(--rule)",
          maxHeight: "180px",
          background: "var(--brand-navy)",
        }}
      >
        <img
          src="/hero_card_clean_bg.png"
          alt="UP Student Scholarship & University Campus Graphic"
          style={{
            width: "100%",
            height: "180px",
            objectFit: "cover",
            display: "block",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(to top, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.1))",
            padding: "var(--s3) var(--s4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span className="chip" style={{ background: "var(--brand-gold)", color: "#000000", fontWeight: 800, border: "none" }}>
            LIVE DEMO INSPECTOR
          </span>
          <span style={{ color: "#ffffff", fontSize: "0.75rem", fontWeight: 700, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
            Interactive File Tracker
          </span>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div
        className="row"
        style={{
          gap: "6px",
          overflowX: "auto",
          whiteSpace: "nowrap",
          paddingBottom: "4px",
        }}
      >
        {PREVIEWS.map((p, idx) => (
          <button
            key={p.id}
            type="button"
            className="btn btn-sm"
            onClick={() => setActiveIdx(idx)}
            style={{
              borderRadius: "8px",
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "6px 12px",
              background: idx === activeIdx ? "var(--brand-blue)" : "var(--surface-sunk)",
              color: idx === activeIdx ? "#ffffff" : "var(--ink-secondary)",
              border: idx === activeIdx ? "1px solid var(--brand-blue)" : "1px solid var(--rule)",
              transition: "all var(--ease-fast)",
            }}
          >
            {p.tabLabel}
          </button>
        ))}
      </div>

      {/* Dynamic Interactive Card Inspector */}
      <div
        className="stack"
        style={{
          ["--gap" as string]: "var(--s2)",
          background: "var(--surface-sunk)",
          padding: "var(--s3) var(--s4)",
          borderRadius: "12px",
          border: "1px solid var(--rule-strong)",
        }}
      >
        <div className="row-between">
          <div className="row" style={{ gap: "var(--s2)" }}>
            <span className="pulse-dot pulse-dot-warn" />
            <span className="mono" style={{ fontWeight: 800, fontSize: "var(--step-s)", color: "var(--brand-blue)" }}>
              {current.id}
            </span>
          </div>
          <span
            className="chip"
            data-tone={current.stageBadgeTone}
            style={{ fontWeight: 700, fontSize: "0.7rem" }}
          >
            {current.stage}
          </span>
        </div>

        <div style={{ fontWeight: 700, fontSize: "var(--step-s)", color: "var(--ink)" }}>
          {current.studentName}
        </div>
        <div className="faint" style={{ fontSize: "0.75rem" }}>
          {current.course}
        </div>

        <div
          className="row-between"
          style={{
            borderTop: "1px dashed var(--rule-strong)",
            paddingTop: "var(--s2)",
            marginTop: "2px",
          }}
        >
          <div>
            <div className="faint" style={{ fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 700 }}>
              NAMED STAGE OWNER
            </div>
            <div style={{ fontSize: "var(--step-s)", fontWeight: 700, color: "var(--brand-navy)" }}>
              {current.owner}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="faint" style={{ fontSize: "0.7rem", textTransform: "uppercase", fontWeight: 700 }}>
              ESTIMATED BENEFIT
            </div>
            <div className="mono" style={{ fontSize: "var(--step-1)", fontWeight: 800, color: "var(--brand-gold)" }}>
              {current.amount}
            </div>
          </div>
        </div>

        <div className="faint" style={{ fontSize: "0.75rem", color: "var(--ink-secondary)" }}>
          ⏱ {current.dueAt} · {current.statusHi}
        </div>

        <Link
          href={`/f/${current.id}`}
          className="btn btn-primary btn-sm btn-block"
          style={{ marginTop: "4px", justifyContent: "center" }}
        >
          Inspect Full Audit Trail ({current.id}) →
        </Link>
      </div>
    </div>
  );
}
