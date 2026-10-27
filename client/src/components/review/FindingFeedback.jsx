import { useState } from "react";
import { checkOf } from "../../lib/evaluation/evaluate.js";
import {
  FEEDBACK_CHECKS,
  FEEDBACK_TYPES,
  addFeedback,
} from "../../lib/evaluation/feedbackStore.js";

const SAVED_NOTICE = "Saved for quality review. This does not change this review's decision.";
const FIELD = "mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]";

export default function FindingFeedback({ finding, content, reviewId, reviewerName }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function submit() {
    try {
      const { duplicate } = addFeedback({
        type: FEEDBACK_TYPES.INCORRECT_FINDING,
        check: checkOf(finding),
        excerpt: finding.excerpt,
        note,
        content,
        reviewId,
        reviewerName,
      });
      setMessage(duplicate ? "You already reported this finding." : SAVED_NOTICE);
      setError("");
      setOpen(false);
      setNote("");
    } catch (reason) {
      setError(reason.message);
    }
  }

  return (
    <div className="mt-3 border-t border-[var(--border)] pt-3">
      {!open && (
        <button
          type="button"
          onClick={() => { setOpen(true); setMessage(""); }}
          className="text-xs font-semibold text-[var(--text-soft)] hover:text-[var(--accent-solid)] hover:underline"
        >
          Report incorrect finding
        </button>
      )}
      {open && (
        <div className="fade-in">
          <label className="text-xs font-medium text-[var(--text-soft)]">
            Why is this finding wrong? (optional)
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              placeholder="For example: “best” is part of “best practices”, not a claim"
              className={FIELD}
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={submit} className="rounded-lg bg-[var(--accent-solid)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90">
              Send report
            </button>
            <button type="button" onClick={() => { setOpen(false); setError(""); }} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)]">
              Cancel
            </button>
          </div>
        </div>
      )}
      <p aria-live="polite" className="mt-2 text-[11px] leading-4 text-[var(--text-soft)]">
        {error ? <span className="text-red-600">{error}</span> : message}
      </p>
    </div>
  );
}

export function MissedIssueReport({ content, reviewId, reviewerName }) {
  const [open, setOpen] = useState(false);
  const [check, setCheck] = useState("claim");
  const [excerpt, setExcerpt] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function submit() {
    try {
      const { duplicate } = addFeedback({
        type: FEEDBACK_TYPES.MISSED_ISSUE,
        check,
        excerpt,
        note,
        content,
        reviewId,
        reviewerName,
      });
      setMessage(duplicate ? "You already reported this missed issue." : SAVED_NOTICE);
      setError("");
      setOpen(false);
      setExcerpt("");
      setNote("");
    } catch (reason) {
      setError(reason.message);
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">Did the checks miss something?</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Reports help measure missed issues. They never change this review&apos;s decision.</p>
        </div>
        {!open && (
          <button type="button" onClick={() => { setOpen(true); setMessage(""); }} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)] hover:border-[var(--accent-solid)]">
            Report a missed issue
          </button>
        )}
      </div>
      {open && (
        <div className="fade-in mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-[var(--text-soft)]">
            Type of issue
            <select value={check} onChange={(event) => setCheck(event.target.value)} className={FIELD}>
              {Object.entries(FEEDBACK_CHECKS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-[var(--text-soft)]">
            Exact words that should be flagged
            <input value={excerpt} onChange={(event) => setExcerpt(event.target.value)} maxLength={120} placeholder="For example: unbeatable" className={FIELD} />
          </label>
          <label className="text-xs font-medium text-[var(--text-soft)] sm:col-span-2">
            What was missed?
            <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Describe why this should be flagged" className={FIELD} />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="button" onClick={submit} className="rounded-lg bg-[var(--accent-solid)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90">
              Send report
            </button>
            <button type="button" onClick={() => { setOpen(false); setError(""); }} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)]">
              Cancel
            </button>
          </div>
        </div>
      )}
      <p aria-live="polite" className="mt-2 text-[11px] leading-4 text-[var(--text-soft)]">
        {error ? <span className="text-red-600">{error}</span> : message}
      </p>
    </div>
  );
}