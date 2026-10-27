import { Link } from "react-router-dom";
import { Badge, Icon, StatusBadge, cardClass, ghostBtn, primaryBtn } from "./shared.jsx";
import { ROLES } from "./ProcessGuide.jsx";
import SampleScenario from "./SampleScenario.jsx";

const ACCESS_STEPS = [
  {
    icon: "login",
    title: "Sign in or create an account",
    text: "Use the button above. Email, Google and GitHub sign-in all work. Your session keeps you signed in on this device.",
  },
  {
    icon: "building",
    title: "Create or join a workspace",
    text: "Open Company Admin. Create a workspace for your team, or ask a workspace owner to invite you.",
  },
  {
    icon: "userCheck",
    title: "Get the right role",
    text: "Your role decides what you can do: manage sources, review claims, or submit claims. Owners and admins can change roles.",
  },
  {
    icon: "shield",
    title: "Return to Claim Review",
    text: "Come back to this page from the sidebar, pick your workspace and start checking claims.",
  },
];

const COPY = {
  missing: {
    title: "Sign in to use Claim Review",
    text: "Claim Review checks statements against your team's approved documents and keeps an audit trail, so it is only available to signed-in workspace members.",
  },
  expired: {
    title: "Your session has expired",
    text: "For your security you were signed out. Sign in again to pick up where you left off - your claims and documents are safe.",
  },
};

// A static, non-interactive sample so people can see what they will get after signing in.
function PreviewCard() {
  return (
    <div className="cr-float rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg" aria-hidden="true">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-soft)]">Sample claim</p>
      <p className="mt-1 text-sm font-medium text-[var(--text)]">"Customer data is encrypted at rest."</p>
      <div className="mt-3 flex items-center gap-2">
        <StatusBadge status="Supported" />
        <span className="text-[11px] text-[var(--text-soft)]">AI-suggested, awaiting review</span>
      </div>
      <blockquote className="mt-3 border-l-2 border-[var(--accent-solid)] pl-3 text-xs leading-5 text-[var(--text-soft)]">
        "All customer records are <mark style={{ background: "transparent", color: "inherit", fontWeight: 600 }}>encrypted at rest</mark> using AES-256."
        <span className="mt-1 block text-[10px]">Security whitepaper · v3 · paragraph 4</span>
      </blockquote>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--text-soft)]">
        <Icon name="clock" size={12} /> Waiting for a reviewer to confirm
      </div>
    </div>
  );
}

export default function SignInGuide({ reason = "missing", onRetry, hasToken = false }) {
  const copy = COPY[reason] || COPY.missing;

  return (
    <div className="mt-6 space-y-6">
      <section className={`${cardClass} cr-hero cr-rise overflow-hidden`}>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] text-white">
              <Icon name="lock" size={22} />
            </span>
            <h2 className="mt-4 text-xl font-semibold text-[var(--text)]">{copy.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-soft)]">{copy.text}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link to="/login" className={`${primaryBtn} inline-flex items-center gap-2`}>
                <Icon name="login" size={16} /> Sign in
              </Link>
              <Link to="/signup" className={`${ghostBtn} inline-flex items-center gap-2`}>
                <Icon name="userPlus" size={16} /> Create account
              </Link>
              {(hasToken || reason === "expired") && onRetry && (
                <button type="button" onClick={onRetry} className="text-xs font-medium text-[var(--accent-solid)] hover:underline">
                  I have just signed in - try again
                </button>
              )}
            </div>
          </div>
          <PreviewCard />
        </div>
      </section>

      <SampleScenario />

      <section className={`${cardClass} cr-rise`} aria-labelledby="cr-access-title" style={{ animationDelay: "80ms" }}>
        <h2 id="cr-access-title" className="text-base font-semibold text-[var(--text)]">How to get access</h2>
        <p className="mt-1 text-xs text-[var(--text-soft)]">Four quick steps. Most people finish in under two minutes.</p>
        <ol className="mt-5 space-y-0">
          {ACCESS_STEPS.map((step, index) => (
            <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
              {index < ACCESS_STEPS.length - 1 && (
                <span className="absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-px bg-[var(--border)]" aria-hidden="true" />
              )}
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--accent-solid)]/40 bg-[var(--accent-solid)]/10 text-[var(--accent-solid)]">
                <Icon name={step.icon} size={18} />
              </span>
              <div className="min-w-0 pt-1">
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  <span className="mr-2 text-[var(--text-soft)]">{index + 1}.</span>{step.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{step.text}</p>
                {index === 1 && (
                  <Link to="/company-admin" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-solid)] hover:underline">
                    Open Company Admin <Icon name="arrowRight" size={12} />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={`${cardClass} cr-rise`} aria-labelledby="cr-roles-title" style={{ animationDelay: "160ms" }}>
        <h2 id="cr-roles-title" className="text-base font-semibold text-[var(--text)]">What each role can do</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {ROLES.map((role) => (
            <article key={role.name} className="rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--accent-solid)]">
                  <Icon name={role.icon} size={16} />
                </span>
                <h3 className="text-sm font-semibold text-[var(--text)]">{role.name}</h3>
              </div>
              <ul className="mt-3 space-y-1.5">
                {role.can.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-[var(--text)]">
                    <Icon name="check" size={14} className="mt-0.5 text-emerald-600" /> {item}
                  </li>
                ))}
                {(role.cannot || []).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-[var(--text-soft)]">
                    <Icon name="x" size={14} className="mt-0.5 text-rose-500" /> {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-[var(--text-soft)]">
          <Icon name="info" size={14} className="mt-0.5" />
          <span>Every submission, approval and decision is recorded with who did it and when. <Badge tone="accent">Audit trail</Badge></span>
        </p>
      </section>
    </div>
  );
}