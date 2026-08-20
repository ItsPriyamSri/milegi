import { NextResponse } from "next/server";
import { envelope, jsonError } from "@/server/logic";
import { getApp, hydrate, persist, resetSeed } from "@/server/store";

export async function POST() {
  try {
    await hydrate();
    resetSeed();
    await persist();
    return NextResponse.json(envelope(getApp("app-priya")));
  } catch (err) {
    const { status, body } = jsonError(err);
    return NextResponse.json(body, { status });
  }
}
