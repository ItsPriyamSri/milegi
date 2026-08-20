import { AppError, errorBody } from "./errors";
import { hydrate, persist } from "./store";

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ ok: true, prototype: true, data }, { status });
}

export function fail(e: unknown): Response {
  const body = errorBody(e);
  const status = e instanceof AppError ? e.status : 500;
  return Response.json(body, { status });
}

export function storeGuard(): void {
  const onVercel = Boolean(process.env.VERCEL);
  if (onVercel && !process.env.DATABASE_URL && process.env.MILEGI_ALLOW_EPHEMERAL !== "1") {
    throw new AppError("STORE_UNCONFIGURED", {
      hi: "यह तैनाती डेटाबेस से जुड़ी नहीं है, इसलिए आवेदन सुरक्षित नहीं रह पाएगा।",
      en: "This deployment has no database configured, so applications would not persist.",
      status: 503,
    });
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") throw new Error("not an object");
    return body as Record<string, unknown>;
  } catch {
    throw new AppError("BAD_BODY", {
      hi: "भेजा गया डेटा पढ़ा नहीं जा सका। पृष्ठ दोबारा लोड करके कोशिश करें।",
      en: "The request body could not be parsed.",
      status: 400,
    });
  }
}

type Ctx = { params: Promise<Record<string, string>> };

/** hydrate -> auth/validate/domain -> persist -> envelope. Every route handler uses this. */
export function handler(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      storeGuard();
      await hydrate();
      const res = await fn(req, ctx);
      await persist();
      return res;
    } catch (e) {
      try {
        await persist();
      } catch {
        // a failed persist must not mask the original error
      }
      return fail(e);
    }
  };
}

export function str(v: unknown, field: string, max = 120): string {
  if (typeof v !== "string" || v.trim().length === 0) {
    throw new AppError("FIELD_REQUIRED", {
      hi: `${field} भरना ज़रूरी है।`,
      en: `${field} is required.`,
      status: 422,
    });
  }
  return v.trim().slice(0, max);
}

export function num(v: unknown, field: string): number {
  const n = Number(v);
  if (!Number.isFinite(n)) {
    throw new AppError("FIELD_REQUIRED", {
      hi: `${field} संख्या में भरें।`,
      en: `${field} must be a number.`,
      status: 422,
    });
  }
  return n;
}
