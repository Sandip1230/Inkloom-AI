import { useEffect, useState } from "react";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(timestamp) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

// Builds the mini trend line + "% change" badge for one stat card.
//  - series: 7 daily values (oldest -> today), based on when reviews were last updated
//  - change: this week vs the week before (null = "New", i.e. nothing last week)
export function buildTrend(reviews, matches, weight = () => 1) {
  const todayStart = startOfDay(Date.now());
  const series = Array(7).fill(0);
  let current = 0;
  let previous = 0;

  reviews.forEach((review) => {
    const updated = Number(review.updatedAt);
    if (!updated || !matches(review)) return;
    const daysAgo = Math.round((todayStart - startOfDay(updated)) / DAY_MS);
    if (daysAgo < 0 || daysAgo > 13) return;
    const amount = weight(review);
    if (daysAgo <= 6) {
      series[6 - daysAgo] += amount;
      current += amount;
    } else {
      previous += amount;
    }
  });

  let change = 0;
  if (previous > 0) change = Math.round(((current - previous) / previous) * 100);
  else if (current > 0) change = null;
  return { series, change };
}

// Counts up from 0 to the target number.
function CountUp({ value }) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplay(target);
      return undefined;
    }
    const duration = 1000;
    const startTime = performance.now();
    let frame;
    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return <>{display}</>;
}

function StatIcon({ name }) {
  const props = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    focusable: "false",
    "aria-hidden": "true",
  };
  switch (name) {
    case "doc":
      return (
        <svg {...props}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
          <path d="M14 3v5h5" />
          <path d="M9 13h6M9 17h4" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "user":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.6" />
          <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
        </svg>
      );
    case "alert":
      return (
        <svg {...props}>
          <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
          <path d="M12 10v4.2M12 17v.01" />
        </svg>
      );
    default:
      return null;
  }
}

