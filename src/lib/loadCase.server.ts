import { redirect } from "next/navigation";
import { caseView, trackView } from "@/server/cases";
import { readSession } from "@/server/session-cookie";
import { getCase, hydrate } from "@/server/store";

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
  const existing = getCase(decodeURIComponent(code).trim().toUpperCase());
  return existing ? trackView(existing) : null;
}
