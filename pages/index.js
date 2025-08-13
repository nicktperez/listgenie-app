// pages/index.js
import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to <span className="hero-accent">ListGenie</span>
          </h1>
          <p className="hero-subtitle">
            Your AI-powered assistant for creating real estate listings in seconds.
          </p>
          
          <div className="hero-actions">
            <Link href="/chat" className="hero-btn primary">
              Start Chatting
            </Link>
            <Link href="/upgrade" className="hero-btn secondary">
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <span className="icon">⚡</span>
            </div>
            <div className="feature-content">
              <h3 className="feature-title">Instant Listings</h3>
              <p className="feature-description">
                Generate professional listings instantly—formatted and ready to post.
              </p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <span className="icon">🤖</span>
            </div>
            <div className="feature-content">
              <h3 className="feature-title">AI-Powered</h3>
              <p className="feature-description">
                Cutting-edge models produce high-quality, unique property descriptions.
              </p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <span className="icon">⏱</span>
            </div>
            <div className="feature-content">
              <h3 className="feature-title">Save Time</h3>
              <p className="feature-description">
                Focus on clients while ListGenie handles the writing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="social-proof">
        <div className="social-content">
          <p className="social-text">
            Trusted by <strong>hundreds of realtors</strong> to create compelling listings
          </p>
        </div>
      </section>
    </main>
  );
}