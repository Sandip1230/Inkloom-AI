import { useEffect, useMemo, useRef, useState } from "react";
import { claimsApi } from "../../api/claimReviewApi.js";
import {
  Badge, EmptyNote, ErrorNote, HighlightedExcerpt, Icon, RelationBadge, STATUSES, STATUS_META, StatusBadge,
  cardClass, displayDate, inputClass, primaryBtn,
} from "./shared.jsx";

const FILTERS = [["all", "All"], ["pending", "Awaiting review"], ["reviewed", "Reviewed"]];
const METHOD_NOTE = {
  ai: "AI-suggested, grounded in the excerpts below",
  none: "System-suggested: no matching approved evidence",
  unavailable: "System-suggested: AI analysis was unavailable",
};
const EXAMPLES = [
  "Customer data is encrypted at rest.",
  "Passwords are stored in plain text.",
  "Support is available 24/7 on all plans.",
];
const RELATION_BORDER = {
  supports: "tp-border-l-ok",
  contradicts: "tp-border-l-danger",
  neutral: "border-l-[var(--text-soft)]",
  unassessed: "border-l-[var(--text-soft)]",
};

function locationLabel(location) {
  if (!location) return "";
  const parts = [];
  if (location.section) parts.push(`Section "${location.section}"`);
  if (location.paragraph) parts.push(`paragraph ${location.paragraph}`);
  if (location.line) parts.push(`line ${location.line}`);
  return parts.join(", ");
}

const effectiveStatus = (item) => item.finalDecision?.status || item.suggestion?.status;

/* ---------- Overview: tiles + distribution bar ---------- */

