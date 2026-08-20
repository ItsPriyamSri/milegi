import { NextResponse } from "next/server";
import { envelope, jsonError, patchDraft } from "@/server/logic";
import { hydrate, persist } from "@/server/store";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await hydrate();
    const { id } = await ctx.params;
    const partial = await req.json();
    const app = patchDraft(id, partial);
    await persist();
    return NextResponse.json(envelope(app));
  } catch (err) {
    const { status, body } = jsonError(err);
    return NextResponse.json(body, { status });
  }
}
