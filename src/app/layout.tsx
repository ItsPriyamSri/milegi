import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getLang } from "@/lib/lang";

export const metadata: Metadata = {
  title: "मिलेगी — छात्रवृत्ति फ़ाइल (प्रोटोटाइप)",
  description:
    "उत्तर प्रदेश छात्रवृत्ति सेवा का स्वतंत्र प्रोटोटाइप। हर चरण का एक नाम वाला ज़िम्मेदार और एक तारीख़। नकली डेटा।",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <body>
        {/*
THESIS: This surface owns the sentence "your file has an owner and a deadline". It refuses the
government-portal arrangement where a citizen screen is a menu of logins plus a status word with no
clock, and it refuses the SaaS arrangement where everything is a rounded card.
OWN-WORLD: Ink on cool paper. Rules only where a boundary is real. One indigo action accent; waiting,
breach, verified and paid each carry a glyph plus a word. Tabular numerals, right-aligned money and
dates. Signature device: the stage ledger, a vertical rule with stage nodes carrying owner, date and
elapsed days. System type stack, no font request, Devanagari at 1.65 line-height.
STORY: The visitor learns this is independent and synthetic, sees what is checked before they type,
fills one form once, and leaves holding a page naming who has their file and until when.
FIRST VIEWPORT: banner; one line of what this is; the two real doors at full width; then the three
things this fixes, each one line with a number.
FORM: single-column civic record on mobile, dense ledger tables on operator surfaces. Direction pinned
by the builder (Civic Ink); no concept roll was run because a pinned direction beats the roll.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
        */}
        {children}
      </body>
    </html>
  );
}
