import type { Application } from "@/server/types";
import type { Lang } from "@/lib/i18n";

const LOCKED = new Set(["institute", "dwo", "paid", "rejected"]);

export function caseHref(app: Application) {
  return LOCKED.has(app.status) ? `/status/${app.id}` : `/apply/${app.id}`;
}

export function statusLine(app: Application, lang: Lang): string {
  const wait = app.actors.find((a) => a.waitingDays > 0)?.waitingDays;
  if (lang === "hi") {
    if (app.status === "choose") return "दरवाज़ा बाकी";
    if (app.status === "preflight") return "कागज़ बाकी";
    if (app.status === "draft" || app.status === "review") return "फॉर्म अधूरा";
    if (app.status === "institute") return wait ? `क्लर्क के पास · ${wait} दिन` : "क्लर्क के पास";
    if (app.status === "dwo") return "जिला कल्याण के पास";
    if (app.status === "paid") return "भुगतान हो गया";
    return "अस्वीकृत";
  }
  if (app.status === "choose") return "Door still open";
  if (app.status === "preflight") return "Papers first";
  if (app.status === "draft" || app.status === "review") return "Form unfinished";
  if (app.status === "institute") return wait ? `With the clerk · ${wait} days` : "With the clerk";
  if (app.status === "dwo") return "With District Welfare";
  if (app.status === "paid") return "Paid";
  return "Rejected";
}