function Overview({ claims }) {
  const stats = useMemo(() => {
    const counts = { Supported: 0, Contradicted: 0, Unverified: 0 };
    let pending = 0;
    claims.forEach((item) => {
      const status = effectiveStatus(item);
      if (counts[status] !== undefined) counts[status] += 1;
      if (item.reviewState === "pending") pending += 1;
    });
    return { counts, pending, total: claims.length };
  }, [claims]);

  if (stats.total === 0) return null;

  const tiles = [
    { label: "Total claims", value: stats.total, icon: "message", tone: "tp-text-accent" },
    { label: "Awaiting review", value: stats.pending, icon: "clock", tone: "tp-text-warn" },
    ...STATUSES.map((status) => ({
      label: status, value: stats.counts[status], icon: STATUS_META[status].icon, tone: STATUS_META[status].text,
    })),
  ];

  return (
    <section className={`${cardClass} cr-rise`} aria-label="Claims overview">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <li key={tile.label} className="tp-stat tp-stat--col">
            <p className={`flex items-center gap-1.5 text-[11px] font-medium ${tile.tone}`}>
              <Icon name={tile.icon} size={13} /> {tile.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--text)]">{tile.value}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <p className="text-[11px] font-medium text-[var(--text-soft)]">Outcome mix (final decision, or AI suggestion until reviewed)</p>
        <div
          className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]"
          role="img"
          aria-label={STATUSES.map((status) => `${stats.counts[status]} ${status}`).join(", ")}
        >
          {STATUSES.map((status) => (
            <span
              key={status}
              className={`cr-bar-seg ${STATUS_META[status].bar}`}
              style={{ width: `${(stats.counts[status] / stats.total) * 100}%` }}
            />
          ))}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {STATUSES.map((status) => (
            <li key={status} className="flex items-center gap-1.5 text-[11px] text-[var(--text-soft)]">
              <span className={`h-2 w-2 rounded-full ${STATUS_META[status].dot}`} /> {status}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Claim detail pieces ---------- */

function ClaimFlow({ claim }) {
  const decision = claim.finalDecision;
  const steps = [
    {
      key: "submitted",
      icon: "message",
      label: "Submitted",
      detail: `${claim.submittedByName || "Unknown"} · ${displayDate(claim.createdAt)}`,
      done: true,
    },
    {
      key: "suggested",
      icon: "search",
      label: "AI suggestion",
      detail: `${claim.suggestion.status} · ${claim.evidence.length} excerpt${claim.evidence.length === 1 ? "" : "s"}`,
      done: true,
    },
    {
      key: "decision",
      icon: decision ? "shield" : "clock",
      label: decision ? "Human decision" : "Awaiting human review",
      detail: decision ? `${decision.status} · ${decision.reviewerName || "Reviewer"}` : "A reviewer must confirm",
      done: Boolean(decision),
    },
  ];

  return (
    <ol className="flex flex-col gap-2 sm:flex-row sm:items-stretch" aria-label="Claim progress">
      {steps.map((step, index) => (
        <li key={step.key} className="flex flex-1 items-center gap-2">
          <div className={`flex flex-1 items-center gap-3 rounded-xl border p-3 ${step.done ? "tp-panel-ok" : "tp-panel-warn"}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${step.done ? "tp-dot--ok text-white" : "tp-dot--warn text-white"}`}>
              <Icon name={step.done && step.key !== "decision" ? "check" : step.icon} size={15} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text)]">{step.label}</p>
              <p className="truncate text-[11px] text-[var(--text-soft)]" title={step.detail}>{step.detail}</p>
            </div>
          </div>
          {index < steps.length - 1 && <Icon name="arrowRight" size={16} className="hidden text-[var(--text-soft)] sm:block" />}
        </li>
      ))}
    </ol>
  );
}

function EvidencePanel({ evidence, method }) {
  return (
    <section className={cardClass}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        <Icon name="file" size={16} className="text-[var(--accent-solid)]" /> Source evidence
      </h3>
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
            <li
              key={`${item.documentId}-${item.location?.startOffset}-${index}`}
              className={`rounded-xl border border-l-4 border-[var(--border)] p-4 ${method === "ai" ? RELATION_BORDER[item.relation] || "" : ""}`}
            >
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
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Icon name="lock" size={16} className="text-[var(--text-soft)]" /> Human review
        </h3>
        <p className="mt-2 text-xs text-[var(--text-soft)]">Only workspace owners, admins, and reviewers can record the final decision.</p>
      </section>
    );
  }

  const overriding = status !== suggested;
  return (
    <section className={cardClass}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        <Icon name="shield" size={16} className="text-[var(--accent-solid)]" /> Human review
      </h3>
      <p className="mt-1 text-xs text-[var(--text-soft)]">The suggestion is advice only. Check the evidence, then confirm or change the status.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Final status">
        {STATUSES.map((option) => {
          const meta = STATUS_META[option];
          const selected = status === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setStatus(option)}
              className={`rounded-xl border p-3 text-left transition ${selected ? `${meta.panel} ring-2 ring-[color:var(--accent-solid)]` : "border-[var(--border)] hover:border-[var(--accent-solid)]"}`}
            >
              <span className={`flex items-center gap-1.5 text-sm font-semibold ${selected ? meta.text : "text-[var(--text)]"}`}>
                <Icon name={meta.icon} size={15} /> {option}
              </span>
              <span className="mt-1 block text-[11px] leading-4 text-[var(--text-soft)]">{meta.meaning}</span>
              {option === suggested && <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-solid)]">AI suggested</span>}
            </button>
          );
        })}
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
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        <Icon name="clock" size={16} className="text-[var(--accent-solid)]" /> Review history
      </h3>
      <ol className="mt-4">
        {history.map((entry, index) => (
          <li key={`${entry.at}-${index}`} className="relative pb-5 pl-6 last:pb-0">
            {index < history.length - 1 && <span className="absolute left-[5px] top-3 h-full w-px bg-[var(--border)]" aria-hidden="true" />}
            <span className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-[var(--accent-solid)] bg-[var(--surface)]" aria-hidden="true" />
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
  const status = decision?.status || claim.suggestion.status;
  const meta = STATUS_META[status];
  return (
    <div className="cr-rise space-y-5">
      <ClaimFlow claim={claim} />

      <section className={`rounded-2xl border p-5 sm:p-6 ${meta ? meta.panel : "border-[var(--border)] bg-[var(--surface)]"}`}>
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">Submitted claim</p>
        <p className="mt-2 text-lg leading-7 text-[var(--text)]">{claim.claim}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StatusBadge status={status} />
          <span className="text-xs text-[var(--text-soft)]">
            {decision ? "Final decision by a human reviewer" : "AI suggestion - not final until a reviewer confirms"}
          </span>
          {decision?.changedFromSuggestion && <Badge tone="accent">Changed from suggestion</Badge>}
        </div>
        {meta && <p className={`mt-2 text-xs ${meta.text}`}>{meta.meaning}</p>}
      </section>

      <section className={cardClass}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-soft)]"><Icon name="sparkle" size={13} /> AI-suggested status</p>
            <div className="mt-2"><StatusBadge status={claim.suggestion.status} /></div>
            <p className="mt-2 text-[11px] text-[var(--text-soft)]">{METHOD_NOTE[claim.suggestion.method]}{claim.suggestion.model ? ` (${claim.suggestion.model})` : ""}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-soft)]"><Icon name="shield" size={13} /> Final decision</p>
            {decision ? (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={decision.status} />
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

/* ---------- Main panel ---------- */

export default function ClaimsPanel({ workspaceId, canReview }) {
  const [claims, setClaims] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [claimText, setClaimText] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const detailRef = useRef(null);

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

  function chooseClaim(id) {
    setSelectedId(id);
    // On small screens the detail sits below the list - bring it into view.
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => detailRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" }), 60);
    }
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
      setFilter("all");
      setSearch("");
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

  const pendingCount = claims.filter((item) => item.reviewState === "pending").length;
  const reviewedCount = claims.length - pendingCount;
  const counts = { all: claims.length, pending: pendingCount, reviewed: reviewedCount };
  const needle = search.trim().toLowerCase();
  const visible = claims.filter((item) => (
    (filter === "all" || item.reviewState === filter)
    && (!needle || item.claim.toLowerCase().includes(needle))
  ));

  return (
    <div className="mt-6 space-y-5">
      <Overview claims={claims} />

      <form onSubmit={submitClaim} className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <label htmlFor="claim-input" className="flex items-center gap-2 text-base font-semibold text-[var(--text)]">
              <Icon name="search" size={18} className="text-[var(--accent-solid)]" /> Check a claim
            </label>
            <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Enter a statement. It is compared only with approved reference documents, and a human reviewer makes the final call.</p>
          </div>
          <Badge tone="muted">Step 4 of 5</Badge>
        </div>
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
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-[var(--text-soft)]">Try an example:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setClaimText(example)}
              className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--text-soft)] transition hover:border-[var(--accent-solid)] hover:text-[var(--text)]"
            >
              {example}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button disabled={submitting || claimText.trim().length < 5} className={primaryBtn}>{submitting ? "Checking sources..." : "Check claim"}</button>
          <span className="text-[11px] text-[var(--text-soft)]">{claimText.length} / 2000</span>
          {submitting && <span role="status" className="text-[11px] text-[var(--text-soft)]">Searching approved documents and preparing a suggestion...</span>}
        </div>
      </form>

      <ErrorNote message={error} />

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className={`${cardClass} self-start`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--text)]">Claims</h2>
            {pendingCount > 0 && <Badge tone="warn">{pendingCount} awaiting review</Badge>}
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search claims..."
            aria-label="Search claims"
            className={inputClass}
          />
          <div className="mt-3 flex flex-wrap gap-1" role="tablist" aria-label="Claim filter">
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${filter === key ? "bg-[var(--accent-solid)]/10 text-[var(--accent-solid)]" : "text-[var(--text-soft)] hover:text-[var(--text)]"}`}
              >
                {label} <span className="opacity-70">({counts[key]})</span>
              </button>
            ))}
          </div>
          <div className="mt-3">
            {loading ? (
              <div className="space-y-2" aria-busy="true">
                {[0, 1, 2].map((key) => <div key={key} className="h-16 animate-pulse rounded-lg bg-[var(--surface-2)]" />)}
              </div>
            ) : visible.length === 0 ? (
              <EmptyNote>{claims.length ? "No claims match this filter." : "No claims yet. Submit one above or try an example."}</EmptyNote>
            ) : (
              <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                {visible.map((item) => {
                  const status = effectiveStatus(item);
                  const meta = STATUS_META[status];
                  return (
                    <li key={item._id}>
                      <button
                        type="button"
                        onClick={() => chooseClaim(item._id)}
                        aria-current={selectedId === item._id ? "true" : undefined}
                        className={`w-full rounded-lg border border-l-4 p-3 text-left transition ${meta ? meta.border : ""} ${selectedId === item._id ? "border-[var(--accent-solid)] bg-[var(--accent-solid)]/5" : "border-[var(--border)] hover:border-[var(--accent-solid)]"}`}
                      >
                        <p className="line-clamp-2 text-sm text-[var(--text)]">{item.claim}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {item.finalDecision
                            ? <>
                                <StatusBadge status={item.finalDecision.status} />
                                {item.finalDecision.changedFromSuggestion && <Badge tone="accent" title={`AI suggested ${item.suggestion.status}`}>Changed</Badge>}
                              </>
                            : <><StatusBadge status={item.suggestion.status} /><span className="text-[11px] text-[var(--text-soft)]">AI-suggested, awaiting review</span></>}
                        </div>
                        {item.finalDecision ? (
                          <p className="mt-1 text-[11px] text-[var(--text-soft)]">
                            Reviewed by <span className="font-medium text-[var(--text)]">{item.finalDecision.reviewerName || "Unknown reviewer"}</span> · {displayDate(item.finalDecision.reviewedAt)}
                          </p>
                        ) : (
                          <p className="mt-1 text-[11px] text-[var(--text-soft)]">Submitted by {item.submittedByName || "Unknown"} · {displayDate(item.createdAt)}</p>
                        )}
                        {typeof item.evidenceCount === "number" && (
                          <p className="mt-1 text-[11px] text-[var(--text-soft)]">{item.evidenceCount} evidence excerpt{item.evidenceCount === 1 ? "" : "s"}</p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <div className="min-w-0" ref={detailRef}>
          {selected && selected._id === selectedId ? (
            <ClaimDetail claim={selected} canReview={canReview} saving={saving} onReview={review} />
          ) : selectedId ? (
            <div className="space-y-3" aria-busy="true">
              <div className="h-16 animate-pulse rounded-xl bg-[var(--surface-2)]" />
              <div className="h-40 animate-pulse rounded-2xl bg-[var(--surface-2)]" />
            </div>
          ) : (
            <EmptyNote>Select a claim to see its progress, evidence, suggested status, and review controls.</EmptyNote>
          )}
        </div>
      </div>
    </div>
  );
}