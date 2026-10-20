const CARDS = [
  {
    label: "Your Idea",
    tone: "from-[var(--accent-from)] to-[var(--accent-to)]",
    rotate: "-rotate-3",
    glow: false,
    icon: (
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4.9 1 .9 1.7V16h5.2v-.4c0-.7.3-1.3.9-1.7A6 6 0 0 0 12 3Z" />
    ),
  },
  {
    label: "AI Analysis",
    tone: "from-[var(--accent-to)] to-[var(--accent-from)]",
    rotate: "rotate-2",
    glow: true,
    icon: (
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" />
    ),
  },
  {
    label: "Your Brand",
    tone: "from-[var(--accent-from)] to-[var(--accent-to)]",
    rotate: "-rotate-2",
    glow: false,
    icon: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z M4.5 7.5 12 12l7.5-4.5M12 12v9" />,
  },
];

export default function BrandVisual() {
  return (
    <div className="relative hidden w-full max-w-[220px] pt-6 xl:block" aria-hidden="true">
      <span className="font-handwritten absolute -top-6 right-2 -rotate-6 text-lg text-[var(--accent-solid)]">
        From Idea
        <br />
        to Brand
        <span className="ml-1 inline-block -rotate-45">↳</span>
      </span>

      <div className="flex flex-col gap-7 pt-16">
        {CARDS.map((card, i) => (
          <div key={card.label} className="relative" style={{ marginLeft: `${(i % 2) * 22}px` }}>
            {card.glow && <span className="glow-ring" />}
            <div
              className={`relative flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 shadow-lg ${card.rotate}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.tone} text-white`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {card.icon}
                </svg>
              </span>
              <span className="text-sm font-semibold text-[var(--text)]">{card.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}