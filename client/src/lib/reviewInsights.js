// Pure helpers that turn saved reviews (see reviewStore.js) into the numbers
// shown on the Review History dashboard. No React, no browser APIs - so they
// are easy to unit test.

export const RANGES = [
  { id: "7", label: "Last 7 Days", days: 7 },
  { id: "30", label: "Last 30 Days", days: 30 },
  { id: "90", label: "Last 90 Days", days: 90 },
  { id: "all", label: "All Time", days: null },
];

export const GRANULARITIES = [
  { id: "daily", label: "Daily", unit: "day", blurb: "A quick view of your daily review activity." },
  { id: "weekly", label: "Weekly", unit: "week", blurb: "Review activity over the last 6 weeks." },
  { id: "monthly", label: "Monthly", unit: "month", blurb: "Review activity over the last 6 months." },
];

export const CATEGORIES = [
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
  { id: "blog", label: "Blog" },
  { id: "report", label: "Report" },
  { id: "others", label: "Others" },
];

// Maps the free-text "content type" saved with a review to one of the six tiles.
export function categoryOf(contentType) {
  const text = String(contentType || "").toLowerCase();
  if (text.includes("instagram")) return "instagram";
  if (text.includes("linkedin")) return "linkedin";
  if (text.includes("facebook")) return "facebook";
  if (text.includes("blog")) return "blog";
  if (text.includes("report")) return "report";
  return "others";
}

// Reviews are not rated by a person, so a score out of 5 is derived from the
// checks: a clean review scores 5.0 and every finding takes 0.4 off (min 1.0).
export function ratingFor(review) {
  const findings = Array.isArray(review?.findings) ? review.findings.length : 0;
  return Math.max(1, Math.round((5 - findings * 0.4) * 10) / 10);
}

export function isPositive(review) {
  return ratingFor(review) >= 4;
}

export function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Keeps reviews saved inside the chosen range (today counts as day 1).
export function filterByRange(reviews, rangeId, now = Date.now()) {
  const range = RANGES.find((item) => item.id === rangeId) || RANGES[0];
  if (!range.days) return reviews;
  const cutoff = startOfDay(now);
  cutoff.setDate(cutoff.getDate() - (range.days - 1));
  return reviews.filter((review) => (review.updatedAt || 0) >= cutoff.getTime());
}

export function summarize(reviews) {
  const total = reviews.length;
  const positive = reviews.filter(isPositive).length;
  const suggestions = reviews.reduce(
    (sum, review) => sum + (review.findings || []).filter((finding) => finding?.suggestion).length,
    0,
  );
  const average = total
    ? Math.round((reviews.reduce((sum, review) => sum + ratingFor(review), 0) / total) * 10) / 10
    : null;
  return { total, positive, suggestions, average };
}

export function countByCategory(reviews) {
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category.id, 0]));
  reviews.forEach((review) => {
    counts[categoryOf(review.contentType)] += 1;
  });
  return counts;
}

// Chooses a tidy y-axis step (1, 2, 5, 10, 20, 50 ...) so the scale reads
// 0, 2, 4, 6, 8 like the design. Always 4 intervals.
export function niceScale(highest, intervals = 4) {
  const raw = Math.max(1, highest / intervals);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  // 2.5 only for tens and up, so small counts never get fractional ticks.
  const factors = magnitude >= 10 ? [1, 2, 2.5, 5, 10] : [1, 2, 5, 10];
  const step = factors.map((factor) => factor * magnitude).find((value) => value >= raw) || magnitude * 10;
  return { step, top: step * intervals, ticks: Array.from({ length: intervals + 1 }, (_, index) => index * step) };
}

function fmt(date, options) {
  return new Intl.DateTimeFormat("en-GB", options).format(date);
}

// Buckets for the Review Trend chart, oldest -> newest.
export function buildTrend(reviews, granularity, now = Date.now()) {
  const today = startOfDay(now);
  const buckets = [];

  if (granularity === "monthly") {
    for (let offset = 5; offset >= 0; offset -= 1) {
      const start = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const end = new Date(today.getFullYear(), today.getMonth() - offset + 1, 1);
      buckets.push({
        start,
        end,
        label: fmt(start, { month: "short" }),
        full: fmt(start, { month: "long", year: "numeric" }),
      });
    }
  } else if (granularity === "weekly") {
    for (let offset = 5; offset >= 0; offset -= 1) {
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset * 7 + 1);
      const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 7);
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
      buckets.push({
        start,
        end,
        label: fmt(start, { day: "numeric", month: "short" }),
        full: `${fmt(start, { day: "numeric", month: "short" })} - ${fmt(last, { day: "numeric", month: "short" })}`,
      });
    }
  } else {
    for (let offset = 6; offset >= 0; offset -= 1) {
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset + 1);
      buckets.push({
        start,
        end,
        label: fmt(start, { weekday: "short" }),
        full: fmt(start, { weekday: "long", day: "numeric", month: "short" }),
      });
    }
  }

  return buckets.map((bucket, index) => ({
    ...bucket,
    key: `${granularity}-${bucket.start.getTime()}`,
    isCurrent: index === buckets.length - 1,
    count: reviews.filter((review) => {
      const time = review.updatedAt || 0;
      return time >= bucket.start.getTime() && time < bucket.end.getTime();
    }).length,
  }));
}

// One short line shown under each item in Recent Reviews.
export function reviewBlurb(review) {
  const comment = (review.comment || "").trim();
  if (comment) return comment;
  const findings = review.findings || [];
  if (!findings.length) return "No issues found. This one looks on-brand.";
  const categories = [...new Set(findings.map((finding) => finding.category).filter(Boolean))];
  const count = `${findings.length} ${findings.length === 1 ? "suggestion" : "suggestions"}`;
  return categories.length ? `${count} · ${categories.slice(0, 2).join(", ")}` : count;
}

export function formatReviewDate(timestamp) {
  const date = new Date(timestamp || Date.now());
  return `${fmt(date, { day: "numeric", month: "short", year: "numeric" })} • ${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)}`;
}