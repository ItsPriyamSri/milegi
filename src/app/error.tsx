"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <h1>कुछ गड़बड़ हुई</h1>
      <p className="lead">{error.message}</p>
      <button type="button" className="primary" onClick={reset}>
        फिर कोशिश
      </button>
    </main>
  );
}
