"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorOf, type ApiError } from "./api";
import { mergePatches, nextBackoffMs, readLocal, writeLocal, type Patch } from "./queue";

export type SaveState = "saved" | "local" | "pending";

type DraftResponse = {
  case: { form: Record<string, unknown>; estimate: { total: number; basisHi: string } };
  rejected: string[];
  savedAt: string;
};

const DEBOUNCE_MS = 900;

/**
 * The phone copy is written on every keystroke batch, unconditionally — a 502 mid-PATCH looks nothing
 * like being offline, and losing 25 minutes of typing to a crash is the pain this product exists for.
 */
export function useAutosave(caseId: string, initial: Record<string, unknown>) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const local = readLocal(caseId);
    return local ? { ...initial, ...local } : initial;
  });
  const [saveState, setSaveState] = useState<SaveState>(() =>
    readLocal(caseId) ? "local" : "saved",
  );
  const [lastError, setLastError] = useState<ApiError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [serverExtras, setServerExtras] = useState<DraftResponse["case"] | null>(null);

  const pending = useRef<Patch[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempt = useRef(0);
  const inFlight = useRef(false);

  const flush = useCallback(async () => {
    if (inFlight.current) return;
    const batch = mergePatches(pending.current);
    if (Object.keys(batch).length === 0) return;
    inFlight.current = true;
    try {
      const res = await api.patch<DraftResponse>(`/api/cases/${caseId}/draft`, batch);
      pending.current = [];
      attempt.current = 0;
      setFieldErrors(res.rejected ?? []);
      setServerExtras(res.case);
      setLastError(null);
      setSaveState("saved");
    } catch (e) {
      attempt.current += 1;
      setLastError(errorOf(e));
      setSaveState("pending");
      const wait = nextBackoffMs(attempt.current);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush();
      }, wait);
    } finally {
      inFlight.current = false;
    }
  }, [caseId]);

  const update = useCallback(
    (name: string, value: unknown) => {
      setValues((prev) => {
        const next = { ...prev, [name]: value };
        writeLocal(caseId, next);
        return next;
      });
      pending.current.push({ [name]: value });
      setSaveState("local");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush();
      }, DEBOUNCE_MS);
    },
    [caseId, flush],
  );

  useEffect(() => {
    function replay() {
      void flush();
    }
    window.addEventListener("online", replay);
    document.addEventListener("visibilitychange", replay);
    return () => {
      window.removeEventListener("online", replay);
      document.removeEventListener("visibilitychange", replay);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [flush]);

  return { values, update, saveState, flush, lastError, fieldErrors, serverExtras };
}
