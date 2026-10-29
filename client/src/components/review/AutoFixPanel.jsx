import { useEffect, useRef, useState } from "react";
import { rewriteForFindings } from "../../api/reviewToolsApi.js";
import { reviewContent } from "../../lib/governance.js";

const MAX_ROUNDS = 3;

const slim = (finding) => ({
  category: finding.category,
  excerpt: finding.excerpt,
  explanation: finding.explanation,
  suggestion: finding.suggestion,
  replacement: finding.replacement,
});

export default function AutoFixPanel({ content, findings, guidelines, onApply }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rounds, setRounds] = useState([]);
  const [result, setResult] = useState(null);
  const runId = useRef(0);
  const terms = guidelines?.preferredTerms || "";

  // The draft or guidelines changed: forget the old run.
  useEffect(() => {
    runId.current += 1;
    setBusy(false);
    setError("");
    setRounds([]);
    setResult(null);
  }, [content, terms]);

  useEffect(() => () => { runId.current += 1; }, []);

  async function run() {
    const id = ++runId.current;
    setBusy(true);
    setError("");
    setRounds([]);
    setResult(null);

    let current = { content, findings };
    const log = [];
    try {
      for (let round = 1; round <= MAX_ROUNDS && current.findings.length > 0; round += 1) {
        const reply = await rewriteForFindings(current.content, current.findings.map(slim), terms);
        if (runId.current !== id) return;

        // Same rules the review uses, so "clean" means the rule checks pass.
        const nextFindings = reviewContent(reply.content, guidelines);
        log.push({ round, before: current.findings.length, after: nextFindings.length });
        setRounds([...log]);

        // No improvement: keep the previous version and stop instead of looping.
        if (nextFindings.length >= current.findings.length) break;
        current = { content: reply.content, findings: nextFindings };
      }
      if (runId.current === id) setResult(current);
    } catch (requestError) {
      if (runId.current === id) setError(requestError.message);
    } finally {
      if (runId.current === id) setBusy(false);
    }
  }

  function stop() {
    runId.current += 1;
    setBusy(false);
  }

  const improved = result && result.content !== content;

  return (
    <section aria-labelledby="autofix-title" className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="autofix-title" className="text-sm font-semibold text-[var(--text)]">Auto-Fix Loop</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">
            AI rewrites the draft, the rule checks run again, and it repeats (up to {MAX_ROUNDS} rounds) until the findings are gone or stop improving.
          </p>
        </div>
        {busy ? (
          <button type="button" onClick={stop} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text)]">
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={run}
            disabled={!findings.length}
            className="rounded-lg bg-[var(--accent-solid)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {result ? "Run again" : "Fix with AI"}
          </button>
        )}
      </div>

      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-xs text-rose-600">{error}</p>}

      {(busy || rounds.length > 0) && (
        <ol aria-live="polite" className="mt-3 space-y-1 text-xs text-[var(--text)]">
          {rounds.map((item) => (
            <li key={item.round}>
              Round {item.round}: {item.before} → {item.after} finding{item.after === 1 ? "" : "s"}
            </li>
          ))}
          {busy && <li className="text-[var(--text-soft)]">Round {rounds.length + 1}: rewriting…</li>}
        </ol>
      )}

      {result && !busy && (
        <div className="mt-3">
          {improved ? (
            <>
              <p className="text-xs font-medium text-[var(--text)]">
                {result.findings.length === 0
                  ? "The rule checks found nothing in the rewritten draft."
                  : `${result.findings.length} finding${result.findings.length === 1 ? "" : "s"} still remain after the best round.`}
              </p>
              <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-[var(--text)]">{result.content}</pre>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={() => onApply(result)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                  Use this version
                </button>
                <button type="button" onClick={() => { setResult(null); setRounds([]); }} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)]">
                  Discard
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-[var(--text-soft)]">The AI could not reduce the findings without changing the text too much. Your draft is unchanged.</p>
          )}
        </div>
      )}

      <p className="mt-3 text-[10px] leading-4 text-[var(--text-soft)]">
        AI rewrites can change meaning. Read the new text before using it. Nothing is saved or approved until you do that yourself.
      </p>
    </section>
  );
}