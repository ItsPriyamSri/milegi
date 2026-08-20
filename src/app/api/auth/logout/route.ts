import { handler, ok } from "@/server/http";
import { clearSession } from "@/server/session-cookie";

export const POST = handler(async () => {
  await clearSession();
  return ok({ done: true });
});
