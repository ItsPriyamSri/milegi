import Link from "next/link";
import { Banner } from "./Banner";
import { LangToggle, ThemeToggle } from "./Toggles";
import { t, type Lang } from "@/lib/i18n";
import { hydrate } from "@/server/store";
import { simState } from "@/server/sim";
import { UPSTREAM_LABEL_HI, UPSTREAM_LABEL_EN } from "@/server/external/gate";

/**
 * Real portals go down silently. This says so, in one line, on every page — the opposite behaviour,
 * demonstrated rather than claimed.
 */
async function SimBadge({ lang }: { lang: Lang }) {
  await hydrate();
  const state = simState();
  if (state.downSystems.length === 0) return null;
  const names = state.downSystems
    .map((s) => (lang === "en" ? UPSTREAM_LABEL_EN[s] : UPSTREAM_LABEL_HI[s]))
    .join(", ");
  return (
    <div className="simbadge" role="status">
      {lang === "en"
        ? `${names} is down (mock). Verification steps may stall; your draft is safe.`
        : `${names} अभी बंद है (मॉक) — जाँच वाले चरण रुक सकते हैं, आपका ड्राफ़्ट सुरक्षित है।`}
    </div>
  );
}

export async function Shell({
  lang,
  children,
  wide = false,
  narrow = false,
}: {
  lang: Lang;
  children: React.ReactNode;
  wide?: boolean;
  narrow?: boolean;
}) {
  return (
    <>
      <a className="skip-link" href="#main">
        {t("skip", lang)}
      </a>
      <Banner />
      <SimBadge lang={lang} />
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">{t("brand", lang)}</span>
          <span className="brand-sub">{t("brandSub", lang)}</span>
        </Link>
        <div className="topbar-actions">
          <LangToggle label={t("langToggle", lang)} />
          <ThemeToggle />
        </div>
      </header>
      <main
        id="main"
        className={`wrap${narrow ? " wrap-narrow" : ""}${wide ? " wrap-wide" : ""}`}
      >
        {children}
      </main>
      <footer className="sitefoot">
        <div className={`wrap${narrow ? " wrap-narrow" : ""}${wide ? " wrap-wide" : ""}`} style={{ padding: 0 }}>
          <p className="measure">{t("footNote", lang)}</p>
          <p className="row" style={{ marginTop: "var(--s3)" }}>
            <Link href="/seemayein">{t("navLimits", lang)}</Link>
            <Link href="/madad">{t("navHelp", lang)}</Link>
            <Link href="/mock">{t("navSim", lang)}</Link>
            <Link href="/sansthan">{t("navInstitute", lang)}</Link>
            <Link href="/dwo">{t("navDwo", lang)}</Link>
          </p>
        </div>
      </footer>
    </>
  );
}
