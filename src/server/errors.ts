export type ErrorBody = {
  ok: false;
  prototype: true;
  error: {
    code: string;
    hi: string;
    en: string;
    retryable: boolean;
    ref: string;
    retryAfterSec?: number;
  };
};

export function newRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return `ERR-${out}`;
}

export class AppError extends Error {
  code: string;
  hi: string;
  en: string;
  retryable: boolean;
  status: number;
  ref: string;
  retryAfterSec?: number;
  /** Logged server-side, never serialised to a client. */
  upstream?: string;

  constructor(
    code: string,
    o: {
      hi: string;
      en: string;
      retryable?: boolean;
      status?: number;
      upstream?: string;
      retryAfterSec?: number;
    },
  ) {
    super(`${code}: ${o.en}`);
    this.name = "AppError";
    this.code = code;
    this.hi = o.hi;
    this.en = o.en;
    this.retryable = o.retryable ?? false;
    this.status = o.status ?? (o.retryable ? 503 : 400);
    this.ref = newRef();
    this.upstream = o.upstream;
    this.retryAfterSec = o.retryAfterSec;
  }
}

export function errorBody(e: unknown): ErrorBody {
  if (e instanceof AppError) {
    if (e.upstream) console.error(`[${e.ref}] ${e.code} upstream=${e.upstream}`);
    return {
      ok: false,
      prototype: true,
      error: {
        code: e.code,
        hi: e.hi,
        en: e.en,
        retryable: e.retryable,
        ref: e.ref,
        ...(e.retryAfterSec ? { retryAfterSec: e.retryAfterSec } : {}),
      },
    };
  }
  const ref = newRef();
  console.error(`[${ref}] unexpected`, e);
  return {
    ok: false,
    prototype: true,
    error: {
      code: "INTERNAL",
      ref,
      retryable: true,
      hi: "कुछ गड़बड़ हुई, पर आपका ड्राफ़्ट सुरक्षित है। थोड़ी देर में दोबारा कोशिश करें।",
      en: "Something broke, but your draft is safe. Try again shortly.",
    },
  };
}
