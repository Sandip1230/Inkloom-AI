import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { adminRequest } from "../api/adminApi.js";

const SOURCE_KINDS = [
  ["brand-guide", "Brand guide"],
  ["approved-facts", "Approved facts"],
  ["claim-evidence", "Claim evidence"],
  ["terminology", "Terminology"],
  ["asset-rules", "Visual asset rules"],
  ["other", "Other"],
];
const MEMBER_ROLES = [
  ["admin", "Admin"],
  ["reviewer", "Reviewer"],
  ["creator", "Creator"],
];
const inputClass = "mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] focus:border-[var(--accent-solid)] focus:outline-none";
const cardClass = "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6";

function displayDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function dateInputValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function emptySource() {
  return {
    kind: "brand-guide",
    title: "",
    content: "",
    owner: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    reviewDate: "",
    confidentiality: "internal",
    changeNote: "",
  };
}

function AdminError({ message }) {
  if (!message) return null;
  return <p role="alert" className="rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-sm text-rose-600">{message}</p>;
}

export default function CompanyAdmin() {
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspace, setWorkspace] = useState(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("creator");
  const [sourceForm, setSourceForm] = useState(emptySource);
  const [editingSourceId, setEditingSourceId] = useState("");
  const [selectedSource, setSelectedSource] = useState(null);
  const [retentionDays, setRetentionDays] = useState(365);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refreshWorkspace = useCallback(async (id) => {
    const data = await adminRequest(`/workspaces/${id}`);
    setWorkspace(data);
    setWorkspaceName(data.name);
    setRetentionDays(data.auditRetentionDays);
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    const data = await adminRequest("/workspaces");
    setWorkspaces(data);
    setWorkspaceId((currentId) => {
      if (data.some((item) => item._id === currentId)) return currentId;
      return data[0]?._id || "";
    });
    return data;
  }, []);

  useEffect(() => {
    let active = true;
    adminRequest("/workspaces")
      .then((data) => {
        if (!active) return;
        setWorkspaces(data);
        setWorkspaceId(data[0]?._id || "");
        setError("");
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!workspaceId) {
      setWorkspace(null);
      return;
    }
    let active = true;
    setLoading(true);
    adminRequest(`/workspaces/${workspaceId}`)
      .then((data) => {
        if (!active) return;
        setWorkspace(data);
        setWorkspaceName(data.name);
        setRetentionDays(data.auditRetentionDays);
        setError("");
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [workspaceId]);

  async function runAction(action, successMessage) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setSaving(false);
    }
  }

  async function createWorkspace(event) {
    event.preventDefault();
    await runAction(async () => {
      const created = await adminRequest("/workspaces", {
        method: "POST",
        body: { name: newWorkspaceName },
      });
      const nextWorkspaces = await refreshWorkspaces();
      if (!nextWorkspaces.some((item) => item._id === created._id)) {
        setWorkspaces((current) => [created, ...current]);
      }
      setLoading(true);
      setWorkspaceId(created._id);
      setNewWorkspaceName("");
    }, "Workspace created.");
  }

  async function saveWorkspace(event) {
    event.preventDefault();
    if (!workspace) return;
    await runAction(async () => {
      await adminRequest(`/workspaces/${workspace._id}`, {
        method: "PATCH",
        body: { name: workspaceName },
      });
      await Promise.all([refreshWorkspaces(), refreshWorkspace(workspace._id)]);
    }, "Workspace details saved.");
  }

  async function addMember(event) {
    event.preventDefault();
    if (!workspace) return;
    await runAction(async () => {
      await adminRequest(`/workspaces/${workspace._id}/members`, {
        method: "POST",
        body: { email: inviteEmail, role: inviteRole },
      });
      await refreshWorkspace(workspace._id);
      setInviteEmail("");
    }, "Workspace member added.");
  }

  async function updateMemberRole(memberId, role) {
    if (!workspace) return;
    await runAction(async () => {
      await adminRequest(`/workspaces/${workspace._id}/members/${memberId}`, {
        method: "PATCH",
        body: { role },
      });
      await refreshWorkspace(workspace._id);
    }, "Member role updated.");
  }

  async function removeMember(member) {
    if (!workspace || !window.confirm(`Remove ${member.email} from this workspace?`)) return;
    await runAction(async () => {
      await adminRequest(`/workspaces/${workspace._id}/members/${member.id}`, { method: "DELETE" });
      await refreshWorkspace(workspace._id);
    }, "Member removed.");
  }

  async function saveSource(event) {
    event.preventDefault();
    if (!workspace) return;
    await runAction(async () => {
      const endpoint = editingSourceId
        ? `/workspaces/${workspace._id}/sources/${editingSourceId}`
        : `/workspaces/${workspace._id}/sources`;
      await adminRequest(endpoint, {
        method: editingSourceId ? "PATCH" : "POST",
        body: { ...sourceForm, reviewDate: sourceForm.reviewDate || null },
      });
      await refreshWorkspace(workspace._id);
      setSourceForm(emptySource());
      setEditingSourceId("");
    }, editingSourceId ? "New source version saved." : "Approved source added.");
  }

  async function viewSource(sourceId) {
    if (!workspace) return;
    await runAction(async () => {
      setSelectedSource(await adminRequest(`/workspaces/${workspace._id}/sources/${sourceId}`));
    }, "");
  }

  function editSource(source) {
    setEditingSourceId(source._id);
    setSourceForm({
      kind: source.kind,
      title: source.title,
      content: source.content,
      owner: source.owner,
      effectiveDate: dateInputValue(source.effectiveDate),
      reviewDate: dateInputValue(source.reviewDate),
      confidentiality: source.confidentiality,
      changeNote: "",
    });
    setSelectedSource(null);
  }

  async function deleteSource(source) {
    if (!workspace || !window.confirm(`Delete "${source.title}" and its version history?`)) return;
    await runAction(async () => {
      await adminRequest(`/workspaces/${workspace._id}/sources/${source._id}`, { method: "DELETE" });
      await refreshWorkspace(workspace._id);
      if (selectedSource?._id === source._id) setSelectedSource(null);
    }, "Source and version history deleted.");
  }

  async function saveRetention(event) {
    event.preventDefault();
    if (!workspace) return;
    await runAction(async () => {
      const days = Number(retentionDays);
      await adminRequest(`/workspaces/${workspace._id}/retention`, {
        method: "PATCH",
        body: { auditRetentionDays: days },
      });
      await refreshWorkspace(workspace._id);
    }, "Audit retention policy saved.");
  }

  const canManage = workspace && ["owner", "admin"].includes(workspace.role);
  const isOwner = workspace?.role === "owner";

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-solid)]">Company administration</p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">Workspace governance</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
              Manage who can participate, which sources are approved, and how long administrative activity is retained.
            </p>
          </div>
          {workspaces.length > 1 && (
            <label className="text-xs font-medium text-[var(--text-soft)]">
              Workspace
              <select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} className={inputClass}>
                {workspaces.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            </label>
          )}
        </div>

        <div className="mt-5 space-y-3">
          <AdminError message={error} />
          {notice && <p role="status" className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
        </div>

        {loading ? (
          <div className={`${cardClass} mt-7 text-sm text-[var(--text-soft)]`} role="status">Loading workspace administration…</div>
        ) : !workspace ? (
          <section className={`${cardClass} mt-7 max-w-2xl`}>
            {error.includes("Sign in") || error.includes("session is invalid") ? (
              <>
                <h2 className="text-lg font-semibold text-[var(--text)]">Sign in to continue</h2>
                <p className="mt-2 text-sm text-[var(--text-soft)]">Workspace settings are available to signed-in members.</p>
                <Link to="/login" className="mt-4 inline-block rounded-lg bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] px-4 py-2.5 text-sm font-medium text-white">Go to sign in</Link>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-[var(--text)]">{workspaces.length ? "No workspace selected" : "Create your company workspace"}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Create the governed workspace where your team will manage members, approved sources, and policy history.</p>
                <form onSubmit={createWorkspace} className="mt-5 flex flex-wrap items-end gap-3">
                  <label className="min-w-60 flex-1 text-xs font-medium text-[var(--text-soft)]">
                    Company or workspace name
                    <input required maxLength={120} value={newWorkspaceName} onChange={(event) => setNewWorkspaceName(event.target.value)} className={inputClass} placeholder="Acme Communications" />
                  </label>
                  <button disabled={saving} className="rounded-lg bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">Create workspace</button>
                </form>
              </>
            )}
          </section>
        ) : (
          <>
            <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Workspace members", workspace.members.length],
                ["Approved sources", workspace.sources.length],
                ["Recent events", workspace.activity.length],
                ["Your access", workspace.role],
              ].map(([label, value]) => (
                <article key={label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="text-xs text-[var(--text-soft)]">{label}</p>
                  <p className="mt-2 text-xl font-semibold capitalize text-[var(--text)]">{value}</p>
                </article>
              ))}
            </section>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
              <div className="space-y-5">
                <section className={cardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-[var(--text)]">Workspace members</h2>
                      <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Assign the minimum access each teammate needs. Members must already have an Inkloom account.</p>
                    </div>
                    <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs capitalize text-[var(--text-soft)]">{workspace.role}</span>
                  </div>
                  <div className="mt-4 divide-y divide-[var(--border)]">
                    {workspace.members.map((member) => (
                      <div key={member.id} className="flex flex-wrap items-center gap-3 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-semibold text-[var(--accent-solid)]">{member.name?.[0]?.toUpperCase() || "?"}</div>
                        <div className="min-w-40 flex-1">
                          <p className="text-sm font-medium text-[var(--text)]">{member.name}</p>
                          <p className="text-xs text-[var(--text-soft)]">{member.email} · joined {displayDate(member.joinedAt)}</p>
                        </div>
                        {member.role === "owner" ? (
                          <span className="text-xs font-semibold text-[var(--text-soft)]">Owner</span>
                        ) : (
                          <>
                            <select
                              aria-label={`Role for ${member.email}`}
                              value={member.role}
                              disabled={!canManage || (member.role === "admin" && !isOwner)}
                              onChange={(event) => updateMemberRole(member.id, event.target.value)}
                              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-xs text-[var(--text)] disabled:opacity-60"
                            >
                              {MEMBER_ROLES.filter(([role]) => role !== "admin" || isOwner || member.role === "admin").map(([role, label]) => <option key={role} value={role}>{label}</option>)}
                            </select>
                            {canManage && (member.role !== "admin" || isOwner) && (
                              <button type="button" onClick={() => removeMember(member)} className="text-xs font-medium text-rose-600 hover:underline">Remove</button>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  {canManage && (
                    <form onSubmit={addMember} className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-[1fr_150px_auto] sm:items-end">
                      <label className="text-xs font-medium text-[var(--text-soft)]">Registered account email<input required type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} className={inputClass} placeholder="teammate@company.com" /></label>
                      <label className="text-xs font-medium text-[var(--text-soft)]">Role<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} className={inputClass}>{MEMBER_ROLES.filter(([role]) => role !== "admin" || isOwner).map(([role, label]) => <option key={role} value={role}>{label}</option>)}</select></label>
                      <button disabled={saving} className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:border-[var(--accent-solid)] disabled:opacity-50">Add member</button>
                    </form>
                  )}
                </section>

                <section className={cardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-[var(--text)]">Approved sources</h2>
                      <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">Keep approved guidance attributable and versioned. Source text is stored in the workspace database.</p>
                    </div>
                    <span className="text-xs text-[var(--text-soft)]">{workspace.sources.length} source{workspace.sources.length === 1 ? "" : "s"}</span>
                  </div>
                  {workspace.sources.length === 0 ? (
                    <p className="mt-4 rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-soft)]">No approved sources have been added.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {workspace.sources.map((source) => (
                        <article key={source._id} className="rounded-xl border border-[var(--border)] p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-[var(--text)]">{source.title}</p>
                              <p className="mt-1 text-xs capitalize text-[var(--text-soft)]">{SOURCE_KINDS.find(([kind]) => kind === source.kind)?.[1] || source.kind} · v{source.currentVersion} · {source.confidentiality}</p>
                              <p className="mt-1 text-xs text-[var(--text-soft)]">Owner: {source.owner} · Effective {displayDate(source.effectiveDate)} · Review {displayDate(source.reviewDate)}</p>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <button type="button" onClick={() => viewSource(source._id)} className="font-medium text-[var(--accent-solid)] hover:underline">View details & versions</button>
                              {canManage && <button type="button" onClick={() => deleteSource(source)} className="font-medium text-rose-600 hover:underline">Delete</button>}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {selectedSource && (
                    <div className="mt-4 rounded-xl border border-[var(--accent-solid)]/30 bg-[var(--bg)] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--text)]">{selectedSource.title} version history</h3>
                          <p className="mt-1 text-xs text-[var(--text-soft)]">Current version: v{selectedSource.currentVersion}</p>
                        </div>
                        <div className="flex gap-3">
                          {canManage && <button type="button" onClick={() => editSource(selectedSource)} className="text-xs font-semibold text-[var(--accent-solid)]">Edit source</button>}
                          <button type="button" onClick={() => setSelectedSource(null)} className="text-xs text-[var(--text-soft)]">Close</button>
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap rounded-lg bg-[var(--surface)] p-3 text-xs leading-5 text-[var(--text-soft)]">{selectedSource.content}</p>
                      <ol className="mt-3 space-y-2">
                        {[...(selectedSource.versions || [])].reverse().map((version) => (
                          <li key={version.version} className="rounded-lg bg-[var(--surface)] p-3 text-xs">
                            <details>
                              <summary className="cursor-pointer font-semibold text-[var(--text)]">Version {version.version} · {displayDate(version.createdAt)}</summary>
                              <p className="mt-1 text-[var(--text-soft)]">Edited by {version.editedBy?.name || version.editedBy?.email || "Workspace member"}{version.changeNote ? ` · ${version.changeNote}` : ""}</p>
                              <p className="mt-2 whitespace-pre-wrap leading-5 text-[var(--text-soft)]">{version.content}</p>
                            </details>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {canManage && (
                    <form onSubmit={saveSource} className="mt-5 grid gap-3 border-t border-[var(--border)] pt-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <h3 className="text-sm font-semibold text-[var(--text)]">{editingSourceId ? "Publish a new source version" : "Add an approved source"}</h3>
                        {editingSourceId && <p className="mt-1 text-xs text-[var(--text-soft)]">Saving creates an immutable version-history entry; existing versions remain available.</p>}
                      </div>
                      <label className="text-xs font-medium text-[var(--text-soft)]">Source type<select value={sourceForm.kind} onChange={(event) => setSourceForm((current) => ({ ...current, kind: event.target.value }))} className={inputClass}>{SOURCE_KINDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                      <label className="text-xs font-medium text-[var(--text-soft)]">Title<input required maxLength={160} value={sourceForm.title} onChange={(event) => setSourceForm((current) => ({ ...current, title: event.target.value }))} className={inputClass} /></label>
                      <label className="text-xs font-medium text-[var(--text-soft)]">Owner<input required maxLength={160} value={sourceForm.owner} onChange={(event) => setSourceForm((current) => ({ ...current, owner: event.target.value }))} className={inputClass} placeholder="Brand team" /></label>
                      <label className="text-xs font-medium text-[var(--text-soft)]">Confidentiality<select value={sourceForm.confidentiality} onChange={(event) => setSourceForm((current) => ({ ...current, confidentiality: event.target.value }))} className={inputClass}><option value="internal">Internal</option><option value="confidential">Confidential</option><option value="public">Public</option></select></label>
                      <label className="text-xs font-medium text-[var(--text-soft)]">Effective date<input required type="date" value={sourceForm.effectiveDate} onChange={(event) => setSourceForm((current) => ({ ...current, effectiveDate: event.target.value }))} className={inputClass} /></label>
                      <label className="text-xs font-medium text-[var(--text-soft)]">Review date<input type="date" value={sourceForm.reviewDate} onChange={(event) => setSourceForm((current) => ({ ...current, reviewDate: event.target.value }))} className={inputClass} /></label>
                      <label className="text-xs font-medium text-[var(--text-soft)] sm:col-span-2">Source content<textarea required maxLength={50000} rows={6} value={sourceForm.content} onChange={(event) => setSourceForm((current) => ({ ...current, content: event.target.value }))} className={inputClass} placeholder="Paste approved guidance or facts and cite the authoritative source." /></label>
                      {editingSourceId && <label className="text-xs font-medium text-[var(--text-soft)] sm:col-span-2">Change note<input maxLength={500} value={sourceForm.changeNote} onChange={(event) => setSourceForm((current) => ({ ...current, changeNote: event.target.value }))} className={inputClass} placeholder="Why is this source being updated?" /></label>}
                      <div className="flex flex-wrap gap-2 sm:col-span-2">
                        <button disabled={saving} className="rounded-lg bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{editingSourceId ? "Save new version" : "Add source"}</button>
                        {editingSourceId && <button type="button" onClick={() => { setEditingSourceId(""); setSourceForm(emptySource()); }} className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-soft)]">Cancel edit</button>}
                      </div>
                    </form>
                  )}
                </section>
              </div>

              <aside className="space-y-5">
                <form onSubmit={saveWorkspace} className={cardClass}>
                  <h2 className="text-base font-semibold text-[var(--text)]">Workspace details</h2>
                  <label className="mt-4 block text-xs font-medium text-[var(--text-soft)]">Company name<input disabled={!canManage} required maxLength={120} value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} className={inputClass} /></label>
                  {canManage && <button disabled={saving} className="mt-3 rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent-solid)] disabled:opacity-50">Save details</button>}
                  <p className="mt-3 text-xs text-[var(--text-soft)]">Created {displayDate(workspace.createdAt)}</p>
                </form>

                <form onSubmit={saveRetention} className={cardClass}>
                  <h2 className="text-base font-semibold text-[var(--text)]">Audit-log retention</h2>
                  <p className="mt-1.5 text-xs leading-5 text-[var(--text-soft)]">Expired administrative activity is automatically purged daily. This setting applies to audit events, not review drafts or source documents.</p>
                  <label className="mt-4 block text-xs font-medium text-[var(--text-soft)]">Keep activity for (30–3650 days)<input disabled={!canManage} required type="number" min={30} max={3650} step={1} value={retentionDays} onChange={(event) => setRetentionDays(event.target.value)} className={inputClass} /></label>
                  {canManage && <button disabled={saving} className="mt-3 rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent-solid)] disabled:opacity-50">Save retention</button>}
                </form>

                <section className={cardClass}>
                  <h2 className="text-base font-semibold text-[var(--text)]">Recent activity</h2>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">Administrative changes in this workspace.</p>
                  {workspace.activity.length === 0 ? (
                    <p className="mt-4 text-sm text-[var(--text-soft)]">No activity recorded yet.</p>
                  ) : (
                    <ol className="mt-4 space-y-4">
                      {workspace.activity.map((event) => (
                        <li key={event.id} className="border-l-2 border-[var(--border)] pl-3">
                          <p className="text-xs font-medium text-[var(--text)]">{event.summary}</p>
                          <p className="mt-1 text-[11px] text-[var(--text-soft)]">{event.actor} · {displayDate(event.createdAt)}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
