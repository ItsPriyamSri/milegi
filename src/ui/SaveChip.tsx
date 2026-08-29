import type { JSX } from "react";

export function SaveChip(props: {
  state: "local" | "pending" | "saved" | "error";
}): JSX.Element {
  const labels: Record<string, { en: string; hi: string; glyph: string }> = {
    local: { en: "Saved on this device", hi: "इस फ़ोन पर सुरक्षित", glyph: "✓" },
    pending: { en: "Saving…", hi: "सेव हो रहा है...", glyph: "◕" },
    saved: { en: "Saved", hi: "सुरक्षित", glyph: "✓" },
    error: {
      en: "Server save failed — draft is safe on this device",
      hi: "सेव नहीं हुआ — फ़ोन पर ड्राफ़्ट सुरक्षित है",
      glyph: "▲",
    },
  };

  const item = labels[props.state] || labels.saved;

  return (
    <div className="savechip" data-state={props.state} aria-live="polite">
      <span aria-hidden="true">{item.glyph}</span>
      <span>
        {item.en} / {item.hi}
      </span>
    </div>
  );
}
