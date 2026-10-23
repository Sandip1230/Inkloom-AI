import { useMemo, useState } from "react";

// What the drop-down in the top-right corner can chart.
const METRICS = [
  { id: "reviews", label: "Reviews / day", count: () => 1 },
  { id: "approved", label: "Approvals / day", count: (review) => (review.status === "Approved" ? 1 : 0) },
  { id: "findings", label: "Findings / day", count: (review) => review.findings?.length || 0 },
];

// Picks a tidy step (1, 2, 5, 10, 20, 25, 50 ...) so the y-axis reads 0, 5, 10, 15 like the design.
function niceStep(raw) {
  const target = Math.max(1, raw);
  const magnitude = 10 ** Math.floor(Math.log10(target));
  for (const factor of [1, 2, 2.5, 5, 10]) {
    if (magnitude * factor >= target) return Math.max(1, Math.round(magnitude * factor * 100) / 100);
  }
  return magnitude * 10;
}

export default function ReviewActivity({ reviews }) {
  const [metricId, setMetricId] = useState("reviews");
  const metric = METRICS.find((item) => item.id === metricId) || METRICS[0];

  // One entry per day for the last 7 days (oldest -> today).
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = date.toDateString();
      const count = reviews.reduce(
        (total, review) => (new Date(review.updatedAt).toDateString() === key ? total + metric.count(review) : total),
        0,
      );
      return {
        key,
        count,
        isToday: index === 6,
        label: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date),
        full: new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(date),
      };
    });
  }, [reviews, metric]);

  const highest = Math.max(0, ...days.map((day) => day.count));
  const step = niceStep(highest / 3);
  const top = step * 3;
  const ticks = [0, 1, 2, 3].map((index) => index * step);
  const summary = days.map((day) => `${day.label} ${day.count}`).join(", ");

  return (
    <section className="dashboard-panel ink-card activity" aria-labelledby="activity-title">
      <div className="activity__head">
        <div>
          <h2 id="activity-title" className="activity__title">Review activity</h2>
          <p className="activity__sub">Saved review updates · Last 7 days</p>
        </div>

        <label className="ink-select ink-select--small activity__select">
          <span className="sr-only">Chart measure</span>
          <select value={metricId} onChange={(event) => setMetricId(event.target.value)}>
            {METRICS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </label>
      </div>

      <div className="activity__chart" role="img" aria-label={`${metric.label} over the last seven days: ${summary}`}>
        <div className="activity__y" aria-hidden="true">
          {ticks.map((tick, index) => (
            <span key={tick} style={{ bottom: `${(index / 3) * 100}%` }}>{tick}</span>
          ))}
        </div>

        <div className="activity__plot">
          <div className="activity__grid" aria-hidden="true">
            {ticks.map((tick, index) => (
              <span key={tick} className="activity__line" style={{ bottom: `${(index / 3) * 100}%` }} />
            ))}
          </div>

          <div className="activity__cols">
            {days.map((day) => (
              <div key={day.key} className={`activity__col ${day.isToday ? "is-today" : ""}`} title={`${day.full}: ${day.count} ${metric.label.split(" /")[0].toLowerCase()}`}>
                <span className="activity__bar-wrap">
                  <span
                    className={`activity__bar ${day.count ? "" : "is-empty"}`}
                    style={{ height: day.count ? `${Math.max(4, (day.count / top) * 100)}%` : undefined }}
                  >
                    <span className="activity__tip">{day.count}</span>
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="activity__x-spacer" aria-hidden="true" />
        <div className="activity__x" aria-hidden="true">
          {days.map((day) => (
            <span key={day.key} className={day.isToday ? "is-today" : ""}>{day.label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}