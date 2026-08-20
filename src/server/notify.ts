import type { Case, Notification } from "./types";
import { iso } from "./clock";
import { getProfile, notificationsFor, putNotification } from "./store";

/**
 * The outbox is a table that the student can read on screen. Nothing is dispatched anywhere: the real
 * portal sends no SMS at all, so showing the message trail is the fix, and faking a send would be a lie.
 */
export function sendNotification(c: Case, reason: string, textHi: string): Notification {
  const profile = getProfile(c.profileId);
  const n: Notification = {
    id: `ntf_${c.id}_${reason}_${Math.random().toString(36).slice(2, 8)}`,
    caseId: c.id,
    channel: "sms",
    to: profile?.mobile ?? "—",
    textHi: `${textHi} — मिलेगी (नकली सूचना)`,
    reason,
    createdAt: iso(),
  };
  putNotification(n);
  return n;
}

/** Send at most one notification per reason per day, so a sweep cannot spam the outbox. */
export function sendOnce(c: Case, reason: string, textHi: string): Notification | null {
  const nowIso = iso();
  const already = notificationsFor(c.id).some(
    (n) => n.reason === reason && n.createdAt.slice(0, 10) === nowIso.slice(0, 10),
  );
  if (already) return null;
  return sendNotification(c, reason, textHi);
}
