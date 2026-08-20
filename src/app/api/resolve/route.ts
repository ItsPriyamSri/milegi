import { NextResponse } from "next/server";
import { jsonError, resolveDoor } from "@/server/logic";
import { hydrate } from "@/server/store";
import type { GotLastYear, Studying } from "@/server/logic";

const STUDYING: Studying[] = ["9-10", "11-12", "college", "outside"];
const GOT: GotLastYear[] = ["yes", "no", "dunno"];

export async function POST(req: Request) {
  try {
    await hydrate();
    const body = (await req.json()) as {
      studying?: Studying;
      firstYear?: boolean;
      gotLastYear?: GotLastYear;
    };
    if (!body.studying || !STUDYING.includes(body.studying)) {
      throw Object.assign(new Error("bad studying"), { status: 400 });
    }
    const gotLastYear = body.gotLastYear && GOT.includes(body.gotLastYear) ? body.gotLastYear : "dunno";
    const door = resolveDoor({
      studying: body.studying,
      firstYear: Boolean(body.firstYear),
      gotLastYear,
    });
    return NextResponse.json({ ok: true, prototype: true, ...door });
  } catch (err) {
    const { status, body } = jsonError(err);
    return NextResponse.json(body, { status });
  }
}
