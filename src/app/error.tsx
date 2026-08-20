"use client";

import { useEffect } from "react";
import { Banner } from "@/ui/Banner";
import { ErrorNote } from "@/ui/bits";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Logged, never shown: a citizen screen has no business printing a stack trace.
    console.error(error);
  }, [error]);

  return (
    <>
      <Banner />
      <main id="main" className="wrap wrap-narrow">
        <h1>कुछ गड़बड़ हुई</h1>
        <p className="muted" style={{ margin: "var(--s3) 0 var(--s4)" }}>
          आपका ड्राफ़्ट इस फ़ोन पर सुरक्षित है। पृष्ठ दोबारा खोलने से काम आगे बढ़ जाएगा।
        </p>
        <ErrorNote
          error={{
            code: "CLIENT_RENDER",
            hi: "यह पृष्ठ इस समय दिखाया नहीं जा सका।",
            en: "This page could not be rendered right now.",
            retryable: true,
            ref: "CLIENT_RENDER",
          }}
        />
        <p style={{ marginTop: "var(--s4)" }}>
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            दोबारा कोशिश करें
          </button>
        </p>
      </main>
    </>
  );
}
