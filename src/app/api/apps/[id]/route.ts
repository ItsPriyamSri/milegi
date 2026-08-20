import { NextResponse } from "next/server";
import { envelope, jsonError } from "@/server/logic";
import { getApp, hydrate } from "@/server/store";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await hydrate();
    const { id } = await ctx.params;
    return NextResponse.json(envelope(getApp(id)));
  } catch (err) {
    const { status, body } = jsonError(err);
    return NextResponse.json(body, { status });
  }
}
