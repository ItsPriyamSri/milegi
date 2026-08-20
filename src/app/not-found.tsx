import Link from "next/link";
import { Banner } from "@/ui/Banner";

export default function NotFound() {
  return (
    <>
      <Banner />
      <main id="main" className="wrap wrap-narrow">
        <h1>यह पता नहीं मिला</h1>
        <p className="muted" style={{ margin: "var(--s3) 0 var(--s4)" }}>
          लिंक अधूरा हो सकता है। अपनी फ़ाइल आवेदन संख्या (MLG-26-…) से खोलें।
        </p>
        <p className="row">
          <Link className="btn" href="/">
            मुख्य पृष्ठ
          </Link>
          <Link className="btn btn-primary" href="/pravesh?mode=track">
            फ़ाइल देखें
          </Link>
        </p>
      </main>
    </>
  );
}
