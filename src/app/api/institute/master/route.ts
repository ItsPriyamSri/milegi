import { handler, ok, readJson, num, str } from "@/server/http";
import { requireRole } from "@/server/session-cookie";
import { publishCourse, unpublishCourse } from "@/server/institute";
import { getInstitute } from "@/server/store";

export const POST = handler(async (req) => {
  const session = await requireRole("institute");
  const body = await readJson(req);
  const code = str(body.code, "कोर्स कोड", 30);
  const clerk = getInstitute(session.subjectId)!.clerk;
  const inst =
    body.publish === false
      ? unpublishCourse(session.subjectId, code)
      : publishCourse(
          session.subjectId,
          {
            code,
            tuition: num(body.tuition, "गैर-वापसी योग्य शुल्क"),
            ...(typeof body.nameHi === "string" && body.nameHi.trim()
              ? { nameHi: body.nameHi.trim() }
              : {}),
          },
          clerk,
        );
  return ok({
    courses: inst.courses.map((c) => ({
      code: c.code,
      nameHi: c.nameHi,
      tuition: c.feeHeads.tuition,
      published: Boolean(c.publishedAt),
      publishedAt: c.publishedAt,
    })),
  });
});
