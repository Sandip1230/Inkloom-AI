function scoreTone(score) {
  if (score >= 85) return { ring: "text-emerald-500", bg: "bg-emerald-500/15", label: "Strong" };
  if (score >= 60) return { ring: "text-amber-500", bg: "bg-amber-500/15", label: "Needs work" };
  return { ring: "text-rose-500", bg: "bg-rose-500/15", label: "Weak" };
}

export default function ConsistencyChecker({ findings = [], consistent = false, score, verdict, draftFindingsCount }) {
  const hasScore = typeof score === "number";
  const tone = hasScore ? scoreTone(score) : null;

  return (
    <div>
      <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
        <span
          className={
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold " +
            (hasScore ? `${tone.bg} ${tone.ring}` : consistent ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500")
          }
        >
          {hasScore ? score : consistent ? "✓" : findings.length}
        </span>
        <div>
          <p className="text-sm font-medium text-[var(--text)]">
            {hasScore ? `${tone.label} — ${score}/100` : consistent ? "Looks consistent" : `${findings.length} issue${findings.length === 1 ? "" : "s"} found`}
          </p>
          <p className="text-xs text-[var(--text-soft)]">
            {typeof draftFindingsCount === "number"
              ? `${findings.length} of ${draftFindingsCount} flagged issues survived a second critique pass`
              : "Clichés, contradictions and audience fit"}
          </p>
        </div>
      </div>

      {verdict && <p className="mt-3 text-sm italic text-[var(--text-soft)]">{verdict}</p>}

      {findings.length > 0 && (
        <ul className="mt-4 space-y-4">
          {findings.map((finding, index) => (
            <li key={index} className="rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--text)]">{finding.issue}</p>
                {finding.verdict && (
                  <span className="shrink-0 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-soft)]">
                    {finding.verdict}
                  </span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-red-500/25 bg-red-500/5 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-red-500">Before</span>
                  <p className="mt-1 text-sm text-[var(--text)]">{finding.before}</p>
                </div>
                <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-500">After</span>
                  <p className="mt-1 text-sm text-[var(--text)]">{finding.after}</p>
                </div>
              </div>

              {finding.rationale && <p className="mt-2 text-xs italic text-[var(--text-soft)]">{finding.rationale}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}