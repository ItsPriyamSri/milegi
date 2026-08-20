import Link from "next/link";
import { Shell } from "@/ui/Shell";
import { getLang } from "@/lib/lang";
import { loadPublicCase } from "@/lib/loadCase.server";
import { Callout } from "@/ui/bits";
import { AlertList, CaseHead, OwnerCard, StageLedger, Timeline } from "@/app/f/[caseId]/parts";
import { calendarFor } from "@/server/config/calendar";

export default async function PublicTrack({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const lang = await getLang();
  const c = await loadPublicCase(code);

  if (!c) {
    return (
      <Shell lang={lang} narrow>
        <h1>यह फ़ाइल नहीं मिली</h1>
        <p className="muted" style={{ margin: "var(--s3) 0 var(--s4)" }}>
          आवेदन संख्या ऐसी दिखती है: <span className="mono">MLG-26-000137</span>. दोबारा जाँच लें।
        </p>
        <Link className="btn btn-primary" href="/pravesh?mode=track">
          फिर कोशिश करें
        </Link>
      </Shell>
    );
  }

  const calendar = calendarFor(
    c.trackHi.includes("पूर्वदशम") ? "pre_9_10" : c.trackHi.includes("इंटर") ? "post_inter" : "dashmottar",
    c.cycleHi === "नवीनीकरण" ? "renewal" : "fresh",
  );

  return (
    <Shell lang={lang} narrow>
      <p className="eyebrow">
        {c.trackHi} · {c.cycleHi} · {c.id}
      </p>
      <h1 style={{ marginTop: "var(--s3)" }}>फ़ाइल की स्थिति</h1>
      <p className="measure muted" style={{ margin: "var(--s3) 0 var(--s5)" }}>
        यह लिंक साझा किया जा सकता है और इसमें कोई निजी जानकारी नहीं है — न फ़ॉर्म, न प्रमाणपत्र संख्या।
        असली पोर्टल पर स्थिति देखने के लिए भी लॉगिन, पासवर्ड और कैप्चा चाहिए।
      </p>

      <div className="stack" style={{ ["--gap" as string]: "var(--s5)" }}>
        <CaseHead
          stage={c.stage}
          stageHi={c.stageHi}
          waitingDays={c.waitingDays}
          estimate={c.estimate}
        />
        <OwnerCard
          owner={c.owner}
          dueAt={c.dueAt}
          breachDays={c.breachDays}
          waitingDays={c.waitingDays}
        />
        <AlertList alerts={c.alerts} caseId={c.id} />
        {c.flags.length > 0 ? (
          <Callout tone="warn" title="दर्ज आपत्तियाँ">
            <ul>
              {c.flags.map((f, i) => (
                <li key={i}>
                  {f.reason?.hi ?? f.code} — <strong>करना है:</strong> {f.reason?.fixHi}
                </li>
              ))}
            </ul>
          </Callout>
        ) : null}
        <StageLedger
          stage={c.stage}
          hasUniversity={c.events.some((e) => e.type === "institute_forwarded")}
          stageEnteredAt={c.stageEnteredAt}
          dueAt={c.dueAt}
          breachDays={c.breachDays}
          calendar={calendar}
          events={c.events}
        />
        <Timeline events={c.events} />
      </div>
    </Shell>
  );
}
