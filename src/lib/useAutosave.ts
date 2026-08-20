"use client";
import { useEffect, useRef, useState } from "react";
import { patchDraft } from "./api";
import type { Application } from "@/server/types";

export function useAutosave(id: string) {
  const key = `milegi-draft-${id}`;
  const [dirty, setDirty] = useState<Partial<Application>>({});
  const dirtyRef = useRef<Partial<Application>>({});
  const [synced, setSynced] = useState(true);
  const [failed, setFailed] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  /** Push whatever is pending. Safe to call twice; never throws. */
  async function flush() {
    const payload = dirtyRef.current;
    if (Object.keys(payload).length === 0) return;
    try {
      const env = await patchDraft(id, payload);
      dirtyRef.current = {};
      setDirty({});
      setSavedAt(env.app.lastSavedAt);
      setSynced(true);
      setFailed(false);
      localStorage.removeItem(key);
      return env;
    } catch {
      // Server said no, or the network died. The phone copy is already written,
      // so the student loses nothing; we just admit it is not synced.
      setSynced(false);
      setFailed(true);
    }
  }

  function update(partial: Partial<Application>) {
    dirtyRef.current = { ...dirtyRef.current, ...partial };
    setDirty(dirtyRef.current);
    localStorage.setItem(key, JSON.stringify(dirtyRef.current));
    setSynced(false);
    setFailed(false);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void flush();
    }, 2000);
  }

  useEffect(() => {
    const queued = localStorage.getItem(key);
    if (queued) {
      const parsed = JSON.parse(queued) as Partial<Application>;
      dirtyRef.current = parsed;
      setDirty(parsed);
      setSynced(false);
      void flush();
    }
    const onUp = () => {
      if (localStorage.getItem(key)) void flush();
    };
    window.addEventListener("online", onUp);
    return () => {
      window.removeEventListener("online", onUp);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [id]);

  const saveKey: "notSynced" | "savedPhone" | "saved" | null = failed
    ? "notSynced"
    : Object.keys(dirty).length
      ? "savedPhone"
      : savedAt
        ? "saved"
        : null;

  return { update, flush, savedAt, dirty, synced, saveKey };
}
