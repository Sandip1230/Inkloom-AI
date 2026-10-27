import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { listReviews } from "../lib/reviewStore.js";
import { PageHero, TpIcon } from "../components/ThemeIcons.jsx";
import "../styles/ThemePages.css";

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
        <PageHero
          icon="bulb"
          eyebrow="Governance insights"
          title="Learn from your reviews"
          text="A local snapshot of recurring checks and review activity in this browser."
        />

        {reviews.length === 0 ? (
          <div className="scale-in mt-8 tp-empty px-6 py-16 text-center">
            <p className="text-sm text-[var(--text-soft)]">Insights appear after you review and save content.</p>
            <Link to="/workflow" className="tp-btn mt-4 inline-flex">Start a review →</Link>
          </div>
        ) : (
          <>
            <div className="stagger mt-7 grid gap-4 sm:grid-cols-3">
              <Metric icon="history" label="Saved reviews" value={reviews.length} />
              <Metric icon="check" alt label="Approved by a person" value={approved} />
              <Metric icon="target" label="Findings recorded" value={stats.reduce((sum, [, count]) => sum + count, 0)} />
            </div>
            <section className="scale-in mt-6 tp-card p-5 sm:p-6">
              <div className="tp-head"><span className="tp-head__icon"><TpIcon name="chart" size={20} /></span><h2 className="text-base font-bold text-[var(--text)]">Most frequent review signals</h2></div>
              {stats.length ? (
                <ul className="stagger mt-4 space-y-3">
                  {stats.map(([category, count]) => (
                    <li key={category} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 text-xs text-[var(--text-soft)]">{category}</span>
                      <span className="tp-track h-2 flex-1">
                        <span
                          className="tp-fill"
                          style={{
                            width: `${Math.max(8, Math.round((count / stats[0][1]) * 100))}%`,
                            transformOrigin: "left",
                            animation: "grow-x 0.9s var(--ease-out) backwards",
                          }}
                        />
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

function Metric({ label, value, icon, alt }) {
  return (
    <div className={`tp-stat ${alt ? "tp-stat--alt" : ""}`}>
      <span className="tp-stat__icon"><TpIcon name={icon} size={22} /></span>
      <div className="tp-stat__text">
        <strong className="tp-stat__value">{value}</strong>
        <span className="tp-stat__label">{label}</span>
      </div>
    </div>
  );
}