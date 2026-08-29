import Link from "next/link";
import type { ReactNode } from "react";
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
  hideFooter = false,
}: {
  lang: Lang;
  children: ReactNode;
  wide?: boolean;
  narrow?: boolean;
  hideFooter?: boolean;
}) {
  return (
    <>
      <a className="skip-link" href="#main">
        {t("skip", lang)}
      </a>
      <Banner />
      <SimBadge lang={lang} />
      <header className="topbar" style={{ flexDirection: "column", alignItems: "stretch", padding: 0 }}>
        <div className="topbar-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--s3) var(--s6)", background: "var(--brand-navy)", color: "#ffffff" }}>
          <Link href="/" className="brand" style={{ color: "#ffffff" }}>
            <span className="brand-mark" style={{ color: "#ffffff" }}>Milegi <span style={{ color: "var(--brand-gold-bright)" }}>· मिलेगी</span></span>
            <span className="brand-sub" style={{ color: "#94a3b8" }}>{t("brandSub", lang)}</span>
          </Link>
          <div className="topbar-actions" style={{ gap: "var(--s3)" }}>
            <span className="chip" data-tone="waiting" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", borderColor: "rgba(245, 158, 11, 0.4)", fontWeight: 700 }}>
              GOVT OF UTTAR PRADESH · SAKSHAM
            </span>
            <LangToggle label={t("langToggle", lang)} />
          </div>
        </div>

        {/* Top Navbar */}
        <nav
          className="portal-navbar"
          aria-label="Portal Navigation"
          style={{
            background: "#ffffff",
            borderBottom: "2px solid var(--brand-blue)",
            padding: "10px var(--s6)",
            overflowX: "auto",
            whiteSpace: "nowrap",
            boxShadow: "var(--shadow-subtle)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--s4)",
              maxWidth: "1140px",
              margin: "0 auto",
              fontSize: "var(--step-s)",
              fontWeight: 700,
            }}
          >
            <Link href="/" style={{ color: "var(--brand-blue)", textDecoration: "none" }}>
              Home / होम
            </Link>
            <span style={{ color: "var(--rule-strong)" }}>|</span>
            <Link href="/otr" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>
              1. Create OTR
            </Link>
            <Link href="/pravesh" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>
              2. Apply
            </Link>
            <Link href="/pravesh?mode=track" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>
              3. Track Status
            </Link>
            <span style={{ color: "var(--rule-strong)" }}>|</span>
            <Link href="/sansthan" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>
              Institute Cell
            </Link>
            <Link href="/dwo" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>
              District Welfare (DWO)
            </Link>
            <Link href="/reports" style={{ color: "var(--ink-secondary)", textDecoration: "none" }}>
              Session Reports
            </Link>
            <span style={{ color: "var(--rule-strong)" }}>|</span>
            <Link href="/#contact-us" style={{ color: "var(--brand-gold)", textDecoration: "none" }}>
              Contact Us & Helplines
            </Link>
            <Link href="/#feedback" style={{ color: "var(--brand-gold)", textDecoration: "none" }}>
              Feedback
            </Link>
            <Link href="/#faqs" style={{ color: "var(--brand-gold)", textDecoration: "none" }}>
              FAQs
            </Link>
          </div>
        </nav>
      </header>

      <main
        id="main"
        className={`wrap${narrow ? " wrap-narrow" : ""}${wide ? " wrap-wide" : ""}`}
        style={{ marginTop: "var(--s4)" }}
      >
        {children}
      </main>
      {!hideFooter ? (
        <footer className="sitefoot" style={{ background: "#0f172a", color: "#f8fafc", borderTop: "4px solid var(--brand-gold)", padding: "var(--s7) 0 var(--s5) 0", marginTop: "var(--s8)" }}>
          <div className="wrap wrap-wide stack" style={{ ["--gap" as string]: "var(--s6)" }}>
            <div className="bento-grid bento-grid-4" style={{ gap: "var(--s6)", alignItems: "start" }}>
              {/* Column 1: Brand & Mission */}
              <div className="stack" style={{ ["--gap" as string]: "var(--s3)" }}>
                <div style={{ fontSize: "var(--step-2)", fontWeight: 800, color: "#ffffff" }}>
                  Milegi <span style={{ color: "var(--brand-gold-bright)" }}>· मिलेगी</span>
                </div>
                <p style={{ fontSize: "var(--step-s)", color: "#94a3b8", lineHeight: 1.6 }}>
                  {lang === "en"
                    ? "Unified Proactive e-Governance System for Uttar Pradesh Student Scholarship & Fee Reimbursement."
                    : "उत्तर प्रदेश छात्रवृत्ति एवं शुल्क प्रतिपूर्ति योजना का एकीकृत नागरिक पोर्टल।"}
                </p>
                <div className="row" style={{ gap: "var(--s2)", flexWrap: "wrap", marginTop: "var(--s2)" }}>
                  <span className="chip" style={{ background: "rgba(255,255,255,0.1)", color: "#e2e8f0", borderColor: "rgba(255,255,255,0.2)" }}>
                    UIDAI e-KYC
                  </span>
                  <span className="chip" style={{ background: "rgba(255,255,255,0.1)", color: "#e2e8f0", borderColor: "rgba(255,255,255,0.2)" }}>
                    DigiLocker
                  </span>
                  <span className="chip" style={{ background: "rgba(255,255,255,0.1)", color: "#e2e8f0", borderColor: "rgba(255,255,255,0.2)" }}>
                    PFMS / DBT
                  </span>
                </div>
              </div>

              {/* Column 2: Citizen Doors */}
              <div className="stack" style={{ ["--gap" as string]: "var(--s3)" }}>
                <h4 style={{ color: "var(--brand-gold-bright)", fontSize: "0.85rem", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700 }}>
                  Citizen Services / नागरिक सेवाएं
                </h4>
                <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0, ["--gap" as string]: "var(--s2)", fontSize: "var(--step-s)" }}>
                  <li>
                    <Link href="/otr" style={{ color: "#cbd5e1", textDecoration: "none" }}>1. Create / Recover OTR</Link>
                  </li>
                  <li>
                    <Link href="/pravesh" style={{ color: "#cbd5e1", textDecoration: "none" }}>2. Apply (Fresh / Renewal)</Link>
                  </li>
                  <li>
                    <Link href="/pravesh?mode=track" style={{ color: "#cbd5e1", textDecoration: "none" }}>3. Track Application File</Link>
                  </li>
                  <li>
                    <Link href="/seemayein" style={{ color: "#cbd5e1", textDecoration: "none" }}>Software Rules & Scope</Link>
                  </li>
                  <li>
                    <Link href="/madad" style={{ color: "#cbd5e1", textDecoration: "none" }}>Help & FAQs</Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Operator & Authorities */}
              <div className="stack" style={{ ["--gap" as string]: "var(--s3)" }}>
                <h4 style={{ color: "var(--brand-gold-bright)", fontSize: "0.85rem", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700 }}>
                  Departments & Operators
                </h4>
                <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0, ["--gap" as string]: "var(--s2)", fontSize: "var(--step-s)" }}>
                  <li>
                    <Link href="/sansthan" style={{ color: "#cbd5e1", textDecoration: "none" }}>Institute Cell Login (PIN 1234)</Link>
                  </li>
                  <li>
                    <Link href="/dwo" style={{ color: "#cbd5e1", textDecoration: "none" }}>District Welfare Login (PIN 1234)</Link>
                  </li>
                  <li>
                    <Link href="/reports" style={{ color: "#cbd5e1", textDecoration: "none" }}>All Session Reports</Link>
                  </li>
                  <li>
                    <Link href="/#contact-us" style={{ color: "#cbd5e1", textDecoration: "none" }}>Department Officer Contacts</Link>
                  </li>
                </ul>
              </div>

              {/* Column 4: Helplines */}
              <div className="stack" style={{ ["--gap" as string]: "var(--s3)" }}>
                <h4 style={{ color: "var(--brand-gold-bright)", fontSize: "0.85rem", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700 }}>
                  Toll-Free Helplines
                </h4>
                <div className="stack" style={{ ["--gap" as string]: "var(--s2)", fontSize: "var(--step-s)" }}>
                  <div style={{ color: "#ffffff", fontWeight: 700 }}>
                    SC/ST Helpline: <span style={{ color: "#38bdf8" }}>14568</span>
                  </div>
                  <div style={{ color: "#ffffff", fontWeight: 700 }}>
                    OBC Helpline: <span style={{ color: "#38bdf8" }}>1800-180-5131</span>
                  </div>
                  <div style={{ color: "#94a3b8" }}>
                    Hours: 09:30 AM to 06:00 PM (except holidays)
                  </div>
                  <Link href="/#feedback" className="btn btn-sm btn-quiet" style={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.3)", marginTop: "4px", width: "fit-content" }}>
                    Submit Online Feedback →
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Disclaimer Strip */}
            <div className="row-between" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "var(--s4)", color: "#94a3b8", fontSize: "0.8rem" }}>
              <p style={{ margin: 0 }}>
                {t("footNote", lang)}
              </p>
              <p style={{ margin: 0, fontWeight: 600, color: "#cbd5e1" }}>
                Govt of Uttar Pradesh · Saksham Saksharta Portal
              </p>
            </div>
          </div>
        </footer>
      ) : null}
    </>
  );
}

