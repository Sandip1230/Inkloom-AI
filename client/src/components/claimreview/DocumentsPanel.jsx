import { useCallback, useEffect, useState } from "react";
import { documentsApi } from "../../api/claimReviewApi.js";
import {
  ApprovalBadge, Badge, EmptyNote, ErrorNote, cardClass, displayDate, ghostBtn, inputClass, primaryBtn, smallBtn,
} from "./shared.jsx";

const MAX_CHARS = 200000;
const MAX_FILE_BYTES = 1024 * 1024;
const TEXT_EXTENSIONS = [".txt", ".md", ".markdown", ".csv", ".json", ".log"];

function emptyForm() {
  return { mode: "new", documentId: "", title: "", owner: "", description: "", content: "", sourceFileName: "", changeNote: "", approve: false };
}

export default function DocumentsPanel({ workspaceId, canManage }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(null);
  const [expandedId, setExpandedId] = useState("");
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    const data = await documentsApi.list(workspaceId);
    setDocuments(data.documents);
  }, [workspaceId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setForm(null);
    setPreview(null);
    setExpandedId("");
    documentsApi.list(workspaceId)
      .then((data) => { if (active) { setDocuments(data.documents); setError(""); } })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [workspaceId]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function run(action, message) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await action();
      await load();
      setNotice(message);
      return true;
    } catch (actionError) {
      setError(actionError.message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      setError(`Upload a text-based file (${TEXT_EXTENSIONS.join(", ")}). For PDF or Word files, copy the text into the box instead.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("That file is larger than 1 MB. Split it into smaller reference documents.");
      return;
    }
    const text = await file.text();
    if (text.length > MAX_CHARS) {
      setError(`That file has more than ${MAX_CHARS.toLocaleString()} characters. Split it into smaller reference documents.`);
      return;
    }
    setError("");
    setForm((current) => ({ ...current, content: text, sourceFileName: file.name, title: current.title || file.name.replace(/\.[^.]+$/, "") }));
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!form) return;
    const body = {
      title: form.title,
      owner: form.owner,
      description: form.description,
      content: form.content,
      sourceFileName: form.sourceFileName,
      changeNote: form.changeNote,
      approve: form.approve,
    };
    const ok = form.mode === "new"
      ? await run(() => documentsApi.create(workspaceId, body), form.approve ? "Document added and approved." : "Document added. It needs approval before it is searched.")
      : await run(() => documentsApi.addVersion(workspaceId, form.documentId, body), form.approve ? "New version added and approved." : "New version added. It needs approval before it is searched.");
    if (ok) setForm(null);
  }

  function startNewVersion(doc) {
    setForm({ ...emptyForm(), mode: "version", documentId: doc._id, title: doc.title, owner: doc.owner, description: doc.description });
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  }

  async function openVersion(doc, version) {
    setError("");
    try {
      const data = await documentsApi.getVersion(workspaceId, doc._id, version);
      setPreview({ title: doc.title, version, content: data.content });
    } catch (previewError) {
      setError(previewError.message);
    }
  }

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const searchableCount = documents.filter((doc) => doc.activeVersion).length;

  return (
    <div className="mt-6 space-y-5">
      <section className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">Approved reference documents</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--text-soft)]">
              Claims are checked only against the approved version of each active document. New versions stay out of search until an owner or admin approves them.
              {" "}{searchableCount} of {documents.length} document{documents.length === 1 ? "" : "s"} currently searchable.
            </p>
          </div>
          {canManage && !form && (
            <button type="button" onClick={() => setForm(emptyForm())} className={primaryBtn}>Add document</button>
          )}
        </div>
        {!canManage && (
          <p className="mt-3 text-xs text-[var(--text-soft)]">Only workspace owners and admins can add or approve reference documents.</p>
        )}
      </section>

      {notice && <p role="status" className="rounded-lg border tp-tone-ok">{notice}</p>}
      <ErrorNote message={error} />

      {form && canManage && (
        <form onSubmit={submitForm} className={`${cardClass} space-y-4`}>
          <h3 className="text-sm font-semibold text-[var(--text)]">
            {form.mode === "new" ? "Add a reference document" : `New version of "${form.title}"`}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-[var(--text-soft)]">
              Title
              <input required maxLength={160} value={form.title} onChange={set("title")} disabled={form.mode === "version"} className={inputClass} placeholder="Security whitepaper" />
            </label>
            <label className="block text-xs font-medium text-[var(--text-soft)]">
              Owner (person or team responsible)
              <input required maxLength={160} value={form.owner} onChange={set("owner")} disabled={form.mode === "version"} className={inputClass} placeholder="Security team" />
            </label>
          </div>
          {form.mode === "new" && (
            <label className="block text-xs font-medium text-[var(--text-soft)]">
              Description (optional)
              <input maxLength={500} value={form.description} onChange={set("description")} className={inputClass} placeholder="What this source covers" />
            </label>
          )}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="doc-content" className="text-xs font-medium text-[var(--text-soft)]">Document text</label>
              <label className={`${smallBtn} cursor-pointer`}>
                Upload text file
                <input type="file" accept={TEXT_EXTENSIONS.join(",")} onChange={handleFile} className="sr-only" />
              </label>
            </div>
            <textarea
              id="doc-content"
              required
              rows={10}
              maxLength={MAX_CHARS}
              value={form.content}
              onChange={set("content")}
              className={`${inputClass} font-mono text-xs leading-5`}
              placeholder="Paste the approved text here, or upload a .txt / .md / .csv / .json file. Use blank lines between paragraphs and # headings so excerpts can show their location."
            />
            <p className="mt-1 text-[11px] text-[var(--text-soft)]">
              {form.content.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters{form.sourceFileName ? ` · from ${form.sourceFileName}` : ""}
            </p>
          </div>
          <label className="block text-xs font-medium text-[var(--text-soft)]">
            Change note (optional)
            <input maxLength={500} value={form.changeNote} onChange={set("changeNote")} className={inputClass} placeholder={form.mode === "new" ? "Initial version" : "What changed in this version"} />
          </label>
          <label className="flex items-start gap-2 text-sm text-[var(--text)]">
            <input type="checkbox" checked={form.approve} onChange={(event) => setForm((current) => ({ ...current, approve: event.target.checked }))} className="mt-1" />
            <span>Approve this version now <span className="block text-xs text-[var(--text-soft)]">Leave unchecked to review it first. Unapproved versions are never used as evidence.</span></span>
          </label>
          <div className="flex flex-wrap gap-3">
            <button disabled={saving} className={primaryBtn}>{saving ? "Saving..." : form.mode === "new" ? "Save document" : "Save new version"}</button>
            <button type="button" disabled={saving} onClick={() => setForm(null)} className={ghostBtn}>Cancel</button>
          </div>
        </form>
      )}

      <section className="space-y-3">
        {loading ? (
          <p className="text-sm text-[var(--text-soft)]">Loading reference documents...</p>
        ) : documents.length === 0 ? (
          <EmptyNote>No reference documents yet. {canManage ? "Add an approved source to start checking claims." : "Ask a workspace owner or admin to add approved sources."}</EmptyNote>
        ) : documents.map((doc) => {
          const expanded = expandedId === doc._id;
          return (
            <article key={doc._id} className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-[var(--text)]">{doc.title}</h3>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">Owner: {doc.owner} · Latest version v{doc.currentVersion} · Updated {displayDate(doc.updatedAt)}</p>
                  {doc.description && <p className="mt-1 text-xs text-[var(--text-soft)]">{doc.description}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {doc.status === "retired" && <Badge tone="muted">Retired</Badge>}
                  <ApprovalBadge status={doc.currentApprovalStatus} />
                  {doc.activeVersion
                    ? <Badge tone="accent" title="The version used as evidence">Searching v{doc.activeVersion}</Badge>
                    : <Badge tone="muted" title="No approved version is available to search">Not searchable</Badge>}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setExpandedId(expanded ? "" : doc._id)} className={smallBtn}>{expanded ? "Hide versions" : `Versions (${doc.versions.length})`}</button>
                {canManage && (
                  <>
                    <button type="button" disabled={saving} onClick={() => startNewVersion(doc)} className={smallBtn}>New version</button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => run(() => documentsApi.update(workspaceId, doc._id, { status: doc.status === "active" ? "retired" : "active" }), doc.status === "active" ? "Document retired." : "Document restored.")}
                      className={smallBtn}
                    >
                      {doc.status === "active" ? "Retire" : "Restore"}
                    </button>
                  </>
                )}
              </div>

              {expanded && (
                <ul className="mt-4 divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
                  {doc.versions.map((version) => (
                    <li key={version.version} className="flex flex-wrap items-center gap-3 p-3">
                      <div className="min-w-40 flex-1">
                        <p className="text-sm font-medium text-[var(--text)]">v{version.version} <span className="font-normal text-[var(--text-soft)]">· {version.changeNote || "No note"}</span></p>
                        <p className="text-[11px] text-[var(--text-soft)]">
                          Added {displayDate(version.uploadedAt)}{version.sourceFileName ? ` · ${version.sourceFileName}` : ""}
                          {version.decidedAt ? ` · Decided ${displayDate(version.decidedAt)}` : ""}
                        </p>
                        <p className="text-[11px] text-[var(--text-soft)]" title={version.contentHash}>Fingerprint {version.contentHash.slice(0, 12)}</p>
                      </div>
                      <ApprovalBadge status={version.approvalStatus} />
                      <button type="button" onClick={() => openVersion(doc, version.version)} className={smallBtn}>View text</button>
                      {canManage && version.approvalStatus !== "approved" && (
                        <button type="button" disabled={saving} onClick={() => run(() => documentsApi.decide(workspaceId, doc._id, version.version, "approved"), `v${version.version} approved.`)} className={smallBtn}>Approve</button>
                      )}
                      {canManage && version.approvalStatus === "pending" && (
                        <button type="button" disabled={saving} onClick={() => run(() => documentsApi.decide(workspaceId, doc._id, version.version, "rejected"), `v${version.version} rejected.`)} className={smallBtn}>Reject</button>
                      )}
                      {canManage && version.approvalStatus === "approved" && (
                        <button type="button" disabled={saving} onClick={() => run(() => documentsApi.decide(workspaceId, doc._id, version.version, "rejected"), `v${version.version} approval withdrawn.`)} className={smallBtn}>Withdraw approval</button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </section>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center tp-backdrop p-4" role="dialog" aria-modal="true" aria-label="Document text" onClick={() => setPreview(null)}>
          <div className={`${cardClass} flex max-h-[85vh] w-full max-w-3xl flex-col`} onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="truncate text-sm font-semibold text-[var(--text)]">{preview.title} · v{preview.version}</h3>
              <button type="button" onClick={() => setPreview(null)} className={smallBtn}>Close</button>
            </div>
            <pre className="mt-4 min-h-0 flex-1 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--bg)] p-4 text-xs leading-5 text-[var(--text)]">{preview.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
}