import { Link } from "react-router-dom";

// Flowing ribbon artwork on the right side of the banner.
function AuroraArt() {
  return (
    <svg className="hero__aurora" viewBox="0 0 700 220" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hero-wave-a" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#ff5a3c" stopOpacity="0" />
          <stop offset="0.35" stopColor="#ff6a45" stopOpacity="0.85" />
          <stop offset="0.7" stopColor="#f0368a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffb06b" stopOpacity="0.55" />
        </linearGradient>
        <filter id="hero-blur" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <path d="M40 200C150 190 210 100 300 86c80-12 110 46 190 38 70-7 130-70 210-62" fill="none" stroke="url(#hero-wave-a)" strokeWidth="46" strokeLinecap="round" opacity="0.85" filter="url(#hero-blur)" />
      <path d="M40 200C150 190 210 100 300 86c80-12 110 46 190 38 70-7 130-70 210-62" fill="none" stroke="url(#hero-wave-a)" strokeWidth="14" strokeLinecap="round" />
      <path d="M70 210C170 196 230 118 310 100c70-15 100 36 170 30 60-5 110-52 220-44" fill="none" stroke="#ffd2b0" strokeWidth="1.4" opacity="0.65" />
      <path d="M100 216C190 204 250 134 322 116c60-14 92 28 150 22 56-6 110-40 228-34" fill="none" stroke="#ff9a52" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}

// Top banner of the dashboard: heading, tagline, handwritten note and two quick actions.
// (The four stat cards now live on the "Review history" page.)
export default function DashboardHero() {
  function jumpToReview() {
    document.getElementById("new-review")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="hero hero--compact stagger" aria-labelledby="hero-title">
      <AuroraArt />

      <div className="hero__top">
        <div className="hero__copy">
          <p className="hero__eyebrow">
            Inkloom AI <span className="hero__slash">/</span> Workspace overview
          </p>
          <h1 id="hero-title" className="hero__title">
            Every draft, in <span className="hero__title-accent">good hands.</span>
          </h1>
          <p className="hero__lead">
            Review the details. Keep your brand consistent. Leave the final call to people.
          </p>

          <div className="hero__actions">
            <button type="button" onClick={jumpToReview} className="hero__btn hero__btn--primary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Start a review
            </button>
            <Link to="/projects" className="hero__btn">
              Open review history <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="hero__note" aria-hidden="true">
          <svg className="hero__note-star" width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3c.8 7.2 3.8 10.2 11 11-7.2.8-10.2 3.8-11 11-.8-7.2-3.8-10.2-11-11 7.2-.8 10.2-3.8 11-11Z" />
            <path d="M29 4v5M26.5 6.5h5" />
          </svg>
          <p>
            Better<br />
            Content<br />
            Brighter<br />
            Ideas <span className="hero__note-dash">-</span>
          </p>
        </div>
      </div>
    </section>
  );
}