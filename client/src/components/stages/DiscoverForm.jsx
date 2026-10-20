import { useState } from "react";
import { useBrand } from "../../context/BrandContext.jsx";
import { TEMPLATES } from "../../lib/templates.js";
import { consumeDraftBrief } from "../../lib/draftBrief.js";

const ICON_TONE = {
  "grad-cap": "bg-blue-500/10 text-blue-500",
  home: "bg-sky-500/10 text-sky-500",
  dumbbell: "bg-indigo-500/10 text-indigo-500",
  leaf: "bg-emerald-500/10 text-emerald-500",
  gamepad: "bg-violet-500/10 text-violet-500",
  play: "bg-pink-500/10 text-pink-500",
};

function TemplateIcon({ name }) {
  const common = {
    width: 17,
    height: 17,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (name) {
    case "grad-cap":
      return (
        <svg {...common}>
          <path d="m2 8 10-4 10 4-10 4-10-4Zm4 2v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="m3 11 9-7 9 7" />
          <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
        </svg>
      );
    case "dumbbell":
      return (
        <svg {...common}>
          <path d="M6.5 8v8M17.5 8v8M2.5 10.5v3M21.5 10.5v3M6.5 12h11" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path d="M20 4C10 4 4 10 4 18c8 0 14-6 14-14Z" />
          <path d="M9 19c1-4 4-8 9-11" />
        </svg>
      );
    case "gamepad":
      return (
        <svg {...common}>
          <rect x="2.5" y="7" width="19" height="10" rx="5" />
          <path d="M7 10v4M5 12h4M15.5 11h.01M18 13h.01" />
        </svg>
      );
    case "play":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m10 9 5 3-5 3V9Z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function DiscoverForm() {
  const { brand, submitBrief, pendingStage, stageErrors, advance } = useBrand();
  const [brief, setBrief] = useState(() => brand.brief || consumeDraftBrief());
  const [showForm, setShowForm] = useState(!brand.stageOutputs.understand);
  const submitting = pendingStage === "understand";
  const error = stageErrors.understand;
  const output = brand.stageOutputs.understand;

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await submitBrief(brief.trim());
      setShowForm(false);
    } catch {
      // error is already captured in stageErrors — nothing else to do here
    }
  }

  if (!showForm && output) {
    return (
      <section>
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
              Step 1 of 6
            </span>
            <h2 className="mt-1.5 text-xl font-semibold text-[var(--text)]">
              Understanding your idea
            </h2>
            <p className="mt-1 text-sm text-[var(--text-soft)]">
              Here's what we understood from your input. You can edit or refine it.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-soft)] transition-colors hover:border-[var(--accent-solid)] hover:text-[var(--text)]"
          >
            Edit
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoCard label="Your Idea" body={brand.brief} />
          <InfoCard label="Target Audience" body={output.audience} />
          <InfoCard label="Core Problem" body={output.problem} />
          <InfoCard label="Constraints" list={output.constraints} />
        </div>

        {output.openQuestions?.length > 0 && (
          <div className="mt-3">
            <InfoCard label="Open Questions" list={output.openQuestions} />
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => advance("understand")}
            className="rounded-lg bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Looks good, Continue →
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--accent-solid)]">
        Step 1 of 6
      </span>
      <h2 className="mt-1.5 text-xl font-bold text-[var(--text)]">Let's start with your idea</h2>
      <p className="mt-1 text-sm text-[var(--text-soft)]">
        Tell us about your product, startup, community or creator idea. Don't worry if it's rough — we'll help you shape it.
      </p>

      <textarea
        id="brand-brief"
        value={brief}
        onChange={(event) => setBrief(event.target.value.slice(0, 500))}
        required
        rows={3}
        maxLength={500}
        placeholder="e.g. I want to create an app that helps students find teammates for college projects…"
        className="mt-4 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent-solid)] focus:outline-none"
      />
      <p className="mt-1 text-right text-xs text-[var(--text-soft)]">{brief.length}/500</p>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--text-soft)]">✨ Example ideas</p>
        <button
          type="button"
          onClick={() => setBrief("")}
          className="flex items-center gap-1 text-[11px] text-[var(--text-soft)] transition-colors hover:text-[var(--text)]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Try another
        </button>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setBrief(template.brief)}
            className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-left transition-colors hover:border-[var(--accent-solid)]"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ICON_TONE[template.icon] || "bg-[var(--surface-2)] text-[var(--accent-solid)]"}`}>
              <TemplateIcon name={template.icon} />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-xs font-medium text-[var(--text)]">{template.title}</span>
              <span className="block truncate text-[11px] text-[var(--text-soft)]">{template.subtitle}</span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-[var(--text-soft)]">→</span>
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-500">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={submitting || !brief.trim()}
          className="rounded-lg bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] px-6 py-2.5 text-sm font-medium text-white shadow-[0_8px_20px_-6px_var(--accent-solid)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Working…" : "Continue →"}
        </button>
      </div>
    </form>
  );
}

function InfoCard({ label, body, list }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-5 py-4">
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--accent-solid)]">{label}</span>
      {body && <p className="mt-2 text-sm text-[var(--text)]">{body}</p>}
      {list && (
        <ul className="mt-2 space-y-1">
          {list.map((item, index) => (
            <li key={`${item}-${index}`} className="text-sm text-[var(--text)]">
              • {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}