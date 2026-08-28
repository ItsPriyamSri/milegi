import type { JSX } from "react";

export function Segmented<T extends string>(props: {
  ariaLabel: string;
  value: T;
  options: { id: T; labelHi: string; href: string }[];
}): JSX.Element {
  return (
    <div className="seg" role="group" aria-label={props.ariaLabel}>
      {props.options.map((opt) => {
        const isActive = opt.id === props.value;
        return (
          <a
            key={opt.id}
            href={opt.href}
            className="seg-btn"
            data-active={isActive ? "true" : undefined}
            aria-pressed={isActive}
          >
            {opt.labelHi}
          </a>
        );
      })}
    </div>
  );
}
