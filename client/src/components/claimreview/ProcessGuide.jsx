import { useState } from "react";
import { Icon, STATUSES, STATUS_META, Badge, StatusBadge, cardClass } from "./shared.jsx";

export const PROCESS_STEPS = [
  {
    icon: "login",
    title: "Sign in",
    text: "Use your Inkloom account. Claim Review is private to signed-in members.",
    who: "Everyone",
  },
  {
    icon: "building",
    title: "Join a workspace",
    text: "Workspaces hold your documents, claims and audit trail. Create or join one in Company Admin.",
    who: "Everyone",
  },
  {
    icon: "file",
    title: "Approve sources",
    text: "Add reference documents and approve a version. Only approved text is ever used as evidence.",
    who: "Owner / Admin",
  },
  {
    icon: "search",
    title: "Check a claim",
    text: "Enter a statement. The system suggests a status and quotes the exact passages it relied on.",
    who: "Everyone",
  },
  {
    icon: "shield",
    title: "Human decides",
    text: "A reviewer confirms or changes the suggestion and records notes. That is the final decision.",
    who: "Owner / Admin / Reviewer",
  },
];

export const ROLES = [
  {
    name: "Owner / Admin",
    icon: "shield",
    can: ["Add and approve reference documents", "Submit claims", "Record final decisions"],
  },
  {
    name: "Reviewer",
    icon: "userCheck",
    can: ["Submit claims", "Record final decisions"],
    cannot: ["Approve reference documents"],
  },
  {
    name: "Creator",
    icon: "message",
    can: ["Submit claims", "Read evidence and decisions"],
    cannot: ["Record final decisions", "Approve reference documents"],
  },
];

/**
 * Visual walkthrough of the claim review process.
 * `current` is the zero-based step the user is on (earlier steps show as done).
 */
export default function ProcessGuide({ current = -1, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`${cardClass} cr-rise`} aria-labelledby="cr-process-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="cr-process-title" className="text-base font-semibold text-[var(--text)]">How claim review works</h2>
          <p className="mt-1 text-xs text-[var(--text-soft)]">Five steps from sign-in to a recorded, auditable decision.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="cr-process-body"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium text-[var(--text)] transition hover:border-[var(--accent-solid)]"
        >
          {open ? "Hide guide" : "Show guide"}
          <Icon name="chevronDown" size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div id="cr-process-body" className="mt-5">
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS_STEPS.map((step, index) => {
              const done = current > index;
              const active = current === index;
              return (
                <li
                  key={step.title}
                  className={`cr-step relative rounded-xl border p-4 ${active ? "cr-step-active border-[var(--accent-solid)] bg-[var(--accent-solid)]/5" : "border-[var(--border)]"}`}
                  style={{ animationDelay: `${index * 70}ms` }}
                  aria-current={active ? "step" : undefined}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${done ? "bg-emerald-500 text-white" : active ? "bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] text-white" : "bg-[var(--surface-2)] text-[var(--text-soft)]"}`}
                    >
                      <Icon name={done ? "check" : step.icon} size={17} />
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--text-soft)]">Step {index + 1}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-[var(--text)]">{step.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{step.text}</p>
                  <p className="mt-3"><Badge tone={active ? "accent" : "muted"}>{step.who}</Badge></p>
                  {index < PROCESS_STEPS.length - 1 && (
                    <Icon name="arrowRight" size={16} className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-[var(--surface)] text-[var(--text-soft)] lg:block" />
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="text-xs font-semibold text-[var(--text)]">What the three statuses mean</p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {STATUSES.map((status) => (
                <li key={status} className="flex items-start gap-2">
                  <StatusBadge status={status} />
                  <span className="text-xs leading-5 text-[var(--text-soft)]">{STATUS_META[status].meaning}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-[var(--text-soft)]">
              <Icon name="info" size={14} className="mt-0.5" />
              The AI status is only a suggestion. "Unverified" never means "false" - it means the approved sources do not cover the claim.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}