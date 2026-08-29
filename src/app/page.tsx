import Link from "next/link";
import Image from "next/image";
import { Shell } from "@/ui/Shell";
import { StatusChip } from "@/ui/bits";
import { getLang } from "@/lib/lang";
import { FeedbackForm } from "@/ui/FeedbackForm";
import { QuickTracker } from "@/ui/QuickTracker";
import { NewsTicker } from "@/ui/NewsTicker";
import { TrustBar } from "@/ui/TrustBar";
import { HeroInteractiveVisual } from "@/ui/HeroInteractiveVisual";

export default async function Home() {
  const lang = await getLang();
  const isEn = lang === "en";

  return (
    <Shell lang={lang}>
      <div className="stack" style={{ ["--gap" as string]: "var(--s7)" }}>
        {/* Cultural Hero Banner Image */}
        <div
          style={{
            position: "relative",
            width: "100%",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid var(--rule-strong)",
            boxShadow: "var(--shadow-lift)",
            background: "#ffffff",
          }}
        >
          <Image
            src="/up_scholarship_banner.png"
            alt="UP Scholarship & Fee Reimbursement Scheme Header Banner"
            width={1200}
            height={260}
            priority
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "260px",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>

        {/* Latest Announcements & Timetables Ticker Strip */}
        <NewsTicker />

        {/* 2-Column Visual Hero Section */}
        <div className="bento-grid bento-grid-2" style={{ alignItems: "start", gap: "var(--s6)" }}>
          {/* Left Column: Headline, Leaded Text, Demo Credentials, Quick Tracker */}
          <div className="stack" style={{ ["--gap" as string]: "var(--s4)" }}>
            <div className="row" style={{ gap: "var(--s3)" }}>
              <span className="pulse-dot" />
              <p className="eyebrow" style={{ color: "var(--brand-blue)", fontWeight: 800 }}>
                {isEn
                  ? "SCHOLARSHIP TRACKING WITH A NAMED OWNER & DEADLINE · मिलेगी"
                  : "छात्रवृत्ति फ़ाइल, नाम और तारीख़ के साथ · MILEGI"}
              </p>
            </div>

            <h1 className="hero-title" style={{ fontSize: "calc(var(--step-4) * 0.95)" }}>
              Who is holding your file, when does the money land, and when is it due?
              <span className="hero-subdeva">
                पैसा आएगा या नहीं, कब आएगा, और फ़ाइल किसके पास है?
              </span>
            </h1>

            <p className="lede measure" style={{ fontSize: "var(--step-0)", lineHeight: 1.6 }}>
              {isEn
                ? "The real question is not what the form looks like. It is when the money arrives, how much, who is holding your file, and what you must do before it dies in silence."
                : "छात्रवृत्ति का असली सवाल यह नहीं है कि फ़ॉर्म कैसा दिखता है। सवाल यह है कि पैसा कब आएगा, कितना आएगा, फ़ाइल किसके पास है, और चुप्पी में मरने से पहले आपको क्या करना है।"}
            </p>

            {/* Interactive Demo Credentials Banner */}
            <div
              className="row"
              style={{
                gap: "var(--s3)",
                background: "var(--surface)",
                border: "1px solid var(--rule-strong)",
                borderRadius: "var(--radius)",
                padding: "10px var(--s4)",
                width: "fit-content",
              }}
            >
              <span className="chip" data-tone="verified" style={{ fontSize: "0.75rem" }}>
                DEMO CREDENTIALS
              </span>
              <span style={{ fontSize: "var(--step-s)", color: "var(--ink-muted)", fontWeight: 500 }}>
                OTP prints on screen · Aadhaar <code className="mono">000012340001</code> · Operator PIN <code className="mono">1234</code>
              </span>
            </div>

            {/* 1-Click Hero Quick Tracker Bar */}
            <QuickTracker />
          </div>

          {/* Right Column: Hero Graphic & Interactive Live Inspector */}
          <HeroInteractiveVisual />
        </div>

        {/* Trust & Government Ecosystem Integration Bar */}
        <TrustBar />

        {/* Three Primary Bento Doors */}
        <div className="doors-grid">
          <Link href="/otr" className="door-card door-card-primary">
            <div className="stack" style={{ ["--gap" as string]: "var(--s3)" }}>
              <span className="door-card-tag">01 // LIFETIME ID</span>
              <h2 style={{ fontSize: "var(--step-2)" }}>
                1. Create OTR / OTR बनाएँ
              </h2>
              <p style={{ color: "var(--ink-muted)", fontSize: "var(--step-s)", lineHeight: 1.6 }}>
                {isEn
                  ? "Mint or recover your lifetime identity (UP26-...). One OTR per student — also serves as a tracking number. Never duplicate."
                  : "अपनी जीवनभर की पहचान (UP26-...) बनाएँ या पुनः प्राप्त करें। एक छात्र का केवल एक OTR।"}
              </p>
            </div>
            <div style={{ marginTop: "var(--s4)" }}>
              <span className="btn btn-primary btn-sm btn-block">
                {isEn ? "Create / Recover OTR →" : "OTR बनाएँ / खोजें →"}
              </span>
            </div>
          </Link>

          <Link href="/pravesh" className="door-card door-card-primary">
            <div className="stack" style={{ ["--gap" as string]: "var(--s3)" }}>
              <span className="door-card-tag">02 // INTAKE GATEWAY</span>
              <h2 style={{ fontSize: "var(--step-2)" }}>
                2. Apply / आवेदन करें
              </h2>
              <p style={{ color: "var(--ink-muted)", fontSize: "var(--step-s)", lineHeight: 1.6 }}>
                {isEn
                  ? "Login via OTP. Router asks 3 questions to pick Fresh vs Renewal. Checks pre-flight before typing, then 1 form lock."
                  : "OTP से लॉगिन करें। तीन सवालों से तय करें कि आप कौन-सा आवेदन हैं। फ़ॉर्म भरने से पहले तैयारी जाँच।"}
              </p>
            </div>
            <div style={{ marginTop: "var(--s4)" }}>
              <span className="btn btn-primary btn-sm btn-block">
                {isEn ? "Start Application →" : "आवेदन शुरू करें →"}
              </span>
            </div>
          </Link>

          <Link href="/pravesh?mode=track" className="door-card">
            <div className="stack" style={{ ["--gap" as string]: "var(--s3)" }}>
              <span className="door-card-tag" style={{ color: "var(--action-cyan)" }}>03 // PUBLIC TRACKER</span>
              <h2 style={{ fontSize: "var(--step-2)" }}>
                3. Track / फ़ाइल देखें
              </h2>
              <p style={{ color: "var(--ink-muted)", fontSize: "var(--step-s)", lineHeight: 1.6 }}>
                {isEn
                  ? "Track by Case ID (MLG-26-...), 15-digit Registration No, or OTR. No password, no captcha, no login needed."
                  : "केस आईडी (MLG-26-...), 15 अंकों की पंजीकरण संख्या, या OTR से देखें — बिना पासवर्ड या कैप्चा।"}
              </p>
            </div>
            <div style={{ marginTop: "var(--s4)" }}>
              <span className="btn btn-cyan btn-sm btn-block">
                {isEn ? "Track Application →" : "फ़ाइल ट्रैक करें →"}
              </span>
            </div>
          </Link>
        </div>

        {/* Real Time Statistics Section (Session 2025-26) */}
        <section className="stack" style={{ ["--gap" as string]: 0, border: "1px solid var(--rule-strong)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-card)", background: "#ffffff" }}>
          <div className="row-between" style={{ background: "var(--brand-navy)", color: "#ffffff", padding: "var(--s4) var(--s5)" }}>
            <div className="stack" style={{ ["--gap" as string]: "2px" }}>
              <span className="eyebrow" style={{ color: "var(--brand-gold-bright)", fontWeight: 800 }}>STATEWIDE PORTAL DATA</span>
              <h2 style={{ color: "#ffffff", fontSize: "var(--step-2)" }}>Real Time Statistics (Session: 2025-26) / राज्य स्तरीय आँकड़े</h2>
            </div>
            <StatusChip tone="verified" glyph="●">LIVE SESSION DATA</StatusChip>
          </div>

          <div className="bento-grid bento-grid-2" style={{ gap: "var(--s3)", padding: "var(--s5)" }}>
            <div className="sheet sheet-tight stack" style={{ ["--gap" as string]: "6px", borderTop: "4px solid var(--brand-blue)", background: "rgba(29, 78, 216, 0.03)" }}>
              <span className="faint" style={{ fontSize: "var(--step-s)", fontWeight: 700, color: "var(--brand-blue)" }}>TOTAL OTR GENERATED</span>
              <span className="mono tnum" style={{ fontSize: "var(--step-3)", fontWeight: 800, color: "var(--brand-blue)" }}>
                89,89,714
              </span>
              <span className="faint" style={{ fontSize: "var(--step-s)" }}>Lifetime Single-Student Identifiers Minted</span>
            </div>

            <div className="sheet sheet-tight stack" style={{ ["--gap" as string]: "6px", borderTop: "4px solid var(--verified)", background: "rgba(5, 150, 105, 0.03)" }}>
              <span className="faint" style={{ fontSize: "var(--step-s)", fontWeight: 700, color: "var(--verified)" }}>FINAL SUBMITTED APPLICATIONS</span>
              <span className="mono tnum" style={{ fontSize: "var(--step-3)", fontWeight: 800, color: "var(--verified)" }}>
                84,88,216
              </span>
              <span className="faint" style={{ fontSize: "var(--step-s)" }}>Locked & Verified Student Forms</span>
            </div>

            <div className="sheet sheet-tight stack" style={{ ["--gap" as string]: "6px", borderTop: "4px solid var(--brand-navy)", background: "rgba(15, 23, 42, 0.03)" }}>
              <span className="faint" style={{ fontSize: "var(--step-s)", fontWeight: 700, color: "var(--brand-navy)" }}>FORWARDED FROM INSTITUTIONS</span>
              <span className="mono tnum" style={{ fontSize: "var(--step-3)", fontWeight: 800, color: "var(--ink)" }}>
                77,08,644
              </span>
              <span className="faint" style={{ fontSize: "var(--step-s)" }}>Verified Attendance (75%+) & Hard Copy Received</span>
            </div>

            <div className="sheet sheet-tight stack" style={{ ["--gap" as string]: "6px", borderTop: "4px solid var(--brand-gold)", background: "rgba(217, 119, 6, 0.03)" }}>
              <span className="faint" style={{ fontSize: "var(--step-s)", fontWeight: 700, color: "var(--brand-gold)" }}>TOTAL BENEFICIARIES PAID</span>
              <span className="mono tnum" style={{ fontSize: "var(--step-3)", fontWeight: 800, color: "var(--brand-gold)" }}>
                18,64,427
              </span>
              <span className="faint" style={{ fontSize: "var(--step-s)" }}>Direct Bank Transfer (DBT) Credits Executed</span>
            </div>
          </div>
        </section>

        {/* State Summary & Financial Disbursal (Session 2024-25) */}
        <section className="stack" style={{ ["--gap" as string]: 0, border: "1px solid var(--rule-strong)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-card)", background: "#ffffff" }}>
          <div className="row-between" style={{ background: "var(--brand-blue)", color: "#ffffff", padding: "var(--s4) var(--s5)" }}>
            <div className="stack" style={{ ["--gap" as string]: "2px" }}>
              <span className="eyebrow" style={{ color: "#93c5fd", fontWeight: 800 }}>FINANCIAL REIMBURSEMENT DISBURSAL</span>
              <h2 style={{ color: "#ffffff", fontSize: "var(--step-2)" }}>State Financial Summary (Session: 2024-25) / वित्तीय सारांश</h2>
            </div>
            <span className="chip" style={{ background: "rgba(255, 255, 255, 0.2)", color: "#ffffff", borderColor: "rgba(255, 255, 255, 0.4)", fontWeight: 700 }}>
              OFFICIAL SAKSHAM DATA
            </span>
          </div>

          <div className="stack" style={{ padding: "var(--s5)", ["--gap" as string]: "var(--s4)" }}>
            <div className="bento-grid bento-grid-3" style={{ gap: "var(--s3)" }}>
              <div className="sheet sheet-tight stack" style={{ ["--gap" as string]: "4px", borderLeft: "4px solid var(--brand-blue)", background: "rgba(29, 78, 216, 0.04)" }}>
                <span className="faint" style={{ fontSize: "var(--step-s)", fontWeight: 700 }}>PREMATRIC SCHOLARSHIP DISBURSED</span>
                <span className="mono tnum" style={{ fontSize: "var(--step-2)", fontWeight: 800, color: "var(--brand-blue)" }}>
                  ₹3,17,53,71,475
                </span>
                <span className="faint" style={{ fontSize: "var(--step-s)" }}>15,32,410 Benefited Students (Classes 9-10)</span>
              </div>

              <div className="sheet sheet-tight stack" style={{ ["--gap" as string]: "4px", borderLeft: "4px solid var(--verified)", background: "rgba(5, 150, 105, 0.04)" }}>
                <span className="faint" style={{ fontSize: "var(--step-s)", fontWeight: 700 }}>POSTMATRIC SCHOLARSHIP DISBURSED</span>
                <span className="mono tnum" style={{ fontSize: "var(--step-2)", fontWeight: 800, color: "var(--verified)" }}>
                  ₹14,21,36,99,560
                </span>
                <span className="faint" style={{ fontSize: "var(--step-s)" }}>43,35,007 Benefited Students (Classes 11-12 & Higher)</span>
              </div>

              <div className="sheet sheet-tight stack" style={{ ["--gap" as string]: "4px", borderLeft: "4px solid var(--brand-gold)", background: "rgba(217, 119, 6, 0.04)" }}>
                <span className="faint" style={{ fontSize: "var(--step-s)", fontWeight: 700 }}>POSTMATRIC FEE REIMBURSEMENT</span>
                <span className="mono tnum" style={{ fontSize: "var(--step-2)", fontWeight: 800, color: "var(--brand-gold)" }}>
                  ₹29,40,79,71,404
                </span>
                <span className="faint" style={{ fontSize: "var(--step-s)" }}>Non-refundable Tuition Reimbursement Total</span>
              </div>
            </div>

            <div className="row-between" style={{ borderTop: "1px solid var(--rule)", paddingTop: "var(--s3)" }}>
              <span className="faint" style={{ fontSize: "var(--step-s)" }}>
                Mapped Institutions Master: <strong>34,858</strong> Prematric · <strong>22,174</strong> Postmatric Inter · <strong>17,170</strong> Degree & Higher
              </span>
              <Link className="btn btn-sm btn-quiet" href="/seemayein">
                View Rules & Coverage →
              </Link>
            </div>
          </div>
        </section>

        {/* Welfare Departments Grid */}
        <section className="stack" style={{ ["--gap" as string]: 0, border: "1px solid var(--rule-strong)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-card)", background: "#ffffff" }}>
          <div className="row-between" style={{ background: "var(--brand-navy)", color: "#ffffff", padding: "var(--s4) var(--s5)" }}>
            <div className="stack" style={{ ["--gap" as string]: "2px" }}>
              <span className="eyebrow" style={{ color: "var(--brand-gold-bright)", fontWeight: 800 }}>STATE SANCTION AUTHORITIES</span>
              <h2 style={{ color: "#ffffff", fontSize: "var(--step-2)" }}>Welfare Departments / संबद्ध कल्याण विभाग</h2>
            </div>
            <span className="chip" style={{ background: "rgba(255, 255, 255, 0.15)", color: "#ffffff" }}>4 State Departments</span>
          </div>

          <div className="bento-grid bento-grid-2" style={{ gap: "var(--s3)", padding: "var(--s5)" }}>
            <div className="sheet stack" style={{ ["--gap" as string]: "var(--s2)", border: "1px solid var(--rule-strong)" }}>
              <div className="row-between">
                <span className="chip" data-tone="verified" style={{ fontWeight: 700 }}>🏛️ Social Welfare</span>
                <span className="faint" style={{ fontSize: "0.75rem" }}>SC & General Category</span>
              </div>
              <h3 style={{ fontSize: "var(--step-1)" }}>Social Welfare Department (समाज कल्याण विभाग)</h3>
              <p className="muted" style={{ fontSize: "var(--step-s)", lineHeight: 1.5 }}>
                Oversees General and SC/ST student post-matric fee reimbursement & maintenance allowances across all districts.
              </p>
              <a href="#contact-us" className="btn btn-sm btn-quiet" style={{ alignSelf: "flex-start", marginTop: "4px" }}>
                View Officer Contacts →
              </a>
            </div>

            <div className="sheet stack" style={{ ["--gap" as string]: "var(--s2)", border: "1px solid var(--rule-strong)" }}>
              <div className="row-between">
                <span className="chip" data-tone="waiting" style={{ fontWeight: 700 }}>🎓 Backward Classes</span>
                <span className="faint" style={{ fontSize: "0.75rem" }}>OBC Category</span>
              </div>
              <h3 style={{ fontSize: "var(--step-1)" }}>Backward Class Welfare Department (पिछड़ा वर्ग कल्याण)</h3>
              <p className="muted" style={{ fontSize: "var(--step-s)", lineHeight: 1.5 }}>
                Manages OBC scholarship schemes, income ceiling verifications, and institution master data publication.
              </p>
              <a href="#contact-us" className="btn btn-sm btn-quiet" style={{ alignSelf: "flex-start", marginTop: "4px" }}>
                View Officer Contacts →
              </a>
            </div>

            <div className="sheet stack" style={{ ["--gap" as string]: "var(--s2)", border: "1px solid var(--rule-strong)" }}>
              <div className="row-between">
                <span className="chip" data-tone="paid" style={{ fontWeight: 700 }}>🌙 Minority Welfare</span>
                <span className="faint" style={{ fontSize: "0.75rem" }}>Minority Category</span>
              </div>
              <h3 style={{ fontSize: "var(--step-1)" }}>Minority Welfare Department (अल्पसंख्यक कल्याण)</h3>
              <p className="muted" style={{ fontSize: "var(--step-s)", lineHeight: 1.5 }}>
                Executes pre-matric & post-matric scholarship sanctions for minority category students in recognized courses.
              </p>
              <a href="#contact-us" className="btn btn-sm btn-quiet" style={{ alignSelf: "flex-start", marginTop: "4px" }}>
                View Officer Contacts →
              </a>
            </div>

            <div className="sheet stack" style={{ ["--gap" as string]: "var(--s2)", border: "1px solid var(--rule-strong)" }}>
              <div className="row-between">
                <span className="chip" data-tone="info" style={{ fontWeight: 700 }}>🌿 Tribal Welfare</span>
                <span className="faint" style={{ fontSize: "0.75rem" }}>ST Category</span>
              </div>
              <h3 style={{ fontSize: "var(--step-1)" }}>Tribal Development Department (जनजातीय विकास विभाग)</h3>
              <p className="muted" style={{ fontSize: "var(--step-s)", lineHeight: 1.5 }}>
                Processes dedicated tribal student financial grants and specialized residential institution allowances.
              </p>
              <a href="#contact-us" className="btn btn-sm btn-quiet" style={{ alignSelf: "flex-start", marginTop: "4px" }}>
                View Officer Contacts →
              </a>
            </div>
          </div>
        </section>

        {/* Timetables & Download Links Section */}
        <section className="stack" style={{ ["--gap" as string]: 0, border: "1px solid var(--rule-strong)", borderRadius: "16px", overflow: "hidden", boxShadow: "var(--shadow-card)", background: "#ffffff" }}>
          <div className="row-between" style={{ background: "var(--brand-gold-subtle)", borderBottom: "2px solid var(--brand-gold)", padding: "var(--s4) var(--s5)" }}>
            <div className="stack" style={{ ["--gap" as string]: "2px" }}>
              <span className="eyebrow" style={{ color: "var(--brand-gold)", fontWeight: 800 }}>MASTER GUIDELINES & SCHEDULING</span>
              <h2 style={{ color: "var(--brand-navy)", fontSize: "var(--step-2)" }}>Timetables & Download Links (2026-27) / समय-सारिणी एवं निर्देश</h2>
            </div>
            <span className="chip" data-tone="waiting" style={{ fontWeight: 700 }}>Official Guidelines</span>
          </div>

          <div className="bento-grid bento-grid-2" style={{ gap: "var(--s4)", padding: "var(--s5)" }}>
            <div className="stack" style={{ ["--gap" as string]: "var(--s2)" }}>
              <h3 className="eyebrow" style={{ color: "var(--brand-blue)", fontWeight: 800 }}>Session Timetables</h3>
              <div className="sheet sheet-sunk stack" style={{ ["--gap" as string]: "var(--s2)", border: "1px solid var(--rule-strong)" }}>
                <div className="row-between">
                  <span style={{ fontSize: "var(--step-s)", fontWeight: 700, color: "var(--ink)" }}>📅 Postmatric Timetable (2026-27)</span>
                  <span className="chip" data-tone="verified" style={{ fontSize: "0.7rem", fontWeight: 700 }}>NEW SESSION</span>
                </div>
                <span className="faint" style={{ fontSize: "var(--step-s)" }}>Applicable to SC, ST, General, Minority & OBC</span>
              </div>
              <div className="sheet sheet-sunk stack" style={{ ["--gap" as string]: "var(--s2)", border: "1px solid var(--rule-strong)" }}>
                <div className="row-between">
                  <span style={{ fontSize: "var(--step-s)", fontWeight: 700, color: "var(--ink)" }}>📅 Prematric Timetable (2026-27)</span>
                  <span className="chip" data-tone="verified" style={{ fontSize: "0.7rem", fontWeight: 700 }}>NEW SESSION</span>
                </div>
                <span className="faint" style={{ fontSize: "var(--step-s)" }}>Class 9 & 10 Application Windows</span>
              </div>
            </div>

            <div className="stack" style={{ ["--gap" as string]: "var(--s2)" }}>
              <h3 className="eyebrow" style={{ color: "var(--brand-blue)", fontWeight: 800 }}>Downloads & Master Notices</h3>
              <div className="sheet sheet-sunk stack" style={{ ["--gap" as string]: "var(--s2)", border: "1px solid var(--rule-strong)" }}>
                <div className="row-between">
                  <span style={{ fontSize: "var(--step-s)", fontWeight: 700, color: "var(--ink)" }}>📄 General Instructions for Students & Institutes</span>
                  <span className="mono faint" style={{ fontSize: "var(--step-s)" }}>PDF</span>
                </div>
                <span className="faint" style={{ fontSize: "var(--step-s)" }}>Guidelines for submission, attendance, and Aadhaar linking</span>
              </div>
              <div className="sheet sheet-sunk stack" style={{ ["--gap" as string]: "var(--s2)", border: "1px solid var(--rule-strong)" }}>
                <div className="row-between">
                  <span style={{ fontSize: "var(--step-s)", fontWeight: 700, color: "var(--breach)" }}>⚠️ Blacklisted / Suspended Institutes List</span>
                  <span className="chip" data-tone="breach" style={{ fontSize: "0.7rem", fontWeight: 700 }}>ADVISORY</span>
                </div>
                <span className="faint" style={{ fontSize: "var(--step-s)" }}>Institutes barred from scholarship session intake</span>
              </div>
            </div>
          </div>
        </section>

        {/* Live Clerk SLA Terminal Card */}
        <div className="sheet stack" style={{ ["--gap" as string]: "var(--s4)" }}>
          <div className="row-between">
            <div className="row" style={{ gap: "var(--s2)" }}>
              <span className="pulse-dot pulse-dot-warn" />
              <span className="eyebrow" style={{ color: "var(--waiting)" }}>
                SYNTHETIC FILE DEMO · ACCOUNTABILITY IN ACTION
              </span>
            </div>
            <StatusChip tone="waiting" glyph="◕">MOCK FILE</StatusChip>
          </div>

          <div className="row-between" style={{ alignItems: "flex-start", gap: "var(--s4)" }}>
            <div>
              <div style={{ fontSize: "var(--step-2)", fontWeight: 700, color: "var(--ink)" }}>
                Shri R. K. Verma / श्री आर. के. वर्मा
              </div>
              <div style={{ fontSize: "var(--step-s)", color: "var(--ink-muted)", marginTop: "4px" }}>
                Scholarship clerk · CSJMU Kanpur / छात्रवृत्ति लिपिक · छत्रपति शाहू जी महाराज विश्वविद्यालय, कानपुर
              </div>
            </div>

            <div
              style={{
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "var(--radius-sm)",
                padding: "8px var(--s4)",
                textAlign: "right",
              }}
            >
              <div className="tnum" style={{ fontWeight: 700, color: "var(--waiting)", fontSize: "var(--step-1)" }}>
                Due Friday 12 Sep / समय सीमा 12 सितम्बर
              </div>
              <div className="faint tnum" style={{ fontSize: "var(--step-s)", marginTop: "2px" }}>
                14 days at this stage / 14 दिन से इसी चरण पर
              </div>
            </div>
          </div>
        </div>

        {/* Operator Doors Quiet Row */}
        <div className="sheet row-between" style={{ background: "var(--surface-sunk)", padding: "var(--s4) var(--s5)" }}>
          <span className="faint" style={{ fontSize: "var(--step-s)", fontWeight: 600 }}>
            {isEn ? "OPERATOR & REPORT ACCESS (PIN: 1234):" : "संस्थान एवं जिला कार्यक्षेत्र (पिन: 1234):"}
          </span>
          <div className="row" style={{ gap: "var(--s3)" }}>
            <Link className="btn btn-sm" href="/sansthan">
              {isEn ? "Institute Login (/sansthan)" : "संस्थान लॉगिन (/sansthan)"}
            </Link>
            <Link className="btn btn-sm" href="/dwo">
              {isEn ? "District Welfare (/dwo)" : "जिला कार्यालय लॉगिन (/dwo)"}
            </Link>
            <Link className="btn btn-sm btn-quiet" href="/reports">
              {isEn ? "All Session Reports" : "सत्र रिपोर्ट"}
            </Link>
          </div>
        </div>

        {/* Contact Us & Official Helplines Section */}
        <section id="contact-us" className="stack" style={{ ["--gap" as string]: "var(--s4)" }}>
          <div className="row-between">
            <div>
              <span className="eyebrow">HELPLINE & OFFICER DIRECTORY</span>
              <h2>Contact Us & Department Helplines / अधिकारी संपर्क</h2>
            </div>
            <span className="chip">Official Helplines</span>
          </div>

          <details className="faq-item" open>
            <summary className="faq-summary">
              Department Officers & Toll-Free Toll Numbers (कल्याण विभाग संपर्क सूत्र)
            </summary>
            <div className="faq-body stack" style={{ ["--gap" as string]: "var(--s4)", marginTop: "var(--s3)" }}>
              <div className="bento-grid bento-grid-2" style={{ gap: "var(--s3)" }}>
                {/* Social Welfare */}
                <div className="sheet stack" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--rule-strong)", boxShadow: "var(--shadow-card)" }}>
                  <div style={{ background: "var(--brand-navy)", color: "#ffffff", padding: "var(--s3) var(--s4)" }}>
                    <div style={{ fontSize: "var(--step-s)", color: "var(--brand-gold-bright)", fontWeight: 700, textTransform: "uppercase" }}>
                      Social Welfare Department (समाज कल्याण विभाग)
                    </div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
                      For Scheduled Caste and General Category / अनुसूचित जाति एवं सामान्य वर्ग के लिए
                    </div>
                  </div>
                  <div className="stack" style={{ padding: "var(--s4)", ["--gap" as string]: "var(--s2)" }}>
                    <div style={{ fontWeight: 700, fontSize: "var(--step-1)", color: "var(--brand-blue)" }}>
                      Mr. Anand Kumar Singh
                    </div>
                    <div className="faint" style={{ fontSize: "var(--step-s)" }}>
                      Deputy Director · 09:30 AM to 06:00 PM (except holidays)
                    </div>

                    <div style={{ fontWeight: 700, fontSize: "var(--step-1)", color: "var(--brand-blue)", marginTop: "var(--s2)" }}>
                      Mr. Siddharth Mishra
                    </div>
                    <div className="faint" style={{ fontSize: "var(--step-s)" }}>
                      Assistant Director · 10:00 AM to 12:00 PM (except holidays)
                    </div>

                    <div className="stack" style={{ gap: "var(--s2)", marginTop: "var(--s3)" }}>
                      <span className="btn btn-sm btn-quiet" style={{ border: "1px solid var(--rule)", justifyContent: "flex-start" }}>
                        📞 0522-3538700
                      </span>
                      <span className="btn btn-sm btn-quiet" style={{ border: "1px solid var(--brand-gold-border)", background: "var(--brand-gold-subtle)", color: "var(--brand-gold)", fontWeight: 700, justifyContent: "flex-start" }}>
                        📞 Toll Free No: 14568
                      </span>
                    </div>
                  </div>
                </div>

                {/* Backward Welfare */}
                <div className="sheet stack" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--rule-strong)", boxShadow: "var(--shadow-card)" }}>
                  <div style={{ background: "var(--brand-navy)", color: "#ffffff", padding: "var(--s3) var(--s4)" }}>
                    <div style={{ fontSize: "var(--step-s)", color: "var(--brand-gold-bright)", fontWeight: 700, textTransform: "uppercase" }}>
                      Backward Class Welfare Department (पिछड़ा वर्ग कल्याण)
                    </div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
                      For Other Backward Category / अन्य पिछड़ा वर्ग के लिए
                    </div>
                  </div>
                  <div className="stack" style={{ padding: "var(--s4)", ["--gap" as string]: "var(--s2)" }}>
                    <div style={{ fontWeight: 700, fontSize: "var(--step-1)", color: "var(--brand-blue)" }}>
                      Mr. Lalit Kishor Mishra
                    </div>
                    <div className="faint" style={{ fontSize: "var(--step-s)" }}>
                      Deputy Director · 09:30 AM to 06:00 PM (except holidays)
                    </div>

                    <div className="stack" style={{ gap: "var(--s2)", marginTop: "var(--s4)" }}>
                      <span className="btn btn-sm btn-quiet" style={{ border: "1px solid var(--rule)", justifyContent: "flex-start" }}>
                        📞 0522-2288861
                      </span>
                      <span className="btn btn-sm btn-quiet" style={{ border: "1px solid var(--brand-gold-border)", background: "var(--brand-gold-subtle)", color: "var(--brand-gold)", fontWeight: 700, justifyContent: "flex-start" }}>
                        📞 Toll Free No: 1800-180-5131
                      </span>
                    </div>
                  </div>
                </div>

                {/* Minority Welfare */}
                <div className="sheet stack" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--rule-strong)", boxShadow: "var(--shadow-card)" }}>
                  <div style={{ background: "var(--brand-navy)", color: "#ffffff", padding: "var(--s3) var(--s4)" }}>
                    <div style={{ fontSize: "var(--step-s)", color: "var(--brand-gold-bright)", fontWeight: 700, textTransform: "uppercase" }}>
                      Minority Welfare Department (अल्पसंख्यक कल्याण)
                    </div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
                      For Minority Category / अल्पसंख्यक वर्ग के लिए
                    </div>
                  </div>
                  <div className="stack" style={{ padding: "var(--s4)", ["--gap" as string]: "var(--s2)" }}>
                    <div style={{ fontWeight: 700, fontSize: "var(--step-1)", color: "var(--brand-blue)" }}>
                      Mr. Avinash Tripathi
                    </div>
                    <div className="faint" style={{ fontSize: "var(--step-s)" }}>
                      Assistant Director · 09:30 AM to 06:00 PM (except holidays)
                    </div>

                    <div className="stack" style={{ gap: "var(--s2)", marginTop: "var(--s4)" }}>
                      <span className="btn btn-sm btn-quiet" style={{ border: "1px solid var(--rule)", justifyContent: "flex-start" }}>
                        📞 0522-2286150
                      </span>
                      <span className="btn btn-sm btn-quiet" style={{ border: "1px solid var(--rule)", justifyContent: "flex-start" }}>
                        📞 0522-2286470
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tribal Welfare */}
                <div className="sheet stack" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--rule-strong)", boxShadow: "var(--shadow-card)" }}>
                  <div style={{ background: "var(--brand-navy)", color: "#ffffff", padding: "var(--s3) var(--s4)" }}>
                    <div style={{ fontSize: "var(--step-s)", color: "var(--brand-gold-bright)", fontWeight: 700, textTransform: "uppercase" }}>
                      Tribal Development Department (जनजाति विकास विभाग)
                    </div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
                      For Scheduled Tribes Category / अनुसूचित जनजाति वर्ग के लिए
                    </div>
                  </div>
                  <div className="stack" style={{ padding: "var(--s4)", ["--gap" as string]: "var(--s2)" }}>
                    <div style={{ fontWeight: 700, fontSize: "var(--step-1)", color: "var(--brand-blue)" }}>
                      Dr. Priyanka Verma
                    </div>
                    <div className="faint" style={{ fontSize: "var(--step-s)" }}>
                      Deputy Director · Availability Timings
                    </div>

                    <p className="muted" style={{ fontSize: "var(--step-s)", marginTop: "var(--s3)" }}>
                      For Scheduled Tribes queries, contact District Welfare Officer cell or submit online feedback below.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </section>

        {/* Feedback Section */}
        <section id="feedback" className="stack" style={{ ["--gap" as string]: "var(--s4)" }}>
          <div className="row-between">
            <div>
              <span className="eyebrow">CITIZEN FEEDBACK</span>
              <h2>Your Feedback is Important For Us / आपका सुझाव</h2>
            </div>
            <span className="chip">Online Submission</span>
          </div>

          <details className="faq-item">
            <summary className="faq-summary">
              Submit Portal Feedback & Queries (सुझाव अथवा प्रश्न दर्ज करें)
            </summary>
            <div className="faq-body" style={{ marginTop: "var(--s4)" }}>
              <FeedbackForm />
            </div>
          </details>
        </section>

        {/* FAQs Accordion */}
        <section id="faqs" className="stack" style={{ ["--gap" as string]: "var(--s4)" }}>
          <div className="row-between">
            <h2>Have any questions? / आपके सवाल</h2>
            <span className="faint" style={{ fontSize: "var(--step-s)" }}>
              {isEn ? "7 core portal answers" : "7 मुख्य उत्तर"}
            </span>
          </div>

          <div className="faq-list">
            <details className="faq-item">
              <summary className="faq-summary">
                1. What is the UP Scholarship / Fee Reimbursement scheme?
              </summary>
              <div className="faq-body">
                <p>
                  State maintenance + reimbursement of approved non-refundable tuition, not &ldquo;your college fee back.&rdquo; Independent prototype of Saksham; synthetic data; not a government site.
                </p>
                <div className="faq-hi">
                  उत्तर प्रदेश छात्रवृत्ति एवं शुल्क भरपाई योजना: स्वीकृत गैर-वापसी योग्य शिक्षण शुल्क की प्रतिपूर्ति और रखरखाव भत्ता। यह Saksham का एक स्वतंत्र प्रोटोटाइप है; सारा डेटा नकली है।
                </div>
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-summary">
                2. Who is eligible?
              </summary>
              <div className="faq-body">
                <p>
                  Studying in a mapped course; income certificate valid 3 years from issue; attendance 75%+; not holding another state/central scholarship. Income ceilings are contested across guides (SC/ST often ₹2.5L; OBC/General/Minority ₹1–2.5L depending on source).
                </p>
                <div className="faq-hi">
                  मान्यता प्राप्त कोर्स में अध्ययनरत; आय प्रमाणपत्र जारी होने से 3 साल तक वैध; 75%+ उपस्थिति; अन्य छात्रवृत्ति न मिल रही हो। आय सीमा विभिन्न स्रोतों में अलग-अलग दर्ज है।
                </div>
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-summary">
                3. How do I apply on Milegi?
              </summary>
              <div className="faq-body">
                <p>
                  Create OTR (once) → Apply → three questions pick Fresh vs Renewal and the scheme → checks before typing → one form → lock → hard copy in 3 days. Not eight student logins.
                </p>
                <div className="faq-hi">
                  OTR बनाएँ (एक बार) → आवेदन करें → तीन सवाल तय करते हैं नया या नवीनीकरण → फ़ॉर्म से पहले तैयारी जाँच → एक फ़ॉर्म → लॉक → 3 दिन में हार्ड कॉपी।
                </div>
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-summary">
                4. What is fee reimbursement, and how is the amount calculated?
              </summary>
              <div className="faq-body">
                <p>
                  Tuition from the institute master data (hostel/mess/caution/library/exam struck out). Plus a maintenance band by course group and hosteller/day-scholar. On-screen rupees are an estimate with a basis, never a promise. Real grievance GOVUP/E/2026/0035742 paid ₹6,605 after a three-month stall.
                </p>
                <div className="faq-hi">
                  संस्थान मास्टर डेटा से स्वीकृत शिक्षण शुल्क (छात्रावास/मेस/परीक्षा शुल्क छोड़कर) + रखरखाव भत्ता। स्क्रीन पर दिखाई गई राशि अनुमान है, वादा नहीं।
                </div>
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-summary">
                5. How do I track my application?
              </summary>
              <div className="faq-body">
                <p>
                  Track door: case id MLG-26-…, 15-digit registration number, or OTR. No password, no captcha. Status is a named owner + weekday, not a word like &ldquo;Institute Pending.&rdquo;
                </p>
                <div className="faq-hi">
                  ट्रैक पृष्ठ: केस आईडी MLG-26-…, 15 अंकों की पंजीकरण संख्या, या OTR। बिना पासवर्ड या कैप्चा। स्थिति में ज़िम्मेदार अधिकारी और समय सीमा दिखती है।
                </div>
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-summary">
                6. OTR vs registration vs application number?
              </summary>
              <div className="faq-body">
                <p>
                  OTR = lifetime (UP26-…), one per student, also a tracking number here. Registration = session, 15 digits, minted at lock. Application / case id = MLG-26-…. Mixing them is why the real portal says No Record Found. Never mint a second OTR.
                </p>
                <div className="faq-hi">
                  OTR = जीवनभर की पहचान (UP26-…)। पंजीकरण संख्या = 15 अंक (सत्र)। केस आईडी = MLG-26-…。 इन्हें मिलाना ही No Record Found का कारण बनता है।
                </div>
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-summary">
                7. Institute, department, and reports logins?
              </summary>
              <div className="faq-body">
                <p>
                  The real site&apos;s nav is a dropdown farm. Milegi ships two working operator doors: institute cell <Link href="/sansthan">/sansthan</Link> (PIN 1234) and district welfare <Link href="/dwo">/dwo</Link> (PIN 1234). University scrutiny is an SLA. All session reports are operator queue counts. Other roles (Minister, Directorate, DIOS, Auditor) are named on <Link href="/seemayein">/seemayein</Link> as process steps.
                </p>
                <div className="faq-hi">
                  मिलेगी में दो कार्यशील ऑपरेटर पृष्ठ हैं: संस्थान <Link href="/sansthan">/sansthan</Link> और जिला कल्याण <Link href="/dwo">/dwo</Link> (पिन 1234)। विश्वविद्यालय जाँच SLA पर चलती है। विस्तृत विवरण <Link href="/seemayein">/seemayein</Link> पर पढ़ें।
                </div>
              </div>
            </details>
          </div>
        </section>

        {/* Footer Link Navigation */}
        <div className="row" style={{ gap: "var(--s4)" }}>
          <Link href="/seemayein" className="btn btn-quiet">
            {isEn ? "Limits & Software Scope →" : "सीमाएँ और सॉफ़्टवेयर दायरा →"}
          </Link>
          <Link href="/madad" className="btn btn-quiet">
            {isEn ? "Help & Documentation →" : "मदद एवं नियम →"}
          </Link>
        </div>
      </div>
    </Shell>
  );
}





