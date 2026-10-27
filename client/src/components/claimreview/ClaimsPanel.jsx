import { useEffect, useState } from "react";
import { claimsApi } from "../../api/claimReviewApi.js";
import {
  Badge, EmptyNote, ErrorNote, HighlightedExcerpt, RelationBadge, STATUSES, StatusBadge,
  cardClass, displayDate, inputClass, primaryBtn,
} from "./shared.jsx";

const FILTERS = [["all", "All"], ["pending", "Awaiting review"], ["reviewed", "Reviewed"]];
const METHOD_NOTE = {
  ai: "AI-suggested, grounded in the excerpts below",
  none: "System-suggested: no matching approved evidence",
  unavailable: "System-suggested: AI analysis was unavailable",
};

function locationLabel(location) {
  if (!location) return "";
  const parts = [];
  if (location.section) parts.push(`Section "${location.section}"`);
  if (location.paragraph) parts.push(`paragraph ${location.paragraph}`);
  if (location.line) parts.push(`line ${location.line}`);
  return parts.join(", ");
}

function EvidencePanel({ evidence, method }) {
  return (
    <section className={cardClass}>
      <h3 className="text-sm font-semibold text-[var(--text)]">Source evidence</h3>
      <p className="mt-1 text-xs text-[var(--text-soft)]">Verbatim excerpts from approved reference documents only.</p>
      {evidence.length === 0 ? (
        <div className="mt-4">
          <EmptyNote>
            No relevant passage was found in the approved reference documents. This does not mean the claim is false - the available sources simply cannot verify it.
          </EmptyNote>
        </div>
      ) : (
        <ol className="mt-4 space-y-3">
          {evidence.map((item, index) => (
            <li key={`${item.documentId}-${item.location?.startOffset}-${index}`} className="rounded-xl border border-[var(--border)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[var(--text)]">E{index + 1} · {item.documentTitle} <span className="font-normal text-[var(--text-soft)]">· v{item.version}</span></p>
                {method === "ai" && <RelationBadge relation={item.relation} />}
              </div>
              <blockquote className="mt-2 border-l-2 border-[var(--accent-solid)] pl-3 text-sm leading-6 text-[var(--text)]">
                <HighlightedExcerpt excerpt={item.excerpt} quote={item.quote} />
              </blockquote>
              <p className="mt-2 text-[11px] text-[var(--text-soft)]">
                Owner: {item.documentOwner || "Not recorded"}
                {locationLabel(item.location) ? ` · ${locationLabel(item.location)}` : ""}
                {item.contentHash ? ` · Fingerprint ${item.contentHash.slice(0, 8)}` : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ReviewerControls({ claim, canReview, saving, onSubmit }) {
  const suggested = claim.suggestion.status;
  const [status, setStatus] = useState(claim.finalDecision?.status || suggested);
  const [notes, setNotes] = useState(claim.finalDecision?.notes || "");

  if (!canReview) {
    return (
      <section className={cardClass}>
        <h3 className="text-sm font-semibold text-[var(--text)]">Human review</h3>
        <p className="mt-2 text-xs text-[var(--text-soft)]">Only workspace owners, admins, and reviewers can record the final decision.</p>
      </section>
    );
  }

  const overriding = status !== suggested;
  return (
    <section className={cardClass}>
      <h3 className="text-sm font-semibold text-[var(--text)]">Human review</h3>
      <p className="mt-1 text-xs text-[var(--text-soft)]">The suggestion is advice only. Check the evidence, then confirm or change the status.</p>
      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Final status">
        {STATUSES.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={status === option}
            onClick={() => setStatus(option)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${status === option ? "border-[var(--accent-solid)] bg-[var(--accent-solid)]/10 text-[var(--accent-solid)]" : "border-[var(--border)] text-[var(--text)] hover:border-[var(--accent-solid)]"}`}
          >
            {option}{option === suggested ? " (suggested)" : ""}
          </button>
        ))}
      </div>
      <label className="mt-4 block text-xs font-medium text-[var(--text-soft)]">
        Review notes {overriding ? "(explain why you changed the suggestion)" : "(optional)"}
        <textarea rows={3} maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} className={inputClass} />
      </label>
      <button
        type="button"
        disabled={saving}
        onClick={() => onSubmit({ status, notes })}
        className={`${primaryBtn} mt-4`}
      >
        {saving ? "Saving..." : overriding ? `Change to ${status}` : claim.reviewState === "reviewed" ? `Re-confirm ${status}` : `Confirm ${status}`}
      </button>
    </section>
  );
}

function History({ history }) {
  return (
    <section className={cardClass}>
      <h3 className="text-sm font-semibold text-[var(--text)]">Review history</h3>
      <ol className="mt-4 space-y-4">
        {history.map((entry, index) => (
          <li key={`${entry.at}-${index}`} className="border-l-2 border-[var(--border)] pl-3">
            <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--text)]">
              {entry.action === "submitted" && "Claim submitted"}
              {entry.action === "suggested" && "Status suggested"}
              {entry.action === "reviewed" && "Final decision recorded"}
              {entry.status && <StatusBadge status={entry.status} />}
              {entry.previousStatus && <span className="font-normal text-[var(--text-soft)]">(was {entry.previousStatus})</span>}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-soft)]">{entry.byName || "System"} · {displayDate(entry.at)}</p>
            {entry.notes && <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{entry.notes}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}

function ClaimDetail({ claim, canReview, saving, onReview }) {
  const decision = claim.finalDecision;
  return (
    <div className="space-y-5">
      <section className={cardClass}>
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">Submitted claim</p>
        <p className="mt-2 text-base leading-7 text-[var(--text)]">{claim.claim}</p>
        <p className="mt-2 text-[11px] text-[var(--text-soft)]">By {claim.submittedByName || "Unknown"} · {displayDate(claim.createdAt)}</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] p-4">
            <p className="text-xs font-medium text-[var(--text-soft)]">AI-suggested status</p>
            <div className="mt-2"><StatusBadge status={claim.suggestion.status} /></div>
            <p className="mt-2 text-[11px] text-[var(--text-soft)]">{METHOD_NOTE[claim.suggestion.method]}{claim.suggestion.model ? ` (${claim.suggestion.model})` : ""}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-4">
            <p className="text-xs font-medium text-[var(--text-soft)]">Final decision</p>
            {decision ? (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={decision.status} />
                  {decision.changedFromSuggestion && <Badge tone="accent">Changed from suggestion</Badge>}
                </div>
                <p className="mt-2 text-[11px] text-[var(--text-soft)]">{decision.reviewerName} · {displayDate(decision.reviewedAt)}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-[var(--text-soft)]">Awaiting human review</p>
            )}
          </div>
        </div>
        {claim.suggestion.rationale && (
          <p className="mt-4 text-sm leading-6 text-[var(--text)]"><span className="font-medium">Why: </span>{claim.suggestion.rationale}</p>
        )}
        {decision?.notes && <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]"><span className="font-medium">Reviewer notes: </span>{decision.notes}</p>}
      </section>

      <EvidencePanel evidence={claim.evidence} method={claim.suggestion.method} />
      <ReviewerControls key={`${claim._id}-${claim.updatedAt}`} claim={claim} canReview={canReview} saving={saving} onSubmit={onReview} />
      <History history={claim.history} />
    </div>
  );
}

export default function ClaimsPanel({ workspaceId, canReview }) {
  const [claims, setClaims] = useState([]);
  const [filter, setFilter] = useState("all");
  const [claimText, setClaimText] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSelectedId("");
    setSelected(null);
    claimsApi.list(workspaceId)
      .then((data) => { if (active) { setClaims(data.claims); setError(""); } })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [workspaceId]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let active = true;
    claimsApi.get(workspaceId, selectedId)
      .then((data) => { if (active) { setSelected(data); setError(""); } })
      .catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [workspaceId, selectedId]);

  function toListItem(claim) {
    const { evidence, history, ...rest } = claim;
    return { ...rest, evidenceCount: evidence.length };
  }

  async function submitClaim(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const created = await claimsApi.submit(workspaceId, claimText);
      setClaims((current) => [toListItem(created), ...current]);
      setSelected(created);
      setSelectedId(created._id);
      setClaimText("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function review({ status, notes }) {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const updated = await claimsApi.review(workspaceId, selected._id, { status, notes });
      setSelected(updated);
      setClaims((current) => current.map((item) => (item._id === updated._id ? toListItem(updated) : item)));
    } catch (reviewError) {
      setError(reviewError.message);
    } finally {
      setSaving(false);
    }
  }

  const visible = claims.filter((item) => filter === "all" || item.reviewState === filter);
  const pendingCount = claims.filter((item) => item.reviewState === "pending").length;

  return (
    <div className="mt-6 space-y-5">
      <form onSubmit={submitClaim} className={cardClass}>
        <label htmlFor="claim-input" className="text-base font-semibold text-[var(--text)]">Check a claim</label>
        <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Enter a statement. It is compared only with approved reference documents, and a human reviewer makes the final call.</p>
        <textarea
          id="claim-input"
          required
          minLength={5}
          maxLength={2000}
          rows={3}
          value={claimText}
          onChange={(event) => setClaimText(event.target.value)}
          className={inputClass}
          placeholder="e.g. The system stores user passwords in plain text."
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button disabled={submitting || claimText.trim().length < 5} className={primaryBtn}>{submitting ? "Checking sources..." : "Check claim"}</button>
          <span className="text-[11px] text-[var(--text-soft)]">{claimText.length} / 2000</span>
        </div>
      </form>

      <ErrorNote message={error} />

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className={`${cardClass} self-start`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--text)]">Claims</h2>
            {pendingCount > 0 && <Badge tone="warn">{pendingCount} awaiting review</Badge>}
          </div>
          <div className="mt-3 flex gap-1" role="tablist" aria-label="Claim filter">
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${filter === key ? "bg-[var(--accent-solid)]/10 text-[var(--accent-solid)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3">
            {loading ? (
              <p className="text-sm text-[var(--text-soft)]">Loading claims...</p>
            ) : visible.length === 0 ? (
              <EmptyNote>{claims.length ? "No claims match this filter." : "No claims yet. Submit one above."}</EmptyNote>
            ) : (
              <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                {visible.map((item) => (
                  <li key={item._id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item._id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${selectedId === item._id ? "border-[var(--accent-solid)] bg-[var(--accent-solid)]/5" : "border-[var(--border)] hover:border-[var(--accent-solid)]"}`}
                    >
                      <p className="line-clamp-2 text-sm text-[var(--text)]">{item.claim}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {item.finalDecision
                          ? <><StatusBadge status={item.finalDecision.status} /><span className="text-[11px] text-[var(--text-soft)]">Reviewed</span></>
                          : <><StatusBadge status={item.suggestion.status} /><span className="text-[11px] text-[var(--text-soft)]">Suggested</span></>}
                      </div>
                      <p className="mt-1 text-[11px] text-[var(--text-soft)]">{displayDate(item.createdAt)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <div className="min-w-0">
          {selected && selected._id === selectedId ? (
            <ClaimDetail claim={selected} canReview={canReview} saving={saving} onReview={review} />
          ) : selectedId ? (
            <p className="text-sm text-[var(--text-soft)]">Loading claim...</p>
          ) : (
            <EmptyNote>Select a claim to see its evidence, suggested status, and review controls.</EmptyNote>
          )}
        </div>
      </div>
    </div>
  );
}