export const inputClass = "mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent-solid)] focus:outline-none";
export const cardClass = "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6";
export const primaryBtn = "rounded-lg bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50";
export const ghostBtn = "rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent-solid)] disabled:opacity-50";
export const smallBtn = "rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--text)] transition hover:border-[var(--accent-solid)] disabled:opacity-50";

export const STATUSES = ["Supported", "Contradicted", "Unverified"];

export const TONES = {
  danger: "border-rose-500/25 bg-rose-500/10 text-rose-600",
  warn: "border-amber-500/25 bg-amber-500/10 text-amber-600",
  ok: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700",
  muted: "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-soft)]",
  accent: "border-[var(--accent-solid)]/30 bg-[var(--accent-solid)]/10 text-[var(--accent-solid)]",
};

// Visual meaning of each status. All class names are written out in full so Tailwind can see them.
export const STATUS_META = {
  Supported: {
    tone: "ok",
    icon: "check",
    meaning: "Approved sources back this claim.",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    border: "border-l-emerald-500",
    panel: "border-emerald-500/30 bg-emerald-500/5",
    text: "text-emerald-700",
  },
  Contradicted: {
    tone: "danger",
    icon: "x",
    meaning: "Approved sources conflict with this claim.",
    bar: "bg-rose-500",
    dot: "bg-rose-500",
    border: "border-l-rose-500",
    panel: "border-rose-500/30 bg-rose-500/5",
    text: "text-rose-600",
  },
  Unverified: {
    tone: "warn",
    icon: "help",
    meaning: "Approved sources cannot confirm or deny it.",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    border: "border-l-amber-500",
    panel: "border-amber-500/30 bg-amber-500/5",
    text: "text-amber-600",
  },
};

const STATUS_TONE = { Supported: "ok", Contradicted: "danger", Unverified: "warn" };
const RELATION_TONE = { supports: "ok", contradicts: "danger", neutral: "muted", unassessed: "muted" };
const RELATION_LABEL = { supports: "Supports", contradicts: "Conflicts", neutral: "Related, not conclusive", unassessed: "Not assessed" };
const APPROVAL_TONE = { approved: "ok", pending: "warn", rejected: "danger" };

export function displayDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

// Small inline icon set (24x24, stroke based) so the page needs no extra dependency.
const ICON_PATHS = {
  login: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
  userPlus: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6",
  userCheck: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM16 11l2 2 4-4",
  building: "M3 21h18M5 21V7l7-4 7 4v14M9 9h2M13 9h2M9 13h2M13 13h2M10 21v-4h4v4",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8",
  message: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  arrowDown: "M12 5v14M19 12l-7 7-7-7",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  chevronDown: "M6 9l6 6 6-6",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.7 1.8L21.5 18.5l-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z",
};

export function Icon({ name, size = 18, className = "" }) {
  const path = ICON_PATHS[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d={path} />
    </svg>
  );
}

export function Badge({ tone = "muted", children, title }) {
  return (
    <span title={title} className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TONES[tone] || TONES.muted}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={STATUS_TONE[status] || "muted"} title={meta?.meaning}>
      {meta && <Icon name={meta.icon} size={11} className="mr-1" />}
      {status}
    </Badge>
  );
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
      <mark style={{ background: "transparent", color: "inherit", fontWeight: 600 }}>{excerpt.slice(index, index + quote.length)}</mark>
      {excerpt.slice(index + quote.length)}
    </>
  );
}