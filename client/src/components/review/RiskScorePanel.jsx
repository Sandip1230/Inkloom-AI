import { useMemo } from "react";
import { scoreRisk } from "../../lib/riskScore.js";

const barColor = (score) =>
  score >= 70 ? "bg-rose-500" : score >= 45 ? "bg-amber-500" : score >= 20 ? "bg-sky-500" : "bg-emerald-500";

export default function RiskScorePanel({ content, findings }) {
  const risk = useMemo(() => scoreRisk(content, findings), [content, findings]);

  return (
    <section aria-labelledby="risk-score-title" className="mt-4 rounded-xl border border-[var(--border)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="risk-score-title" className="text-sm font-semibold text-[var(--text)]">Backlash &amp; risk score</h3>
          <p className="mt-1 text-xs text-[var(--text-soft)]">PR, legal and tone risk from rule checks. 0 is calm, 100 is severe.</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-[var(--text)]">
            {risk.overall}<span className="text-sm font-medium text-[var(--text-soft)]">/100</span>
          </p>
          <p className="text-xs font-semibold text-[var(--text-soft)]">{risk.level} risk</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {risk.dimensions.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-xs text-[var(--text-soft)]">{item.label}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <span className={`block h-full rounded-full ${barColor(item.score)}`} style={{ width: `${item.score}%` }} />
            </span>
            <span className="w-8 text-right text-xs font-semibold text-[var(--text)]">{item.score}</span>
          </li>
        ))}
      </ul>

      {risk.lines.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">Which lines add the most risk</h4>
          <ol className="mt-2 space-y-2">
            {risk.lines.slice(0, 5).map((line, index) => (
              <li key={`${index}-${line.text}`} className="rounded-lg bg-[var(--surface-2)]/50 p-2.5 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[var(--text)]">“{line.text}”</p>
                  <span className="shrink-0 font-semibold text-rose-600">{line.share}% of risk</span>
                </div>
                <p className="mt-1 text-[var(--text-soft)]">
                  {[...new Set(line.hits.map((hit) => hit.reason))].join(" · ")}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="mt-4 text-xs text-[var(--text-soft)]">These checks found no risky wording.</p>
      )}

      <p className="mt-3 text-[10px] leading-4 text-[var(--text-soft)]">
        Heuristic score from word patterns. It is not legal advice and cannot judge context. A person still decides.
      </p>
    </section>
  );
}