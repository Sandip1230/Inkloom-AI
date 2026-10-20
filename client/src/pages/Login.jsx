import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthSplitLayout from "../components/auth/AuthSplitLayout.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

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

      localStorage.setItem("brandloom-token", data.token);
      navigate("/workflow");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkip() {
    navigate("/workflow");
  }

  function handleGoogleLogin() {
    window.location.href = API_BASE_URL + "/api/auth/google";
  }

  function handleGitHubLogin() {
    window.location.href = API_BASE_URL + "/api/auth/github";
  }

  return (
    <AuthSplitLayout
      badge="Collaborative Brand Engine"
      heading="Welcome back."
      highlight="Keep building."
      description="Sign in to continue turning your ideas into launch-ready brand systems — staged, structured and checked."
    >
      <div className="w-full max-w-sm rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] text-2xl font-bold text-white shadow-lg">
            B
          </span>
          <h2 className="mt-4 text-xl font-bold text-[var(--text)]">Brandloom</h2>
          <p className="mt-3 text-lg font-bold text-[var(--text)]">Welcome Back</p>
          <p className="mt-1 text-sm text-[var(--text-soft)]">
            Continue your journey. Great brands are built in stages.
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-center text-sm text-rose-500">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
              Email
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]">
                <MailIcon />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-3 pl-10 pr-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-soft)] focus:border-[var(--accent-solid)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
              Password
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]">
                <LockIcon />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] py-3 pl-10 pr-10 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-soft)] focus:border-[var(--accent-solid)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((show) => !show)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)] hover:text-[var(--accent-solid)]"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-[var(--text-soft)]">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent-solid)]" />
              Remember me
            </label>
            <Link to="/forgot-password" className="font-medium text-[var(--accent-solid)]">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-soft)]">or continue with</span>
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)]"
          >
            <GoogleIcon /> Google
          </button>
          <button
            type="button"
            onClick={handleGitHubLogin}
            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)]"
          >
            <GitHubIcon /> GitHub
          </button>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="mt-4 w-full rounded-xl border border-dashed border-[var(--border)] py-2.5 text-xs font-semibold text-[var(--text-soft)] transition hover:border-[var(--accent-solid)] hover:text-[var(--accent-solid)]"
        >
          Skip for now →
        </button>

        <p className="mt-5 text-center text-sm text-[var(--text-soft)]">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-[var(--accent-solid)]">
            Create one
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.4 19.4 0 0 1 5.06-5.94M9.9 4.24A10.6 10.6 0 0 1 12 4c7 0 11 8 11 8a19.5 19.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4V6.5H1.4C.5 8.2 0 10.1 0 12s.5 3.8 1.4 5.5l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.5l4 3.1c.9-2.8 3.5-4.8 6.6-4.8Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.4-1.3-5.4-5.9 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.6.1-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6.2 0c2.4-1.5 3.4-1.2 3.4-1.2.7 1.6.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.4 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}