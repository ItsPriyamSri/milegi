import { NextResponse } from "next/server";
import { envelope, jsonError } from "@/server/logic";
import { getAppByResume, hydrate } from "@/server/store";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    await hydrate();
    const { code } = await ctx.params;
    return NextResponse.json(envelope(getAppByResume(decodeURIComponent(code))));
  } catch (err) {
    const { status, body } = jsonError(err);
    return NextResponse.json(body, { status });
  }
}
