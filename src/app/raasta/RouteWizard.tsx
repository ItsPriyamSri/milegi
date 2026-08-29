"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, errorOf, type ApiError } from "@/lib/api";
import { Callout, ErrorNote, StatusChip } from "@/ui/bits";
import { fmtDate, fmtMoney } from "@/lib/format";

type RouteResult = {
  track: string;
  cycle: "fresh" | "renewal";
  reasonHi: string;
  reasonEn?: string;
  recoveryHi: string;
  recoveryEn?: string;
  warnHi: string | null;
  warnEn?: string | null;
  schemeHi: string;
  schemeEn?: string;
  classesHi: string;
  classesEn?: string;
  calendar: { registrationOpen: string; studentDeadline: string; disbursementFrom: string };
};

type Institute = {
  id: string;
  nameHi: string;
  nameEn?: string;
  districtCode?: string;
  districtHi: string;
  districtEn?: string;
  kind: string;
  affiliatedTo: string | null;
  clerkNameHi: string;
  clerkNameEn?: string;
  courses: {
    code: string;
    nameHi: string;
    nameEn?: string;
    published: boolean;
    tuition: number;
    excluded: { key: string; amount: number }[];
  }[];
};

const KIND_FOR_TRACK: Record<string, string[]> = {
  pre_9_10: ["school"],
  post_inter: ["school"],
  dashmottar: ["college", "iti", "university"],
  outside_state: ["college", "iti", "university"],
};

