"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { useAutosave } from "@/lib/useAutosave";
import { fmtDate, fmtMoney } from "@/lib/format";
import { Callout, ErrorNote } from "@/ui/bits";
import { SaveChip } from "@/ui/SaveChip";
import { FIELDS, isRequired, validateField, type FieldSpec } from "@/server/fields";
import { SCHEMES, type SectionId } from "@/server/config/schemes";
import type { Cycle, TrackId } from "@/server/types";

const SECTION_TITLES: Record<SectionId, { en: string; hi: string }> = {
  identity: { en: "Identity", hi: "पहचान" },
  education: { en: "Education Details", hi: "शिक्षा" },
  previous_result: { en: "Previous Academic Result", hi: "पिछला परिणाम" },
  family_docs: { en: "Family & Certificate Details", hi: "परिवार और प्रमाणपत्र" },
  fee: { en: "Fee Head Breakdown", hi: "शुल्क" },
  declaration: { en: "Declaration", hi: "घोषणा" },
};

export type FormShellProps = {
  caseId: string;
  track: TrackId;
  cycle: Cycle;
  initial: Record<string, unknown>;
  provenance: Record<string, string>;
  identityRows: { label: string; value: string; provenance?: string }[];
  fee: {
    nonRefundable: number;
    excluded: { key: string; amount: number }[];
    disputed: { note: string; at: string } | null;
    courseNameHi: string;
    instituteNameHi: string;
  };
  estimate: { total: number; basisHi: string };
  deadline: string | null;
  stage: string;
  correctionFields: string[];
  lang?: "en" | "hi";
};

const EXCLUDED_LABEL: Record<string, { en: string; hi: string }> = {
  exam: { en: "Exam Fee", hi: "परीक्षा शुल्क" },
  hostel: { en: "Hostel Fee", hi: "छात्रावास" },
  mess: { en: "Mess Fee", hi: "मेस" },
  caution: { en: "Caution Deposit", hi: "कॉशन मनी" },
  library: { en: "Library Deposit", hi: "पुस्तकालय जमानत" },
};

