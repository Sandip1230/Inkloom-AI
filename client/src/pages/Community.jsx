import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { listReviews } from "../lib/reviewStore.js";

export default function Community() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    setReviews(listReviews());
  }, []);

  const stats = useMemo(() => {
    const categories = {};
    for (const review of reviews) {
      for (const finding of review.findings || []) {
        categories[finding.category] = (categories[finding.category] || 0) + 1;
      }
    }
    return Object.entries(categories).sort((a, b) => b[1] - a[1]);
  }, [reviews]);

  const approved = reviews.filter((review) => review.status === "Approved").length;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-solid)]">Governance insights</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">Learn from your reviews</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">A local snapshot of recurring checks and review activity in this browser.</p>

        {reviews.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
            <p className="text-sm text-[var(--text-soft)]">Insights appear after you review and save content.</p>
            <Link to="/workflow" className="mt-4 inline-block text-sm font-medium text-[var(--accent-solid)]">Start a review →</Link>
          </div>
        ) : (
          <>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <Metric label="Saved reviews" value={reviews.length} />
              <Metric label="Approved by a person" value={approved} />
              <Metric label="Findings recorded" value={stats.reduce((sum, [, count]) => sum + count, 0)} />
            </div>
            <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-[var(--text)]">Most frequent review signals</h2>
              {stats.length ? (
                <ul className="mt-4 space-y-3">
                  {stats.map(([category, count]) => (
                    <li key={category} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 text-xs text-[var(--text-soft)]">{category}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
                        <span className="block h-full rounded-full bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)]" style={{ width: `${Math.max(8, Math.round((count / stats[0][1]) * 100))}%` }} />
                      </span>
                      <span className="w-8 text-right text-xs font-semibold text-[var(--text)]">{count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-[var(--text-soft)]">No findings were recorded in your saved reviews.</p>
              )}
              <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--text-soft)]">
                Repeated findings can point to training needs or guidelines that need clarification. These counts are local to this browser and are not a team-wide analytics report.
              </p>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-2xl font-semibold text-[var(--text)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-soft)]">{label}</p>
    </div>
  );
}
