import { handler, ok, readJson, str } from "@/server/http";
import { AppError } from "@/server/errors";
import { requireRole } from "@/server/session-cookie";
import { caseView, createCase, prefillFromLastYear, runPreflightOn } from "@/server/cases";
import { getProfile, putCase } from "@/server/store";
import type { Cycle, TrackId } from "@/server/types";

const TRACKS = ["pre_9_10", "post_inter", "dashmottar", "outside_state"];

export const POST = handler(async (req) => {
  const session = await requireRole("student");
  const profile = getProfile(session.subjectId);
  if (!profile) {
    throw new AppError("NO_PROFILE", {
      hi: "पहले OTR बनाएँ — आवेदन उसी पहचान से खुलता है।",
      en: "Create an OTR first.",
      status: 409,
    });
  }
  const body = await readJson(req);
  const track = str(body.track, "वर्ग", 20);
  const cycle = str(body.cycle, "प्रकार", 10);
  if (!TRACKS.includes(track) || (cycle !== "fresh" && cycle !== "renewal")) {
    throw new AppError("BAD_TRACK", {
      hi: "वर्ग या आवेदन का प्रकार गलत है।",
      en: "Unknown track or cycle.",
      status: 422,
    });
  }
  let created = createCase(profile, {
    track: track as TrackId,
    cycle: cycle as Cycle,
    instituteId: str(body.instituteId, "संस्थान", 60),
    courseCode: str(body.courseCode, "कोर्स", 30),
  });
  if (cycle === "renewal") created = prefillFromLastYear(profile, created);
  created = runPreflightOn(created, profile);
  putCase(created);
  return ok({ case: caseView(created) }, 201);
});
