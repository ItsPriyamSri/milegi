import type { Application, Blocker, Institute } from "@/server/types";

export type Envelope = {
  ok: boolean;
  prototype: true;
  app: Application;
  blockers: Blocker[];
  missing: Blocker[];
  preflightOk: boolean;
  institute: Institute;
  crashed?: boolean;
  savedAt?: string;
  messageHi?: string;
  messageEn?: string;
};

/** Error bodies carry `error` and sometimes `blockers`, never a full app. */
export type ErrorBody = { ok: false; prototype: true; error: string; blockers?: Blocker[] };

export type DoorAlt = {
  appId: string;
  resumeCode: string;
  labelHi: string;
  labelEn: string;
} | null;

export type DoorEnvelope = {
  ok: boolean;
  prototype: true;
  completable: boolean;
  track: string;
  cycle: "fresh" | "renewal";
  appId: string | null;
  resumeCode: string | null;
  otrs: string[];
  alt: DoorAlt;
  messageHi: string;
  messageEn: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public body: ErrorBody,
  ) {
    super(message);
  }
}

async function parse(r: Response): Promise<Envelope> {
  const j = (await r.json()) as Envelope | ErrorBody;
  if (!r.ok || !j.ok) {
    const e = j as ErrorBody;
    throw new ApiError(e.error ?? "request failed", e);
  }
  return j as Envelope;
}

export async function getApp(id: string) {
  return parse(await fetch(`/api/apps/${id}`, { cache: "no-store" }));
}

export async function patchDraft(id: string, partial: Partial<Application>) {
  return parse(
    await fetch(`/api/apps/${id}/draft`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    }),
  );
}

/** Every mutation except the draft PATCH. `fee-dispute` is the only one with a body. */
export async function postAction(id: string, action: string, body?: unknown) {
  return parse(
    await fetch(`/api/apps/${id}/${action}`, {
      method: "POST",
      ...(body === undefined
        ? {}
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    }),
  );
}

export function feeDispute(id: string, note: string) {
  return postAction(id, "fee-dispute", { note });
}

export async function resolveDoor(body: {
  studying: "9-10" | "11-12" | "college" | "outside";
  firstYear: boolean;
  gotLastYear: "yes" | "no" | "dunno";
}): Promise<DoorEnvelope> {
  const r = await fetch("/api/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = (await r.json()) as DoorEnvelope;
  if (!r.ok || !j.ok) throw new Error("resolve failed");
  return j;
}

export async function getResume(code: string) {
  return parse(await fetch(`/api/resume/${encodeURIComponent(code)}`, { cache: "no-store" }));
}

export async function resetSeed() {
  return parse(await fetch("/api/seed", { method: "POST" }));
}