// Smooth little line chart drawn with plain SVG (no chart library).
function Sparkline({ series, gradientId }) {
  const width = 110;
  const height = 38;
  const pad = 4;
  const max = Math.max(...series);
  const min = Math.min(...series);
  const flat = max === min;

  const points = series.map((value, index) => ({
    x: pad + (index / (series.length - 1)) * (width - pad * 2),
    y: flat ? height / 2 : height - pad - ((value - min) / (max - min)) * (height - pad * 2),
  }));

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const point = points[i];
    const midX = ((prev.x + point.x) / 2).toFixed(1);
    path += ` C ${midX} ${prev.y.toFixed(1)}, ${midX} ${point.y.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  }

  return (
    <svg className="hero-stat__spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff7a4c" />
          <stop offset="1" stopColor="#f0568a" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke={`url(#${gradientId})`} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function TrendBadge({ change }) {
  if (change === null) {
    return <span className="hero-stat__trend is-up" title="New this week (nothing in the previous 7 days)"><span aria-hidden="true">↗</span> New</span>;
  }
  if (change > 0) {
    return <span className="hero-stat__trend is-up" title="Compared with the previous 7 days"><span aria-hidden="true">↗</span> +{change}%</span>;
  }
  if (change < 0) {
    return <span className="hero-stat__trend is-down" title="Compared with the previous 7 days"><span aria-hidden="true">↘</span> {change}%</span>;
  }
  return <span className="hero-stat__trend is-flat" title="Compared with the previous 7 days"><span aria-hidden="true">→</span> 0%</span>;
}

function HeroStat({ id, label, value, icon, tone, trend }) {
  return (
    <div className={`hero-stat hero-stat--${tone} dashboard-metric`}>
      <span className="hero-stat__icon" aria-hidden="true">
        <StatIcon name={icon} />
      </span>
      <div className="hero-stat__body">
        <p className="hero-stat__label">{label}</p>
        <p className="hero-stat__row">
          <span className="hero-stat__value"><CountUp value={value} /></span>
          <TrendBadge change={trend.change} />
        </p>
      </div>
      <Sparkline series={trend.series} gradientId={`hero-spark-${id}`} />
    </div>
  );
}

// Flowing ribbon artwork on the right side of the banner.
function AuroraArt() {
  return (
    <svg className="hero__aurora" viewBox="0 0 700 220" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hero-wave-a" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#ff5a3c" stopOpacity="0" />
          <stop offset="0.35" stopColor="#ff6a45" stopOpacity="0.85" />
          <stop offset="0.7" stopColor="#f0368a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffb06b" stopOpacity="0.55" />
        </linearGradient>
        <filter id="hero-blur" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <path d="M40 200C150 190 210 100 300 86c80-12 110 46 190 38 70-7 130-70 210-62" fill="none" stroke="url(#hero-wave-a)" strokeWidth="46" strokeLinecap="round" opacity="0.85" filter="url(#hero-blur)" />
      <path d="M40 200C150 190 210 100 300 86c80-12 110 46 190 38 70-7 130-70 210-62" fill="none" stroke="url(#hero-wave-a)" strokeWidth="14" strokeLinecap="round" />
      <path d="M70 210C170 196 230 118 310 100c70-15 100 36 170 30 60-5 110-52 220-44" fill="none" stroke="#ffd2b0" strokeWidth="1.4" opacity="0.65" />
      <path d="M100 216C190 204 250 134 322 116c60-14 92 28 150 22 56-6 110-40 228-34" fill="none" stroke="#ff9a52" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}

// Top banner of the dashboard: heading, tagline, handwritten note and the four stat cards.
export default function DashboardHero({ reviews }) {
  const stats = [
    {
      id: "saved",
      label: "Saved reviews",
      icon: "doc",
      tone: "orange",
      value: reviews.length,
      trend: buildTrend(reviews, () => true),
    },
    {
      id: "waiting",
      label: "Awaiting attention",
      icon: "clock",
      tone: "orange",
      value: reviews.filter((review) => review.status === "Draft" || review.status === "Awaiting approval").length,
      trend: buildTrend(reviews, (review) => review.status === "Draft" || review.status === "Awaiting approval"),
    },
    {
      id: "approved",
      label: "Approved by a person",
      icon: "user",
      tone: "orange",
      value: reviews.filter((review) => review.status === "Approved").length,
      trend: buildTrend(reviews, (review) => review.status === "Approved"),
    },
    {
      id: "findings",
      label: "Findings to review",
      icon: "alert",
      tone: "pink",
      value: reviews.reduce((total, review) => total + (review.findings?.length || 0), 0),
      trend: buildTrend(reviews, (review) => (review.findings?.length || 0) > 0, (review) => review.findings.length),
    },
  ];

  return (
    <section className="hero stagger" aria-labelledby="hero-title">
      <AuroraArt />

      <div className="hero__top">
        <div className="hero__copy">
          <p className="hero__eyebrow">
            Inkloom AI <span className="hero__slash">/</span> Workspace overview
          </p>
          <h1 id="hero-title" className="hero__title">
            Every draft, in <span className="hero__title-accent">good hands.</span>
          </h1>
          <p className="hero__lead">
            Review the details. Keep your brand consistent. Leave the final call to people.
          </p>
        </div>

        <div className="hero__note" aria-hidden="true">
          <svg className="hero__note-star" width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3c.8 7.2 3.8 10.2 11 11-7.2.8-10.2 3.8-11 11-.8-7.2-3.8-10.2-11-11 7.2-.8 10.2-3.8 11-11Z" />
            <path d="M29 4v5M26.5 6.5h5" />
          </svg>
          <p>
            Better<br />
            Content<br />
            Brighter<br />
            Ideas <span className="hero__note-dash">-</span>
          </p>
        </div>
      </div>

      <div className="hero__stats">
        {stats.map((stat) => (
          <HeroStat key={stat.id} {...stat} />
        ))}
      </div>
    </section>
  );
}