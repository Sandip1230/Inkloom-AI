import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import BranchingReviewSummary from "../components/BranchingReviewSummary.jsx";
import ParticleTitle from "../components/ParticleTitle.jsx";
import { applySuggestion, reviewContent } from "../lib/governance.js";
import { createReviewId, getGuidelines, listReviews, saveReview } from "../lib/reviewStore.js";

const CONTENT_TYPES = ["Web page", "Email", "Social post", "Advertisement", "Other"];

function statusStyle(status) {
  if (status === "Approved") return "bg-emerald-500/10 text-emerald-600";
  if (status === "Awaiting approval") return "bg-sky-500/10 text-sky-600";
  if (status === "Changes requested") return "bg-amber-500/10 text-amber-600";
  return "bg-[var(--surface-2)] text-[var(--text-soft)]";
}

export default function Workflow() {
  const [guidelines, setGuidelines] = useState(() => getGuidelines());
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [findings, setFindings] = useState([]);
  const [reviewId, setReviewId] = useState(null);
  const [status, setStatus] = useState("Draft");
  const [reviewer, setReviewer] = useState("");
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem("inkloom-guidelines", JSON.stringify(guidelines));
      setReviewError("");
    } catch (error) {
      setReviewError(`Could not save guidelines in this browser: ${error.message}`);
    }
  }, [guidelines]);

  const issueCount = findings.length;
  const categoryCount = useMemo(
    () => new Set(findings.map((finding) => finding.category)).size,
    [findings],
  );
  const savedReviews = useMemo(
    () => listReviews(),
    [reviewed, status, findings],
  );
  const activity = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const count = savedReviews.filter(
        (review) => new Date(review.updatedAt).toDateString() === date.toDateString(),
      ).length;
      return {
        label: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date),
        count,
      };
    });
  }, [savedReviews]);
  const outstandingReviews = savedReviews.filter(
    (review) => review.status === "Draft" || review.status === "Awaiting approval",
  ).length;
  const approvedReviews = savedReviews.filter((review) => review.status === "Approved").length;
  const savedFindingCount = savedReviews.reduce((total, review) => total + (review.findings?.length || 0), 0);
  const visibleFindings = activeCategory
    ? findings.filter((finding) => (
      activeCategory === "Brand voice"
        ? ["Terminology", "Tone"].includes(finding.category)
        : activeCategory === "Claims"
          ? finding.category === "Promotional claim"
          : finding.category === "Accessibility"
    ))
    : findings;

  function handleReview(event) {
    event.preventDefault();
    const results = reviewContent(content, guidelines);
    const id = reviewId || createReviewId();
    setFindings(results);
    setReviewId(id);
    setStatus("Draft");
    setReviewed(true);
    setActiveCategory(null);
    try {
      saveReview({
        id,
        content,
        contentType,
        findings: results,
        status: "Draft",
        reviewer,
        comment,
        guidelineSnapshot: guidelines,
      });
      setReviewError("");
    } catch (error) {
      setReviewError(`Review ran, but could not be saved in this browser: ${error.message}`);
    }
  }

  function updateDecision(nextStatus) {
    if (!reviewId) return;
    try {
      saveReview({
        id: reviewId,
        content,
        contentType,
        findings,
        status: nextStatus,
        reviewer,
        comment,
        guidelineSnapshot: guidelines,
      });
      setStatus(nextStatus);
      setReviewError("");
    } catch (error) {
      setReviewError(`Could not save the review decision: ${error.message}`);
    }
  }

  function acceptSuggestion(finding) {
    const updatedContent = applySuggestion(content, finding);
    if (updatedContent === content) return;
    setContent(updatedContent);
    const updatedFindings = reviewContent(updatedContent, guidelines);
    setFindings(updatedFindings);
    setStatus("Draft");
    if (reviewId) {
      try {
        saveReview({
          id: reviewId,
          content: updatedContent,
          contentType,
          findings: updatedFindings,
          status: "Draft",
          reviewer,
          comment,
          guidelineSnapshot: guidelines,
        });
        setReviewError("");
      } catch (error) {
        setReviewError(`Could not save the updated draft: ${error.message}`);
      }
    }
  }

  return (
    <AppShell>
      <div className="inkloom-dashboard-scroll h-full overflow-y-auto">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 xl:px-9">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-solid)]">
                Inkloom AI <span className="mx-1 text-[var(--text-soft)]">/</span> Workspace overview
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
                <ParticleTitle>Every draft, in good hands.</ParticleTitle>
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
                Review the details. Keep your brand consistent. Leave the final call to people.
              </p>
            </div>
            <Link to="/projects" className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--accent-solid)]">
              All reviews <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <DashboardMetric label="Saved reviews" value={savedReviews.length} tone="violet" />
            <DashboardMetric label="Awaiting attention" value={outstandingReviews} tone="amber" />
            <DashboardMetric label="Approved by a person" value={approvedReviews} tone="green" />
            <DashboardMetric label="Findings to review" value={savedFindingCount} tone="blue" />
          </div>

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(260px,0.75fr)]">
            <div className="dashboard-panel px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text)]">Review activity</h2>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">Saved review updates · Last 7 days</p>
                </div>
                <span className="dashboard-chart-key"><span /> reviews / day</span>
              </div>
              <div className="review-activity-chart" role="img" aria-label={`Review updates over seven days: ${activity.map((day) => `${day.label} ${day.count}`).join(", ")}`}>
                {activity.map((day, index) => (
                  <div key={`${day.label}-${index}`} className="review-activity-chart__day">
                    <span className="review-activity-chart__value">{day.count || ""}</span>
                    <span className="review-activity-chart__track">
                      <span style={{ height: `${day.count ? Math.max(12, Math.round((day.count / Math.max(1, ...activity.map((item) => item.count))) * 100)) : 3}%` }} />
                    </span>
                    <span className="review-activity-chart__label">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="dashboard-panel dashboard-next-step px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text)]">Keep your review moving</h2>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">A clear next step for this workspace</p>
                </div>
                <span className="dashboard-next-step__icon" aria-hidden="true">✦</span>
              </div>
              <p className="mt-4 text-sm leading-5 text-[var(--text)]">Run a draft through your approved terminology and content checks.</p>
              <a href="#new-review" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-solid)] hover:underline">
                Start a new review <span aria-hidden="true">→</span>
              </a>
              <p className="mt-4 border-t border-[var(--border)] pt-3 text-[11px] leading-4 text-[var(--text-soft)]">
                Checks are local prototype signals, not a factual or legal clearance.
              </p>
            </div>
          </section>

          <div id="new-review" className="mt-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent-solid)]">Review workspace</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--text)]">Start a content review</h2>
            </div>
            {savedReviews.length > 0 && <p className="text-xs text-[var(--text-soft)]">{outstandingReviews} item{outstandingReviews === 1 ? "" : "s"} need attention</p>}
          </div>

          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(270px,0.8fr)]">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-6">
            <form onSubmit={handleReview}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <label className="block text-sm font-semibold text-[var(--text)]" htmlFor="content-type">
                  Content to review
                  <span className="mt-1 block text-xs font-normal text-[var(--text-soft)]">
                    Paste text from your draft. Your content stays in this browser.
                  </span>
                </label>
                <select
                  id="content-type"
                  value={contentType}
                  onChange={(event) => setContentType(event.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)]"
                >
                  {CONTENT_TYPES.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
              <textarea
                id="review-content"
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                  setReviewed(false);
                }}
                required
                rows={12}
                maxLength={12000}
                placeholder="Paste a campaign draft, product description, email, or social post…"
                className="mt-4 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm leading-6 text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent-solid)] focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-[var(--text-soft)]">{content.length.toLocaleString()} / 12,000 characters</p>
                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="rounded-lg bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Review content
                </button>
              </div>
            </form>

            {reviewed && (
              <div aria-live="polite" className="mt-6 border-t border-[var(--border)] pt-5">
                {reviewError && <p role="alert" className="mb-4 rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-xs text-rose-600">{reviewError}</p>}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                      {issueCount ? `${issueCount} finding${issueCount === 1 ? "" : "s"} to review` : "No issues detected"}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">
                      {issueCount ? `Across ${categoryCount} ${categoryCount === 1 ? "category" : "categories"}. Review each finding before deciding.` : "Automated checks found no matches. A human reviewer should still verify the draft."}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle(status)}`}>{status}</span>
                </div>

                {findings.length > 0 ? (
                  <>
                    <BranchingReviewSummary
                      findings={findings}
                      activeCategory={activeCategory}
                      onSelect={setActiveCategory}
                    />
                    {activeCategory && <p className="mt-4 text-xs text-[var(--text-soft)]">Showing {visibleFindings.length} findings in {activeCategory}. <button type="button" onClick={() => setActiveCategory(null)} className="font-semibold text-[var(--accent-solid)] hover:underline">Show all</button></p>}
                    <ul className="mt-4 space-y-3">
                      {visibleFindings.map((finding) => (
                      <li key={finding.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-soft)]">{finding.category}</span>
                            <span className="text-xs font-medium text-amber-600">{finding.severity}</span>
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-[var(--text)]">“{finding.excerpt}”</p>
                        <p className="mt-1.5 text-sm leading-5 text-[var(--text-soft)]">{finding.explanation}</p>
                        <p className="mt-2 text-xs text-[var(--accent-solid)]">Guideline: {finding.source}</p>
                        <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Suggested next step</p>
                          <p className="mt-1 text-sm text-[var(--text)]">{finding.suggestion}</p>
                          {finding.replacement && finding.category === "Terminology" && (
                            <button type="button" onClick={() => acceptSuggestion(finding)} className="mt-2 text-xs font-semibold text-emerald-700 hover:underline">
                              Apply wording suggestion
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  </>
                ) : (
                  <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-[var(--text)]">
                    No configured checks were triggered. This is not a guarantee that the content is accurate or compliant.
                  </div>
                )}

                <div className="mt-5 rounded-xl border border-[var(--border)] p-4">
                  <h3 className="text-sm font-semibold text-[var(--text)]">Human review</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-medium text-[var(--text-soft)]">
                      Reviewer
                      <input value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="Name (optional)" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" />
                    </label>
                    <label className="text-xs font-medium text-[var(--text-soft)]">
                      Review note
                      <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Context or decision rationale" className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" />
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => updateDecision("Awaiting approval")} disabled={!reviewId} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)] hover:border-[var(--accent-solid)] disabled:opacity-50">Request approval</button>
                    <button type="button" onClick={() => updateDecision("Changes requested")} disabled={!reviewId} className="rounded-lg border border-amber-500/30 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-500/5 disabled:opacity-50">Request changes</button>
                    <button type="button" onClick={() => updateDecision("Approved")} disabled={!reviewId} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Approve draft</button>
                  </div>
                  <p className="mt-3 text-[11px] leading-4 text-[var(--text-soft)]">
                    Approval is a human decision. Inkloom’s automated checks do not publish content or replace legal, factual, or brand-owner review.
                  </p>
                </div>
              </div>
            )}
          </section>

            <aside className="space-y-4">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text)]">Your terminology rules</h2>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">One substitution per line, written as “old term → approved term”.</p>
                </div>
                <Link to="/brand-kits" className="shrink-0 text-xs font-medium text-[var(--accent-solid)] hover:underline">Manage</Link>
              </div>
              <textarea
                value={guidelines.preferredTerms || ""}
                onChange={(event) => setGuidelines((current) => ({ ...current, preferredTerms: event.target.value }))}
                rows={5}
                placeholder={"users → customers\ncheap → accessible"}
                className="mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-xs leading-5 text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent-solid)] focus:outline-none"
              />
              <p className="mt-2 text-[11px] leading-4 text-[var(--text-soft)]">Saved in this browser only. Add verified source material to your internal review before relying on any claim.</p>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h2 className="text-sm font-semibold text-[var(--text)]">What gets checked</h2>
              <ul className="mt-3 space-y-2.5 text-xs text-[var(--text-soft)]">
                {["Unsupported absolute or comparative claims", "Approved terminology substitutions", "Descriptive link text and long sentences", "Repeated all-caps language and tone"].map((item) => (
                  <li key={item} className="flex gap-2"><span className="text-[var(--accent-solid)]">✓</span>{item}</li>
                ))}
              </ul>
              <p className="mt-4 border-t border-[var(--border)] pt-3 text-[11px] leading-4 text-[var(--text-soft)]">
                Current prototype reviews text with local rules. Image, document and external-source verification are not yet enabled.
              </p>
            </section>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function DashboardMetric({ label, value, tone }) {
  return (
    <div className={`dashboard-metric dashboard-metric--${tone}`}>
      <span className="dashboard-metric__mark" aria-hidden="true" />
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-[var(--text-soft)]">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text)]">{value}</p>
      </div>
      <span className="dashboard-metric__spark" aria-hidden="true">⌁</span>
    </div>
  );
}
