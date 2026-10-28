import { useMemo, useState } from "react";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";

function badge(status) {
  if (status === "Approved") return "bg-emerald-500/10 text-emerald-600";
  if (status === "Awaiting approval") return "bg-sky-500/10 text-sky-600";
  if (status === "Changes requested") return "bg-amber-500/10 text-amber-600";
  return "bg-[var(--surface-2)] text-[var(--text-soft)]";
}

export default function TeamDrafts({ store, activeId, onOpen }) {
  const { userId } = useWorkspace();
  const [mine, setMine] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const visible = useMemo(() => {
    const list = mine
      ? store.reviews.filter((review) => review.assignees.some((item) => item.id === userId))
      : store.reviews;
    return showAll ? list : list.slice(0, 5);
  }, [store.reviews, mine, showAll, userId]);

  return (
    <section className="mt-4 rounded-xl border border-[var(--border)] p-4" aria-labelledby="team-drafts-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="team-drafts-title" className="text-sm font-semibold text-[var(--text)]">Team drafts</h3>
        <label className="flex items-center gap-2 text-xs text-[var(--text-soft)]">
          <input type="checkbox" checked={mine} onChange={(event) => setMine(event.target.checked)} />
          Assigned to me
        </label>
      </div>

      {store.error && <p role="alert" className="mt-2 text-xs text-red-500">{store.error}</p>}
      {store.loading && <p className="mt-2 text-xs text-[var(--text-soft)]">Loading team drafts…</p>}
      {!store.loading && !visible.length && (
        <p className="mt-2 text-xs text-[var(--text-soft)]">No drafts yet. Run a review and it will appear here for your team.</p>
      )}

      <ul className="mt-3 space-y-2">
        {visible.map((review) => (
          <li
            key={review.id}
            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${
              review.id === activeId ? "border-[var(--accent-solid)]" : "border-[var(--border)]"
            }`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-[var(--text)]">{review.content.slice(0, 80)}</p>
              <p className="mt-0.5 text-[11px] text-[var(--text-soft)]">
                {review.contentType} · {review.createdBy.name} ·{" "}
                {new Date(review.updatedAt).toLocaleDateString()}
                {review.assignees.length > 0 && ` · reviewers: ${review.assignees.map((item) => item.name).join(", ")}`}
                {review.comments.length > 0 && ` · ${review.comments.length} comment${review.comments.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${badge(review.status)}`}>{review.status}</span>
              <button
                type="button"
                onClick={() => onOpen(review)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:border-[var(--accent-solid)]"
              >
                Open
              </button>
            </div>
          </li>
        ))}
      </ul>

      {store.reviews.length > 5 && (
        <button type="button" onClick={() => setShowAll((state) => !state)} className="mt-3 text-xs font-semibold text-[var(--accent-solid)]">
          {showAll ? "Show fewer" : "Show all"}
        </button>
      )}
    </section>
  );
}