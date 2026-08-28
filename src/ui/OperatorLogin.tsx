"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, errorOf, type ApiError } from "@/lib/api";
import { ErrorNote } from "@/ui/bits";

export function OperatorLogin({
  role,
  next,
  options,
}: {
  role: "institute" | "dwo";
  next: string;
  options: { code: string; labelHi: string; pin: string }[];
}) {
  const router = useRouter();
  const [code, setCode] = useState(options[0]?.code ?? "");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/auth/operator", { role, code, pin });
      router.push(next);
    } catch (err) {
      setError(errorOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="sheet stack" style={{ maxWidth: "420px", margin: "0 auto" }} onSubmit={submit}>
      <div className="field">
        <label htmlFor="code">{role === "institute" ? "संस्थान" : "जिला"}</label>
        <select id="code" value={code} onChange={(e) => setCode(e.target.value)}>
          {options.map((o) => (
            <option key={o.code} value={o.code}>
              {o.labelHi}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="pin">पिन</label>
        <input
          id="pin"
          className="mono"
          inputMode="numeric"
          maxLength={8}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <span className="field-hint">
          डेमो पिन जान-बूझकर यहीं लिखा है: <span className="mono">1234</span>. यह एक प्रोटोटाइप है,
          इसमें छिपाने जैसा कुछ नहीं।
        </span>
      </div>
      {error ? <ErrorNote error={error} /> : null}
      <button className="btn btn-primary" type="submit" disabled={busy || pin.length === 0}>
        {busy ? "खोल रहे हैं…" : "लॉगिन"}
      </button>
    </form>
  );
}
