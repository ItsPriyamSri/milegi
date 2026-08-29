import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { getLang } from "@/lib/lang";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-latin",
  adjustFontFallback: true,
});

const notoDeva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-deva",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "Milegi — Scholarship Tracking with Named Owners & Deadlines · मिलेगी",
  description:
    "Independent scholarship tracking prototype for UP Saksham. Every stage has a named owner and a deadline. Synthetic data.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${notoDeva.variable} ${jakarta.variable}`}>
      <body>
        {/*
THESIS: This surface owns "your file has an owner and a deadline." It refuses a menu of logins with a status word, and it refuses a SaaS card grid.
OWN-WORLD: Gazette Register — cool mineral paper, cut-record 3px sheets, stamp-pad indigo, clerk-stamp owner block, dak-register ledger spine, UPI-receipt paid state. Noto Sans Devanagari UI, two weights, self-hosted subset. Status is glyph plus word. No emblem, no glass, no 16px radius.
STORY: The visitor sees an independent prototype, two doors, and a labelled synthetic case strip naming an owner and a weekday. They leave holding a file page with a sticky duty strip.
FIRST VIEWPORT: banner; Hindi money-question; two full-width doors; demo case strip with नकली chip; then three claims.
FORM: Gazette Register. Student = single-column record. Operator = dense ledger table. Sticky duty strip is the signature interaction.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
        */}
        {children}
      </body>
    </html>
  );
}

