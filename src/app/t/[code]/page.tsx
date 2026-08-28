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
  const c = await loadPublicCase(code);

  if (!c) {
    return (
      <Shell lang={lang} narrow>
        <PageHead
          eyebrow="सार्वजनिक स्थिति जाँच"
          title="यह फ़ाइल नहीं मिली"
          meta={
            <p className="measure muted">
              आवेदन संख्या ऐसी दिखती है: <span className="mono">MLG-26-000137</span>. कृपया दोबारा जाँच लें।
            </p>
          }
        />
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
        eyebrow={`${c.trackHi} · ${c.cycleHi} · ${c.id}`}
        title="फ़ाइल की सार्वजनिक स्थिति"
        meta={
          <p className="measure muted">
            यह लिंक साझा करने योग्य है और इसमें कोई निजी विवरण नहीं है — बिना किसी पासवर्ड या कैप्चा के
            अभिभावक भी फ़ाइल की स्थिति देख सकते हैं।
          </p>
        }
      />

      <div className="stack" style={{ ["--gap" as string]: "var(--s5)", marginTop: "var(--s5)" }}>
        <OwnerStamp
          owner={c.owner}
          dueAt={c.dueAt}
          breachDays={c.breachDays}
          waitingDays={c.waitingDays}
        />

        <div className="sheet">
          <Money
            amount={c.estimate.total}
            label="अनुमानित लाभ"
            basis={c.estimate.basisHi}
          />
        </div>

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

        <section className="stack">
          <h2>फ़ाइल कहाँ तक पहुँची · Stage Ledger</h2>
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

