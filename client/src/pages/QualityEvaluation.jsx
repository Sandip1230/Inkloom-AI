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

const percent = (value) => `${Math.round(value * 100)}%`;
const checkLabel = (check) => FEEDBACK_CHECKS[check] || check;

const TRIAGE_LABELS = {
  new: "Awaiting triage",
  "added-to-golden-set": "Added to golden set",
  dismissed: "Dismissed",
};

function Metric({ label, value, detail }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs font-medium text-[var(--text-soft)]">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-[var(--text)]">{value}</p>
      <p className="mt-1 text-[11px] leading-4 text-[var(--text-soft)]">{detail}</p>
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
        <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent-solid)]">Quality evaluation</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">How well do the checks work?</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">
            The automated checks are run against labeled sample drafts. Precision shows how many flags were correct; recall shows how many real issues were caught.
          </p>
          <p className="mt-3 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-xs leading-5 text-[var(--text-soft)]">{EVALUATION_NOTICE}</p>
        </header>

        <section aria-label="Overall results" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Samples passed" value={`${report.passedCount} / ${report.sampleCount}`} detail="Samples where the checks match the human labels exactly." />
          <Metric label="Precision" value={percent(report.totals.precision)} detail={`${report.totals.fp} false positive${report.totals.fp === 1 ? "" : "s"} (flagged, but not an issue).`} />
          <Metric label="Recall" value={percent(report.totals.recall)} detail={`${report.totals.fn} missed issue${report.totals.fn === 1 ? "" : "s"} (an issue the checks did not flag).`} />
          <Metric label="Balanced score (F1)" value={percent(report.totals.f1)} detail="Combines precision and recall. Not an approval score." />
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5" aria-labelledby="by-check-title">
          <h2 id="by-check-title" className="text-base font-semibold text-[var(--text)]">Results by check</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
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
                  <tr key={check} className="border-t border-[var(--border)] text-[var(--text)]">
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

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5" aria-labelledby="gaps-title">
          <h2 id="gaps-title" className="text-base font-semibold text-[var(--text)]">Known gaps in the checks</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">These labeled samples show where today&apos;s rule-based checks disagree with a human reviewer. Fixing them should raise the scores above.</p>
          {known.length ? (
            <ul className="mt-3 space-y-2">
              {known.map((result) => (
                <li key={result.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                  <p className="text-sm font-semibold text-[var(--text)]">{result.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{result.knownIssue}</p>
                  <p className="mt-1.5 text-[11px] text-amber-700">
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

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5" aria-labelledby="samples-title">
          <h2 id="samples-title" className="text-base font-semibold text-[var(--text)]">All labeled samples</h2>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {report.results.map((result) => (
              <li key={result.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="text-sm text-[var(--text)]">{result.title}</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${result.passed ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-700"}`}>
                  {result.passed ? "Matches labels" : result.knownIssue ? "Known gap" : "Needs attention"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5" aria-labelledby="feedback-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="feedback-title" className="text-base font-semibold text-[var(--text)]">Reviewer feedback</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Reports saved in this browser. A person decides which ones become labeled samples; nothing is added automatically.</p>
            </div>
            <p className="text-xs text-[var(--text-soft)]">
              {summary.total} report{summary.total === 1 ? "" : "s"} · {summary.incorrect} incorrect · {summary.missed} missed · {summary.awaitingTriage} awaiting triage
            </p>
          </div>

          {feedback.length ? (
            <ul className="mt-4 space-y-3">
              {feedback.map((record) => (
                <li key={record.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-soft)]">
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
                    <button type="button" onClick={() => copySample(record)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)] hover:border-[var(--accent-solid)]">
                      {copiedId === record.id ? "Copied" : "Copy as labeled-sample draft"}
                    </button>
                    {record.triage !== "added-to-golden-set" && (
                      <button type="button" onClick={() => changeTriage(record.id, "added-to-golden-set")} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)] hover:border-[var(--accent-solid)]">
                        Mark added to golden set
                      </button>
                    )}
                    {record.triage !== "dismissed" && (
                      <button type="button" onClick={() => changeTriage(record.id, "dismissed")} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-soft)] hover:border-[var(--accent-solid)]">
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