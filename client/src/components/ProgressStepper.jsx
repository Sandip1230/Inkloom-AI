import { STAGES } from "../lib/stages.js";

function StepIcon({ name }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (name) {
    case "bulb":
      return (
        <svg {...common}>
          <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4.9 1 .9 1.7V16h5.2v-.4c0-.7.3-1.3.9-1.7A6 6 0 0 0 12 3Z" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="0.6" fill="currentColor" />
        </svg>
      );
    case "person":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 20c0-3.6 3.1-6.4 7-6.4s7 2.8 7 6.4" />
        </svg>
      );
    case "image":
      return (
        <svg {...common}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="m5 17 4.5-4.5 3 3L18.5 9 21 11.5" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" />
        </svg>
      );
    case "rocket":
      return (
        <svg {...common}>
          <path d="M12 2.5c2.5 1.7 4 4.7 4 8.5 0 2-.5 3.7-1.3 5.2L12 19l-2.7-2.8C8.5 14.7 8 13 8 11c0-3.8 1.5-6.8 4-8.5Z" />
          <circle cx="12" cy="10" r="1.6" />
          <path d="M9 16.5 6.5 19M15 16.5l2.5 2.5M8 20.5h8" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ProgressStepper({ currentStage, completedStages = [], onSelect }) {
  const activeIndex = STAGES.findIndex((stage) => stage.key === currentStage);

  return (
    <nav
      aria-label="Brand pipeline progress"
      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:px-4"
    >
      <ol className="flex w-full items-center">
        {STAGES.map((stage, index) => {
          const isDone = completedStages.includes(stage.key);
          const isActive = index === activeIndex;
          const isReachable = isDone || isActive || index === 0;
          const isLast = index === STAGES.length - 1;

          return (
            <li key={stage.key} className={"flex min-w-0 items-center" + (isLast ? "" : " flex-1")}>
              <button
                type="button"
                disabled={!isReachable}
                onClick={() => onSelect?.(stage.key)}
                aria-current={isActive ? "step" : undefined}
                className="flex min-w-0 shrink items-center gap-1.5 disabled:cursor-not-allowed"
              >
                <span
                  className={
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors " +
                    (isActive
                      ? "bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] text-white shadow-[0_4px_14px_-4px_var(--accent-solid)]"
                      : isDone
                      ? "bg-[var(--surface-2)] text-[var(--text)]"
                      : "border border-[var(--border)] text-[var(--text-soft)]")
                  }
                >
                  {isDone && !isActive ? "✓" : index + 1}
                </span>
                <span
                  className={
                    "hidden shrink-0 items-center 2xl:flex " +
                    (isActive ? "text-[var(--accent-solid)]" : "text-[var(--text-soft)]")
                  }
                >
                  <StepIcon name={stage.icon} />
                </span>
                <span className="hidden min-w-0 shrink flex-col items-start leading-tight lg:flex">
                  <span
                    className={
                      "truncate text-[12px] " +
                      (isActive ? "font-semibold text-[var(--text)]" : "font-medium text-[var(--text-soft)]")
                    }
                  >
                    {stage.label}
                  </span>
                  <span className="hidden truncate text-[10px] text-[var(--text-soft)] xl:block">
                    {stage.subtitle}
                  </span>
                </span>
              </button>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={
                    "mx-1.5 h-px min-w-[8px] flex-1 sm:mx-2 " +
                    (isDone
                      ? "bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)]"
                      : "bg-[var(--border)]")
                  }
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}