import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import "../styles/Landing.css";

const NAV_LINKS = ["Pipeline", "Stages", "Examples", "Pricing", "Community"];

const FLOW_CARDS = [
  {
    n: "01",
    key: "understand",
    title: "Understand",
    body: "Clarify your idea, audience and real problem.",
    tone: "blue",
    icon: (
      <path d="M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7-1a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2ZM2.5 19c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M16 13.6c2.6.3 4.6 2.1 5 4.7" />
    ),
  },
  {
    n: "02",
    key: "position",
    title: "Position",
    body: "Find your category, edge and value proposition.",
    tone: "rose",
    icon: (
      <>
        <circle cx="11" cy="11" r="8" />
        <circle cx="11" cy="11" r="3.4" />
        <path d="m19 19 2.5 2.5" />
      </>
    ),
  },
  {
    n: "03",
    key: "visualize",
    title: "Visualize",
    body: "Create a unique visual identity and style.",
    tone: "violet",
    icon: (
      <path d="M12 3a9 9 0 1 0 0 18c1 0 1.6-.7 1.6-1.5 0-.4-.2-.7-.4-1a1.6 1.6 0 0 1 1.2-2.7h1.7A3.9 3.9 0 0 0 20 11.9C20 6.9 16.4 3 12 3Zm-4.6 8.3a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm3-3.6a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Zm4.3.4a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6Z" />
    ),
  },
  {
    n: "04",
    key: "deliver",
    title: "Deliver",
    body: "Get a complete brand kit ready to launch.",
    tone: "teal",
    icon: <path d="M4 12.5 10 15l2.5 6L20 4 4 12.5Zm6 2.5-1 4" />,
  },
];

const STATS = [
  {
    title: "6",
    subtitle: "AI-Powered Stages",
    tone: "violet",
    icon: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
  },
  {
    title: "50+",
    subtitle: "Brand Assets in One Place",
    tone: "indigo",
    icon: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="M4.5 7.5 12 12l7.5-4.5M12 12v9" />
      </>
    ),
  },
  {
    title: "For Founders",
    subtitle: "Creators & Teams",
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
    title: "All-in-One",
    subtitle: "Brand Kit",
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
            Brand<i>loom</i>
          </span>
        </a>

        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          {NAV_LINKS.map((label) => (
            <a key={label} href="#pipeline" onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
        </div>

        <div className="nav-buttons">
          <ThemeButton />
          <a href="#pipeline" className="login-btn">
            See how it works
          </a>
          <Link to="/login" className="start-btn">
            Get Started
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
            AI-Powered Brand Pipeline
          </div>

          <h1>
            Turn your idea
            <br />
            into a <span>complete brand.</span>
          </h1>

          <p className="hero-description">
            From a rough thought to a launch-ready brand system. Powered by
            AI, guided by strategy, designed for builders.
          </p>

          <div className="hero-buttons">
            <Link to="/login" className="primary-btn">
              Start your brand
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
              Built for founders shaping
              <br />
              their first brand with AI.
            </p>
          </div>
        </section>

        {/* RIGHT SIDE */}
        <section className="hero-right">
          {/* Glow */}
          <div className="blue-glow"></div>
          <div className="purple-glow"></div>

          {/* Decorative ribbon */}
          <div className="ribbon ribbon-one"></div>
          <div className="ribbon ribbon-two"></div>

          {/* Handwritten annotations */}
          <span className="annotate annotate-tl">
            Your idea
            <br />
            Our AI
            <br />
            A complete brand
          </span>
          <span className="annotate annotate-tr">
            From
            <br />
            Idea
          </span>
          <span className="annotate annotate-br">
            To
            <br />
            Launch
            <br />
            Ready Brand
          </span>

          {/* PHONE */}
          <div className="phone">
            <div className="phone-screen">
              <div className="phone-logo">
                <span>✦</span>
              </div>

              <div className="phone-title">Brandloom</div>

              <div className="phone-subtitle">Ideas to launch-ready brands</div>
            </div>
          </div>

          {/* FLOATING CARDS */}
          {FLOW_CARDS.map((card) => (
            <div key={card.key} className={`workflow-card ${card.key}-card tone-${card.tone}`}>
              <div className="card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {card.icon}
                </svg>
              </div>
              <div className="card-copy">
                <span>{card.title}</span>
                <p>{card.body}</p>
              </div>
              <span className="card-number">{card.n}</span>
            </div>
          ))}
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
        <h2>Six stages. One thread of context.</h2>
        <p>
          Nothing restarts from zero. Every stage writes structured results
          that the next one reads before it says a word.
        </p>

        <div className="stage-grid">
          {[
            { n: "01", title: "Understand", body: "Extract the real problem, audience, constraints and open questions before anything gets named." },
            { n: "02", title: "Position", body: "Find the category, the differentiator, and the value proposition worth defending." },
            { n: "03", title: "Shape", body: "Personality traits, naming directions, voice and tagline — each with a reason." },
            { n: "04", title: "Visualize", body: "Translate the strategy into typography, color mood and imagery direction." },
            { n: "05", title: "Challenge", body: "Every output gets checked for clichés, contradictions and weak assumptions — and revised." },
            { n: "06", title: "Deliver", body: "A consistency-checked, exportable brand kit you can actually launch with." },
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
        Brandloom — built for the Inkloom × We Code Coders Hackathon.
      </footer>
    </div>
  );
}