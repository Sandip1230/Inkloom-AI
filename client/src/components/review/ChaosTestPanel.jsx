import { useEffect, useRef, useState } from "react";
import { runChaosTest } from "../../api/reviewToolsApi.js";

export default function ChaosTestPanel({ content, preferredTerms }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const requestId = useRef(0);
  const tests = analysis?.content === content && analysis?.preferredTerms === preferredTerms
    ? analysis.tests
    : null;

  useEffect(() => {
    requestId.current += 1;
    setBusy(false);
    setError("");
    setAnalysis(null);
  }, [content, preferredTerms]);

  useEffect(() => () => {
    requestId.current += 1;
  }, []);

  async function runTest() {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    const draft = content;
    const guidelines = preferredTerms;
    setBusy(true);
    setError("");
    setAnalysis(null);
    try {
      const result = await runChaosTest(draft, guidelines);
      if (requestId.current === currentRequest) {
        setAnalysis({ content: draft, preferredTerms: guidelines, tests: result.tests });
      }
    } catch (requestError) {
      if (requestId.current === currentRequest) setError(requestError.message);
    } finally {
      if (requestId.current === currentRequest) setBusy(false);
    }
  }

  return (
    <section aria-labelledby="chaos-test-title" className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="chaos-test-title" className="text-sm font-semibold text-[var(--text)]">Chaos-Test My Copy</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Ask how this wording could be misunderstood, quoted out of context, or read as a promise.</p>
        </div>
        <button
          type="button"
          onClick={runTest}
          disabled={busy || !content.trim()}
          className="rounded-lg bg-[var(--accent-solid)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Stress-testing…" : tests ? "Run again" : "Stress-test draft"}
        </button>
      </div>
      <p className="mt-2 text-[10px] leading-4 text-[var(--text-soft)]">Your draft is sent to the server-configured AI provider for this request. Results are examples for human review, never approval.</p>
      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-xs text-rose-600">{error}</p>}
      {tests && (
        <div aria-live="polite" className="mt-4 space-y-3">
          {tests.length === 0 ? (
            <p className="rounded-lg border border-[var(--border)] p-3 text-xs text-[var(--text-soft)]">The review did not identify a concrete stress-test example. That is not a guarantee that the copy cannot be misunderstood.</p>
          ) : tests.map((item, index) => (
            <article key={`${index}-${item.excerpt}`} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
              <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">{item.riskType}</span>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">“{item.excerpt}”</p>
              <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]"><strong>Possible reading:</strong> {item.scenario}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]"><strong>Why:</strong> {item.why}</p>
              <p className="mt-2 text-xs font-medium text-[var(--accent-solid)]">Human review question: {item.reviewQuestion}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
