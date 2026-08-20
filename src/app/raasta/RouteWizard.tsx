"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, errorOf, type ApiError } from "@/lib/api";
import { Callout, ErrorNote } from "@/ui/bits";
import { fmtDate, fmtMoney } from "@/lib/format";

type RouteResult = {
  track: string;
  cycle: "fresh" | "renewal";
  reasonHi: string;
  recoveryHi: string;
  warnHi: string | null;
  schemeHi: string;
  classesHi: string;
  calendar: { registrationOpen: string; studentDeadline: string; disbursementFrom: string };
};

type Institute = {
  id: string;
  nameHi: string;
  districtHi: string;
  kind: string;
  affiliatedTo: string | null;
  clerkNameHi: string;
  courses: {
    code: string;
    nameHi: string;
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
  const visible = institutes.filter((i) =>
    result
      ? allowedKinds.includes(i.kind) &&
        (result.track === "outside_state" ? i.districtHi.includes("बाहर") : !i.districtHi.includes("बाहर"))
      : true,
  );
  const chosen = visible.find((i) => i.id === instituteId);

  return (
    <div className="stack" style={{ ["--gap" as string]: "var(--s5)" }}>
      <div className="sheet stack">
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="eyebrow">1. अभी क्या पढ़ रहे हो?</legend>
          <div className="stack" style={{ ["--gap" as string]: "var(--s1)", marginTop: "var(--s2)" }}>
            {[
              { v: "class_9_10", l: "कक्षा 9 या 10" },
              { v: "class_11_12", l: "कक्षा 11 या 12" },
              { v: "college", l: "कॉलेज, डिप्लोमा या आई.टी.आई." },
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
          <legend className="eyebrow">2. क्या यह इस कोर्स का पहला साल है?</legend>
          <div className="row" style={{ marginTop: "var(--s2)" }}>
            {[
              { v: true, l: "हाँ" },
              { v: false, l: "नहीं" },
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
          <legend className="eyebrow">3. पिछले साल इसी कोर्स पर छात्रवृत्ति मिली थी?</legend>
          <div className="row" style={{ marginTop: "var(--s2)" }}>
            {[
              { v: "yes", l: "हाँ" },
              { v: "no", l: "नहीं" },
              { v: "dunno", l: "पता नहीं" },
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
            &ldquo;पता नहीं&rdquo; भी एक सही जवाब है। इससे पहले पुराना आवेदन खोजा जाता है, क्योंकि
            दूसरा OTR बन जाना ही सबसे बड़ा नुकसान है।
          </p>
        </fieldset>

        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="eyebrow">वे बातें जो असली पोर्टल पूछता ही नहीं</legend>
          <label className="check">
            <input
              type="checkbox"
              checked={answers.changedCourse}
              onChange={(e) => setAnswers((a) => ({ ...a, changedCourse: e.target.checked }))}
            />
            <span>कोर्स या कॉलेज बदला है</span>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={answers.rejectedLastYear}
              onChange={(e) => setAnswers((a) => ({ ...a, rejectedLastYear: e.target.checked }))}
            />
            <span>पिछले साल आवेदन अस्वीकृत हुआ था</span>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={!answers.inUp}
              onChange={(e) => setAnswers((a) => ({ ...a, inUp: !e.target.checked }))}
            />
            <span>संस्थान उत्तर प्रदेश के बाहर है</span>
          </label>
        </fieldset>

        <button className="btn btn-primary" type="button" onClick={resolve} disabled={busy}>
          {busy ? "देख रहे हैं…" : "बताइए, मैं कौन-सा आवेदन हूँ"}
        </button>
      </div>

      {error ? <ErrorNote error={error} /> : null}

      {result ? (
        <>
          <div className="sheet stack">
            <p className="eyebrow">आपका आवेदन</p>
            <h2>
              {result.schemeHi} · {result.cycle === "renewal" ? "नवीनीकरण" : "नया आवेदन"}
            </h2>
            <p>{result.reasonHi}</p>
            <dl style={{ margin: 0 }}>
              <div className="datarow">
                <dt>कक्षा / स्तर</dt>
                <dd>{result.classesHi}</dd>
              </div>
              <div className="datarow">
                <dt>विंडो खुलती है</dt>
                <dd>{fmtDate(result.calendar.registrationOpen)}</dd>
              </div>
              <div className="datarow">
                <dt>अंतिम तारीख़</dt>
                <dd>{fmtDate(result.calendar.studentDeadline)}</dd>
              </div>
              <div className="datarow">
                <dt>भुगतान अवधि शुरू</dt>
                <dd>{fmtDate(result.calendar.disbursementFrom)}</dd>
              </div>
            </dl>
            <p className="faint" style={{ fontSize: "var(--step-s)" }}>
              {result.recoveryHi}
            </p>
            {result.warnHi ? <Callout tone="warn">{result.warnHi}</Callout> : null}
          </div>

          <div className="sheet stack">
            <p className="eyebrow">संस्थान चुनें</p>
            <div className="field">
              <label htmlFor="q">संस्थान का नाम या जिला</label>
              <input id="q" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            {visible.length === 0 ? (
              <Callout tone="warn" title="यह संस्थान सूची में नहीं है">
                <p style={{ fontSize: "var(--step-s)" }}>
                  इसका मतलब है कि संस्थान ने इस सत्र का मास्टर डेटा प्रकाशित नहीं किया। कॉलेज के
                  छात्रवृत्ति नोडल अधिकारी से कहें: &ldquo;कृपया मास्टर डेटा में यह संस्थान और कोर्स
                  प्रकाशित करें।&rdquo;
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
                      {i.nameHi}
                      <span className="faint" style={{ fontSize: "var(--step-s)", display: "block" }}>
                        {i.districtHi}
                        {i.affiliatedTo ? ` · ${i.affiliatedTo}` : ""} · लिपिक {i.clerkNameHi}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {chosen ? (
              <>
                <p className="eyebrow" style={{ marginTop: "var(--s3)" }}>
                  कोर्स चुनें
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
                        {c.nameHi}
                        <span className="faint" style={{ fontSize: "var(--step-s)", display: "block" }}>
                          {c.published
                            ? `गैर-वापसी योग्य शुल्क ${fmtMoney(c.tuition)} — मास्टर डेटा से, आपको टाइप नहीं करना है`
                            : "कॉलेज ने इस सत्र में प्रकाशित नहीं किया — यह छात्र के स्तर पर ठीक नहीं होता"}
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
              {busy ? "बना रहे हैं…" : "तैयारी जाँच पर जाएँ"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
