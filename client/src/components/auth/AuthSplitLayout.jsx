const FEATURES = [
  {
    title: "Explainable checks",
    body: "Understand why a draft was flagged",
    icon: (
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    ),
  },
  {
    title: "Human approval",
    body: "People make the final decision",
    icon: (
      <>
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="9" />
      </>
    ),
  },
  {
    title: "Brand standards",
    body: "Keep preferred terminology close",
    icon: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="M4.5 7.5 12 12l7.5-4.5M12 12v9" />
      </>
    ),
  },
  {
    title: "Built for teams",
    body: "Review content before publication",
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <circle cx="17" cy="8" r="2.4" />
        <path d="M22 20c0-2.6-2-4.8-5-5.6" />
      </>
    ),
  },
];

const NAV_LINKS = ["Reviews", "Guidelines", "Insights"];

export default function AuthSplitLayout({ badge, heading, highlight, description, children }) {
  return (
    <div className="flex min-h-screen w-full bg-[var(--bg)]">
      {/* LEFT — marketing panel */}
      <div className="relative hidden w-1/2 flex-col overflow-hidden bg-[var(--auth-panel-bg)] p-8 text-[var(--auth-panel-text)] lg:flex">
        <div className="auth-panel-glow pointer-events-none absolute inset-0" />

        {/* nav */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] text-sm font-bold text-white">
              I
            </span>
            <span className="text-base font-semibold">Inkloom AI</span>
            <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--auth-panel-muted)]">
              Beta
            </span>
          </div>

          <div className="hidden items-center gap-6 text-sm text-[var(--auth-panel-muted)] xl:flex">
            {NAV_LINKS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <span className="text-right text-xs italic text-[var(--auth-panel-muted)]">
            "From draft
            <br />
            to approval, with care."
          </span>
        </div>

        {/* content */}
        <div className="relative z-10 my-auto max-w-md">
          <span className="inline-block rounded-full border border-[var(--accent-solid)]/30 bg-[var(--accent-solid)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-solid)]">
            {badge}
          </span>

          <h1 className="mt-4 text-4xl font-bold leading-tight">
            {heading} <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">{highlight}</span>
          </h1>

          <p className="mt-3 text-sm text-[var(--auth-panel-muted)]">{description}</p>

          <div className="mt-8 space-y-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-solid)]/30 bg-[var(--accent-solid)]/10 text-[var(--accent-solid)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {feature.icon}
                  </svg>
                </span>
                <span>
                  <span className="block text-sm font-semibold">{feature.title}</span>
                  <span className="block text-xs text-[var(--auth-panel-muted)]">{feature.body}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs text-[var(--auth-panel-muted)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Brand governance workspace
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--auth-panel-muted)]">
            <span>© 2026 Inkloom AI. All rights reserved.</span>
            <span className="flex gap-3 text-[var(--auth-panel-muted)]">
              <span>Privacy</span> · <span>Terms</span> · <span>Help</span>
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT — form card */}
      <div className="flex w-full flex-1 items-center justify-center bg-[var(--bg)] px-6 py-10 lg:w-1/2">
        {children}
      </div>
    </div>
  );
}