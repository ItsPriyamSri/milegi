"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getResume } from "@/lib/api";
import { t } from "@/lib/i18n";
import { useLang } from "@/lib/useLang";

const LOCKED = new Set(["institute", "dwo", "paid", "rejected"]);

export default function ResumePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const lang = useLang();
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!code) return;
    void getResume(code)
      .then((env) => {
        const path = LOCKED.has(env.app.status)
          ? `/status/${env.app.id}`
          : `/apply/${env.app.id}`;
        router.replace(path);
      })
      .catch(() => setMissing(true));
  }, [code, router]);

  if (missing) {
    return (
      <main>
        <h1>{t(lang, "unknownResume")}</h1>
        <p>
          <Link href="/">{t(lang, "homeLink")}</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <p className="lead">…</p>
    </main>
  );
}
