"use client";

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
        <button type="button" className="primary" onClick={onReload}>
          वापस जाएँ
        </button>
        <p className="tag">स्वतंत्र हैकथॉन प्रोटोटाइप · नकली क्रैश · सरकारी वेबसाइट नहीं</p>
      </div>
    </div>
  );
}
