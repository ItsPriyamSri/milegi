import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { PageHead } from "@/ui/PageHead";
import { getLang } from "@/lib/lang";
import { loadPublicCase } from "@/lib/loadCase.server";
import { Callout, Money, StatusChip } from "@/ui/bits";
import { DutyStrip } from "@/ui/DutyStrip";
import { OwnerStamp } from "@/ui/OwnerStamp";
import { StageLedger } from "@/ui/StageLedger";
import { AlertList, STAGE_TONE, Timeline } from "@/app/f/[caseId]/parts";
import { calendarFor } from "@/server/config/calendar";

export default async function PublicTrack({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const lang = await getLang();
  const isEn = lang === "en";
  const c = await loadPublicCase(code);

  if (!c) {
    return (
      <Shell lang={lang} narrow>
        <PageHead
          eyebrow="PUBLIC FILE TRACKER · फ़ाइल देखें"
          title={isEn ? "No Record Found / फ़ाइल नहीं मिली" : "फ़ाइल नहीं मिली / Not Found"}
          meta={
            <p className="measure muted">
              {isEn
                ? "The entered code could not be matched. Please verify your Case ID (MLG-26-...), 15-digit Registration No, or OTR."
                : "दर्ज किया गया कोड नहीं मिला। कृपया अपनी केस आईडी (MLG-26-...), 15 अंकों की पंजीकरण संख्या, या OTR की जाँच करें।"}
            </p>
          }
        />
        <div style={{ marginTop: "var(--s4)" }}>
          <Link className="btn btn-primary" href="/pravesh?mode=track">
            {isEn ? "Try Searching Again →" : "दोबारा खोजें →"}
          </Link>
        </div>
      </Shell>
    );
  }

  if (c.kind === "otr_no_case") {
    return (
      <Shell lang={lang} narrow>
        <PageHead
          eyebrow={`OTR RECOVERY · ${c.otr}`}
          title={isEn ? "OTR exists, no application yet" : "OTR मौजूद है, अभी तक कोई आवेदन नहीं"}
          meta={
            <p className="measure muted">
              {isEn
                ? `One-Time Registration profile (${c.otr}) is active, but no scholarship application case has been submitted for this session.`
                : `जीवनभर का OTR (${c.otr}) बना हुआ है, लेकिन इस सत्र के लिए कोई आवेदन फ़ॉर्म जमा नहीं हुआ है।`}
            </p>
          }
        />
        <div className="sheet stack" style={{ marginTop: "var(--s4)", ["--gap" as string]: "var(--s4)" }}>
          <Callout tone="info" title="Ready to Apply / आवेदन के लिए तैयार">
            <p style={{ fontSize: "var(--step-s)" }}>
              Your lifetime OTR profile is ready. Click below to login and start your scholarship application.
            </p>
          </Callout>
          <div className="row">
            <Link className="btn btn-primary" href="/pravesh">
              {isEn ? "Apply Now →" : "अभी आवेदन करें →"}
            </Link>
            <Link className="btn btn-quiet" href="/">
              Back to Home
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const calendar = calendarFor(
    c.trackHi.includes("पूर्वदशम") ? "pre_9_10" : c.trackHi.includes("इंटर") ? "post_inter" : "dashmottar",
    c.cycleHi === "नवीनीकरण" ? "renewal" : "fresh",
  );

  const tone = STAGE_TONE[c.stage] ?? "neutral";

  return (
    <Shell lang={lang} narrow>
      <DutyStrip
        stageHi={c.stageHi}
        tone={tone}
        ownerNameHi={c.owner ? c.owner.nameHi : null}
        dueAt={c.dueAt}
      />

      <PageHead
        eyebrow={`PUBLIC TRACKER · ${c.trackHi} · ${c.cycleHi}`}
        title={isEn ? "Public Application Status" : "फ़ाइल की सार्वजनिक स्थिति"}
        meta={
          <p className="measure muted">
            {isEn
              ? "Shareable public view — contains zero passwords, captchas, Aadhaar, or private certificates."
              : "यह लिंक साझा करने योग्य है और इसमें कोई निजी विवरण नहीं है — बिना किसी पासवर्ड या कैप्चा के फ़ाइल की स्थिति देखें।"}
          </p>
        }
      />

      {/* Above-the-fold 3 Labelled IDs summary */}
      <div className="sheet stack" style={{ ["--gap" as string]: "var(--s3)", margin: "var(--s4) 0" }}>
        <div className="bento-grid bento-grid-3" style={{ gap: "var(--s3)" }}>
          <div className="sheet sheet-tight sheet-sunk stack" style={{ ["--gap" as string]: "2px" }}>
            <span className="faint" style={{ fontSize: "var(--step-s)", fontWeight: 600 }}>1. OTR Number</span>
            <span className="mono tnum" style={{ fontSize: "var(--step-1)", fontWeight: 700 }}>{c.otr ?? "—"}</span>
          </div>
          <div className="sheet sheet-tight sheet-sunk stack" style={{ ["--gap" as string]: "2px" }}>
            <span className="faint" style={{ fontSize: "var(--step-s)", fontWeight: 600 }}>2. Session Reg No</span>
            <span className="mono tnum" style={{ fontSize: "var(--step-1)", fontWeight: 700 }}>{c.registrationNo ?? "Pending"}</span>
          </div>
          <div className="sheet sheet-tight sheet-sunk stack" style={{ ["--gap" as string]: "2px" }}>
            <span className="faint" style={{ fontSize: "var(--step-s)", fontWeight: 600 }}>3. Case ID</span>
            <span className="mono tnum" style={{ fontSize: "var(--step-1)", fontWeight: 700 }}>{c.id}</span>
          </div>
        </div>
      </div>

      <div className="stack" style={{ ["--gap" as string]: "var(--s5)", marginTop: "var(--s4)" }}>
        <OwnerStamp
          owner={c.owner}
          dueAt={c.dueAt}
          breachDays={c.breachDays}
          waitingDays={c.waitingDays}
        />

        <div className="sheet">
          <Money
            amount={c.estimate.total}
            label={isEn ? "Estimated Benefit (Tuition + Maintenance)" : "अनुमानित लाभ"}
            basis={c.estimate.basisHi}
          />
        </div>

        <AlertList alerts={c.alerts} caseId={c.id} />

        {c.flags.length > 0 ? (
          <Callout tone="warn" title={isEn ? "Actionable Objections" : "दर्ज आपत्तियाँ"}>
            <ul>
              {c.flags.map((f, i) => (
                <li key={i}>
                  {f.reason?.hi ?? f.code} — <strong>Required Action:</strong> {f.reason?.fixHi}
                </li>
              ))}
            </ul>
          </Callout>
        ) : null}

        <section className="stack">
          <h2>Stage Ledger / फ़ाइल की स्थिति</h2>
          <StageLedger
            stage={c.stage}
            hasUniversity={c.events.some((e) => e.type === "institute_forwarded")}
            stageEnteredAt={c.stageEnteredAt}
            dueAt={c.dueAt}
            breachDays={c.breachDays}
            calendar={calendar}
            events={c.events}
          />
        </section>

        <section className="stack">
          <Timeline events={c.events} />
        </section>
      </div>
    </Shell>
  );
}


