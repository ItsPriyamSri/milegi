import { handler, ok } from "@/server/http";
import { runPayments, simState } from "@/server/sim";

export const POST = handler(async () => {
  const { rows, cases } = runPayments();
  return ok({
    rows,
    moved: cases.map((c) => ({ id: c.id, stage: c.stage, payment: c.payment })),
    state: simState(),
    simulated: true,
  });
});
