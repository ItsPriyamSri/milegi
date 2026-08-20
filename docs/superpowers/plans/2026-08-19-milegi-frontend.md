# Milegi Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Revised 20 Aug 2026 (Opus review).** The "v2 overrides" section is gone: every snippet below is the shipped design. There is no `NewTrack.tsx`, no `createApp` in the client, no fee input, and no Google Fonts request.

**Goal:** Hindi-first intake UI for a Dashmottar scholarship **case**. The wizard is a subpage. After lock, the student lives on the case page. The door recovers the OTR; school / outside-state is an honest "this prototype is Dashmottar," never a fake school form.

**Architecture:** App Router client talks only to `/api/apps/*`, `/api/resolve`, `/api/resume/:code`. No component library, no Tailwind. One CSS file. **Backend Tasks 1–8 must exist before this plan's Task 2.**

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, `src/app/globals.css` only.

**Spec:** `docs/milegi-plan.md`
**Who / order:** `docs/superpowers/plans/2026-08-20-milegi-build-order.md`  
**Progress (tick here after each task):** `docs/PROGRESS.md`

## Who writes which task (ChatGPT Go is scarce)

| Task | Who | Why |
|---|---|---|
| 1 Shell, CSS, banner, home | **Codex** | Volume UI, touches no API. Build this **before** the Cursor case page so the case page is not styled twice. |
| 2 `api.ts` + Wizard host | **Cursor** writes `api.ts`. Codex writes `Wizard.tsx` **after** `api.ts` exists. |
| 3 ChooseStep (door) | **Codex** | Calls `resolveDoor()`, invents no routes. |
| 4 PreflightStep | **Codex** | |
| 5 FormStep | **Codex** | **No fee `<input>`.** |
| 6 `useAutosave` | **Cursor** | This hook *is* the 502 story. Codex may add `CrashOverlay` only. |
| 7a ReviewStep | **Codex** | Lock confirm, then `/status/[id]`. |
| 7b Case page + clerk page + `/r/[code]` | **Cursor** | This is the product. Do not spend Go quota here. |
| 8 Limitations + 360px | **Codex** | Honest Dashmottar-only copy. No other-track playground. |

Paste into Codex from `docs/PROGRESS.md` (the matching block). Always: tick that file when the task is done. Generic fallback:

> Implement Task N from `docs/superpowers/plans/2026-08-19-milegi-frontend.md`. Tick the row in `docs/PROGRESS.md`. Do not change anything under `src/server`, `src/lib/api.ts`, `src/lib/useAutosave.ts`, `src/app/status`, `src/app/institute`, or `src/app/r`. Do not add a chatbot, Tailwind, a fee input, a bank/IFSC field, or `NewTrack.tsx`. Do not add a Google Fonts link.

If Go quota dies, Cursor finishes the remaining Codex tasks and the write-up says so.

## Global Constraints

- Hindi default. English toggle is cheap (`localStorage.milegiLang`). Do not spend a day on i18n. Server blockers already ship both `hi` and `en`, so the toggle just picks a field.
- Banner exact: `स्वतंत्र हैकथॉन प्रोटोटाइप · नकली डेटा · सरकारी वेबसाइट नहीं`
- No UP emblem, no minister photo, no official logo files, no saffron-white-green flag chrome.
- **No web font request.** Every cheap Android already ships a Devanagari face; a blocking stylesheet from `fonts.googleapis.com` plus a Devanagari download is exactly the wrong thing at 11pm on two bars. Use the system stack in `globals.css`.
- Autosave: Cursor's `useAutosave`. Labels: `इस फोन पर सेव है` / `अभी सिंक नहीं हुआ` / `सेव हो गया`.
- Crash: `सर्वर क्रैश दिखाएँ` → `await flush()` → POST crash → overlay → reload → fields still filled.
- Demo IDs: `app-priya`, `app-amit`, `app-amit-dup`. Resume codes: `MLG-PRIYA`, `MLG-AMIT`, `MLG-DUP`.
- Never render an account-number, IFSC, district, or **tuition** input. The fee panel is read-only master data plus "रसीद मेल नहीं खाती".
- Money on screen is labelled as an estimate, never as a promise. `expectedAmount` is the college's non-refundable tuition, which is what reimbursement is calculated from — it is **not** a sanctioned amount. Hindi label: `कॉलेज मास्टर के अनुसार गैर-वापसी योग्य शुल्क (अनुमान)`.
- Do not build eight wizard copies. The door may ask 9–10 / 11–12 / outside, then shows the scope sentence and a button that follows `door.alt`.
- Once `status` is `institute|dwo|paid|rejected`, home for that persona is `/status/[id]`, not the wizard.
- Inputs 48px min height, 16px font, labels above fields, errors in one sentence under the field.
- `"use client"` on interactive trees. `useParams()` on client pages.