export function FormShell(props: FormShellProps) {
  const { caseId, track, cycle } = props;
  const lang = props.lang ?? "en";
  const { values, update, saveState, lastError, fieldErrors, serverExtras } = useAutosave(
    caseId,
    props.initial,
  );
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeNote, setDisputeNote] = useState("");
  const [disputeError, setDisputeError] = useState<ApiError | null>(null);
  const [disputed, setDisputed] = useState(props.fee.disputed);

  const sections = SCHEMES[track].sections;
  const editable = props.stage === "draft" || props.stage === "returned_to_student";
  const correctionOnly = props.stage === "correction_required";

  const specsBySection = useMemo(() => {
    const map = new Map<SectionId, FieldSpec[]>();
    for (const spec of Object.values(FIELDS)) {
      if (!sections.includes(spec.section)) continue;
      if (spec.section === "previous_result" && cycle !== "renewal" && !SCHEMES[track].needsMarks) continue;
      if (spec.readOnly) continue;
      const list = map.get(spec.section) ?? [];
      list.push(spec);
      map.set(spec.section, list);
    }
    return map;
  }, [sections, cycle, track]);

  function fieldEnabled(spec: FieldSpec): boolean {
    if (editable) return true;
    if (correctionOnly) return props.correctionFields.includes(spec.name);
    return false;
  }

  function localError(spec: FieldSpec): string | null {
    const v = values[spec.name];
    if (v === undefined || v === null || v === "") return null;
    return validateField(spec.name, v, values);
  }

  function completion(section: SectionId): string {
    const specs = specsBySection.get(section) ?? [];
    const required = specs.filter((s) => isRequired(s, { track, cycle }));
    const done = required.filter((s) => {
      const v = values[s.name];
      return v !== undefined && v !== null && v !== "" && v !== false;
    });
    return required.length === 0 ? "" : `${done.length}/${required.length} filled`;
  }

  async function raiseDispute() {
    setDisputeError(null);
    try {
      await api.post(`/api/cases/${caseId}/fee-dispute`, { note: disputeNote });
      setDisputed({ note: disputeNote, at: new Date().toISOString() });
      setDisputeOpen(false);
    } catch (e) {
      setDisputeError(errorOf(e));
    }
  }

  return (
    <div className="stack" style={{ ["--gap" as string]: "var(--s6)", paddingBottom: "96px" }}>
      {/* Connected Step Wizard Header */}
      <nav className="wizard-nav" aria-label="Application Sections">
        <span style={{ fontWeight: 800, fontSize: "var(--step-s)", color: "var(--brand-navy)", paddingRight: "var(--s2)" }}>
          FORM STEPS:
        </span>
        {sections.map((s, idx) => (
          <a className="step-pill" key={s} href={`#sec-${s}`}>
            <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>0{idx + 1}.</span>
            <span>{SECTION_TITLES[s].en}</span>
          </a>
        ))}
      </nav>

      {correctionOnly ? (
        <Callout tone="warn" title="Correction Window — Only flagged fields are unlocked">
          <p style={{ fontSize: "var(--step-s)" }}>
            Other fields are locked per department policy. After correction, submit updated hard copy to institute within 3 days.
          </p>
        </Callout>
      ) : null}
      {!editable && !correctionOnly ? (
        <Callout tone="info" title="This application is locked">
          <p style={{ fontSize: "var(--step-s)" }}>
            Once locked, online edits occur only during the official correction window. Check status <Link href={`/f/${caseId}`}>here</Link>.
          </p>
        </Callout>
      ) : null}

      <section id="sec-identity" className="stack">
        <div className="row-between">
          <h2>{SECTION_TITLES.identity.en} / {SECTION_TITLES.identity.hi}</h2>
          <span className="chip">Aadhaar e-KYC</span>
        </div>
        <dl className="sheet" style={{ margin: 0 }}>
          {props.identityRows.map((r) => (
            <div className="datarow" key={r.label}>
              <dt>{r.label}</dt>
              <dd>
                {r.value}
                {r.provenance ? <span className="prov">{r.provenance}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
        <p className="faint" style={{ fontSize: "var(--step-s)" }}>
          Name and date of birth are imported directly from Aadhaar e-KYC.
        </p>
      </section>

      {sections
        .filter((s) => s !== "identity" && s !== "fee")
        .map((section) => (
          <section id={`sec-${section}`} className="stack" key={section}>
            <div className="row-between">
              <h2>{SECTION_TITLES[section].en} / {SECTION_TITLES[section].hi}</h2>
              <span className="faint" style={{ fontSize: "var(--step-s)" }}>
                {completion(section)}
              </span>
            </div>
            <div className="sheet stack">
              {(specsBySection.get(section) ?? []).map((spec) => {
                const err = localError(spec) ?? (fieldErrors.includes(spec.name) ? "This edit was rejected at this stage" : null);
                const disabled = !fieldEnabled(spec);
                const id = `field-${spec.name}`;
                const value = values[spec.name];
                const labelText = lang === "en" ? spec.labelEn || spec.labelHi : spec.labelHi;
                const hintText = lang === "en" ? spec.hintEn || spec.hintHi : spec.hintHi;
                if (spec.type === "checkbox") {
                  return (
                    <label className="check" key={spec.name} htmlFor={id}>
                      <input
                        id={id}
                        type="checkbox"
                        disabled={disabled}
                        checked={value === true}
                        onChange={(e) => update(spec.name, e.target.checked)}
                      />
                      <span>
                        {labelText}
                        {hintText ? (
                          <span className="field-hint" style={{ display: "block" }}>
                            {hintText}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                }
                return (
                  <div className="field" key={spec.name}>
                    <label htmlFor={id}>
                      {labelText}
                      {isRequired(spec, { track, cycle }) ? (
                        <span className="faint"> *</span>
                      ) : null}
                    </label>
                    {spec.options ? (
                      <select
                        id={id}
                        disabled={disabled}
                        aria-invalid={err ? "true" : undefined}
                        aria-describedby={hintText ? `${id}-hint` : undefined}
                        value={String(value ?? "")}
                        onChange={(e) => update(spec.name, e.target.value)}
                      >
                        <option value="">— Select —</option>
                        {spec.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {lang === "en" ? o.en || o.hi : o.hi}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={id}
                        type={spec.type === "number" ? "number" : spec.type === "date" ? "date" : "text"}
                        inputMode={spec.type === "number" ? "numeric" : undefined}
                        disabled={disabled}
                        maxLength={spec.maxLen}
                        aria-invalid={err ? "true" : undefined}
                        aria-describedby={hintText ? `${id}-hint` : undefined}
                        value={String(value ?? "")}
                        onChange={(e) =>
                          update(
                            spec.name,
                            spec.type === "number" && e.target.value !== ""
                              ? Number(e.target.value)
                              : e.target.value,
                          )
                        }
                      />
                    )}
                    {hintText ? (
                      <span className="field-hint" id={`${id}-hint`}>
                        {hintText}
                      </span>
                    ) : null}
                    {err ? (
                      <span className="field-error" role="alert">
                        {err}
                      </span>
                    ) : null}
                  </div>
                );
              })}
              {section === "education" ? (
                <p className="faint" style={{ fontSize: "var(--step-s)" }}>
                  Hostel selection updates the maintenance allowance band in real time.
                </p>
              ) : null}
            </div>
          </section>
        ))}


      <section id="sec-fee" className="stack">
        <div className="row-between">
          <h2>{SECTION_TITLES.fee.en} / {SECTION_TITLES.fee.hi}</h2>
          <span className="chip">Master Data Auto-Fetched</span>
        </div>
        <div className="sheet stack">
          <dl style={{ margin: 0 }}>
            <div className="datarow">
              <dt>Non-refundable Tuition Fee (Eligible)</dt>
              <dd>
                <strong>{fmtMoney(props.fee.nonRefundable)}</strong>
              </dd>
            </div>
            {props.fee.excluded.map((h) => (
              <div className="datarow" key={h.key}>
                <dt>{EXCLUDED_LABEL[h.key]?.en ?? h.key}</dt>
                <dd className="strike">{fmtMoney(h.amount)}</dd>
              </div>
            ))}
          </dl>
          <p className="muted" style={{ fontSize: "var(--step-s)" }}>
            Non-refundable tuition fee is auto-fetched from master data. Excluded heads (hostel, mess, caution deposit) are struck out automatically.
          </p>

          <div className="money">
            <span className="money-label">{lang === "en" ? "Estimated benefit" : "अनुमानित लाभ"}</span>
            <span className="money-amount">
              {fmtMoney(serverExtras?.estimate?.total ?? props.estimate.total)}
            </span>
            <span className="money-basis">
              {serverExtras?.estimate?.basisHi ?? props.estimate.basisHi}
            </span>
          </div>

          {disputed ? (
            <Callout tone="warn" title={lang === "en" ? "Fee dispute on file" : "शुल्क आपत्ति दर्ज है"}>
              <p style={{ fontSize: "var(--step-s)" }}>
                {disputed.note} — {lang === "en" ? "the college clerk will see this" : "कॉलेज लिपिक को यह दिखेगी"} ({fmtDate(disputed.at)}).
              </p>
            </Callout>
          ) : disputeOpen ? (
            <div className="stack">
              <div className="field">
                <label htmlFor="disputeNote">{lang === "en" ? "What does the receipt say?" : "रसीद में क्या लिखा है?"}</label>
                <input
                  id="disputeNote"
                  value={disputeNote}
                  onChange={(e) => setDisputeNote(e.target.value)}
                  placeholder={lang === "en" ? "e.g. receipt shows ₹21,300" : "जैसे: रसीद में ₹21,300 लिखा है"}
                />
              </div>
              {disputeError ? <ErrorNote error={disputeError} lang={lang} /> : null}
              <div className="row">
                <button className="btn" type="button" onClick={raiseDispute}>
                  {lang === "en" ? "File dispute" : "आपत्ति दर्ज करें"}
                </button>
                <button className="btn btn-quiet" type="button" onClick={() => setDisputeOpen(false)}>
                  {lang === "en" ? "Cancel" : "रहने दें"}
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-sm" type="button" onClick={() => setDisputeOpen(true)}>
              {lang === "en" ? "Receipt does not match" : "रसीद मेल नहीं खाती"}
            </button>
          )}
        </div>
      </section>

      {lastError ? <ErrorNote error={lastError} lang={lang} /> : null}

      <div
        className="row-between noprint"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: "var(--surface)",
          borderTop: "1px solid var(--rule)",
          padding: "var(--s3) var(--s4)",
          gap: "var(--s3)",
          zIndex: 5,
        }}
      >
        <SaveChip state={lastError ? "error" : saveState} />
        <span className="faint tnum" style={{ fontSize: "var(--step-s)" }}>
          {lang === "en" ? "Deadline" : "अंतिम तारीख़"} {fmtDate(props.deadline)}
        </span>
        <Link className="btn btn-primary" href={`/jaanch/${caseId}`}>
          {lang === "en" ? "Review and lock" : "जाँच करें और लॉक करें"}
        </Link>
      </div>
    </div>
  );
}
