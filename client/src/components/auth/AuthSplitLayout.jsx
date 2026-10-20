const FEATURES = [
  {
    title: "Staged AI Pipeline",
    body: "Six stages, one thread of context",
    icon: (
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    ),
  },
  {
    title: "Consistency Checked",
    body: "AI critiques its own output",
    icon: (
      <>
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="9" />
      </>
    ),
  },
  {
    title: "Structured & Powerful",
    body: "More than a generic generator",
    icon: (
      <>
        <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
        <path d="M4.5 7.5 12 12l7.5-4.5M12 12v9" />
      </>
    ),
  },
  {
    title: "Built for Founders",
    body: "Turn ideas into launch-ready brands",
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

const NAV_LINKS = ["Features", "Templates", "Community", "Pricing"];

export default function AuthSplitLayout({ badge, heading, highlight, description, children }) {
  return (
    <div className="flex min-h-screen w-full bg-[var(--bg)]">
      {/* LEFT — marketing panel */}
      <div className="relative hidden w-1/2 flex-col overflow-hidden bg-[#0a0714] p-8 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 15% 20%, rgba(139,92,246,0.25), transparent 45%), radial-gradient(circle at 90% 10%, rgba(236,72,153,0.15), transparent 50%)",
          }}
        />

        {/* nav */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#f472b6] text-sm font-bold">
              B
            </span>
            <span className="text-base font-semibold">Brandloom</span>
            <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-medium text-white/60">
              Beta
            </span>
          </div>

          <div className="hidden items-center gap-6 text-sm text-white/60 xl:flex">
            {NAV_LINKS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <span className="text-right text-xs italic text-white/40">
            "From idea
            <br />
            to brand, step by step."
          </span>
        </div>

        {/* content */}
        <div className="relative z-10 my-auto max-w-md">
          <span className="inline-block rounded-full border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#c4b5fd]">
            {badge}
          </span>

          <h1 className="mt-4 text-4xl font-bold leading-tight">
            {heading} <span className="bg-gradient-to-r from-[#8b5cf6] to-[#f472b6] bg-clip-text text-transparent">{highlight}</span>
          </h1>

          <p className="mt-3 text-sm text-white/60">{description}</p>

          <div className="mt-8 space-y-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 text-[#c4b5fd]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {feature.icon}
                  </svg>
                </span>
                <span>
                  <span className="block text-sm font-semibold">{feature.title}</span>
                  <span className="block text-xs text-white/50">{feature.body}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            AI pipeline online
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-white/30">
            <span>© 2026 Brandloom. All rights reserved.</span>
            <span className="flex gap-3">
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