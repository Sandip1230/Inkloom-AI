import { useMemo, useState } from "react";
import AppShell from "../components/AppShell.jsx";
import { EVALUATION_NOTICE, evaluateAll } from "../lib/evaluation/evaluate.js";
import {
  FEEDBACK_CHECKS,
  FEEDBACK_TYPES,
  listFeedback,
  summarizeFeedback,
  toGoldenSampleDraft,
  updateTriage,
} from "../lib/evaluation/feedbackStore.js";
import { GOLDEN_SET } from "../lib/evaluation/goldenSet.js";
import { PageHero, TpIcon } from "../components/ThemeIcons.jsx";
import "../styles/ThemePages.css";

const percent = (value) => `${Math.round(value * 100)}%`;
const checkLabel = (check) => FEEDBACK_CHECKS[check] || check;

const TRIAGE_LABELS = {
  new: "Awaiting triage",
  "added-to-golden-set": "Added to golden set",
  dismissed: "Dismissed",
};

function Metric({ label, value, detail, icon, alt }) {
  return (
    <div className={`tp-stat ${alt ? "tp-stat--alt" : ""}`}>
      <span className="tp-stat__icon"><TpIcon name={icon} size={22} /></span>
      <div className="tp-stat__text">
        <strong className="tp-stat__value">{value}</strong>
        <span className="tp-stat__label">{label}</span>
        <span className="tp-stat__hint">{detail}</span>
      </div>
    </div>
  );
}

function sampleSnippet(record) {
  const { id, title, content, expected } = toGoldenSampleDraft(record);
  return `// Confirm the labels with a person before adding this to GOLDEN_SET.\n${JSON.stringify({ id, title, content, expected }, null, 2)},`;
}