## Visual contract (Operate mode)

Do **not** ship cream parchment + terracotta (the AI civic default) and do **not** clone NIC navy + photo carousel.

World: **independent civic tool**. Cheap Android, Hindi, 11pm, two bars. Cool atmosphere, white surface, black ink, red only for errors, one deep-teal primary. Honest prototype banner. Do **not** look like `scholarship.up.gov.in`. Do **not** costume the page as lined exam paper.

```
THESIS: One scholarship case you can finish; not eight government doors.
OWN-WORLD: civic tool; atmosphere #d5e0eb; surface #ffffff; ink #12202e;
  error #b42318; teal action #0b5f56; quiet depth, no notebook rules, no emblem.
STORY: Student answers who they are, proves papers, fills the short form, locks, sees a named clerk and a Friday clock.
FIRST VIEWPORT: banner strip, then “Milegi” + one Hindi sentence + persona start + resume code.
FORM: Operate / civic tool. No Inter, no purple SaaS, no gov emblem, no exam margin.
```

Put that block as an HTML comment, first child of `<body>` in `src/app/layout.tsx`.

## File map

| File | Responsibility | Who |
|---|---|---|
| `src/app/globals.css` | tokens + form + case file | Codex |
| `src/app/layout.tsx` | banner, lang, comment contract | Codex |
| `src/app/page.tsx` | home | Codex |
| `src/app/apply/[id]/page.tsx` | wizard host | Codex after Cursor's `api.ts` |
| `src/app/status/[id]/page.tsx` | **case page (the product)** | Cursor |
| `src/app/institute/[id]/page.tsx` | clerk attest | Cursor |
| `src/app/r/[code]/page.tsx` | resume redirect | Cursor |
| `src/app/limitations/page.tsx` | honesty | Codex |
| `src/app/error.tsx` | fetch failures | Codex |
| `src/lib/api.ts` | fetch wrappers | Cursor |
| `src/lib/i18n.ts` | hi/en strings | Codex |
| `src/lib/useAutosave.ts` | debounce + phone draft | Cursor |
| `src/components/Banner.tsx` | prototype strip | Codex |
| `src/components/LangToggle.tsx` | hi/en | Codex |
| `src/components/Wizard.tsx` | step router | Codex |
| `src/components/CrashOverlay.tsx` | sorry-but-saved | Codex |
| `src/components/CaseFile.tsx` | next action + clock + ₹ | Cursor |
| `src/components/steps/ChooseStep.tsx` | door → resolve | Codex |
| `src/components/steps/PreflightStep.tsx` | OTR / income / NPCI | Codex |
| `src/components/steps/FormStep.tsx` | short Dashmottar form | Codex |
| `src/components/steps/ReviewStep.tsx` | lock | Codex |

Do **not** create `src/components/NewTrack.tsx`, `src/lib/fields.ts`, or `src/components/Timeline.tsx`.

---

### Task 1: Shell, tokens, home

**Who:** Codex. Do not touch `src/server`.

**Files:**
- Create: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/Banner.tsx`, `src/components/LangToggle.tsx`, `src/lib/i18n.ts`
- Modify: `src/app/page.tsx` (the backend task left a one-line stub)

**Interfaces:** `t(lang, key)`, a `LangToggle` that writes `localStorage.milegiLang`, a Banner visible on every route.

- [ ] **Step 1: CSS tokens — paste in full**

```css
:root {
  --sheet: #c5d6e8;
  --paper: #f4f8fc;
  --ink: #12202e;
  --muted: #3d5166;
  --rule: #8aa0b8;
  --teal: #0b5f56;
  --teal-ink: #f4f8fc;
  --ballpoint: #b42318;
  --ok: #0b5f56;
  --focus: #0b5f56;
}
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--sheet); color: var(--ink); }
body {
  /* System stack on purpose: no blocking web-font request on a slow phone.
     Android and iOS both ship a Devanagari face. */
  font-family: system-ui, "Noto Sans Devanagari", "Noto Sans", sans-serif;
  font-size: 18px;
  line-height: 1.45;
}
.app {
  max-width: 640px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--paper);
  border-left: 1px solid var(--rule);
  border-right: 1px solid var(--rule);
}
.banner {
  background: var(--ink);
  color: #fff;
  font-size: 13px;
  letter-spacing: 0.02em;
  padding: 8px 16px;
  text-align: center;
}
header.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px dashed var(--rule);
}
main { padding: 20px 16px 48px; }
h1 { font-size: 28px; font-weight: 700; margin: 0 0 8px; }
h2 { font-size: 20px; margin: 0 0 12px; }
p.lead { color: var(--muted); margin: 0 0 24px; }
button, .btn {
  display: block;
  min-height: 48px;
  width: 100%;
  font: inherit;
  font-size: 18px;
  border-radius: 4px;
  border: 1px solid var(--ink);
  background: var(--paper);
  color: var(--ink);
  padding: 12px 14px;
  margin: 0 0 10px;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}
