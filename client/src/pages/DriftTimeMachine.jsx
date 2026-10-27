import { useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { compareDrafts, reviewVersions } from "../lib/drift.js";
import { listReviews } from "../lib/reviewStore.js";
import { PageHero, TpIcon } from "../components/ThemeIcons.jsx";
import "../styles/ThemePages.css";

function formatDate(value) {
  if (!value) return "Date unavailable";
  return new Date(value).toLocaleString();
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

export default function DriftTimeMachine() {
  const [reviews] = useState(() => {
    try {
      return listReviews();
    } catch {
      return [];
    }
  });
  const drafts = useMemo(() => reviews.filter((review) => review.status !== "Approved" && review.content), [reviews]);
  const approved = useMemo(() => reviews.filter((review) => review.status === "Approved" && review.content), [reviews]);
  const [draftId, setDraftId] = useState(() => drafts[0]?.id || "");
  const [approvedId, setApprovedId] = useState(() => approved[0]?.id || "");
  const selectedDraft = drafts.find((review) => review.id === draftId) || drafts[0];
  const selectedApproved = approved.find((review) => review.id === approvedId) || approved[0];
  const comparison = selectedDraft && selectedApproved
    ? compareDrafts(selectedDraft.content, selectedApproved.content)
    : null;
  const versions = reviewVersions(selectedDraft);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-7">
        <PageHero
          icon="history"
          eyebrow="Review insights"
          title="Brand Drift Time Machine"
          text="Compare a saved draft with an approved example and review its revision timeline. Phrase overlap and wording signals are simple text comparisons—not a brand-fit score or approval decision."
        />

        {!drafts.length || !approved.length ? (
          <section className="tp-card p-6">
            <h2 className="text-base font-bold text-[var(--text)]">More review history needed</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Save at least one draft and one human-approved review in this browser to compare phrase, promise, and tone signals.</p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 tp-card p-5 md:grid-cols-2">
              <label className="text-xs font-semibold text-[var(--text-soft)]">
                Draft to inspect
                <select value={selectedDraft.id} onChange={(event) => setDraftId(event.target.value)} className="tp-input mt-2">
                  {drafts.map((review) => <option key={review.id} value={review.id}>{review.contentType || "Content review"} · {formatDate(review.updatedAt)}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-[var(--text-soft)]">
                Approved example
                <select value={selectedApproved.id} onChange={(event) => setApprovedId(event.target.value)} className="tp-input mt-2">
                  {approved.map((review) => <option key={review.id} value={review.id}>{review.contentType || "Content review"} · {formatDate(review.updatedAt)}</option>)}
                </select>
              </label>
            </section>

            {comparison && (
              <>
                <section className="grid gap-3 sm:grid-cols-3">
                  <MetricBar icon="target" label="Phrase overlap" value={comparison.overlap} detail="Shared 2–4 word phrases across both examples." />
                  <MetricBar icon="alert" alt label="Promise signal" value={comparison.draftPromises.length ? 100 : 0} detail={`${comparison.draftPromises.length} absolute or comparative phrase(s) in the selected draft.`} />
                  <MetricBar icon="activity" label="Tone signal" value={Math.min(100, Object.values(comparison.tone).reduce((sum, signal) => sum + signal.draft, 0) * 20)} detail="Counts selected warmth, assertiveness, and caution cues." />
                </section>
                <section className="grid gap-4 lg:grid-cols-2">
                  <PhraseList title="Phrases in the draft, not the approved example" phrases={comparison.added} emptyMessage="No phrase additions found." />
                  <PhraseList title="Phrases in the approved example, not the draft" phrases={comparison.removed} emptyMessage="No phrase changes found." />
                </section>
                <section className="tp-card p-5">
                  <h2 className="text-base font-bold text-[var(--text)]">Promise and tone signals</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="tp-card tp-card--soft p-4">
                      <h3 className="text-xs font-semibold text-[var(--text)]">Absolute or comparative wording</h3>
                      <p className="mt-2 text-xs text-[var(--text-soft)]">Draft: {comparison.draftPromises.join(", ") || "none detected"}</p>
                      <p className="mt-1 text-xs text-[var(--text-soft)]">Approved: {comparison.approvedPromises.join(", ") || "none detected"}</p>
                    </div>
                    <div className="tp-card tp-card--soft p-4">
                      <h3 className="text-xs font-semibold text-[var(--text)]">Tone cues (draft / approved)</h3>
                      <ul className="mt-2 space-y-1 text-xs text-[var(--text-soft)]">
                        {Object.entries(comparison.tone).map(([name, signal]) => <li key={name}>{name}: {signal.draft} / {signal.approved}</li>)}
                      </ul>
                    </div>
                  </div>
                </section>
                <section className="tp-card p-5">
                  <h2 className="text-base font-bold text-[var(--text)]">Draft revision timeline</h2>
                  {versions.length < 2 ? (
                    <p className="mt-2 text-xs text-[var(--text-soft)]">This review has no saved earlier revisions yet. Edit and save the draft to build its timeline.</p>
                  ) : (
                    <ol className="mt-4 space-y-3 border-l-2 border-[color-mix(in_srgb,var(--accent-solid)_40%,transparent)] pl-4">
                      {versions.map((version, index) => (
                        <li key={version.id} className="relative tp-row p-3">
                          <span className="tp-fill-grad absolute -left-[1.32rem] top-4 h-2.5 w-2.5 rounded-full" style={{ boxShadow: "0 0 10px var(--tp-glow)" }} />
                          <div className="flex flex-wrap justify-between gap-2">
                            <span className="text-xs font-semibold text-[var(--text)]">{index + 1}. {version.label}</span>
                            <time className="text-[10px] text-[var(--text-soft)]">{formatDate(version.updatedAt)}</time>
                          </div>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs font-medium text-[var(--accent-solid)]">View saved wording</summary>
                            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[var(--text-soft)]">{version.content}</pre>
                          </details>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