export default function QualityEvaluation() {
  const report = useMemo(() => evaluateAll(GOLDEN_SET), []);
  const [feedback, setFeedback] = useState(() => listFeedback());
  const [copiedId, setCopiedId] = useState("");
  const summary = summarizeFeedback(feedback);
  const checks = Object.entries(report.byCheck);
  const known = report.results.filter((result) => result.knownIssue && !result.passed);

  function changeTriage(id, triage) {
    updateTriage(id, triage);
    setFeedback(listFeedback());
  }

  async function copySample(record) {
    try {
      await navigator.clipboard.writeText(sampleSnippet(record));
      setCopiedId(record.id);
      window.setTimeout(() => setCopiedId(""), 2000);
    } catch {
      setCopiedId("");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-7">
        <PageHero
          icon="shield"
          eyebrow="Quality evaluation"
          title="How well do the checks work?"
          text="The automated checks are run against labeled sample drafts. Precision shows how many flags were correct; recall shows how many real issues were caught."
          notice={<p className="tp-card tp-card--soft mt-3 px-3 py-2 text-xs leading-5 text-[var(--text-soft)]">{EVALUATION_NOTICE}</p>}
        />

        <section aria-label="Overall results" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon="check" label="Samples passed" value={`${report.passedCount} / ${report.sampleCount}`} detail="Samples where the checks match the human labels exactly." />
          <Metric icon="target" alt label="Precision" value={percent(report.totals.precision)} detail={`${report.totals.fp} false positive${report.totals.fp === 1 ? "" : "s"} (flagged, but not an issue).`} />
          <Metric icon="activity" label="Recall" value={percent(report.totals.recall)} detail={`${report.totals.fn} missed issue${report.totals.fn === 1 ? "" : "s"} (an issue the checks did not flag).`} />
          <Metric icon="star" alt label="Balanced score (F1)" value={percent(report.totals.f1)} detail="Combines precision and recall. Not an approval score." />
        </section>

        <section className="tp-card p-5" aria-labelledby="by-check-title">
          <h2 id="by-check-title" className="text-base font-bold text-[var(--text)]">Results by check</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="tp-table w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-xs text-[var(--text-soft)]">
                  <th className="py-2 pr-3 font-medium">Check</th>
                  <th className="py-2 pr-3 font-medium">Correct</th>
                  <th className="py-2 pr-3 font-medium">False positives</th>
                  <th className="py-2 pr-3 font-medium">Missed</th>
                  <th className="py-2 pr-3 font-medium">Precision</th>
                  <th className="py-2 font-medium">Recall</th>
                </tr>
              </thead>
              <tbody>
                {checks.map(([check, counts]) => (
                  <tr key={check} className="text-[var(--text)]">
                    <td className="py-2.5 pr-3 font-medium">{checkLabel(check)}</td>
                    <td className="py-2.5 pr-3">{counts.tp}</td>
                    <td className="py-2.5 pr-3">{counts.fp}</td>
                    <td className="py-2.5 pr-3">{counts.fn}</td>
                    <td className="py-2.5 pr-3">{percent(counts.precision)}</td>
                    <td className="py-2.5">{percent(counts.recall)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="tp-card p-5" aria-labelledby="gaps-title">
          <h2 id="gaps-title" className="text-base font-bold text-[var(--text)]">Known gaps in the checks</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">These labeled samples show where today&apos;s rule-based checks disagree with a human reviewer. Fixing them should raise the scores above.</p>
          {known.length ? (
            <ul className="mt-3 space-y-2">
              {known.map((result) => (
                <li key={result.id} className="tp-row p-3">
                  <p className="text-sm font-semibold text-[var(--text)]">{result.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{result.knownIssue}</p>
                  <p className="mt-1.5 text-[11px] tp-text-warn">
                    {result.falsePositives.length > 0 && `Wrongly flagged: ${result.falsePositives.join(", ")}. `}
                    {result.missed.length > 0 && `Not caught: ${result.missed.join(", ")}.`}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-[var(--text-soft)]">No known gaps are recorded for this sample set.</p>
          )}
        </section>

        <section className="tp-card p-5" aria-labelledby="samples-title">
          <h2 id="samples-title" className="text-base font-bold text-[var(--text)]">All labeled samples</h2>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {report.results.map((result) => (
              <li key={result.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="text-sm text-[var(--text)]">{result.title}</span>
                <span className={`tp-pill ${result.passed ? "tp-tone-ok" : "tp-tone-warn"}`}>
                  {result.passed ? "Matches labels" : result.knownIssue ? "Known gap" : "Needs attention"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="tp-card p-5" aria-labelledby="feedback-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="feedback-title" className="text-base font-bold text-[var(--text)]">Reviewer feedback</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Reports saved in this browser. A person decides which ones become labeled samples; nothing is added automatically.</p>
            </div>
            <p className="text-xs text-[var(--text-soft)]">
              {summary.total} report{summary.total === 1 ? "" : "s"} · {summary.incorrect} incorrect · {summary.missed} missed · {summary.awaitingTriage} awaiting triage
            </p>
          </div>

          {feedback.length ? (
            <ul className="mt-4 space-y-3">
              {feedback.map((record) => (
                <li key={record.id} className="tp-row p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="tp-pill tp-tone-accent text-[10px] uppercase tracking-wide">
                        {record.type === FEEDBACK_TYPES.INCORRECT_FINDING ? "Incorrect finding" : "Missed issue"}
                      </span>
                      <span className="text-xs text-[var(--text-soft)]">{checkLabel(record.check)}</span>
                    </div>
                    <span className="text-[11px] font-medium text-[var(--text-soft)]">{TRIAGE_LABELS[record.triage] || record.triage}</span>
                  </div>
                  {record.excerpt && <p className="mt-2 text-sm font-semibold text-[var(--text)]">“{record.excerpt}”</p>}
                  {record.note && <p className="mt-1 text-sm leading-5 text-[var(--text-soft)]">{record.note}</p>}
                  {record.context && <p className="mt-2 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-xs leading-5 text-[var(--text-soft)]">…{record.context}…</p>}
                  <p className="mt-2 text-[11px] text-[var(--text-soft)]">
                    {record.reviewerName ? `${record.reviewerName} · ` : ""}{new Date(record.createdAt).toLocaleString()}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => copySample(record)} className="tp-btn-ghost tp-btn-sm">
                      {copiedId === record.id ? "Copied" : "Copy as labeled-sample draft"}
                    </button>
                    {record.triage !== "added-to-golden-set" && (
                      <button type="button" onClick={() => changeTriage(record.id, "added-to-golden-set")} className="tp-btn-ghost tp-btn-sm">
                        Mark added to golden set
                      </button>
                    )}
                    {record.triage !== "dismissed" && (
                      <button type="button" onClick={() => changeTriage(record.id, "dismissed")} className="tp-btn-ghost tp-btn-sm">
                        Dismiss
                      </button>
                    )}
                    {record.triage !== "new" && (
                      <button type="button" onClick={() => changeTriage(record.id, "new")} className="rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-soft)] hover:underline">
                        Reopen
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-lg bg-[var(--surface-2)] px-3 py-3 text-xs leading-5 text-[var(--text-soft)]">
              No feedback yet. On the review screen, use “Report incorrect finding” or “Report a missed issue” to add some.
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}