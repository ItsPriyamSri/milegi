import { cookies } from "next/headers";
import type { Lang } from "./i18n";

export const LANG_COOKIE = "mlg_lang";

export async function getLang(): Promise<Lang> {
  const jar = await cookies();
  return jar.get(LANG_COOKIE)?.value === "en" ? "en" : "hi";
}
