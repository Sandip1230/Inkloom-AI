// Small stroke icon set shared by the themed pages (no extra dependency).
const PATHS = {
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  trend: "m3 17 6-6 4 4 8-8M15 7h6v6",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  check: "M20 6L9 17l-5-5",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  building: "M3 21h18M5 21V7l7-4 7 4v14M9 9h2M13 9h2M9 13h2M13 13h2M10 21v-4h4v4",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8",
  key: "M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z",
  alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  close: "M18 6 6 18M6 6l12 12",
};

export function TpIcon({ name, size = 22, strokeWidth = 2 }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

// Page header used at the top of every themed page.
export function PageHero({ icon, eyebrow, title, text, children, notice }) {
  return (
    <header className="tp-hero fade-in">
      <div className="tp-hero__main">
        <span className="tp-hero__icon"><TpIcon name={icon} size={24} /></span>
        <div className="min-w-0">
          <p className="tp-eyebrow">{eyebrow}</p>
          <h1 className="tp-title">{title}</h1>
          {text && <p className="tp-sub">{text}</p>}
          {notice}
        </div>
      </div>
      {children}
    </header>
  );
}
