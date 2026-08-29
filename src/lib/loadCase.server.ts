import { redirect } from "next/navigation";
import { caseView, trackView } from "@/server/cases";
import { readSession } from "@/server/session-cookie";
import { getCase, hydrate } from "@/server/store";
import { resolveTracking } from "@/server/track";

/** Read screens talk to the domain directly; only mutations go through the HTTP API. */
export async function loadOwnCase(id: string) {
  await hydrate();
  const session = await readSession();
  if (!session || session.role !== "student") redirect("/pravesh");
  const existing = getCase(id);
  if (!existing) redirect("/pravesh?mode=track");
  if (existing.profileId !== session.subjectId) redirect("/pravesh?mode=track");
  return caseView(existing);
}

export async function loadPublicCase(code: string) {
  await hydrate();
  const hit = resolveTracking(decodeURIComponent(code));
  if (hit.kind === "otr_no_case") {
    return { kind: "otr_no_case" as const, otr: hit.otr };
  }
  if (hit.kind === "case") {
    return { kind: "case" as const, ...trackView(hit.case) };
  }
  return null;
}

