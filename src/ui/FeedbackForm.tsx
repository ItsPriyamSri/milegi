"use client";

import { useState, type FormEvent } from "react";
import { Callout } from "@/ui/bits";

export function FeedbackForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    category: "general",
    subject: "general",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const id = `FDBK-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    setRefId(id);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Callout tone="ok" title="✓ Feedback Submitted Successfully">
        <p style={{ fontSize: "var(--step-0)", fontWeight: 600, color: "var(--ink)" }}>
          Thank you for your feedback! Reference ID: <code className="mono">{refId}</code>
        </p>
        <p style={{ fontSize: "var(--step-s)", marginTop: "var(--s2)" }}>
          Your suggestions have been recorded for the scholarship portal review committee.
        </p>
        <button
          className="btn btn-sm btn-quiet"
          type="button"
          style={{ marginTop: "var(--s3)" }}
          onClick={() => {
            setSubmitted(false);
            setForm({ name: "", email: "", mobile: "", category: "general", subject: "general", message: "" });
          }}
        >
          Submit Another Feedback
        </button>
      </Callout>
    );
  }

  return (
    <form className="stack" style={{ ["--gap" as string]: "var(--s4)" }} onSubmit={submit}>
      <div className="bento-grid bento-grid-2" style={{ gap: "var(--s3)" }}>
        <div className="field">
          <label htmlFor="f-name">Your Full Name / नाम *</label>
          <input
            id="f-name"
            required
            placeholder="e.g. Ramesh Kumar"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
        </div>

        <div className="field">
          <label htmlFor="f-email">Your Email Address / ईमेल *</label>
          <input
            id="f-email"
            type="email"
            required
            placeholder="e.g. ramesh@example.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
        </div>
      </div>

      <div className="bento-grid bento-grid-2" style={{ gap: "var(--s3)" }}>
        <div className="field">
          <label htmlFor="f-mobile">10-Digit Mobile Number / मोबाइल *</label>
          <input
            id="f-mobile"
            inputMode="numeric"
            maxLength={10}
            required
            placeholder="e.g. 9876543210"
            value={form.mobile}
            onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
          />
        </div>

        <div className="field">
          <label htmlFor="f-subject">Feedback Category / विषय *</label>
          <select
            id="f-subject"
            value={form.subject}
            onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          >
            <option value="general">General Portal Feedback / सामान्य सुझाव</option>
            <option value="otr">OTR Registration Issue / OTR पंजीकरण</option>
            <option value="application">Scholarship Application Process / आवेदन प्रक्रिया</option>
            <option value="disbursal">Fee Reimbursement / शुल्क प्रतिपूर्ति</option>
            <option value="grievance">Grievance Portal Query / शिकायत निवारण</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label>Social Category / वर्ग *</label>
        <div className="row" style={{ gap: "var(--s4)", marginTop: "4px" }}>
          {[
            { id: "obc", label: "OBC / पिछड़ा वर्ग" },
            { id: "sc", label: "SC / अनुसूचित जाति" },
            { id: "st", label: "ST / अनुसूचित जनजाति" },
            { id: "minority", label: "Minority / अल्पसंख्यक" },
            { id: "general", label: "General / सामान्य" },
          ].map((c) => (
            <label key={c.id} className="row" style={{ gap: "6px", cursor: "pointer", fontSize: "var(--step-s)", fontWeight: 500 }}>
              <input
                type="radio"
                name="f-category"
                checked={form.category === c.id}
                onChange={() => setForm((p) => ({ ...p, category: c.id }))}
              />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-message">Your Feedback Message / संदेश *</label>
        <textarea
          id="f-message"
          required
          rows={4}
          placeholder="Describe your feedback, suggestion, or query in detail..."
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
        />
      </div>

      <button className="btn btn-primary" type="submit" disabled={!form.name || !form.email || form.mobile.length !== 10 || !form.message}>
        Send Feedback / सुझाव भेजें →
      </button>
    </form>
  );
}
