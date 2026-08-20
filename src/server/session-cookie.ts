import { cookies } from "next/headers";
import { AppError } from "./errors";
import { COOKIE, SESSION_TTL_MS, signSession, verifySession, type Session, type SessionRole } from "./session";

export async function readSession(): Promise<Session | null> {
  const jar = await cookies();
  return verifySession(jar.get(COOKIE)?.value);
}

export async function setSession(role: SessionRole, subjectId: string): Promise<Session> {
  const s: Session = { role, subjectId, exp: Date.now() + SESSION_TTL_MS };
  const jar = await cookies();
  jar.set(COOKIE, signSession(s), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return s;
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function requireRole(role: SessionRole): Promise<Session> {
  const s = await readSession();
  if (!s || s.role !== role) {
    throw new AppError("FORBIDDEN", {
      hi:
        role === "student"
          ? "पहले मोबाइल से लॉगिन करें।"
          : "यह पृष्ठ संस्थान/जिला कार्यालय के लॉगिन से खुलता है।",
      en: `A ${role} session is required.`,
      status: 403,
    });
  }
  return s;
}
