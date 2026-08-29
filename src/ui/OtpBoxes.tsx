"use client";

import { useRef, type ChangeEvent, type KeyboardEvent, type ClipboardEvent, type JSX } from "react";

export function OtpBoxes(props: {
  id: string;
  value: string; // 0–6 digits
  onChange: (digits: string) => void;
  disabled?: boolean;
}): JSX.Element {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      props.onChange(pasted);
      const targetIdx = Math.min(pasted.length - 1, 5);
      inputRefs.current[targetIdx]?.focus();
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>, idx: number) {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      const chars = (props.value || "").split("");
      chars[idx] = "";
      props.onChange(chars.join("").trimEnd());
      return;
    }
    if (val.length > 1) {
      const pasted = val.slice(0, 6);
      props.onChange(pasted);
      const targetIdx = Math.min(pasted.length - 1, 5);
      inputRefs.current[targetIdx]?.focus();
      return;
    }
    const char = val;
    const current = (props.value || "").split("");
    while (current.length < idx) current.push("");
    current[idx] = char;
    const next = current.slice(0, 6).join("");
    props.onChange(next);
    if (idx < 5 && char) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key === "Backspace" && !props.value[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  return (
    <div className="otp" id={props.id}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const char = props.value[i] || "";
        return (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={char}
            disabled={props.disabled}
            aria-label={`OTP digit ${i + 1}`}
            onPaste={handlePaste}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          />
        );
      })}
    </div>
  );
}

