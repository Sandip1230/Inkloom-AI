import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CATEGORIES,
  GRANULARITIES,
  RANGES,
  buildTrend,
  categoryOf,
  countByCategory,
  filterByRange,
  formatReviewDate,
  niceScale,
  ratingFor,
  reviewBlurb,
  summarize,
} from "../lib/reviewInsights.js";
import "../styles/ReviewHistory.css";

/* ---------- icons (inline SVG, no extra dependency) ---------- */

function Svg({ children, size = 20, fill = "none", strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const Icons = {
  doc: (p) => (<Svg {...p}><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M9 8h6M9 12h6M9 16h3" /></Svg>),
  star: (p) => (<Svg {...p}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" /></Svg>),
  starSolid: (p) => (<Svg {...p} fill="currentColor" strokeWidth={1}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" /></Svg>),
  trend: (p) => (<Svg {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></Svg>),
  heart: (p) => (<Svg {...p} fill="currentColor" strokeWidth={1.5}><path d="M12 21s-7.5-4.6-9.4-9.2C1.2 8.4 3.2 4.8 6.7 4.8c2 0 3.6 1.1 4.5 2.7h1.6c.9-1.6 2.5-2.7 4.5-2.7 3.5 0 5.5 3.6 4.1 7C19.5 16.4 12 21 12 21Z" /></Svg>),
  calendar: (p) => (<Svg {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></Svg>),
  chevron: (p) => (<Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>),
  arrow: (p) => (<Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>),
  clock: (p) => (<Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>),
  bars: (p) => (<Svg {...p} strokeWidth={2.4}><path d="M5 20V12M12 20V4M19 20v-6" /></Svg>),
  layers: (p) => (<Svg {...p}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></Svg>),
  plus: (p) => (<Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>),
  check: (p) => (<Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>),
  instagram: (p) => (<Svg {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="0.8" fill="currentColor" /></Svg>),
  linkedin: (p) => (<Svg {...p} strokeWidth={2.4}><path d="M6 10v8M6 6.2v.1M11 18v-8M11 13.5c0-2 1.3-3.5 3.2-3.5S17.5 11.2 17.5 13.5V18" /></Svg>),
  facebook: (p) => (<Svg {...p} strokeWidth={2.4}><path d="M14.5 21v-8h2.7l.5-3.2h-3.2V7.9c0-1 .5-1.7 1.8-1.7h1.5V3.4c-.5-.1-1.5-.2-2.5-.2-2.6 0-4.3 1.6-4.3 4.4v2.2H8v3.2h2.8v8H14.5Z" /></Svg>),
  blog: (p) => (<Svg {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M8 9h8M8 12.5h8M8 16h4.5" /></Svg>),
  report: (p) => (<Svg {...p}><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 8h8M8 12h8M8 16h5" /></Svg>),
  others: (p) => (<Svg {...p} fill="currentColor" strokeWidth={0}><circle cx="8" cy="8" r="2.6" /><circle cx="16" cy="8" r="2.6" /><circle cx="8" cy="16" r="2.6" /><circle cx="16" cy="16" r="2.6" /></Svg>),
};

/* ---------- small pieces ---------- */

function RangeSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = RANGES.find((range) => range.id === value) || RANGES[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="rh-range" ref={ref}>
      <button type="button" className="rh-range__btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((state) => !state)}>
        <span className="rh-range__icon">{Icons.calendar({ size: 18 })}</span>
        <span className="rh-range__label">{current.label}</span>
        <span className={`rh-range__chev ${open ? "is-open" : ""}`}>{Icons.chevron({ size: 16 })}</span>
      </button>
      {open && (
        <div className="rh-range__menu" role="listbox" aria-label="Date range">
          {RANGES.map((range) => (
            <button
              key={range.id}
              type="button"
              role="option"
              aria-selected={range.id === value}
              className={`rh-range__opt ${range.id === value ? "is-active" : ""}`}
              onClick={() => {
                onChange(range.id);
                setOpen(false);
              }}
            >
              {range.label}
              {range.id === value && Icons.check({ size: 15 })}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ tone, icon, value, label }) {
  return (
    <div className={`rh-stat rh-stat--${tone}`}>
      <span className="rh-stat__icon">{icon}</span>
      <div className="rh-stat__text">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function Rating({ value }) {
  return (
    <span className="rh-rating" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      {Icons.starSolid({ size: 14 })}
      {value.toFixed(1)}
    </span>
  );
}

// orange -> pink across the bars, like the design
function barColor(index, count) {
  const t = count > 1 ? index / (count - 1) : 0;
  const from = [255, 168, 76];
  const to = [255, 62, 128];
  const mix = from.map((channel, i) => Math.round(channel + (to[i] - channel) * t));
  return `rgb(${mix.join(",")})`;
}

function TrendChart({ reviews }) {
  const [granularity, setGranularity] = useState("daily");
  const mode = GRANULARITIES.find((item) => item.id === granularity) || GRANULARITIES[0];
  const buckets = useMemo(() => buildTrend(reviews, granularity), [reviews, granularity]);
  const highest = Math.max(0, ...buckets.map((bucket) => bucket.count));
  const { top, ticks } = niceScale(highest);
  const peakIndex = highest > 0 ? buckets.findIndex((bucket) => bucket.count === highest) : -1;
  const summary = buckets.map((bucket) => `${bucket.label} ${bucket.count}`).join(", ");

  return (
    <section className="rh-card rh-trend" aria-labelledby="rh-trend-title">
      <div className="rh-trend__head">
        <div className="rh-head-text">
          <span className="rh-head-icon rh-head-icon--bars">{Icons.bars({ size: 22 })}</span>
          <div>
            <h2 id="rh-trend-title">Review Trend</h2>
            <p>{mode.blurb}</p>
          </div>
        </div>
        <div className="rh-seg" role="group" aria-label="Chart period">
          {GRANULARITIES.map((item) => (
            <button key={item.id} type="button" className={granularity === item.id ? "is-active" : ""} aria-pressed={granularity === item.id} onClick={() => setGranularity(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rh-chart" role="img" aria-label={`Reviews per ${mode.unit}: ${summary}`}>
        <div className="rh-chart__y" aria-hidden="true">
          {ticks.map((tick, index) => (
            <span key={tick} style={{ bottom: `${(index / (ticks.length - 1)) * 100}%` }}>{tick}</span>
          ))}
        </div>
        <div className="rh-chart__plot">
          {ticks.map((tick, index) => (
            <span key={tick} className="rh-chart__line" aria-hidden="true" style={{ bottom: `${(index / (ticks.length - 1)) * 100}%` }} />
          ))}
          <div className="rh-chart__cols">
            {buckets.map((bucket, index) => {
              const label = `${bucket.count} ${bucket.count === 1 ? "review" : "reviews"}`;
              return (
                <div key={bucket.key} className={`rh-col ${index === peakIndex ? "is-peak" : ""}`} tabIndex={0} title={`${bucket.full}: ${label}`}>
                  {bucket.count > 0 ? (
                    <span className="rh-bar" style={{ height: `${Math.max(4, (bucket.count / top) * 100)}%`, background: barColor(index, buckets.length) }}>
                      <span className="rh-bar__tip">{label}</span>
                    </span>
                  ) : (
                    <span className="rh-bar rh-bar--empty" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="rh-chart__x" aria-hidden="true">
          {buckets.map((bucket) => (
            <span key={bucket.key} className={bucket.isCurrent ? "is-current" : ""}>{bucket.label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecentReviews({ reviews, filterLabel, onClearFilter }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? reviews : reviews.slice(0, 5);

  return (
    <section className="rh-card rh-recent" aria-labelledby="rh-recent-title">
      <div className="rh-recent__head">
        <div className="rh-head-text">
          <span className="rh-head-icon rh-head-icon--ring">{Icons.clock({ size: 22 })}</span>
          <h2 id="rh-recent-title">Recent Reviews</h2>
        </div>
        {reviews.length > 5 && (
          <button type="button" className="rh-link" onClick={() => setExpanded((state) => !state)} aria-expanded={expanded}>
            {expanded ? "Show less" : "View All"}
            {Icons.arrow({ size: 16 })}
          </button>
        )}
      </div>

      {filterLabel && (
        <p className="rh-filter-note">
          Showing {filterLabel} only
          <button type="button" onClick={onClearFilter}>Clear</button>
        </p>
      )}

      {shown.length === 0 ? (
        <div className="rh-empty">
          <p>{filterLabel ? `No ${filterLabel} reviews in this period.` : "No reviews in this period yet."}</p>
          <Link to="/workflow">Start a review →</Link>
        </div>
      ) : (
        <ol className={`rh-timeline ${expanded ? "is-scroll" : ""}`}>
          {shown.map((review) => {
            const category = categoryOf(review.contentType);
            return (
              <li key={review.id} className="rh-timeline__item">
                <span className="rh-timeline__dot" aria-hidden="true" />
                <span className={`rh-tile rh-tile--${category}`}>{Icons[category]({ size: 22 })}</span>
                <div className="rh-timeline__body">
                  <h3>{review.contentType || "Content review"}</h3>
                  <time dateTime={new Date(review.updatedAt || 0).toISOString()}>{formatReviewDate(review.updatedAt)}</time>
                  <p>{reviewBlurb(review)}</p>
                </div>
                <Rating value={ratingFor(review)} />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function Categories({ counts, active, onSelect }) {
  const topId = CATEGORIES.reduce((best, category) => (counts[category.id] > counts[best] ? category.id : best), CATEGORIES[0].id);
  const highlight = active || (counts[topId] > 0 ? topId : null);

  return (
    <section className="rh-card rh-cats" aria-labelledby="rh-cats-title">
      <div className="rh-head-text">
        <span className="rh-head-icon rh-head-icon--layers">{Icons.layers({ size: 24 })}</span>
        <div>
          <h2 id="rh-cats-title">Review Categories</h2>
          <p>See what you&apos;ve been reviewing the most. Select one to filter.</p>
        </div>
      </div>
      <div className="rh-cats__grid">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`rh-cat ${highlight === category.id ? "is-active" : ""}`}
            aria-pressed={active === category.id}
            onClick={() => onSelect(active === category.id ? null : category.id)}
          >
            <span className={`rh-cat__circle rh-cat__circle--${category.id}`}>{Icons[category.id]({ size: 26 })}</span>
            <strong>{counts[category.id]}</strong>
            <span>{category.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}


function statusClass(status) {
  if (status === "Approved") return "is-approved";
  if (status === "Awaiting approval") return "is-awaiting";
  if (status === "Changes requested") return "is-changes";
  return "";
}

// The full record for every review in the period: decision, reviewer, comment
// and earlier versions. (Everything the old Review History page showed.)
function ReviewLog({ reviews, filterLabel }) {
  return (
    <section className="rh-card rh-log" aria-labelledby="rh-log-title">
      <div className="rh-head-text">
        <span className="rh-head-icon rh-head-icon--ring">{Icons.doc({ size: 22 })}</span>
        <div>
          <h2 id="rh-log-title">All Reviews</h2>
          <p>{reviews.length} {reviews.length === 1 ? "review" : "reviews"}{filterLabel ? ` · ${filterLabel}` : ""} · saved drafts, findings and human decisions</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="rh-log__empty">Nothing to show for this selection.</p>
      ) : (
        <div className="rh-log__list">
          {reviews.map((review) => {
            const category = categoryOf(review.contentType);
            const findings = review.findings?.length || 0;
            return (
              <article key={review.id} className="rh-entry">
                <span className={`rh-tile rh-tile--${category} rh-tile--sm`}>{Icons[category]({ size: 18 })}</span>
                <div className="rh-entry__main">
                  <div className="rh-entry__top">
                    <h3>{review.contentType || "Content review"}</h3>
                    <span className={`rh-status ${statusClass(review.status)}`}>{review.status || "Draft"}</span>
                    <span className="rh-entry__meta">{findings} {findings === 1 ? "finding" : "findings"}</span>
                    <Rating value={ratingFor(review)} />
                  </div>
                  <p className="rh-entry__content">{review.content}</p>
                  {(review.reviewer || review.comment) && (
                    <p className="rh-entry__note">
                      {review.reviewer ? `Reviewer: ${review.reviewer}` : ""}
                      {review.reviewer && review.comment ? " · " : ""}
                      {review.comment || ""}
                    </p>
                  )}
                  {review.revisionHistory?.length > 0 && (
                    <details className="rh-entry__versions">
                      <summary>{review.revisionHistory.length} previous {review.revisionHistory.length === 1 ? "version" : "versions"}</summary>
                      <ol>
                        {review.revisionHistory.map((revision, index) => (
                          <li key={`${review.id}-revision-${index}`}>
                            <p>Saved {new Date(revision.updatedAt).toLocaleString()} · {(revision.findings || []).length} findings</p>
                            <p>{revision.content}</p>
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}
                </div>
                <time className="rh-entry__time">{formatReviewDate(review.updatedAt)}</time>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ---------- the dashboard ---------- */

export default function ReviewHistoryDashboard({ reviews }) {
  const [rangeId, setRangeId] = useState("7");
  const [categoryId, setCategoryId] = useState(null);

  // Newest first - edited reviews keep their old position in storage.
  const sorted = useMemo(() => [...reviews].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)), [reviews]);
  const inRange = useMemo(() => filterByRange(sorted, rangeId), [sorted, rangeId]);
  const counts = useMemo(() => countByCategory(inRange), [inRange]);
  const visible = useMemo(
    () => (categoryId ? inRange.filter((review) => categoryOf(review.contentType) === categoryId) : inRange),
    [inRange, categoryId],
  );
  const stats = useMemo(() => summarize(inRange), [inRange]);
  const filterLabel = categoryId ? CATEGORIES.find((category) => category.id === categoryId)?.label : null;

  return (
    <div className="rh">
      <header className="rh-header fade-in">
        <div className="rh-header__title">
          <span className="rh-logo">{Icons.doc({ size: 26 })}</span>
          <div>
            <h1>Review History</h1>
            <p>Track your creative journey and see how you&apos;ve grown.</p>
          </div>
        </div>
        <div className="rh-header__actions">
          <Link to="/workflow" className="rh-new">
            {Icons.plus({ size: 16 })}
            New review
          </Link>
          <RangeSelect value={rangeId} onChange={setRangeId} />
        </div>
      </header>

      <div className="rh-stats">
        <StatCard tone="orange" icon={Icons.doc({ size: 26 })} value={stats.total} label="Total Reviews" />
        <StatCard tone="pink" icon={Icons.star({ size: 26 })} value={stats.positive} label="Positive Reviews" />
        <StatCard tone="orange" icon={Icons.trend({ size: 26 })} value={stats.suggestions} label="Suggestions" />
        <StatCard tone="pink" icon={Icons.heart({ size: 26 })} value={stats.average === null ? "—" : stats.average.toFixed(1)} label="Average Rating" />
      </div>

      <div className="rh-grid">
        <div className="rh-grid__left">
          <TrendChart reviews={sorted} />
          <Categories counts={counts} active={categoryId} onSelect={setCategoryId} />
        </div>
        <RecentReviews key={`${rangeId}-${categoryId}`} reviews={visible} filterLabel={filterLabel} onClearFilter={() => setCategoryId(null)} />
      </div>

      <ReviewLog reviews={visible} filterLabel={filterLabel} />
    </div>
  );
}