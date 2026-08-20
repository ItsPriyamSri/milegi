import { handler, ok, readJson } from "@/server/http";
import { routeStudent, type RouteAnswers } from "@/server/route";
import { SCHEMES } from "@/server/config/schemes";
import { calendarFor } from "@/server/config/calendar";

export const POST = handler(async (req) => {
  const body = await readJson(req);
  const answers: RouteAnswers = {
    studying: (["class_9_10", "class_11_12", "college"].includes(String(body.studying))
      ? String(body.studying)
      : "college") as RouteAnswers["studying"],
    firstYear: body.firstYear === true,
    gotLastYear: (["yes", "no", "dunno"].includes(String(body.gotLastYear))
      ? String(body.gotLastYear)
      : "dunno") as RouteAnswers["gotLastYear"],
    changedCourse: body.changedCourse === true,
    rejectedLastYear: body.rejectedLastYear === true,
    inUp: body.inUp !== false,
  };
  const result = routeStudent(answers);
  return ok({
    ...result,
    schemeHi: SCHEMES[result.track].nameHi,
    classesHi: SCHEMES[result.track].classesHi,
    calendar: calendarFor(result.track, result.cycle),
  });
});
