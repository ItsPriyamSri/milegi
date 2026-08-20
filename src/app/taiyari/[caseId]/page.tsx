import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { getLang } from "@/lib/lang";
import { bi, t } from "@/lib/i18n";
import { loadOwnCase } from "@/lib/loadCase.server";
import { Callout, Money, StatusChip, type Tone } from "@/ui/bits";
import { CertificateCheck, RerunPreflight } from "./PreflightActions";

const TONE: Record<string, Tone> = {
  ok: "verified",
  warn: "waiting",
  blocked: "breach",
  unknown: "neutral",
};

const GLYPH: Record<string, string> = { ok: "✓", warn: "!", blocked: "✕", unknown: "?" };

const FIXED_BY_KEY: Record<string, string> = {
  student: "fixedByStudent",
  institute: "fixedByInstitute",
  bank: "fixedByBank",
  revenue_office: "fixedByRevenue",
};

export default async function Taiyari({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const lang = await getLang();
  const c = await loadOwnCase(caseId);
  const blocked = c.preflight.filter((i) => i.state === "blocked");
  const warned = c.preflight.filter((i) => i.state === "warn");
  const unknown = c.preflight.filter((i) => i.state === "unknown");

  return (
    <Shell lang={lang} narrow>
      <p className="eyebrow">
        {c.trackHi} · {c.cycleHi} · {c.id}
      </p>
      <h1 style={{ marginTop: "var(--s3)" }}>तैयारी जाँच</h1>
      <p className="measure muted" style={{ margin: "var(--s3) 0 var(--s4)" }}>
        {blocked.length === 0
          ? `${c.preflight.length} में से कोई रुकावट नहीं। फ़ॉर्म भरकर लॉक कर सकते हैं।`
          : `${c.preflight.length} में से ${blocked.length} रुकावट है — फ़ॉर्म भरना अभी भी शुरू कर सकते हैं, लेकिन लॉक करने से पहले यह ठीक करनी होगी।`}
      </p>
      <p className="faint measure" style={{ fontSize: "var(--step-s)", marginBottom: "var(--s5)" }}>
        असली पोर्टल पर यह सब 30 मिनट टाइप करने के बाद, अलग डैशबोर्ड पर या दिसंबर में जिला स्तर पर पता
        चलता है।
      </p>

      <div className="stack" style={{ ["--gap" as string]: "var(--s5)" }}>
        <div className="sheet">
          <Money
            amount={c.estimate.total}
            label="अनुमानित लाभ (शुल्क प्रतिपूर्ति + रखरखाव भत्ता)"
            basis={c.estimate.basisHi}
          />
        </div>

        {blocked.length > 0 ? (
          <Callout tone="danger" title="लॉक करने से पहले यह ठीक करनी होगी">
            <ul>
              {blocked.map((i) => (
                <li key={i.id}>{bi(i.titleHi, i.titleEn, lang)}</li>
              ))}
            </ul>
          </Callout>
        ) : null}

        <ol className="stack" style={{ listStyle: "none", padding: 0, ["--gap" as string]: "var(--s3)" }}>
          {c.preflight.map((i) => (
            <li className="sheet stack" key={i.id} style={{ ["--gap" as string]: "var(--s2)" }}>
              <div className="row-between">
                <strong>{bi(i.titleHi, i.titleEn, lang)}</strong>
                <StatusChip tone={TONE[i.state]} glyph={GLYPH[i.state]}>
                  {t(
                    i.state === "ok"
                      ? "stateOk"
                      : i.state === "warn"
                        ? "stateWarn"
                        : i.state === "blocked"
                          ? "stateBlocked"
                          : "stateUnknown",
                    lang,
                  )}
                </StatusChip>
              </div>
              <p className="muted">{bi(i.detailHi, i.detailEn, lang)}</p>
              {i.actionHi ? (
                <p
                  style={{
                    borderLeft: "3px solid var(--rule-strong)",
                    paddingLeft: "var(--s3)",
                    fontSize: "var(--step-s)",
                  }}
                >
                  <strong>{t(FIXED_BY_KEY[i.fixedBy] ?? "fixedByStudent", lang)}:</strong>{" "}
                  {i.actionHi}
                  {i.etaHi ? (
                    <span className="faint">
                      {" "}
                      · {t("eta", lang)} {i.etaHi}
                    </span>
                  ) : null}
                </p>
              ) : null}
              {i.state === "unknown" ? (
                <p className="faint" style={{ fontSize: "var(--step-s)" }}>
                  जाँच नहीं हो पाई, इसलिए इसे &ldquo;ठीक है&rdquo; नहीं माना गया। यही अंतर है — असली
                  पोर्टल पर ऐसी चुप्पी बाद में अस्वीकृति बनकर लौटती है।
                </p>
              ) : null}
              {i.source ? (
                <p className="faint" style={{ fontSize: "var(--step-s)" }}>
                  {t("source", lang)}: <span className="mono">{i.source}</span>
                </p>
              ) : null}
            </li>
          ))}
        </ol>

        <CertificateCheck caseId={c.id} />

        <div className="row">
          <Link className="btn btn-primary" href={`/aavedan/${c.id}`}>
            फ़ॉर्म भरना शुरू करें
          </Link>
          <RerunPreflight caseId={c.id} />
        </div>

        <p className="faint" style={{ fontSize: "var(--step-s)" }}>
          {warned.length} चेतावनी · {unknown.length} जाँच अधूरी · {blocked.length} रुकावट
        </p>
      </div>
    </Shell>
  );
}