button.primary, .btn.primary {
  background: var(--teal);
  color: var(--teal-ink);
  border-color: var(--teal);
}
button.danger { border-color: var(--ballpoint); color: var(--ballpoint); }
button:disabled { opacity: 0.45; cursor: not-allowed; }
button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}
label { display: block; font-weight: 600; margin: 16px 0 6px; }
input, select {
  width: 100%;
  min-height: 48px;
  font: inherit;
  font-size: 16px;
  padding: 10px 12px;
  border: 1px solid var(--ink);
  background: #fff;
  border-radius: 2px;
}
.err { color: var(--ballpoint); font-size: 15px; margin: 6px 0 0; }
.ok { color: var(--ok); font-size: 14px; }
.struck { text-decoration: line-through; color: var(--muted); }
.cards { display: grid; gap: 8px; }
.progress { display: flex; gap: 6px; padding: 0 16px 12px; }
.progress span { flex: 1; height: 6px; background: #d3e0ee; }
.progress span.on { background: var(--teal); }
.rule { border: none; border-top: 1px solid var(--rule); margin: 24px 0; }
a { color: var(--teal); }
.overlay {
  position: fixed; inset: 0;
  background: rgba(18, 32, 46, 0.72);
  display: grid; place-items: center;
  padding: 24px;
}
.overlay .sheet { background: var(--paper); padding: 24px; max-width: 420px; }
.overlay .sheet .tag { font-size: 12px; color: var(--muted); margin: 16px 0 0; }
```

No `<link>` to `fonts.googleapis.com`. If a reviewer asks why the type is not custom: because the visitor is on two bars at 11pm and a render-blocking Devanagari download is the least defensible thing on this page.

- [ ] **Step 2: i18n — keys the whole app uses**

```ts
export type Lang = "hi" | "en";
export const STR = {
  banner: { hi: "स्वतंत्र हैकथॉन प्रोटोटाइप · नकली डेटा · सरकारी वेबसाइट नहीं", en: "Independent hackathon prototype · mock data · not a government site" },
  title: { hi: "Milegi", en: "Milegi" },
  sub: { hi: "यूपी छात्रवृत्ति — एक केस फाइल, आठ लॉगिन नहीं", en: "UP scholarship — one case file, not eight logins" },
  startPriya: { hi: "प्रिया से शुरू करें (नया)", en: "Start as Priya (fresh)" },
  startAmit: { hi: "अमित से शुरू करें (नवीनीकरण)", en: "Start as Amit (renewal)" },
  startDup: { hi: "गलत Fresh (अमित का आधार)", en: "Wrong Fresh (Amit's Aadhaar)" },
  resume: { hi: "कोड से खोलें (MLG-…)", en: "Open with code (MLG-…)" },
  openCase: { hi: "केस खोलें", en: "Open the case" },
  savedPhone: { hi: "इस फोन पर सेव है", en: "Saved on this phone" },
  notSynced: { hi: "अभी सिंक नहीं हुआ", en: "Not synced yet" },
  saved: { hi: "सेव हो गया", en: "Saved" },
  limits: { hi: "सीमाएँ", en: "Limits" },
  qStudy: { hi: "अभी क्या पढ़ रहे हो?", en: "What are you studying now?" },
  tPre: { hi: "कक्षा 9–10", en: "Class 9–10" },
  tInter: { hi: "कक्षा 11–12", en: "Class 11–12" },
  tDash: { hi: "कॉलेज · डिप्लोमा · ITI", en: "College · diploma · ITI" },
  tOut: { hi: "दूसरे राज्य में पढ़ाई (यूपी निवासी)", en: "Study outside UP (UP resident)" },
  qFirst: { hi: "क्या इस कोर्स का पहला साल है?", en: "Is this the first year of this course?" },
  qGot: { hi: "पिछले साल इसी कोर्स पर यूपी छात्रवृत्ति मिली थी?", en: "Did you get UP scholarship last year on this course?" },
  yes: { hi: "हाँ", en: "Yes" },
  no: { hi: "नहीं", en: "No" },
  dunno: { hi: "पता नहीं", en: "Not sure" },
  next: { hi: "आगे", en: "Next" },
  crash: { hi: "सर्वर क्रैश दिखाएँ", en: "Show server crash" },
  crashBody: { hi: "सर्वर व्यस्त है। आपका फॉर्म सेव है।", en: "Server busy. Your form is saved." },
  crashTag: { hi: "यह नकली क्रैश है — प्रोटोटाइप डेमो", en: "This is a simulated crash — prototype demo" },
  reload: { hi: "वापस जाएँ", en: "Return" },
  lock: { hi: "लॉक करें — इसके बाद सिर्फ़ संशोधन विंडो में बदलेगा", en: "Lock — after this it only changes in the correction window" },
  feeLabel: { hi: "कॉलेज मास्टर के अनुसार गैर-वापसी योग्य शुल्क (अनुमान)", en: "Non-refundable fee from college master data (estimate)" },
  feeHint: { hi: "हॉस्टल, मेस, Caution money और परीक्षा शुल्क कॉलेज मास्टर में हैं — इस फॉर्म में नहीं।", en: "Hostel, mess, caution money and exam fees live on college master data — not on this form." },
  feeNotPromise: { hi: "यह अनुमान है। स्वीकृत राशि विभाग तय करता है।", en: "This is an estimate. The department decides the sanctioned amount." },
  feeDispute: { hi: "रसीद मेल नहीं खाती", en: "Receipt does not match" },
  npciRetry: { hi: "NPCI फिर से जाँचें", en: "Retry NPCI" },
  npciNoBank: { hi: "पैसे उसी खाते में जाएँगे जो आधार से जुड़ा है। खाता नंबर नहीं माँगा जाता।", en: "Money goes to whichever account is Aadhaar-seeded. No account number is asked." },
  kyc: { hi: "OTR पूरा करें (नकली)", en: "Complete OTR (mock)" },
  otrKeep: { hi: "नया OTR न बनाएँ — यही चलेगा", en: "Do not mint a new OTR — this one works" },
  openFormBtn: { hi: "फॉर्म खोलें", en: "Open the form" },
  attest: { hi: "कॉलेज सत्यापित · अग्रेषित", en: "College verified · forwarded" },
  pay: { hi: "भुगतान दिखाएँ (डेमो)", en: "Show payment (demo)" },
  ping: { hi: "क्लर्क को याद दिलाएँ", en: "Nudge the clerk" },
  nudged: { hi: "अनुरोध भेज दिया — इंतज़ार की गिनती वैसी ही है", en: "Reminder sent — the wait is unchanged" },
  hardCopy: { hi: "हार्ड कॉपी कॉलेज में जमा करें", en: "Submit the hard copy at the college" },
  lastYearPaid: { hi: "पिछले साल मिला", en: "Received last year" },
  resumeCodeIs: { hi: "इस केस का कोड", en: "This case's code" },
} as const;

export type StrKey = keyof typeof STR;
export function t(lang: Lang, key: StrKey) {
  return STR[key][lang];
}
```

- [ ] **Step 3: Banner + LangToggle + layout + home**

`LangToggle` writes `localStorage.milegiLang` and sets `document.documentElement.lang`.

Home is not marketing: three persona buttons, a resume-code field, a link to limitations. **No** `/apply/new`.

```tsx
// src/app/page.tsx
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");
  return (
    <main>
      <h1>Milegi</h1>
      <p className="lead">यूपी छात्रवृत्ति — एक केस फाइल, आठ लॉगिन नहीं</p>
      <a className="btn primary" href="/apply/app-priya">प्रिया से शुरू करें (नया)</a>
      <a className="btn" href="/apply/app-amit">अमित से शुरू करें (नवीनीकरण)</a>
      <a className="btn" href="/apply/app-amit-dup">गलत Fresh (अमित का आधार)</a>
      <label htmlFor="resume">कोड से खोलें (MLG-…)</label>
      <input
        id="resume"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="MLG-PRIYA"
        autoCapitalize="characters"
      />
      <button
        className="primary"
        type="button"
        onClick={() => {
          const c = code.trim().toUpperCase();
          if (c) router.push(`/r/${c}`);
        }}
      >
        केस खोलें
      </button>
      <p><Link href="/limitations">सीमाएँ</Link></p>
    </main>
  );
}
```

Layout:

```tsx
import "./globals.css";
import Banner from "@/components/Banner";
import LangToggle from "@/components/LangToggle";

