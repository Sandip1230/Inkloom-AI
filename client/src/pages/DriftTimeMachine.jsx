import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { annotateVersions, buildTimeline, compareDrafts, reviewVersions } from "../lib/drift.js";
import { listReviews } from "../lib/reviewStore.js";
import { PageHero, TpIcon } from "../components/ThemeIcons.jsx";
import "../styles/ThemePages.css";
import "../styles/DriftTimeMachine.css";

function formatDate(value) {
  if (!value) return "Date unavailable";
  return new Date(value).toLocaleString();
}

function shortDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function statusKey(status) {
  if (status === "Approved") return "approved";
  if (status === "Awaiting approval") return "awaiting";
  if (status === "Changes requested") return "changes";
  return "draft";
}

function MetricBar({ label, value, detail, icon, alt }) {
  return (
    <div className={`tp-stat tp-stat--col ${alt ? "tp-stat--alt" : ""}`} style={{ boxShadow: "var(--tp-shadow)" }}>
      <div className="flex w-full items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-semibold text-[var(--text-soft)]">
          <span className="tp-head__icon"><TpIcon name={icon} size={16} /></span>{label}
        </span>
        <span className="text-lg font-extrabold text-[var(--text)]">{value}%</span>
      </div>
      <div className="tp-track mt-2 h-2 w-full">
        <div className="tp-fill" style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
      </div>
      <p className="mt-1 text-[11px] leading-4 text-[var(--text-soft)]">{detail}</p>
    </div>
  );
}

function PhraseList({ title, phrases, emptyMessage }) {
  return (
    <section className="tp-card tp-card--sm p-4">
      <h3 className="text-sm font-bold text-[var(--text)]">{title}</h3>
      {phrases.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {phrases.map((phrase) => <li key={phrase} className="tp-pill tp-tone-accent">{phrase}</li>)}
        </ul>
      ) : <p className="mt-2 text-xs text-[var(--text-soft)]">{emptyMessage}</p>}
    </section>
  );
}

/* ---------- the time rail: every saved review, oldest to newest ---------- */

