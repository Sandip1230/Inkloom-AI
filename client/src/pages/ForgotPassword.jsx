import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthSplitLayout from "../components/auth/AuthSplitLayout.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const STEP_COPY = {
  email: { title: "Reset Password", description: "Enter your account email to receive a code." },
  code: { title: "Enter Code", description: "We sent a 6-digit code to your email. It expires in 10 minutes." },
  password: { title: "Set New Password", description: "Choose a new password for your account." },
  done: { title: "Password Updated", description: "You can now sign in with your new password." },
};

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSendCode(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong. Try again.");
      setStep("code");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "That code is invalid or has expired.");
      setResetToken(data.resetToken);
      setStep("password");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetNewPassword(event) {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not reset password. Try again.");
      setStep("done");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout
      badge="Collaborative Brand Engine"
      heading="Forgot your"
      highlight="password?"
      description="No worries. Enter the email on your account and we'll send you a 6-digit code to set a new one."
    >
      <div className="w-full max-w-sm rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] text-2xl font-bold text-white shadow-lg">
            B
          </span>
          <h2 className="mt-4 text-xl font-bold text-[var(--text)]">Brandloom</h2>
          <p className="mt-3 text-lg font-bold text-[var(--text)]">{STEP_COPY[step].title}</p>
          <p className="mt-1 text-sm text-[var(--text-soft)]">
            {step === "code" ? `We sent a 6-digit code to ${email}. It expires in 10 minutes.` : STEP_COPY[step].description}
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-center text-sm text-rose-500">
            {error}
          </p>
        )}

        {step === "email" && (
          <form onSubmit={handleSendCode} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-soft)] focus:border-[var(--accent-solid)]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Send code →"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                6-digit code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-center text-lg tracking-[0.3em] sm:tracking-[0.5em] text-[var(--text)] outline-none placeholder:tracking-normal placeholder:text-[var(--text-soft)] focus:border-[var(--accent-solid)]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="w-full rounded-xl bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Verifying…" : "Verify code →"}
            </button>

            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-center text-xs font-medium text-[var(--text-soft)] hover:text-[var(--text)]"
            >
              Wrong email? Go back
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleSetNewPassword} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                New password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-soft)] focus:border-[var(--accent-solid)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                Confirm new password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter password"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-soft)] focus:border-[var(--accent-solid)]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Set new password →"}
            </button>
          </form>
        )}

        {step === "done" && (
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
          >
            Back to sign in →
          </button>
        )}

        {step !== "done" && (
          <p className="mt-5 text-center text-sm">
            <Link to="/login" className="font-semibold text-[var(--accent-solid)]">
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </AuthSplitLayout>
  );
}