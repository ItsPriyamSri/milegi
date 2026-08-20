"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { t } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

const LINKS = [
  { href: "/", key: "navHome" as const },
  { href: "/schemes", key: "navSchemes" as const },
  { href: "/circulars", key: "navCirculars" as const },
  { href: "/grievance", key: "navGrievance" as const },
  { href: "/limitations", key: "limits" as const },
];

export default function SiteNav() {
  const lang = useLang();
  const path = usePathname();
  return (
    <nav className="sitenav" aria-label="Milegi">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={path === link.href ? "here" : undefined}
        >
          {t(lang, link.key)}
        </Link>
      ))}
    </nav>
  );
}