function TimeRail({ items, selectedId, onSelect }) {
  const selectedRef = useRef(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView?.({ inline: "center", block: "nearest" });
  }, [selectedId]);

  return (
    <section className="tp-card dtm-rail-card" aria-labelledby="dtm-rail-title">
      <div className="dtm-rail-card__head">
        <div className="tp-head">
          <span className="tp-head__icon"><TpIcon name="history" size={20} /></span>
          <div>
            <h2 id="dtm-rail-title" className="text-base font-bold text-[var(--text)]">Review timeline</h2>
            <p className="text-xs text-[var(--text-soft)]">Every saved review, oldest to newest. Pick a moment to travel back to it.</p>
          </div>
        </div>
        <ul className="dtm-legend" aria-label="Status colours">
          {[["approved", "Approved"], ["awaiting", "Awaiting"], ["changes", "Changes"], ["draft", "Draft"]].map(([key, label]) => (
            <li key={key}><span className={`dtm-dot dtm-dot--${key}`} />{label}</li>
          ))}
        </ul>
      </div>

      <ol className="dtm-rail">
        {items.map((item) => {
          const active = item.id === selectedId;
          const key = statusKey(item.status);
          return (
            <li key={item.id} className="dtm-rail__item">
              <button
                ref={active ? selectedRef : null}
                type="button"
                className={`dtm-node ${active ? "is-active" : ""}`}
                aria-pressed={active}
                onClick={() => onSelect(item.id)}
              >
                <span className="dtm-node__date">{shortDate(item.updatedAt)}</span>
                <span className={`dtm-node__pin dtm-dot dtm-dot--${key}`} aria-hidden="true">
                  {item.versionCount > 1 ? item.versionCount : ""}
                </span>
                <span className="dtm-node__card">
                  <strong>{item.contentType}</strong>
                  <span>{item.status}</span>
                  <span className="dtm-node__ver">{item.versionCount} {item.versionCount === 1 ? "version" : "versions"}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ---------- drift curve: how much each version changed from the one before ---------- */

function DriftCurve({ versions, index, onSelect }) {
  const peak = Math.max(20, ...versions.map((version) => version.drift || 0));
  return (
    <div className="dtm-curve" role="group" aria-label="Drift between versions">
      {versions.map((version, position) => {
        const height = version.drift === null ? 6 : Math.max(8, (version.drift / peak) * 100);
        return (
          <button
            key={version.id}
            type="button"
            className={`dtm-curve__col ${position === index ? "is-active" : ""} ${position > index ? "is-future" : ""}`}
            onClick={() => onSelect(position)}
            aria-pressed={position === index}
            aria-label={`Version ${position + 1}: ${version.drift === null ? "first saved version" : `${version.drift}% drift from the version before`}`}
            title={version.drift === null ? "First saved version" : `${version.drift}% drift`}
          >
            <span className="dtm-curve__value">{version.drift === null ? "start" : `${version.drift}%`}</span>
            <span className="dtm-curve__bar" style={{ height: `${height}%` }} />
            <span className="dtm-curve__label">v{position + 1}</span>
          </button>
        );
      })}
    </div>
  );
}

function DiffText({ version, showChanges }) {
  if (!showChanges || !version.diff) {
    return <pre className="dtm-text">{version.content}</pre>;
  }
  return (
    <p className="dtm-text dtm-text--diff">
      {version.diff.parts.map((part, position) => {
        if (part.type === "add") return <ins key={position}>{part.text} </ins>;
        if (part.type === "del") return <del key={position}>{part.text} </del>;
        return <span key={position}>{part.text} </span>;
      })}
    </p>
  );
}

/* ---------- travel through one review's versions ---------- */

function TimeTravel({ item, baselineOptions }) {
  const versions = useMemo(() => annotateVersions(reviewVersions(item.review)), [item]);
  const [index, setIndex] = useState(Math.max(0, versions.length - 1));
  const [showChanges, setShowChanges] = useState(true);
  const [baselineId, setBaselineId] = useState(() => baselineOptions[0]?.id || "");

  const version = versions[Math.min(index, versions.length - 1)];
  const baseline = baselineOptions.find((option) => option.id === baselineId) || baselineOptions[0];
  const comparison = useMemo(
    () => (version && baseline ? compareDrafts(version.content, baseline.review.content) : null),
    [version, baseline],
  );
  const toneTotal = comparison ? Object.values(comparison.tone).reduce((sum, signal) => sum + signal.draft, 0) : 0;
  const isFirst = index === 0;
  const isLast = index === versions.length - 1;
  const findings = version?.findings ?? 0;

  if (!version) return null;

  return (
    <>
      <section className="tp-card dtm-travel" aria-labelledby="dtm-travel-title">
        <div className="dtm-travel__head">
          <div>
            <p className="dtm-eyebrow">Time travel</p>
            <h2 id="dtm-travel-title" className="text-base font-bold text-[var(--text)]">{item.contentType}</h2>
            <p className="text-xs text-[var(--text-soft)]">
              {versions.length} saved {versions.length === 1 ? "version" : "versions"} · last saved {formatDate(item.updatedAt)}
            </p>
          </div>
          <span className={`dtm-status dtm-status--${statusKey(item.status)}`}>{item.status}</span>
        </div>

        {versions.length > 1 ? (
          <>
            <DriftCurve versions={versions} index={index} onSelect={setIndex} />
            <div className="dtm-slider">
              <button type="button" className="tp-btn-ghost tp-btn-sm" onClick={() => setIndex(index - 1)} disabled={isFirst}>← Earlier</button>
              <input
                type="range"
                min={0}
                max={versions.length - 1}
                step={1}
                value={index}
                onChange={(event) => setIndex(Number(event.target.value))}
                aria-label="Travel through saved versions"
                aria-valuetext={`Version ${index + 1} of ${versions.length}`}
              />
              <button type="button" className="tp-btn-ghost tp-btn-sm" onClick={() => setIndex(index + 1)} disabled={isLast}>Later →</button>
            </div>
          </>
        ) : (
          <p className="tp-notice tp-tone-muted mt-4 text-xs">
            Only one version is saved for this review. Edit it in <Link to="/workflow" className="font-semibold text-[var(--accent-solid)]">Workflow</Link> and save again to build a timeline you can travel through.
          </p>
        )}

        <div className="dtm-snapshot">
          <div className="dtm-snapshot__bar">
            <div>
              <p className="dtm-snapshot__title">
                Version {index + 1} of {versions.length}
                <span className="dtm-pill-now">{isLast ? "Latest" : isFirst ? "Earliest" : "Past"}</span>
              </p>
              <time className="text-[11px] text-[var(--text-soft)]">{formatDate(version.updatedAt)}</time>
            </div>
            {versions.length > 1 && version.diff && (
              <div className="tp-tabs dtm-toggle" role="group" aria-label="Wording view">
                <button type="button" className={`tp-tab ${showChanges ? "is-active" : ""}`} aria-pressed={showChanges} onClick={() => setShowChanges(true)}>Changes</button>
                <button type="button" className={`tp-tab ${!showChanges ? "is-active" : ""}`} aria-pressed={!showChanges} onClick={() => setShowChanges(false)}>Clean text</button>
              </div>
            )}
          </div>

          <dl className="dtm-facts">
            <div><dt>Words</dt><dd>{version.words}</dd></div>
            <div><dt>Findings</dt><dd>{findings}</dd></div>
            <div><dt>Drift from previous</dt><dd>{version.drift === null ? "—" : `${version.drift}%`}</dd></div>
            <div><dt>Added / removed</dt><dd>{version.diff ? <><span className="dtm-add">+{version.diff.added}</span> / <span className="dtm-del">−{version.diff.removed}</span></> : "—"}</dd></div>
          </dl>

          <DiffText version={version} showChanges={showChanges} />
          {versions.length > 1 && showChanges && version.diff && (
            <p className="dtm-key"><ins>added</ins> <del>removed</del> compared with version {index} </p>
          )}
          {versions.length > 1 && !version.diff && version.drift !== null && (
            <p className="dtm-key">This version is too long for a word-by-word view. Drift is estimated from shared phrases.</p>
          )}
        </div>
      </section>

      <section className="tp-card dtm-compare" aria-labelledby="dtm-compare-title">
        <div className="dtm-compare__head">
          <div>
            <p className="dtm-eyebrow">Compare with approved wording</p>
            <h2 id="dtm-compare-title" className="text-base font-bold text-[var(--text)]">How far did version {index + 1} drift from your approved example?</h2>
          </div>
          {baselineOptions.length > 0 && (
            <label className="text-xs font-semibold text-[var(--text-soft)]">
              Approved example
              <select value={baseline.id} onChange={(event) => setBaselineId(event.target.value)} className="tp-input mt-1.5">
                {baselineOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.contentType} · {formatDate(option.updatedAt)}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        {!comparison ? (
          <p className="tp-empty mt-4 p-4 text-sm">
            No other approved review to compare with yet. Approve a draft in <Link to="/workflow" className="font-semibold text-[var(--accent-solid)]">Workflow</Link> and it will appear here as an example. Your review history above works without it.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricBar icon="target" label="Phrase overlap" value={comparison.overlap} detail="Shared 2–4 word phrases across both examples." />
              <MetricBar icon="alert" alt label="Promise signal" value={comparison.draftPromises.length ? 100 : 0} detail={`${comparison.draftPromises.length} absolute or comparative phrase(s) in this version.`} />
              <MetricBar icon="activity" label="Tone signal" value={Math.min(100, toneTotal * 20)} detail="Counts selected warmth, assertiveness, and caution cues." />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <PhraseList title="Phrases in this version, not the approved example" phrases={comparison.added} emptyMessage="No phrase additions found." />
              <PhraseList title="Phrases in the approved example, not this version" phrases={comparison.removed} emptyMessage="No phrase changes found." />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="tp-card tp-card--soft p-4">
                <h3 className="text-xs font-semibold text-[var(--text)]">Absolute or comparative wording</h3>
                <p className="mt-2 text-xs text-[var(--text-soft)]">This version: {comparison.draftPromises.join(", ") || "none detected"}</p>
                <p className="mt-1 text-xs text-[var(--text-soft)]">Approved: {comparison.approvedPromises.join(", ") || "none detected"}</p>
              </div>
              <div className="tp-card tp-card--soft p-4">
                <h3 className="text-xs font-semibold text-[var(--text)]">Tone cues (this version / approved)</h3>
                <ul className="mt-2 space-y-1 text-xs text-[var(--text-soft)]">
                  {Object.entries(comparison.tone).map(([name, signal]) => <li key={name}>{name}: {signal.draft} / {signal.approved}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export default function DriftTimeMachine() {
  const [reviews] = useState(() => {
    try {
      const list = listReviews();
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  });
  const timeline = useMemo(() => buildTimeline(reviews), [reviews]);
  const [selectedId, setSelectedId] = useState(() => timeline[timeline.length - 1]?.id || "");
  const selected = timeline.find((item) => item.id === selectedId) || timeline[timeline.length - 1];
  const baselineOptions = useMemo(
    () => timeline.filter((item) => item.status === "Approved" && item.id !== selected?.id).reverse(),
    [timeline, selected],
  );

  const totals = useMemo(() => ({
    reviews: timeline.length,
    versions: timeline.reduce((sum, item) => sum + item.versionCount, 0),
    approved: timeline.filter((item) => item.status === "Approved").length,
    edited: timeline.filter((item) => item.versionCount > 1).length,
  }), [timeline]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-7">
        <PageHero
          icon="history"
          eyebrow="Review insights"
          title="Brand Drift Time Machine"
          text="Travel back through your saved review history and see how wording changed from one version to the next. Phrase overlap and wording signals are simple text comparisons—not a brand-fit score or approval decision."
        />

        {!selected ? (
          <section className="tp-card p-6 text-center">
            <span className="dtm-empty-icon"><TpIcon name="history" size={28} /></span>
            <h2 className="mt-3 text-base font-bold text-[var(--text)]">No review history yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-soft)]">
              Save a review in Workflow and it will appear here on a timeline. Edit and save it again to travel back through each version.
            </p>
            <Link to="/workflow" className="tp-btn mt-4 inline-flex">Start a review</Link>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Review history totals">
              {[
                ["Saved reviews", totals.reviews],
                ["Saved versions", totals.versions],
                ["Edited reviews", totals.edited],
                ["Approved reviews", totals.approved],
              ].map(([label, value]) => (
                <div key={label} className="tp-stat tp-stat--col">
                  <span className="text-2xl font-extrabold text-[var(--text)]">{value}</span>
                  <span className="text-xs font-semibold text-[var(--text-soft)]">{label}</span>
                </div>
              ))}
            </section>

            <TimeRail items={timeline} selectedId={selected.id} onSelect={setSelectedId} />
            <TimeTravel key={selected.id} item={selected} baselineOptions={baselineOptions} />
          </>
        )}
      </div>
    </AppShell>
  );
}