import { handler, ok } from "@/server/http";
import { allInstitutes } from "@/server/store";
import { districtHi } from "@/server/config/districts";

export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const kind = url.searchParams.get("kind");
  const list = allInstitutes()
    .filter((i) => (kind ? i.kind === kind : true))
    .filter((i) =>
      q.length === 0
        ? true
        : `${i.nameHi} ${i.nameEn} ${districtHi(i.districtCode)}`.toLowerCase().includes(q),
    )
    .map((i) => ({
      id: i.id,
      nameHi: i.nameHi,
      nameEn: i.nameEn,
      districtCode: i.districtCode,
      districtHi: districtHi(i.districtCode),
      kind: i.kind,
      affiliatedTo: i.affiliatedTo,
      masterDataPublishedAt: i.masterDataPublishedAt,
      clerkNameHi: i.clerk.nameHi,
      courses: i.courses.map((c) => ({
        code: c.code,
        nameHi: c.nameHi,
        nameEn: c.nameEn,
        group: c.group,
        years: c.years,
        published: Boolean(c.publishedAt),
        tuition: c.feeHeads.tuition,
        excluded: (["exam", "hostel", "mess", "caution", "library"] as const)
          .filter((k) => c.feeHeads[k] > 0)
          .map((k) => ({ key: k, amount: c.feeHeads[k] })),
      })),
    }));
  return ok({ institutes: list });
});