export function RouteWizard() {
  const router = useRouter();
  const [answers, setAnswers] = useState({
    studying: "college",
    firstYear: false,
    gotLastYear: "dunno",
    changedCourse: false,
    rejectedLastYear: false,
    inUp: true,
  });
  const [result, setResult] = useState<RouteResult | null>(null);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [query, setQuery] = useState("");
  const [instituteId, setInstituteId] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ institutes: Institute[] }>(`/api/institutes?q=${encodeURIComponent(query)}`)
      .then((res) => {
        if (!cancelled) setInstitutes(res.institutes);
      })
      .catch((e) => {
        if (!cancelled) setError(errorOf(e));
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  async function resolve() {
    setBusy(true);
    setError(null);
    try {
      setResult(await api.post<RouteResult>("/api/route", answers));
      setInstituteId("");
      setCourseCode("");
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    if (!result || !instituteId || !courseCode) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ case: { id: string } }>("/api/cases", {
        track: result.track,
        cycle: result.cycle,
        instituteId,
        courseCode,
      });
      router.push(`/taiyari/${res.case.id}`);
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(false);
    }
  }

  const allowedKinds = result ? KIND_FOR_TRACK[result.track] ?? [] : [];
  const visible = institutes.filter((i) => {
    if (!result) return true;
    if (i.id === "inst-other") return result.track !== "outside_state";
    if (!allowedKinds.includes(i.kind)) return false;
    const outside = i.districtCode === "OS";
    return result.track === "outside_state" ? outside : !outside;
  });
  const chosen = visible.find((i) => i.id === instituteId);

  return (
    <div className="stack" style={{ ["--gap" as string]: "var(--s5)" }}>
      <div className="sheet stack">
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="eyebrow">1. What are you studying currently?</legend>
          <div className="stack" style={{ ["--gap" as string]: "var(--s1)", marginTop: "var(--s2)" }}>
            {[
              { v: "class_9_10", l: "Class 9 or 10 / कक्षा 9 या 10" },
              { v: "class_11_12", l: "Class 11 or 12 / कक्षा 11 या 12" },
              { v: "college", l: "College, Diploma, ITI, or Degree / कॉलेज या विश्वविद्यालय" },
            ].map((o) => (
              <label className="check" key={o.v}>
                <input
                  type="radio"
                  name="studying"
                  checked={answers.studying === o.v}
                  onChange={() => setAnswers((a) => ({ ...a, studying: o.v }))}
                />
                <span>{o.l}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="eyebrow">2. Is this your first year in this course?</legend>
          <div className="row" style={{ marginTop: "var(--s2)" }}>
            {[
              { v: true, l: "Yes / हाँ" },
              { v: false, l: "No / नहीं" },
            ].map((o) => (
              <label className="check" key={String(o.v)}>
                <input
                  type="radio"
                  name="firstYear"
                  checked={answers.firstYear === o.v}
                  onChange={() => setAnswers((a) => ({ ...a, firstYear: o.v }))}
                />
                <span>{o.l}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="eyebrow">3. Did you receive scholarship last year for this course?</legend>
          <div className="row" style={{ marginTop: "var(--s2)" }}>
            {[
              { v: "yes", l: "Yes / हाँ" },
              { v: "no", l: "No / नहीं" },
              { v: "dunno", l: "Don't know / पता नहीं" },
            ].map((o) => (
              <label className="check" key={o.v}>
                <input
                  type="radio"
                  name="gotLastYear"
                  checked={answers.gotLastYear === o.v}
                  onChange={() => setAnswers((a) => ({ ...a, gotLastYear: o.v }))}
                />
                <span>{o.l}</span>
              </label>
            ))}
          </div>
          <p className="field-hint" style={{ marginTop: "var(--s2)" }}>
            &ldquo;Don&apos;t know&rdquo; is a valid answer — the router will safely look up previous session records.
          </p>
        </fieldset>

        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="eyebrow">Special Circumstances</legend>
          <label className="check">
            <input
              type="checkbox"
              checked={answers.changedCourse}
              onChange={(e) => setAnswers((a) => ({ ...a, changedCourse: e.target.checked }))}
            />
            <span>Changed course or college / कोर्स या कॉलेज बदला है</span>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={answers.rejectedLastYear}
              onChange={(e) => setAnswers((a) => ({ ...a, rejectedLastYear: e.target.checked }))}
            />
            <span>Rejected last academic year / पिछले साल निरस्त हुआ था</span>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={!answers.inUp}
              onChange={(e) => setAnswers((a) => ({ ...a, inUp: !e.target.checked }))}
            />
            <span>Studying outside Uttar Pradesh / उत्तर प्रदेश से बाहर</span>
          </label>
        </fieldset>

        <button className="btn btn-primary" type="button" onClick={resolve} disabled={busy}>
          {busy ? "Resolving Track…" : "Determine Application Track →"}
        </button>
      </div>

            {error ? <ErrorNote error={error} lang="en" /> : null}

      {result ? (
        <>
          <div className="sheet stack">
            <p className="eyebrow">Resolved Application Track</p>
            <div className="row-between">
              <h2 style={{ fontSize: "var(--step-3)" }}>{result.schemeEn ?? result.schemeHi}</h2>
              <StatusChip tone={result.cycle === "renewal" ? "verified" : "waiting"}>
                {result.cycle === "renewal" ? "Renewal / नवीनीकरण" : "Fresh / नया आवेदन"}
              </StatusChip>
            </div>
            <p>{result.reasonEn ?? result.reasonHi}</p>
            <dl style={{ margin: 0 }}>
              <div className="datarow">
                <dt>Class / Level</dt>
                <dd>{result.classesEn ?? result.classesHi}</dd>
              </div>
              <div className="datarow">
                <dt>Portal Opens</dt>
                <dd>{fmtDate(result.calendar.registrationOpen)}</dd>
              </div>
              <div className="datarow">
                <dt>Student Deadline</dt>
                <dd>{fmtDate(result.calendar.studentDeadline)}</dd>
              </div>
              <div className="datarow">
                <dt>Disbursement Begins</dt>
                <dd>{fmtDate(result.calendar.disbursementFrom)}</dd>
              </div>
            </dl>
            <p className="faint" style={{ fontSize: "var(--step-s)" }}>
              {result.recoveryEn ?? result.recoveryHi}
            </p>
            {result.warnEn || result.warnHi ? <Callout tone="warn">{result.warnEn ?? result.warnHi}</Callout> : null}
          </div>

          <div className="sheet stack">
            <p className="eyebrow">Select Your Institute</p>
            <div className="field">
              <label htmlFor="q">Institute Name or District / खोजें</label>
              <input id="q" value={query} placeholder="Search college or school..." onChange={(e) => setQuery(e.target.value)} />
            </div>
            {visible.length === 0 ? (
              <Callout tone="warn" title="Institute Not Found in Master Data">
                <p style={{ fontSize: "var(--step-s)" }}>
                  If your college is unlisted, the institute clerk has not yet published master data for this session.
                </p>
              </Callout>
            ) : (
              <div className="stack" style={{ ["--gap" as string]: "var(--s1)" }}>
                {visible.map((i) => (
                  <label className="check" key={i.id}>
                    <input
                      type="radio"
                      name="institute"
                      checked={instituteId === i.id}
                      onChange={() => {
                        setInstituteId(i.id);
                        setCourseCode("");
                      }}
                    />
                    <span>
                      {i.nameEn ?? i.nameHi}
                      <span className="faint" style={{ fontSize: "var(--step-s)", display: "block" }}>
                        {i.districtEn ?? i.districtHi}
                        {i.affiliatedTo ? ` · ${i.affiliatedTo}` : ""} · Clerk: {i.clerkNameEn ?? i.clerkNameHi}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {chosen ? (
              <>
                <p className="eyebrow" style={{ marginTop: "var(--s3)" }}>
                  Select Course
                </p>
                <div className="stack" style={{ ["--gap" as string]: "var(--s1)" }}>
                  {chosen.courses.map((c) => (
                    <label className="check" key={c.code} style={{ opacity: c.published ? 1 : 0.6 }}>
                      <input
                        type="radio"
                        name="course"
                        disabled={!c.published}
                        checked={courseCode === c.code}
                        onChange={() => setCourseCode(c.code)}
                      />
                      <span>
                        {c.nameEn ?? c.nameHi}
                        <span className="faint" style={{ fontSize: "var(--step-s)", display: "block" }}>
                          {c.published
                            ? `Non-refundable Tuition: ${fmtMoney(c.tuition)} (Auto-fetched from master data)`
                            : "Not published by institute for current session"}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </>
            ) : null}

            <button
              className="btn btn-primary"
              type="button"
              onClick={start}
              disabled={busy || !instituteId || !courseCode}
            >
              {busy ? "Creating Application File…" : "Continue to Pre-flight Audit →"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

