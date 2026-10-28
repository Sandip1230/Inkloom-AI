import { useEffect, useState } from "react";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { getReviewActivity } from "../../api/reviewsApi.js";

const REVIEWER_ROLES = ["owner", "admin", "reviewer"];
const inputClass = "mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]";
const smallBtn = "rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)] hover:border-[var(--accent-solid)] disabled:opacity-50";

function formatTime(ms) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(ms));
}

export default function TeamReviewPanel({ review, store, note, onNoteChange, onDecision, busy }) {
  const { role, members } = useWorkspace();
  const can = review?.can || {};
  const [selected, setSelected] = useState([]);
  const [text, setText] = useState("");
  const [panelError, setPanelError] = useState("");
  const [working, setWorking] = useState(false);
  const [showTrail, setShowTrail] = useState(false);
  const [trail, setTrail] = useState([]);

  const assigneeKey = (review?.assignees || []).map((item) => item.id).join(",");
  const eligible = members.filter((member) => REVIEWER_ROLES.includes(member.role));
  const dirty = [...selected].sort().join(",") !== assigneeKey.split(",").filter(Boolean).sort().join(",");
  const disabled = busy || working || !review;
  const anyDecision = can.requestApproval || can.requestChanges || can.approve;

  useEffect(() => {
    setSelected(assigneeKey ? assigneeKey.split(",") : []);
  }, [review?.id, assigneeKey]);

  useEffect(() => {
    setText("");
    setPanelError("");
    setShowTrail(false);
    setTrail([]);
  }, [review?.id]);

  useEffect(() => {
    if (!showTrail || !review?.id) return undefined;
    let active = true;
    getReviewActivity(store.workspaceId, review.id)
      .then((events) => { if (active) setTrail(events); })
      .catch((error) => { if (active) setPanelError(error.message); });
    return () => { active = false; };
  }, [showTrail, review?.id, review?.updatedAt, store.workspaceId]);

  async function run(action) {
    setWorking(true);
    setPanelError("");
    try {
      await action();
    } catch (error) {
      setPanelError(error.message);
    } finally {
      setWorking(false);
    }
  }

  function toggle(id) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <div className="mt-5 space-y-4 rounded-xl border border-[var(--border)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--text)]">Team review</h3>
        <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-[11px] text-[var(--text-soft)]">Your role: {role || "…"}</span>
      </div>

      {!review && (
        <p className="text-xs text-[var(--text-soft)]">
          Run the review first. It is then saved to the workspace, and you can assign reviewers, comment and decide.
        </p>
      )}

      {/* Reviewers */}
      <section aria-labelledby="assign-title">
        <h4 id="assign-title" className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">Reviewers</h4>
        {review?.assignees?.length ? (
          <p className="mt-1.5 text-sm text-[var(--text)]">{review.assignees.map((item) => item.name).join(", ")}</p>
        ) : (
          <p className="mt-1.5 text-xs text-[var(--text-soft)]">No one assigned yet. Any reviewer or admin can decide.</p>
        )}
        {can.assign && (
          <div className="mt-2 space-y-2">
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {eligible.map((member) => (
                <li key={member.id}>
                  <label className="flex items-center gap-2 text-xs text-[var(--text)]">
                    <input type="checkbox" checked={selected.includes(member.id)} onChange={() => toggle(member.id)} disabled={disabled} />
                    {member.name} <span className="text-[var(--text-soft)]">({member.role})</span>
                  </label>
                </li>
              ))}
            </ul>
            <button type="button" className={smallBtn} disabled={disabled || !dirty} onClick={() => run(() => store.assign(review.id, selected))}>
              Save reviewers
            </button>
          </div>
        )}
      </section>

      {/* Decision */}
      <section aria-labelledby="decision-title">
        <h4 id="decision-title" className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">Decision</h4>
        <label className="mt-2 block text-xs font-medium text-[var(--text-soft)]">
          Decision note
          <input value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="Required when requesting changes" className={inputClass} />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={disabled || !can.requestApproval} onClick={() => onDecision("Awaiting approval")} className={smallBtn}>Request approval</button>
          <button type="button" disabled={disabled || !can.requestChanges} onClick={() => onDecision("Changes requested")} className="rounded-lg border border-amber-500/30 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-500/5 disabled:opacity-50">Request changes</button>
          <button type="button" disabled={disabled || !can.approve} onClick={() => onDecision("Approved")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Approve draft</button>
        </div>
        {review && !anyDecision && (
          <p className="mt-2 text-[11px] text-[var(--text-soft)]">
            No decision is available to you right now. Status is “{review.status}”. Only the author or an admin can request approval, and only assigned reviewers or admins can approve.
          </p>
        )}
        <p className="mt-3 text-[11px] leading-4 text-[var(--text-soft)]">
          Approval is a human decision. Inkloom’s automated checks do not publish content or replace legal, factual, or brand-owner review.
        </p>
      </section>

      {/* Decision history */}
      {review && (
        <section aria-labelledby="history-title">
          <h4 id="history-title" className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">Decision history</h4>
          <ol className="mt-2 space-y-2">
            {[...review.decisions].reverse().map((item) => (
              <li key={item.id} className="rounded-lg bg-[var(--surface-2)]/50 p-2.5 text-xs text-[var(--text)]">
                <span className="font-semibold">{item.status}</span> · {item.actorName} · <span className="text-[var(--text-soft)]">{formatTime(item.createdAt)}</span>
                {item.note && <p className="mt-1 text-[var(--text-soft)]">{item.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Comments */}
      {review && (
        <section aria-labelledby="comments-title">
          <h4 id="comments-title" className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">Comments ({review.comments.length})</h4>
          <ul className="mt-2 space-y-2">
            {review.comments.map((item) => (
              <li key={item.id} className="rounded-lg border border-[var(--border)] p-2.5 text-xs">
                <p className="text-[var(--text)]"><span className="font-semibold">{item.authorName}</span> · <span className="text-[var(--text-soft)]">{formatTime(item.createdAt)}</span></p>
                <p className="mt-1 whitespace-pre-wrap text-[var(--text)]">{item.text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            <input value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} placeholder="Add a comment for your team" className={`${inputClass} mt-0`} />
            <button type="button" className={smallBtn} disabled={disabled || !text.trim()} onClick={() => run(async () => { await store.addComment(review.id, text); setText(""); })}>
              Post
            </button>
          </div>
        </section>
      )}

      {/* Audit trail */}
      {review && (
        <section aria-labelledby="audit-title">
          <button type="button" id="audit-title" onClick={() => setShowTrail((state) => !state)} aria-expanded={showTrail} className="text-xs font-semibold text-[var(--accent-solid)]">
            {showTrail ? "Hide audit trail" : "Show audit trail"}
          </button>
          {showTrail && (
            <ul className="mt-2 space-y-1.5">
              {trail.length === 0 && <li className="text-xs text-[var(--text-soft)]">No audit events yet.</li>}
              {trail.map((event) => (
                <li key={event.id} className="text-xs text-[var(--text)]">
                  <span className="text-[var(--text-soft)]">{formatTime(event.createdAt)}</span> · <span className="font-semibold">{event.actor}</span> · {event.summary}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {panelError && <p role="alert" className="text-xs text-red-500">{panelError}</p>}
    </div>
  );
}