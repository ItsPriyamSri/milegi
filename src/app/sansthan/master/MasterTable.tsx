"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { ErrorNote, StatusChip } from "@/ui/bits";
import { fmtDate, fmtMoney } from "@/lib/format";

export type Course = {
  code: string;
  nameHi: string;
  tuition: number;
  published: boolean;
  publishedAt: string | null;
  feeHeads: Record<string, number>;
};

export function MasterTable({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  async function save(code: string, publish: boolean) {
    setBusy(code);
    setError(null);
    try {
      const tuition = Number(edit[code] ?? courses.find((c) => c.code === code)?.tuition ?? 0);
      await api.post("/api/institute/master", { code, tuition, publish });
      router.refresh();
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack">
      {error ? <ErrorNote error={error} /> : null}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">कोर्स</th>
              <th scope="col" className="num">
                गैर-वापसी योग्य शुल्क
              </th>
              <th scope="col" className="num">
                बाहर रखे मद
              </th>
              <th scope="col">स्थिति</th>
              <th scope="col">कार्रवाई</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.code}>
                <td>
                  {c.nameHi} <span className="faint mono">{c.code}</span>
                </td>
                <td className="num">
                  <input
                    type="number"
                    aria-label={`${c.nameHi} शुल्क`}
                    style={{ width: "8rem", minHeight: 28, textAlign: "right" }}
                    value={edit[c.code] ?? String(c.tuition)}
                    onChange={(e) => setEdit((p) => ({ ...p, [c.code]: e.target.value }))}
                  />
                </td>
                <td className="num faint tnum">
                  {["exam", "hostel", "mess", "caution", "library"]
                    .filter((k) => (c.feeHeads[k] ?? 0) > 0)
                    .map((k) => fmtMoney(c.feeHeads[k]))
                    .join(" · ") || "—"}
                </td>
                <td>
                  {c.published ? (
                    <StatusChip tone="verified">प्रकाशित {fmtDate(c.publishedAt)}</StatusChip>
                  ) : (
                    <StatusChip tone="breach">प्रकाशित नहीं — छात्र चुन नहीं सकते</StatusChip>
                  )}
                </td>
                <td>
                  <div className="row">
                    <button
                      className="btn btn-sm btn-primary"
                      type="button"
                      disabled={busy !== null}
                      onClick={() => save(c.code, true)}
                    >
                      {busy === c.code ? "…" : c.published ? "शुल्क अपडेट करें" : "प्रकाशित करें"}
                    </button>
                    {c.published ? (
                      <button
                        className="btn btn-sm"
                        type="button"
                        disabled={busy !== null}
                        onClick={() => save(c.code, false)}
                      >
                        हटाएँ
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
