// pages/index.js
import Link from "next/link";

export default function Home() {
  return (
    <main className="app-hero">
      <div className="container">
        <h1 className="headline">Welcome to <span className="accent">ListGenie</span></h1>
        <p className="subhead">
          Your AI‑powered assistant for creating real estate listings in seconds.
        </p>

        <div className="cta-row">
          <Link href="/chat" className="btn btn-primary">Start Chatting</Link>
          <Link href="/pricing" className="btn btn-ghost">See Pricing</Link>
        </div>

        <section className="features-grid">
          <article className="card">
            <h3>⚡ Instant Listings</h3>
            <p>Generate professional listings instantly—formatted and ready to post.</p>
          </article>
          <article className="card">
            <h3>🤖 AI‑Powered</h3>
            <p>Cutting‑edge models produce high‑quality, unique property descriptions.</p>
          </article>
          <article className="card">
            <h3>⏱ Save Time</h3>
            <p>Focus on clients while ListGenie handles the writing.</p>
          </article>
        </section>
      </div>
    </main>
  );
}