export const metadata = { title: "Milegi — प्रोटोटाइप" };
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <body>
        {/* THESIS: One exam sheet you can finish; not eight government doors.
            OWN-WORLD: exam-copy blue #c5d6e8; paper #f4f8fc; ink #12202e; ballpoint #b42318; teal #0b5f56.
            STORY: Prove papers first, then a short form, then a named clerk.
            FIRST VIEWPORT: banner, Milegi, two persona buttons + resume code.
            FORM: Operate / exam-copy. System fonts only — the visitor is on two bars. */}
        <div className="app">
          <Banner />
          <header className="bar">
            <strong>Milegi</strong>
            <LangToggle />
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
```

Use `metadata` / `viewport` exports rather than a hand-written `<head>`; App Router injects the viewport tag for you.

- [ ] **Step 4: `npx next dev` — home renders, banner visible, 360px layout, no photos, and the Network tab shows zero font requests.**
- [ ] **Step 5: Commit** `Add Milegi shell and Hindi-first home.`

---

### Task 2: API client + apply route + wizard shell

**Who:** Cursor writes `src/lib/api.ts`. Codex writes `Wizard.tsx` and the apply page after `api.ts` exists.

**Files:**
- Create: `src/lib/api.ts` (Cursor)
- Create: `src/app/apply/[id]/page.tsx`, `src/components/Wizard.tsx`

```ts
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
```

Apply page:

```tsx
"use client";
import { useParams } from "next/navigation";
import Wizard from "@/components/Wizard";

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  return <Wizard id={id} />;
}
```

`Wizard` loads `getApp`, keeps `app` + `blockers` + `missing` + `institute` in state, and maps:

| backend status | UI step |
|---|---|
| choose | choose |
| preflight | preflight |
| draft | form |
| review | review |
| institute, dwo, paid, rejected | `router.replace(/status/${id})` |

Six progress ticks: choose, preflight, form, review, institute, paid.

- [ ] **Step 1: Implement load-or-error.** On fetch failure show a red `p.lead` plus a "सीड रीसेट" button that calls `resetSeed()` and reloads. That button touches the three personas only.
- [ ] **Step 2: Open `/apply/app-priya` — प्रिया वर्मा appears.**
- [ ] **Step 3: Commit** `Wire apply wizard to the mock API.`

---

### Task 3: Chooser (replaces the eight logins)

**Who:** Codex. Calls `resolveDoor`. Does not PATCH `track`/`cycle` — they are not patchable. Does not invent `/api/*`.

**Files:** Create `src/components/steps/ChooseStep.tsx`

Three questions, no jargon:

1. `अभी क्या पढ़ रहे हो?` — four buttons → local `studying` (`9-10` | `11-12` | `college` | `outside`).
2. `क्या इस कोर्स का पहला साल है?` — हाँ / नहीं.
3. `पिछले साल इसी कोर्स पर यूपी छात्रवृत्ति मिली थी?` — हाँ / नहीं / **पता नहीं**, sent as `"yes" | "no" | "dunno"`.

"पता नहीं" is a real answer, not a missing one. Send `"dunno"`; the backend resolves it to the safe side (the renewal) and explains why. Never coerce it to `false`.

On Next: `const door = await resolveDoor({ studying, firstYear, gotLastYear })`, then:

- `!door.completable` → render `door.messageHi`, and a button labelled `door.alt.labelHi` that navigates to `/apply/${door.alt.appId}`. No fake school wizard, no dead end.
- `door.completable` → render `door.messageHi` and a `केस खोलें` button to `/apply/${door.appId}`. If `door.otrs.length > 1`, list both OTR strings right there. If `door.alt` exists, render it as a secondary button with `door.alt.labelHi`.
- Never render a terminal "No Record Found."

Demo mapping (assert these by hand):

| answers | lands on |
|---|---|
| college + first year + नहीं | `app-priya` |
| college + not first year + हाँ | `app-amit` |
| college + first year + हाँ | `app-amit-dup`, two OTRs, alt = the real renewal |
| college + not first year + पता नहीं | `app-amit`, alt = fresh |
| कक्षा 9–10 | not completable, alt = continue as college |

The chooser does **not** skip pre-flight. Opening the resolved id lands on `choose`/`preflight`, and the wizard shows the checklist.

- [ ] **Step 1: Implement four study buttons, two follow-ups, resolve on Next**
- [ ] **Step 2: Walk all five rows of the table above. Class 9–10 shows the scope sentence, not a 404.**
- [ ] **Step 3: Commit** `Add the one-door resolver UI.`

---

### Task 4: Pre-flight screen

**Who:** Codex.

**Files:** Create `src/components/steps/PreflightStep.tsx`

Checklist rows, always all of them, so a clean renewal still sees a green list:

1. **OTR** — if `!app.otr`, button `OTR पूरा करें (नकली)` → `postAction(id,"kyc")`. If it exists, show it read-only with `नया OTR न बनाएँ — यही चलेगा`.
2. **आय प्रमाण पत्र (3 साल)** — if `income_expired`, a date input bound to `incomeIssuedOn` + PATCH. Always show `incomeAppNo` and `incomeCertNo` inputs; this is the e-District pair that the real portal hides behind a separate dashboard *after* the long form.
3. **जाति प्रमाण पत्र** — hidden when `category === "general"`; otherwise `casteAppNo` + `casteCertNo`.
4. **आधार–DBT (NPCI)** — if timeout or pending, button `NPCI फिर से जाँचें` → `postAction(id,"npci")`. Never ask for an account number. Copy: `पैसे उसी खाते में जाएँगे जो आधार से जुड़ा है। खाता नंबर नहीं माँगा जाता।`
5. **संस्थान सूची में है** — if unlisted, say plainly that unblocking it is the college nodal officer's job, not the student's. Both demo institutes are listed.
6. **दोहरा आवेदन** — if `duplicate_fresh` is in `blockers` or `app.duplicateOtrs?.length`, list **both** OTR strings and offer a link to the real renewal. ponytail: that link is `/apply/app-amit`, hardcoded, because this screen does not have the door result in hand; it is a three-persona demo and `/limitations` says so.

`फॉर्म खोलें` stays disabled until `preflightOk`, then calls `postAction(id, "open")` (`preflight → draft`). Do not skip this screen when there are no blockers.

- [ ] **Step 1: Priya starts blocked on income + NPCI + missing OTR. KYC → date `2025-01-15` → NPCI retry → checklist green → form opens.**
- [ ] **Step 2: Commit** `Add the pre-flight checklist before the long form.`

---

### Task 5: Short form

**Who:** Codex. **No tuition `<input>`.**

**Files:** Create `src/components/steps/FormStep.tsx`

Do **not** create `src/lib/fields.ts`. Drive visibility from `app.cycle`. List leftovers from `env.missing` at the top of the last inner section. Catch `ApiError` on review and render `err.body.blockers` / `err.body.missing`.

Inner tabs, so somebody who has used Saksham recognises the work:

**Fresh:** `शैक्षिक विवरण` → `निजी विवरण` → `शुल्क संबंधी` (read-only panel)
**Renewal:** `परिणाम` → `शुल्क` (read-only)

This prototype only has Dashmottar field sets. If `track !== "dashmottar"` you will not get here — the door already said so — so do not build prematric / inter / outside-state fields.

**Fresh, editable:** year of study, day scholar, ration card (`0` is a valid answer), enrollment number, counseling + number if yes, bonafide tick, photo tick.
**Renewal, editable:** result (पास / प्रोमोटेड), marks obtained, marks total, both-semesters-combined tick.
**Read-only in both:** `courseName`, `instituteName`, `otr`, `feeNonRefundable`, `expectedAmount`.

Fee panel: master tuition under the label `कॉलेज मास्टर के अनुसार गैर-वापसी योग्य शुल्क (अनुमान)`, then `institute.hostel` / `institute.mess` / `institute.caution` rendered with `className="struck"` and the one-line `feeHint`, then `feeNotPromise`. Button `रसीद मेल नहीं खाती` → `feeDispute(id, note)`. Never a number input for money.

Inner Next does not hit the server except through autosave. The last inner Next does `await flush(); postAction(id, "review")`.

Do not render: bank account, IFSC, district, or `courseType` as a puzzle (the seed default is `regular`).

- [ ] **Step 1: Implement FormStep with inner sections and the read-only fee panel**
- [ ] **Step 2: `grep -r feeNonRefundable src/components` finds no `<input>`. The crash-demo field is `enrollmentNo`.**
- [ ] **Step 3: Commit** `Add the short Dashmottar form with college-master fees.`

---

### Task 6: Autosave + crash overlay

**Who:** Cursor writes `useAutosave`. Codex writes `CrashOverlay` only.

**Files:** Create `src/lib/useAutosave.ts` (Cursor), `src/components/CrashOverlay.tsx` (Codex)

The local-first promise is "your typing is on this phone before it is on any server." So the hook writes `localStorage` on **every keystroke batch**, not only when the browser reports itself offline — a 502 mid-PATCH looks nothing like `navigator.onLine === false`, and that is the exact failure we are demoing.

```ts
"use client";
import { useEffect, useRef, useState } from "react";
import { patchDraft } from "./api";
import type { Application } from "@/server/types";

export function useAutosave(id: string) {
  const key = `milegi-draft-${id}`;
  const [dirty, setDirty] = useState<Partial<Application>>({});
  const dirtyRef = useRef<Partial<Application>>({});
  const [synced, setSynced] = useState(true);
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
      localStorage.removeItem(key);
      return env;
    } catch {
      // Server said no, or the network died. The phone copy is already written,
      // so the student loses nothing; we just admit it is not synced.
      setSynced(false);
    }
  }

  function update(partial: Partial<Application>) {
    dirtyRef.current = { ...dirtyRef.current, ...partial };
    setDirty(dirtyRef.current);
    localStorage.setItem(key, JSON.stringify(dirtyRef.current));
    setSynced(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return { update, flush, savedAt, dirty, synced };
}
```

Contract:

- `dirtyRef` is updated **inside `update`**, not during render. A click that flushes immediately after a keystroke must see that keystroke.
- Do **not** `setEnv` from an autosave response. The parent keeps field state as `{ ...app, ...dirty }` and takes only `lastSavedAt` from the response.
- **Required, not optional:** `await flush()` before every `postAction` (crash, review, lock, open, kyc, npci).
- `flush` swallows errors on purpose. A failed save must never blow up the form; the phone copy plus `अभी सिंक नहीं हुआ` is the honest state.

Labels in the FormStep footer: `localStorage` has the key → `इस फोन पर सेव है`; pending keys and `!synced` → `अभी सिंक नहीं हुआ`; after a successful flush → `सेव हो गया`.

`FormStep` renders `value={dirty.enrollmentNo ?? app.enrollmentNo ?? ""}` — that is the crash demo. Course name is read-only text, not an input.

Crash overlay:

```tsx
export function CrashOverlay({
  message,
  onReload,
}: {
  message: string;
  onReload: () => void;
}) {
  return (
    <div className="overlay" role="alertdialog" aria-modal="true">
      <div className="sheet">
        <h2>We Are Sorry</h2>
        <p>{message}</p>
        <button className="primary" onClick={onReload}>वापस जाएँ</button>
        <p className="tag">स्वतंत्र हैकथॉन प्रोटोटाइप · नकली क्रैश · सरकारी वेबसाइट नहीं</p>
      </div>
    </div>
  );
}
```

`We Are Sorry` is the official error students already recognise, and the Hindi line under it is our difference. The overlay covers the page banner, so it carries its own prototype line — an unlabelled full-screen government-style error is the one place this build could read as official.

Click handler, required order: `await flush()` → `postAction(id,"crash")` → overlay → reload.

- [ ] **Step 1: Manual** — type enrollment `ENR-CRASH`, click crash, reload, the value is still there. Then throttle the network to offline in devtools, type, and confirm `इस फोन पर सेव है` appears and survives a reload.
- [ ] **Step 2: Commit** `Add autosave and crash-recovery overlay.`

---

### Task 7a: Review + lock

**Who:** Codex. Stops at `router.push(/status/${id})`. Does not invent the case page.

**Files:** Create `src/components/steps/ReviewStep.tsx`

A definition list: name, OTR, registration number, course (read-only), tuition from master, expected ₹ with the estimate caveat, enrollment or marks. **No fee editor.** Primary button `लॉक करें`, `window.confirm('लॉक के बाद सिर्फ़ संशोधन विंडो में बदलेगा। जारी रखें?')`, then `await flush()` → `postAction(id,"lock")` → `router.push(/status/${id})`.

If lock throws `ApiError`, render `err.body.blockers` as red one-liners; do not navigate.

- [ ] **Step 1: Review lists master tuition, not a typed number. Lock lands on `/status/[id]`.**
- [ ] **Step 2: Commit** `Add the lock review step.`

---

### Task 7b: Case page + clerk + resume — this is the product

**Who:** Cursor. Do **not** paste this task into Codex.

**Files:**
- Create: `src/components/CaseFile.tsx`
- Create: `src/app/status/[id]/page.tsx` (`"use client"`, `useParams`)
- Create: `src/app/institute/[id]/page.tsx` (`"use client"`, `useParams`)
- Create: `src/app/r/[code]/page.tsx` (`"use client"`)

`/r/[code]`: `getResume(code)`, then `/status/${app.id}` if status is `institute|dwo|paid|rejected`, else `/apply/${app.id}`. On 404: `यह कोड नहीं मिला` plus a link home. Never a Saksham-style "No Record Found."

The case page answers these, above the fold, in Hindi:

1. **फ़ाइल कहाँ है** — one sentence from `status` plus the current actor by name (`institute` → `राम प्रकाश, छात्रवृत्ति क्लर्क, CSJMU`).
2. **आपको क्या करना है, कब तक** — if `hardCopyDueAt` is set and the file is still at the institute: `हार्ड कॉपी कॉलेज में {date} तक`. Once attested, the same line stays, `className="struck"` — the paper requirement did not evaporate, it was met.
3. **कितने पैसे** — `expectedAmount` under `कॉलेज मास्टर के अनुसार गैर-वापसी योग्य शुल्क (अनुमान)` plus `यह अनुमान है। स्वीकृत राशि विभाग तय करता है।` Renewal also shows `lastYearPaid`.
4. **NPCI** — named state, retry when not ok, and the never-ask-your-account-number line.
5. **आगे बढ़ाएँ** — `ping` when any actor has `waitingDays > 0`. After a ping, show `nudgeSentAt` and `अनुरोध भेज दिया — इंतज़ार की गिनती वैसी ही है`. Do not pretend the wait reset.
6. **इस केस का कोड** — print `resumeCode` so the video can reopen the case in another browser.

Do not lead with a generic timeline. The `actors` list, with `done` ticks (clerk → विश्वविद्यालय → DWO → PFMS), sits under the fold as a short list inside `CaseFile`. One component is enough; skip `Timeline.tsx`.

If status is still `choose|preflight|draft|review`: `अभी लॉक नहीं हुआ` plus a link to `/apply/${id}`. No attest button there.

Link to `/institute/${id}` only when `status === "institute"` (the judge/clerk hat). When `dwo`, show `pay` and `reject`. When `paid`, a teal `भुगतान हो गया (नकली PFMS)`. When `rejected`, the DWO line and a link back to `/apply/${id}` (the machine allows `rejected → draft`).

Institute page: `राम प्रकाश, छात्रवृत्ति क्लर्क`, the attendance number, one idempotent `attest` button, and a link back to the case.

- [ ] **Step 1: `/status/app-amit` names the clerk, the 12 days, the nudge, ₹19,800 as an estimate, and last year's ₹18,500.** Getting Amit into that state before the wizard exists: see the curl block in the build-order plan, Phase B.
- [ ] **Step 2: `/r/MLG-PRIYA` opens Priya's wizard. After lock, the same URL goes to the case page.**
- [ ] **Step 3: Commit** `Make the scholarship case page the product.`

---

### Task 8: Limitations + 360px polish

**Who:** Codex.

**Files:** Create `src/app/limitations/page.tsx`, `src/app/error.tsx`

```tsx
"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <h1>कुछ गड़बड़ हुई</h1>
      <p className="lead">{error.message}</p>
      <button className="primary" onClick={reset}>फिर कोशिश</button>
    </main>
  );
}
```

Limitations, Hindi first, English under each line. Every item here has to be true:

- नकली OTP, DigiLocker/OTR, e-District आय–जाति सत्यापन, NPCI, PFMS — कोई लाइव सरकारी सिस्टम नहीं
- बैंक खाता नंबर या IFSC कभी नहीं माँगते; असली पोर्टल भी अब आधार-DBT से भुगतान करता है (पासबुक फिर भी हार्ड कॉपी में लगती है)
- पूरा जर्नी सिर्फ़ दशमोत्तर Fresh + एक Renewal। कक्षा 9–12 और दूसरे राज्य का दरवाज़ा सवाल पूछता है और यहीं ईमानदारी से रुक जाता है
- दरवाज़ा तीन सवालों से तय करता है; असली पोर्टल पर पुराना रजिस्ट्रेशन नंबर हाई स्कूल रोल नंबर से निकाला जाता है। यहाँ तीन नकली छात्र हैं, कोई खोज नहीं
- शुल्क कॉलेज मास्टर डेटा से आता है — छात्र टाइप नहीं करता। दिखाई गई रकम **अनुमान** है, स्वीकृत राशि नहीं
- हार्ड कॉपी 3 दिन की घड़ी दिखती है; इस प्रोटोटाइप का हैपी पाथ डिजिटल अटेस्ट है
- सम्बद्ध विश्वविद्यालय असली चेन का हिस्सा है — यहाँ वह दिखता है पर अपने-आप आगे बढ़ जाता है, उसका कोई डैशबोर्ड नहीं बनाया
- उपस्थिति अटेस्ट पर 80% मान ली जाती है; असली नियम 75% न्यूनतम है
- लॉक के बाद बदलाव सिर्फ़ विभाग की संशोधन विंडो में — यह प्रोटोटाइप वह विंडो नहीं बनाता
- कोई भी व्यक्ति जिसके पास MLG- कोड है, वह केस खोल सकता है। डेमो के लिए जानबूझकर — इसमें असली डेटा नहीं है
- Codex (ChatGPT Go) ने वॉल्यूम UI लिखा; केस पेज, डोमेन लॉजिक और API Cursor में लिखे गए

Do **not** add `NewTrack` or other-track completion.

Polish: 360px pass on home, the door, and the case page. Taps ≥48px. No box-shadow, no gradient, no font download.

- [ ] **Step 1: Implement limitations + `error.tsx`**
- [ ] **Step 2: 360px pass — no horizontal scroll anywhere**
- [ ] **Step 3: Commit** `Add limitations page and mobile polish.`

---

## Self-review

- Completable journeys: Dashmottar Fresh + Dashmottar Renewal only. The door still asks 9–10 / 11–12 / outside, then honest scope copy plus `door.alt`.
- No `NewTrack.tsx`, no `createApp` in the client, no tuition input, no bank fields, no `fields.ts`.
- No Google Fonts request. System font stack only.
- Case page (Task 7b, Cursor) is the product: next action, named holder, Friday clock struck through after attest, estimate-not-promise money, nudge that does not fake progress.
- "पता नहीं" is sent as `dunno` and resolves to the safe side.
- Duplicate Fresh names both OTRs and points at the renewal.
- Autosave writes the phone copy on every keystroke batch and never throws. Crash flushes first. The crash demo types `enrollmentNo`.
- The crash overlay carries its own prototype label because it covers the banner.
- Exam-copy CSS, banner on every screen, `error.tsx` exists.
- Types match the backend `Application` + `Institute`; the client imports them as types only.
