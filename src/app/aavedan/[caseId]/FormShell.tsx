"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { useAutosave } from "@/lib/useAutosave";
import { fmtDate, fmtMoney } from "@/lib/format";
import { Callout, ErrorNote } from "@/ui/bits";
import { FIELDS, isRequired, validateField, type FieldSpec } from "@/server/fields";
import { SCHEMES, type SectionId } from "@/server/config/schemes";
import type { Cycle, TrackId } from "@/server/types";

const SECTION_TITLES: Record<SectionId, string> = {
  identity: "पहचान",
  education: "शिक्षा",
  previous_result: "पिछला परिणाम",
  family_docs: "परिवार और प्रमाणपत्र",
  fee: "शुल्क",
  declaration: "घोषणा",
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
};

const EXCLUDED_LABEL: Record<string, string> = {
  exam: "परीक्षा शुल्क",
  hostel: "छात्रावास",
  mess: "मेस",
  caution: "कॉशन मनी",
  library: "पुस्तकालय जमानत",
};

export function FormShell(props: FormShellProps) {
  const { caseId, track, cycle } = props;
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

  const saveLabel =
    saveState === "saved" ? "सेव हो गया" : saveState === "pending" ? "अभी सिंक नहीं हुआ" : "इस फोन पर सेव है";

  function completion(section: SectionId): string {
    const specs = specsBySection.get(section) ?? [];
    const required = specs.filter((s) => isRequired(s, { track, cycle }));
    const done = required.filter((s) => {
      const v = values[s.name];
      return v !== undefined && v !== null && v !== "" && v !== false;
    });
    return required.length === 0 ? "" : `${done.length}/${required.length} भर गए`;
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
      <nav className="row" aria-label="भाग">
        {sections.map((s) => (
          <a className="btn btn-quiet" key={s} href={`#sec-${s}`}>
            {SECTION_TITLES[s]}
          </a>
        ))}
      </nav>

      {correctionOnly ? (
        <Callout tone="warn" title="सुधार विंडो — केवल आपत्ति वाले खाने खुले हैं">
          <p style={{ fontSize: "var(--step-s)" }}>
            बाकी खाने बंद हैं, क्योंकि विभाग की सुधार विंडो में केवल चिह्नित जानकारी बदली जा सकती है।
            सुधार के बाद नई प्रति 3 दिन में कॉलेज में जमा करनी होगी।
          </p>
        </Callout>
      ) : null}
      {!editable && !correctionOnly ? (
        <Callout tone="info" title="यह आवेदन लॉक है">
          <p style={{ fontSize: "var(--step-s)" }}>
            लॉक के बाद ऑनलाइन बदलाव सिर्फ़ विभाग की सुधार विंडो में होता है। फ़ाइल की स्थिति{" "}
            <Link href={`/f/${caseId}`}>यहाँ</Link> देखें।
          </p>
        </Callout>
      ) : null}

      <section id="sec-identity" className="stack">
        <div className="row-between">
          <h2>{SECTION_TITLES.identity}</h2>
          <span className="chip">आधार से</span>
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
          नाम और जन्मतिथि आधार से आती है। गलत है तो पहले आधार सुधारें — यहाँ बदलने से फ़ाइल बाद में
          जिला स्तर पर रुकती है।
        </p>
      </section>

      {sections
        .filter((s) => s !== "identity" && s !== "fee")
        .map((section) => (
          <section id={`sec-${section}`} className="stack" key={section}>
            <div className="row-between">
              <h2>{SECTION_TITLES[section]}</h2>
              <span className="faint" style={{ fontSize: "var(--step-s)" }}>
                {completion(section)}
              </span>
            </div>
            <div className="sheet stack">
              {(specsBySection.get(section) ?? []).map((spec) => {
                const err = localError(spec) ?? (fieldErrors.includes(spec.name) ? "यह बदलाव इस चरण पर स्वीकार नहीं हुआ" : null);
                const disabled = !fieldEnabled(spec);
                const id = `field-${spec.name}`;
                const value = values[spec.name];
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
                        {spec.labelHi}
                        {spec.hintHi ? (
                          <span className="field-hint" style={{ display: "block" }}>
                            {spec.hintHi}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                }
                return (
                  <div className="field" key={spec.name}>
                    <label htmlFor={id}>
                      {spec.labelHi}
                      {isRequired(spec, { track, cycle }) ? (
                        <span className="faint"> *</span>
                      ) : null}
                    </label>
                    {spec.options ? (
                      <select
                        id={id}
                        disabled={disabled}
                        aria-invalid={err ? "true" : undefined}
                        aria-describedby={spec.hintHi ? `${id}-hint` : undefined}
                        value={String(value ?? "")}
                        onChange={(e) => update(spec.name, e.target.value)}
                      >
                        <option value="">— चुनें —</option>
                        {spec.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.hi}
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
                        aria-describedby={spec.hintHi ? `${id}-hint` : undefined}
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
                    {spec.hintHi ? (
                      <span className="field-hint" id={`${id}-hint`}>
                        {spec.hintHi}
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
                  छात्रावास चुनने पर रखरखाव भत्ता बदलता है — अनुमान अपने आप नीचे अपडेट होता है।
                </p>
              ) : null}
            </div>
          </section>
        ))}

      <section id="sec-fee" className="stack">
        <div className="row-between">
          <h2>{SECTION_TITLES.fee}</h2>
          <span className="chip">कॉलेज मास्टर डेटा से</span>
        </div>
        <div className="sheet stack">
          <dl style={{ margin: 0 }}>
            <div className="datarow">
              <dt>गैर-वापसी योग्य शुल्क (गिना जाता है)</dt>
              <dd>
                <strong>{fmtMoney(props.fee.nonRefundable)}</strong>
              </dd>
            </div>
            {props.fee.excluded.map((h) => (
              <div className="datarow" key={h.key}>
                <dt>{EXCLUDED_LABEL[h.key] ?? h.key}</dt>
                <dd className="strike">{fmtMoney(h.amount)}</dd>
              </div>
            ))}
          </dl>
          <p className="muted" style={{ fontSize: "var(--step-s)" }}>
            छात्रवृत्ति में केवल गैर-वापसी योग्य शुल्क आता है — छात्रावास, मेस, कॉशन मनी, पुस्तकालय और
            परीक्षा शुल्क नहीं। असली पोर्टल पर यह राशि छात्र खुद टाइप करता है, और गलत आँकड़ा महीनों बाद
            &ldquo;suspect data&rdquo; बनकर लौटता है।
          </p>
          <div className="money">
            <span className="money-label">अनुमानित लाभ</span>
            <span className="money-amount">
              {fmtMoney(serverExtras?.estimate?.total ?? props.estimate.total)}
            </span>
            <span className="money-basis">
              {serverExtras?.estimate?.basisHi ?? props.estimate.basisHi}
            </span>
          </div>

          {disputed ? (
            <Callout tone="warn" title="शुल्क आपत्ति दर्ज है">
              <p style={{ fontSize: "var(--step-s)" }}>
                {disputed.note} — कॉलेज लिपिक को यह दिखेगी ({fmtDate(disputed.at)})।
              </p>
            </Callout>
          ) : disputeOpen ? (
            <div className="stack">
              <div className="field">
                <label htmlFor="disputeNote">रसीद में क्या लिखा है?</label>
                <input
                  id="disputeNote"
                  value={disputeNote}
                  onChange={(e) => setDisputeNote(e.target.value)}
                  placeholder="जैसे: रसीद में ₹21,300 लिखा है"
                />
              </div>
              {disputeError ? <ErrorNote error={disputeError} /> : null}
              <div className="row">
                <button className="btn" type="button" onClick={raiseDispute}>
                  आपत्ति दर्ज करें
                </button>
                <button className="btn btn-quiet" type="button" onClick={() => setDisputeOpen(false)}>
                  रहने दें
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-sm" type="button" onClick={() => setDisputeOpen(true)}>
              रसीद मेल नहीं खाती
            </button>
          )}
        </div>
      </section>

      {lastError ? <ErrorNote error={lastError} /> : null}

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
        <span aria-live="polite" className="chip" data-tone={saveState === "saved" ? "verified" : "waiting"}>
          <span aria-hidden="true">{saveState === "saved" ? "✓" : "◕"}</span>
          {saveLabel}
        </span>
        <span className="faint tnum" style={{ fontSize: "var(--step-s)" }}>
          अंतिम तारीख़ {fmtDate(props.deadline)}
        </span>
        <Link className="btn btn-primary" href={`/jaanch/${caseId}`}>
          जाँच करें और लॉक करें
        </Link>
      </div>
    </div>
  );
}
