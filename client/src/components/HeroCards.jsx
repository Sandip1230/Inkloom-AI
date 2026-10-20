const STAGES = [
  { label: "Understand", icon: "🧭" },
  { label: "Position", icon: "🎯" },
  { label: "Shape", icon: "🪄" },
  { label: "Visualize", icon: "🎨" },
  { label: "Challenge", icon: "⚡" },
  { label: "Deliver", icon: "🚀" },
];

export default function HeroCards() {
  return (
    <div className="relative w-full max-w-sm">
      <div className="pointer-events-none absolute -inset-10 rounded-[40px] bg-brand-gradient opacity-20 blur-3xl" />
      <div className="relative flex flex-col gap-3">
        {STAGES.map((stage, i) => (
          <div
            key={stage.label}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md"
            style={{
              marginLeft: `${(i % 2) * 28}px`,
              marginRight: `${((i + 1) % 2) * 28}px`,
            }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-base">
              {stage.icon}
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">
                Stage {String(i + 1).padStart(2, "0")}
              </p>
              <p className="text-sm font-medium text-white">{stage.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}