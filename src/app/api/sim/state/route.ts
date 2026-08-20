import { handler, ok } from "@/server/http";
import { simState } from "@/server/sim";
import { UPSTREAM_LABEL_HI } from "@/server/external/gate";

export const GET = handler(async () =>
  ok({ ...simState(), simulated: true, labelsHi: UPSTREAM_LABEL_HI }),
);
