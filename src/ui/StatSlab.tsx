import type { JSX } from "react";
import type { Tone } from "./bits";

export function StatSlab(props: {
  n: number;
  labelHi: string;
  tone?: Tone | "neutral";
}): JSX.Element {
  return (
    <div
      className="stat-slab"
      data-tone={props.tone && props.tone !== "neutral" ? props.tone : undefined}
    >
      <span className="stat-slab-num">{props.n.toLocaleString("en-IN")}</span>
      <span className="stat-slab-label">{props.labelHi}</span>
    </div>
  );
}
