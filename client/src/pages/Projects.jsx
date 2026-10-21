import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { listReviews } from "../lib/reviewStore.js";

function badgeClass(status) {
  if (status === "Approved") return "bg-emerald-500/10 text-emerald-700";
  if (status === "Awaiting approval") return "bg-sky-500/10 text-sky-700";
  if (status === "Changes requested") return "bg-amber-500/10 text-amber-700";
  return "bg-[var(--surface-2)] text-[var(--text-soft)]";
}

export default function Projects() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    setReviews(listReviews());
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="fade-in flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">Review history</h1>
            <p className="mt-1 text-sm text-[var(--text-soft)]">Saved drafts, findings and human decisions from this browser.</p>
          </div>
          <Link to="/workflow" className="rounded-lg bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] px-4 py-2.5 text-sm font-medium text-white">
            + New review
          </Link>
        </div>

        {reviews.length === 0 ? (
          <div className="scale-in mt-8 rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
            <p className="text-sm text-[var(--text-soft)]">No reviews saved yet. Start with a draft to build your review history.</p>
            <Link to="/workflow" className="mt-4 inline-block text-sm font-medium text-[var(--accent-solid)]">Review content →</Link>
          </div>
        ) : (
          <div className="stagger mt-8 space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text)]">{review.contentType || "Content review"}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${badgeClass(review.status)}`}>{review.status || "Draft"}</span>
                      <span className="text-xs text-[var(--text-soft)]">{review.findings?.length || 0} findings</span>
                    </div>
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-5 text-[var(--text-soft)]">{review.content}</p>
                  </div>
                  <time className="shrink-0 text-xs text-[var(--text-soft)]">
                    {new Date(review.updatedAt).toLocaleString()}
                  </time>
                </div>
                {(review.reviewer || review.comment) && (
                  <p className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-soft)]">
                    {review.reviewer ? `Reviewer: ${review.reviewer}` : ""}{review.reviewer && review.comment ? " · " : ""}{review.comment || ""}
                  </p>
                )}
                {review.revisionHistory?.length > 0 && (
                  <details className="mt-3 border-t border-[var(--border)] pt-3">
                    <summary className="cursor-pointer text-xs font-medium text-[var(--accent-solid)]">
                      {review.revisionHistory.length} previous {review.revisionHistory.length === 1 ? "version" : "versions"}
                    </summary>
                    <ol className="mt-3 space-y-3">
                      {review.revisionHistory.map((revision, index) => (
                        <li key={`${review.id}-revision-${index}`} className="rounded-lg bg-[var(--bg)] p-3">
                          <p className="text-[10px] text-[var(--text-soft)]">Saved {new Date(revision.updatedAt).toLocaleString()} · {revision.findings.length} findings</p>
                          <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[var(--text)]">{revision.content}</p>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}