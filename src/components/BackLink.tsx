"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { t } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

export default function BackLink() {
  const lang = useLang();
  const path = usePathname();
  if (path === "/") return null;
  const hat = path.match(/^\/(institute|dwo|sanshodhan)\/([^/]+)/);
  const href = hat ? `/status/${hat[2]}` : "/";
  const label = hat ? t(lang, "backToCase") : t(lang, "back");
  return (
    <p className="backrow">
      <Link href={href}>{label}</Link>
    </p>
  );
}
