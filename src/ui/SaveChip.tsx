import type { JSX } from "react";

export function SaveChip(props: {
  state: "local" | "pending" | "saved" | "error";
}): JSX.Element {
  const labels: Record<string, { hi: string; glyph: string }> = {
    local: { hi: "इस फ़ोन पर सुरक्षित", glyph: "✓" },
    pending: { hi: "सेव हो रहा है...", glyph: "◕" },
    saved: { hi: "सुरक्षित", glyph: "✓" },
    error: { hi: "सेव नहीं हुआ — फ़ोन पर ड्राफ़्ट सुरक्षित है", glyph: "▲" },
  };

  const item = labels[props.state] || labels.saved;

  return (
    <div className="savechip" data-state={props.state} aria-live="polite">
      <span aria-hidden="true">{item.glyph}</span>
      <span>{item.hi}</span>
    </div>
  );
}
