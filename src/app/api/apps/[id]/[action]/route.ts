import { NextResponse } from "next/server";
import {
  attestInstitute,
  completeKyc,
  crash,
  envelope,
  jsonError,
  lock,
  moveToReview,
  openForm,
  pay,
  pingClerk,
  raiseFeeDispute,
  reject,
  retryNpci,
} from "@/server/logic";
import { getApp, hydrate, persist } from "@/server/store";
import type { Application } from "@/server/types";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; action: string }> },
) {
  try {
    await hydrate();
    const { id, action } = await ctx.params;
    let extra: Record<string, unknown> = {};
    let app: Application;

    if (action === "kyc") app = completeKyc(id);
    else if (action === "open") app = openForm(id);
    else if (action === "review") app = moveToReview(id);
    else if (action === "lock") app = lock(id);
    else if (action === "npci") {
      await new Promise((r) => setTimeout(r, 400)); // the hang students actually feel
      app = retryNpci(id);
    } else if (action === "attest") app = attestInstitute(id);
    else if (action === "pay") app = pay(id);
    else if (action === "reject") app = reject(id);
    else if (action === "ping") app = pingClerk(id);
    else if (action === "fee-dispute") {
      const body = (await req.json().catch(() => ({}))) as { note?: string };
      app = raiseFeeDispute(id, body.note ?? "रसीद मेल नहीं खाती");
    } else if (action === "crash") {
      extra = crash(id);
      app = getApp(id);
    } else {
      return NextResponse.json(
        { ok: false, prototype: true, error: "unknown action" },
        { status: 404 },
      );
    }

    await persist();
    return NextResponse.json({ ...envelope(app), ...extra });
  } catch (err) {
    const { status, body } = jsonError(err);
    return NextResponse.json(body, { status });
  }
}
