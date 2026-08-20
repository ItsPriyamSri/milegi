import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "मिलेगी — छात्रवृत्ति फ़ाइल",
  description: "स्वतंत्र हैकथॉन प्रोटोटाइप · नकली डेटा · सरकारी वेबसाइट नहीं",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}
