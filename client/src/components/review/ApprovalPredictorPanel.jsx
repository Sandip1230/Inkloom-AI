import { useMemo } from "react";
import { predictApproval } from "../../lib/approvalPredictor.js";

const barColor = (percent) => (percent >= 60 ? "bg-emerald-500" : percent >= 40 ? "bg-amber-500" : "bg-rose-500");

export default function ApprovalPredictorPanel({ findings, contentType, reviews, currentId }) {
  const result = useMemo(
    () => predictApproval({ findings, contentType }, reviews, { excludeId: currentId }),
    [findings, contentType, reviews, currentId],
  );

  return (
    <section aria-labelledby="predictor-title" className="mt-4 rounded-xl border border-[var(--border)] p-4">
      <h3 id="predictor-title" className="text-sm font-semibold text-[var(--text)]">Approval predictor</h3>

      {!result.ready ? (
        <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">
          Not enough history yet. It needs at least {result.needed} past decisions, with both “Approved” and
          “Changes requested” among them. You have {result.total} so far.
        </p>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <p className="w-20 shrink-0 text-2xl font-bold text-[var(--text)]">{result.percent}%</p>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <span className={`block h-full rounded-full ${barColor(result.percent)}`} style={{ width: `${result.percent}%` }} />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-soft)]">
            Chance a reviewer approves this draft · based on {result.total} past decisions ({result.approved} approved,{" "}
            {result.rejected} sent back) · confidence: {result.confidence}
          </p>

          {result.reasons.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {result.reasons.map((reason) => (
                <li key={reason.feature} className="text-xs text-[var(--text)]">
                  <span className={reason.direction === "up" ? "text-emerald-600" : "text-rose-600"}>
                    {reason.direction === "up" ? "▲" : "▼"}
                  </span>{" "}
                  {reason.text}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <p className="mt-3 text-[10px] leading-4 text-[var(--text-soft)]">
        An estimate from your past decisions, not an approval. A human reviewer still decides.
      </p>
    </section>
  );
}