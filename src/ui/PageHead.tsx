import type { JSX, ReactNode } from "react";

export function PageHead(props: {
  eyebrow?: string;
  title: string;
  meta?: ReactNode;
}): JSX.Element {
  return (
    <header className="pagehead">
      {props.eyebrow ? <div className="eyebrow">{props.eyebrow}</div> : null}
      <h1>{props.title}</h1>
      {props.meta ? <div className="pagehead-meta">{props.meta}</div> : null}
    </header>
  );
}
