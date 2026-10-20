import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import ParticleTitle from "../components/ParticleTitle.jsx";
import "../styles/Landing.css";

const NAV_LINKS = [
  { label: "How it works", href: "#pipeline" },
  { label: "Guidelines", href: "/brand-kits" },
  { label: "Insights", href: "/community" },
];

const STATS = [
  {
    title: "Explainable",
    subtitle: "Review findings",
    tone: "violet",
    icon: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
  },
  {
    title: "Human-led",
    subtitle: "Approval workflow",
    tone: "indigo",
    icon: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="M4.5 7.5 12 12l7.5-4.5M12 12v9" />
      </>
    ),
  },
  {
    title: "For Teams",
    subtitle: "Creators & Reviewers",
    tone: "blue",
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <circle cx="17" cy="8" r="2.4" />
        <path d="M22 20c0-2.6-2-4.8-5-5.6" />
      </>
    ),
  },
  {
    title: "Local",
    subtitle: "Browser-based prototype",
    tone: "amber",
    icon: <path d="M12 2 4 12.5h5.5L9 22l9.5-11.5H13L12 2Z" />,
  },
];

function ThemeButton() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="theme-btn"
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )}
    </button>
  );
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="page">
      {/* ================= NAVBAR ================= */}
      <nav className="navbar">
        <a href="#top" className="logo">
          <span className="logo-star">✦</span>
          <span>
            Ink<i>loom</i>
          </span>
        </a>

        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          {NAV_LINKS.map((item) => (
            item.href.startsWith("#") ? (
              <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>
            ) : (
              <Link key={item.label} to={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>
            )
          ))}
        </div>

        <div className="nav-buttons">
          <ThemeButton />
          <a href="#pipeline" className="login-btn">
            Explore Inkloom
          </a>
          <Link to="/workflow" className="start-btn">
            Review a draft
            <span>→</span>
          </Link>
          <button
            type="button"
            className="nav-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <main className="hero">
        {/* LEFT SIDE */}
        <section className="hero-left">
          <div className="ai-badge">
            <span>✦</span>
            Pre-publication Brand Governance
          </div>

          <h1>
            <ParticleTitle>
              Make every
              <br />
              <span>message</span> matter.
            </ParticleTitle>
          </h1>

          <p className="hero-description">
            One calm place to review brand voice, claims and accessibility
            before content goes live. Clear reasons, thoughtful suggestions,
            people in control.
          </p>

          <div className="hero-buttons">
            <Link to="/workflow" className="primary-btn">
              Start a review
              <span>→</span>
            </Link>

            <a href="#pipeline" className="demo-btn">
              <span className="play">▶</span>
              See how it works
            </a>
          </div>

          {/* PEOPLE */}
          <div className="social-proof">
            <div className="avatars">
              <div className="avatar avatar1"></div>
              <div className="avatar avatar2"></div>
              <div className="avatar avatar3"></div>
              <div className="avatar avatar4"></div>
            </div>

            <p>
              Built for teams protecting
              <br />
              a consistent brand voice.
            </p>
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="hero-right" aria-label="Preview of the Inkloom review workspace">
          <div className="review-preview">
            <div className="review-preview__topbar">
              <div className="review-preview__brand"><span>i</span><b>inkloom</b><small>WORKSPACE</small></div>
              <div className="review-preview__top-actions"><span>● Your workspace</span><i>JD</i></div>
            </div>
            <div className="review-preview__body">
              <aside className="review-preview__rail" aria-hidden="true">
                <span className="is-selected">▦</span><span>⌕</span><span>◇</span><span>◷</span><span>⚙</span>
              </aside>
              <div className="review-preview__main">
                <div className="review-preview__heading">
                  <div><small>CONTENT REVIEW / SOCIAL</small><h2>Spring launch post</h2></div>
                  <span className="review-preview__draft">IN REVIEW</span>
                </div>
                <div className="review-preview__document">
                  <div className="review-preview__document-head"><span>Draft copy</span><span>Edited just now</span></div>
                  <p>Meet the <mark>best</mark> way to organize your team. We <mark className="claim">guarantee</mark> you’ll get more done.</p>
                  <div className="review-preview__findings">
                    <div className="review-preview__finding">
                      <span className="review-preview__finding-icon">!</span>
                      <div><b>Promotional claim</b><small>“Best” needs an approved source.</small></div>
                      <span className="review-preview__severity">CHECK</span>
                    </div>
                    <div className="review-preview__finding">
                      <span className="review-preview__finding-icon">↗</span>
                      <div><b>Absolute language</b><small>Consider a more supportable promise.</small></div>
                      <span className="review-preview__severity">CHECK</span>
                    </div>
                  </div>
                </div>
                <div className="review-preview__footer"><span><i /> Human review stays in control</span><button type="button" tabIndex={-1}>Review findings <b>→</b></button></div>
              </div>
            </div>
          </div>
          <div className="review-preview-note"><span>✦</span> Clear findings. Better decisions.</div>
        </section>
      </main>

      {/* ================= STATS ================= */}
      <section className="stats-row">
        {STATS.map((stat) => (
          <div key={stat.subtitle} className={`stat-card tone-${stat.tone}`}>
            <span className="stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {stat.icon}
              </svg>
            </span>
            <div>
              <p className="stat-title">{stat.title}</p>
              <p className="stat-subtitle">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ================= PIPELINE DETAIL ================= */}
      <section id="pipeline" className="pipeline-section">
        <h2>From first draft to human approval.</h2>
        <p>
          One clear review loop keeps your approved standards, content findings
          and reviewer decisions connected.
        </p>

        <div className="stage-grid">
          {[
            { n: "01", title: "Add brand rules", body: "Record approved terminology and the standards your reviewers expect content to follow." },
            { n: "02", title: "Review a draft", body: "Run text checks for unsupported claims, terminology, tone and common accessibility issues." },
            { n: "03", title: "Understand findings", body: "See why each item was flagged, the rule behind it and a suggested next step." },
            { n: "04", title: "Revise together", body: "Apply optional wording suggestions, leave context and request changes or approval." },
            { n: "05", title: "Keep a decision", body: "A reviewer explicitly approves or requests changes; automation never publishes for you." },
            { n: "06", title: "Learn over time", body: "Use saved reviews to spot recurring wording issues and improve unclear guidelines." },
          ].map((step) => (
            <div key={step.n} className="stage-card">
              <span className="stage-number">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="site-footer">
        Inkloom AI — brand governance that keeps human judgment in the loop.
      </footer>
    </div>
  );
}