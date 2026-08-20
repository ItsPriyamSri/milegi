import crypto from "node:crypto";

export type SessionRole = "student" | "institute" | "dwo";
export type Session = { role: SessionRole; subjectId: string; exp: number };

export const COOKIE = "mlg_session";

function secret(): string {
  return process.env.MILEGI_SESSION_SECRET || "dev-only-change-me";
}

export function signSession(s: Session): string {
  const body = Buffer.from(JSON.stringify(s)).toString("base64url");
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifySession(token: string | undefined): Session | null {
  if (!token || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (mac.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    return s.exp > Date.now() ? s : null;
  } catch {
    return null;
  }
}

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
