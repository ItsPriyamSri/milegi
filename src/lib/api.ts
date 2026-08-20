export type ApiError = {
  code: string;
  hi: string;
  en: string;
  retryable: boolean;
  ref: string;
  retryAfterSec?: number;
};

export class ApiFailure extends Error {
  error: ApiError;
  constructor(error: ApiError) {
    super(`${error.code}: ${error.en}`);
    this.name = "ApiFailure";
    this.error = error;
  }
}

const NETWORK: ApiError = {
  code: "NETWORK",
  hi: "नेटवर्क नहीं मिल रहा। आपका ड्राफ़्ट इस फ़ोन पर सुरक्षित है — कनेक्शन आने पर अपने आप सिंक हो जाएगा।",
  en: "No network. Your draft is safe on this phone and will sync when the connection returns.",
  retryable: true,
  ref: "NETWORK",
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiFailure(NETWORK);
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new ApiFailure({
      code: "BAD_RESPONSE",
      hi: "सर्वर से अधूरा जवाब मिला। थोड़ी देर में दोबारा कोशिश करें।",
      en: "The server returned an incomplete response.",
      retryable: true,
      ref: "BAD_RESPONSE",
    });
  }
  const envelope = body as { ok?: boolean; data?: T; error?: ApiError };
  if (!envelope || envelope.ok !== true) {
    throw new ApiFailure(
      envelope?.error ?? {
        code: "UNKNOWN",
        hi: "कुछ गड़बड़ हुई। आपका ड्राफ़्ट सुरक्षित है।",
        en: "Something went wrong. Your draft is safe.",
        retryable: true,
        ref: "UNKNOWN",
      },
    );
  }
  return envelope.data as T;
}

export const api = {
  get: <T>(path: string) => call<T>(path),
  post: <T>(path: string, body?: unknown) =>
    call<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    call<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};

export function errorOf(e: unknown): ApiError {
  return e instanceof ApiFailure ? e.error : NETWORK;
}
