import type { Case } from "./types";
import { daysBetween, iso } from "./clock";
import { calendarFor } from "./config/calendar";
import { REASONS } from "./config/reasons";
import { stageLabelHi } from "./machine";

/**
 * The escalation a real citizen had to compose by hand before anyone acted on a three-month stall.
 * It states only facts already on the case: no invented officer, no phone number, no promise.
 */
export function grievanceDraft(
  c: Case,
  who: { nameHi: string; otr: string; mobile: string },
  nowIso: string = iso(),
): { subjectHi: string; bodyHi: string; bodyEn: string } {
  const waited = Math.abs(daysBetween(c.stageEnteredAt, nowIso));
  const late = c.dueAt ? Math.max(0, daysBetween(c.dueAt, nowIso)) : 0;
  const cal = calendarFor(c.track, c.cycle);
  const flags =
    c.flags.map((f) => REASONS[f.code]?.hi ?? f.code).join("; ") || "कोई आपत्ति दर्ज नहीं";

  const subjectHi = `छात्रवृत्ति आवेदन ${c.id} (सत्र ${c.session}) ${waited} दिन से एक ही चरण पर लंबित — निस्तारण हेतु अनुरोध`;

  const bodyHi = [
    "सेवा में,",
    "जिला समाज कल्याण अधिकारी / सम्बंधित अधिकारी",
    "",
    `विषय: ${subjectHi}`,
    "",
    "महोदय,",
    `मेरा छात्रवृत्ति आवेदन (आवेदन संख्या ${c.id}, OTR ${who.otr}, सत्र ${c.session}) दिनांक ` +
      `${c.stageEnteredAt.slice(0, 10)} से "${stageLabelHi(c.stage)}" चरण पर लंबित है। यह चरण ` +
      `${c.owner ? `${c.owner.nameHi} (${c.owner.designationHi}, ${c.owner.orgHi})` : "—"} के पास है` +
      (c.dueAt
        ? ` और निर्धारित समय सीमा ${c.dueAt.slice(0, 10)} से ${late} दिन बीत चुके हैं।`
        : "।"),
    `दर्ज आपत्तियाँ: ${flags}.`,
    `विभागीय अधिसूचना के अनुसार इस वर्ग के लिए सत्यापन विंडो ${cal.dwoWindowFrom.slice(0, 10)} से ` +
      `${cal.dwoWindowEnd.slice(0, 10)} तक और भुगतान अवधि ${cal.disbursementFrom.slice(0, 10)} से ` +
      `${cal.disbursementTo.slice(0, 10)} तक है।`,
    "कृपया प्रकरण का निस्तारण कराकर स्थिति से अवगत कराने की कृपा करें।",
    "",
    "भवदीय,",
    `${who.nameHi} (पंजीकृत मोबाइल: ${who.mobile})`,
    "",
    "[यह मसौदा एक स्वतंत्र प्रोटोटाइप ने तैयार किया है। भेजने से पहले विवरण जाँच लें।]",
  ].join("\n");

  const bodyEn = [
    "To the District Social Welfare Officer / concerned authority,",
    `Subject: scholarship application ${c.id} (session ${c.session}) pending at one stage for ${waited} days.`,
    `The file has been at "${c.stage}" since ${c.stageEnteredAt.slice(0, 10)}, held by ` +
      `${c.owner?.nameHi ?? "—"}, and is ${late} days past the stated deadline of ${
        c.dueAt?.slice(0, 10) ?? "—"
      }.`,
    `Recorded objections: ${flags}. Please have the case disposed of and inform me of the status.`,
    "[Draft prepared by an independent prototype. Verify before sending.]",
  ].join("\n");

  return { subjectHi, bodyHi, bodyEn };
}
