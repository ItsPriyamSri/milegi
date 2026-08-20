import type { ReactNode } from "react";
import { fmtMoney } from "@/lib/format";

export type Tone = "waiting" | "breach" | "verified" | "paid" | "neutral";

const GLYPH: Record<Tone, string> = {
  waiting: "◕",
  breach: "▲",
  verified: "✓",
  paid: "₹",
  neutral: "•",
};

/** Status is never colour alone: every chip carries a glyph and a word. */
export function StatusChip({
  tone,
  children,
  glyph,
}: {
  tone: Tone;
  children: ReactNode;
  glyph?: string;
}) {
  return (
    <span className="chip" data-tone={tone === "neutral" ? undefined : tone}>
      <span className="chip-glyph" aria-hidden="true">
        {glyph ?? GLYPH[tone]}
      </span>
      {children}
    </span>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn" | "danger" | "ok";
  title?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="callout" data-tone={tone}>
      {title ? <p className="callout-title">{title}</p> : null}
      {children}
    </div>
  );
}

export function DataRow({
  label,
  value,
  provenance,
  hint,
}: {
  label: ReactNode;
  value: ReactNode;
  provenance?: string;
  hint?: ReactNode;
}) {
  return (
    <div className="datarow">
      <dt>
        {label}
        {hint ? <span className="faint"> · {hint}</span> : null}
      </dt>
      <dd>
        {value}
        {provenance ? <span className="prov">{provenance}</span> : null}
      </dd>
    </div>
  );
}

/** Cannot render an amount without its basis. That is the point of the component. */
export function Money({
  amount,
  label,
  basis,
}: {
  amount: number;
  label: ReactNode;
  basis: string;
}) {
  return (
    <div className="money">
      <span className="money-label">{label}</span>
      <span className="money-amount">{fmtMoney(amount)}</span>
      <span className="money-basis">{basis}</span>
    </div>
  );
}

export type ApiErrorShape = {
  code: string;
  hi: string;
  en?: string;
  retryable?: boolean;
  ref?: string;
};

/** The only error surface in the product. Never a status code, never a stack, never an upstream string. */
export function ErrorNote({
  error,
  lang = "hi",
  onRetryHref,
  retryLabel,
  refLabel,
}: {
  error: ApiErrorShape;
  lang?: "hi" | "en";
  onRetryHref?: string;
  retryLabel?: string;
  refLabel?: string;
}) {
  const text = lang === "en" && error.en ? error.en : error.hi;
  return (
    <div className="callout" data-tone="danger" role="alert">
      <p className="callout-title">{text}</p>
      <p className="faint" style={{ fontSize: "var(--step-s)" }}>
        {refLabel ?? "संदर्भ"}: <span className="mono">{error.ref ?? error.code}</span>
      </p>
      {error.retryable && onRetryHref ? (
        <p style={{ marginTop: "var(--s2)" }}>
          <a className="btn btn-sm" href={onRetryHref}>
            {retryLabel ?? "दोबारा कोशिश करें"}
          </a>
        </p>
      ) : null}
    </div>
  );
}
