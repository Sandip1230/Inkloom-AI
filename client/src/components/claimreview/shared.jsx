export const inputClass = "mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent-solid)] focus:outline-none";
export const cardClass = "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6";
export const primaryBtn = "rounded-lg bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50";
export const ghostBtn = "rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:border-[var(--accent-solid)] disabled:opacity-50";
export const smallBtn = "rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text)] hover:border-[var(--accent-solid)] disabled:opacity-50";

export const STATUSES = ["Supported", "Contradicted", "Unverified"];

export const TONES = {
  danger: "border-rose-500/25 bg-rose-500/10 text-rose-600",
  warn: "border-amber-500/25 bg-amber-500/10 text-amber-600",
  ok: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700",
  muted: "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-soft)]",
  accent: "border-[var(--accent-solid)]/30 bg-[var(--accent-solid)]/10 text-[var(--accent-solid)]",
};

const STATUS_TONE = { Supported: "ok", Contradicted: "danger", Unverified: "warn" };
const RELATION_TONE = { supports: "ok", contradicts: "danger", neutral: "muted", unassessed: "muted" };
const RELATION_LABEL = { supports: "Supports", contradicts: "Conflicts", neutral: "Related, not conclusive", unassessed: "Not assessed" };
const APPROVAL_TONE = { approved: "ok", pending: "warn", rejected: "danger" };

export function displayDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function Badge({ tone = "muted", children, title }) {
  return (
    <span title={title} className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TONES[tone] || TONES.muted}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONE[status] || "muted"}>{status}</Badge>;
}

export function RelationBadge({ relation }) {
  return <Badge tone={RELATION_TONE[relation] || "muted"}>{RELATION_LABEL[relation] || relation}</Badge>;
}

export function ApprovalBadge({ status }) {
  return <Badge tone={APPROVAL_TONE[status] || "muted"}>{status ? status[0].toUpperCase() + status.slice(1) : "Pending"}</Badge>;
}

export function ErrorNote({ message }) {
  if (!message) return null;
  return <p role="alert" className="rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-sm text-rose-600">{message}</p>;
}

export function EmptyNote({ children }) {
  return <p className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-soft)]">{children}</p>;
}

// Renders an excerpt with the model's quoted words highlighted (when they really occur in it).
export function HighlightedExcerpt({ excerpt, quote }) {
  const index = quote ? excerpt.toLowerCase().indexOf(quote.toLowerCase()) : -1;
  if (index < 0) return <>{excerpt}</>;
  return (
    <>
      {excerpt.slice(0, index)}
      <mark className="rounded bg-[var(--accent-solid)]/20 px-0.5 text-[var(--text)]">{excerpt.slice(index, index + quote.length)}</mark>
      {excerpt.slice(index + quote.length)}
    </>
  );
}