import { handler, ok } from "@/server/http";
import { resetAll, simState } from "@/server/sim";
import { markDirty } from "@/server/store";

export const POST = handler(async () => {
  resetAll();
  markDirty();
  return ok({ ...simState(), simulated: true, resetHi: "सब कुछ बीज-डेटा पर लौट आया।" });
});
