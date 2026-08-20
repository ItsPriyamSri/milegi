import "./globals.css";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import Banner from "@/components/Banner";
import LangToggle from "@/components/LangToggle";
import SiteNav from "@/components/SiteNav";

export const metadata = { title: "Milegi — प्रोटोटाइप" };
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <body>
        {/* THESIS: One scholarship case you can finish; not eight government doors.
            OWN-WORLD: civic tool; atmosphere #d5e0eb; surface #ffffff; ink #12202e; error #b42318; teal #0b5f56.
            STORY: Prove papers first, then one form, then a named clerk.
            FIRST VIEWPORT: banner, nav, Milegi, case list, OTR/registration resume.
            FORM: Operate / civic tool. System fonts only — the visitor is on two bars. */}
        <div className="app">
          <Banner />
          <header className="bar">
            <Link href="/" className="brand">Milegi</Link>
            <LangToggle />
          </header>
          <SiteNav />
          <BackLink />
          {children}
        </div>
      </body>
    </html>
  );
}
