import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { StatusChip } from "@/ui/bits";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";

export default async function Home() {
  const lang = await getLang();
  return (
    <Shell lang={lang}>
      <p className="eyebrow">{t("brandSub", lang)}</p>
      <h1 className="measure" style={{ marginTop: "var(--s2)" }}>
        {lang === "en"
          ? "Will the money arrive, when, and who is holding my file?"
          : "पैसा आएगा या नहीं, कब आएगा, और फ़ाइल किसके पास है?"}
      </h1>

      <p className="measure faint" style={{ fontSize: "var(--step-s)", marginTop: "var(--s2)" }}>
        {t("howToTry", lang)}
      </p>

      <div className="doors">
        <Link href="/pravesh" className="door door-primary">
          <span className="door-title">{t("doorNew", lang)}</span>
          <br />
          <span className="door-sub">{t("doorNewSub", lang)}</span>
        </Link>
        <Link href="/pravesh?mode=track" className="door">
          <span className="door-title">{t("doorTrack", lang)}</span>
          <br />
          <span className="door-sub">{t("doorTrackSub", lang)}</span>
        </Link>
      </div>

      {/* Synthetic Demo Case Strip */}
      <div className="stamp" style={{ margin: "var(--s5) 0" }}>
        <div className="row-between">
          <span className="stamp-kicker">{t("demoStripKicker", lang)}</span>
          <StatusChip tone="waiting" glyph="◕">
            {t("fakeChip", lang)}
          </StatusChip>
        </div>
        <div className="stamp-name">{t("demoStripOwner", lang)}</div>
        <div className="stamp-meta">{t("demoStripRole", lang)}</div>
        <div
          className="row-between"
          style={{
            marginTop: "var(--s3)",
            paddingTop: "var(--s2)",
            borderTop: "1px solid var(--rule)",
          }}
        >
          <span className="tnum" style={{ fontWeight: 700 }}>
            {t("demoStripDue", lang)}
          </span>
          <span className="faint" style={{ fontSize: "var(--step-s)" }}>
            {t("demoStripWait", lang)}
          </span>
        </div>
      </div>

      <p className="measure faint" style={{ fontSize: "var(--step-s)" }}>
        {t("landingWhat", lang)}
      </p>

      <h2 style={{ marginTop: "var(--s7)" }}>
        {lang === "en" ? "Three things this changes" : "यह तीन चीज़ें बदलता है"}
      </h2>
      <div className="claims" style={{ marginTop: "var(--s4)" }}>
        {[1, 2, 3].map((n) => (
          <div className="claim" key={n}>
            <span className="claim-fig tnum">{t(`claim${n}Fig`, lang)}</span>
            <span className="claim-body">
              {t(`claim${n}`, lang)}
              <span className="claim-was">{t(`claim${n}Was`, lang)}</span>
            </span>
          </div>
        ))}
      </div>

      <p style={{ marginTop: "var(--s6)" }}>
        <Link href="/seemayein">{t("navLimits", lang)} →</Link>
      </p>
    </Shell>
  );
}

