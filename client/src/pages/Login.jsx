import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle.jsx";
import "../styles/Login.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const LOGIN_FEATURES = [
  { icon: "✳", label: "Clear guidance", detail: "Explainable content checks" },
  { icon: "✓", label: "Human approval", detail: "People make the final call" },
  { icon: "◈", label: "Brand standards", detail: "Approved rules, all together" },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not sign in. Try again.");

      localStorage.setItem("inkloom-token", data.token);
      navigate("/workflow");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  }

  function handleGitHubLogin() {
    window.location.href = `${API_BASE_URL}/api/auth/github`;
  }

  return (
    <main className="login-page">
      <section className="login-shell" aria-label="Sign in to Inkloom AI">
        <header className="login-header">
          <Link to="/" className="login-brand" aria-label="Inkloom AI home">
            <span className="login-brand-mark">I</span>
            <span>Inkloom <span className="login-brand-light">AI</span></span>
            <span className="login-beta">BETA</span>
          </Link>
          <div className="login-header-actions">
            <p className="login-header-note">A little more clarity in every message.</p>
            <ThemeToggle />
          </div>
        </header>

        <div className="login-stage">
          <div className="login-orbit login-orbit-one" aria-hidden="true" />
          <div className="login-orbit login-orbit-two" aria-hidden="true" />
          <span className="login-spark login-spark-one" aria-hidden="true">✳</span>
          <span className="login-spark login-spark-two" aria-hidden="true">＋</span>
          <span className="login-spark login-spark-three" aria-hidden="true">○</span>

          <section className="login-story">
            <span className="login-eyebrow">Content governance for teams</span>
            <h1>Good content.<br /><span>On brand.</span> By design.</h1>
            <p className="login-story-copy">
              Bring brand standards, clear feedback, and thoughtful human approval into one calm workspace.
            </p>

            <div className="login-benefits">
              {LOGIN_FEATURES.map((feature) => (
                <div className="login-benefit" key={feature.label}>
                  <span className="login-benefit-icon" aria-hidden="true">{feature.icon}</span>
                  <span>
                    <strong>{feature.label}</strong>
                    <small>{feature.detail}</small>
                  </span>
                </div>
              ))}
            </div>

            <div className="login-preview" aria-label="Inkloom content review preview">
              <div className="login-preview-top">
                <span className="login-preview-dots"><i /><i /><i /></span>
                <span className="login-preview-label">CONTENT REVIEW</span>
                <span className="login-preview-status"><i /> Ready to review</span>
              </div>
              <div className="login-preview-body">
                <div className="login-preview-document">
                  <span className="login-preview-kicker">CAMPAIGN DRAFT · WEB PAGE</span>
                  <strong>Make room for better work.</strong>
                  <span className="login-preview-line login-preview-line-long" />
                  <span className="login-preview-line" />
                  <span className="login-preview-line login-preview-line-short" />
                </div>
                <div className="login-preview-checks">
                  <span className="login-check-icon">✓</span>
                  <span><strong>Voice looks good</strong><small>Brand tone aligned</small></span>
                </div>
              </div>
              <div className="login-preview-footer">
                <span className="login-preview-avatar">JD</span>
                <span>Human review stays in control</span>
                <span className="login-preview-arrow">↗</span>
              </div>
            </div>
            <p className="login-story-footer">Clear feedback. Confident teams. Better drafts.</p>
          </section>

          <section className="login-card" aria-labelledby="login-title">
            <div className="login-card-heading">
              <span className="login-card-mark" aria-hidden="true">I</span>
              <div>
                <p className="login-card-kicker">YOUR WORKSPACE AWAITS</p>
                <h2 id="login-title">Welcome back<span>.</span></h2>
                <p>Sign in to pick up where you left off.</p>
              </div>
            </div>

            {error && <p role="alert" className="login-error">{error}</p>}

            <form onSubmit={handleSubmit} className="login-form">
              <label className="login-field">
                <span>Email</span>
                <span className="login-input-wrap">
                  <MailIcon />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                  />
                </span>
              </label>

              <label className="login-field">
                <span>Password</span>
                <span className="login-input-wrap">
                  <LockIcon />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((show) => !show)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </span>
              </label>

              <div className="login-form-options">
                <label className="login-remember">
                  <input type="checkbox" defaultChecked />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              <button type="submit" className="login-submit" disabled={submitting}>
                <span>{submitting ? "Signing in…" : "Sign in"}</span>
                {!submitting && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <div className="login-divider"><span>or continue with</span></div>

            <div className="login-socials">
              <button type="button" onClick={handleGoogleLogin}><GoogleIcon /> Google</button>
              <button type="button" onClick={handleGitHubLogin}><GitHubIcon /> GitHub</button>
            </div>

            <button type="button" className="login-skip" onClick={() => navigate("/workflow")}>
              Continue without signing in
            </button>

            <p className="login-signup">
              New to Inkloom? <Link to="/signup">Create an account <span aria-hidden="true">→</span></Link>
            </p>
            <p className="login-terms">Thoughtful content review, with people in control.</p>
          </section>
        </div>
      </section>
    </main>
  );
}

function MailIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.5 10.5 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.1 4.1M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 3.1-.5" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4V6.5H1.4C.5 8.2 0 10.1 0 12s.5 3.8 1.4 5.5l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.5l4 3.1c.9-2.8 3.5-4.8 6.6-4.8Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.4-1.3-5.4-5.9 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.6.1-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6.2 0c2.4-1.5 3.4-1.2 3.4-1.2.7 1.6.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.4 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}
