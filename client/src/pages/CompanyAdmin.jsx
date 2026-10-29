import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { adminRequest, fetchAdmin, peekAdmin } from "../api/adminApi.js";
import { fetchAccountType, getAccountTypeFromToken } from "../lib/account.js";
import { PageHero, TpIcon } from "../components/ThemeIcons.jsx";
import "../styles/ThemePages.css";

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
const TABS = [
  ["overview", "Overview"],
  ["members", "Members"],
  ["sources", "Sources"],
  ["activity", "Activity"],
  ["settings", "Settings"],
];
const RETENTION_PRESETS = [90, 180, 365, 730];

const inputClass = "tp-input mt-1.5";
const cardClass = "tp-card p-5 sm:p-6";
const primaryBtn = "tp-btn";
const ghostBtn = "tp-btn-ghost";

const TONES = {
  danger: "tp-tone-danger",
  warn: "tp-tone-warn",
  ok: "tp-tone-ok",
  muted: "tp-tone-muted",
  accent: "tp-tone-accent",
};

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

function kindLabel(kind) {
  return SOURCE_KINDS.find(([value]) => value === kind)?.[1] || kind;
}

// Review status of a source: overdue / due within 30 days / on track / no date
function reviewStatus(source) {
  if (!source.reviewDate) return { key: "none", label: "No review date", tone: "muted" };
  const days = Math.ceil((new Date(source.reviewDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { key: "overdue", label: `Overdue by ${Math.abs(days)}d`, tone: "danger" };
  if (days <= 30) return { key: "soon", label: `Review in ${days}d`, tone: "warn" };
  return { key: "ok", label: "On track", tone: "ok" };
}

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function AdminError({ message }) {
  if (!message) return null;
  return <p role="alert" className="rounded-lg border tp-tone-danger">{message}</p>;
}

function Badge({ tone = "muted", children }) {
  return (
    <span className={`tp-pill capitalize ${TONES[tone]}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, hint, icon, tone }) {
  return (
    <article className={`tp-stat ${tone === "alt" ? "tp-stat--alt" : ""}`}>
      <span className="tp-stat__icon">{icon}</span>
      <div className="tp-stat__text">
        <strong className="tp-stat__value">{value}</strong>
        <span className="tp-stat__label">{label}</span>
        {hint && <span className="tp-stat__hint">{hint}</span>}
      </div>
    </article>
  );
}

function Bars({ items }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex justify-between text-xs">
            <span className="capitalize text-[var(--text)]">{item.label}</span>
            <span className="text-[var(--text-soft)]">{item.value}</span>
          </div>
          <div className="tp-track mt-1 h-2">
            <div
              className="tp-fill"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function SectionHead({ title, text, right }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>
        {text && <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{text}</p>}
      </div>
      {right}
    </div>
  );
}

function savedWorkspaceId(list) {
  const saved = localStorage.getItem("inkloom-active-workspace");
  if (saved && saved !== "personal" && list.some((item) => item._id === saved)) return saved;
  return list[0]?._id || "";
}

// What every non-admin account sees instead of the workspace tools.
function AdminOnlyNotice() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className={`${cardClass} max-w-2xl`} role="status">
          <span className="tp-pill tp-tone-warn">Restricted</span>
          <h2 className="mt-3 text-lg font-semibold text-[var(--text)]">Admin workspace</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
            If you are an Admin then only you can access the Admin workspace
            (only accessible for Company Admins, and to access this, log in yourself as an Admin).
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--text-soft)]">
            Regular users cannot open or create company workspaces. Admin accounts are created by choosing
            “Company Admin” when you sign up.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/" className="tp-btn inline-flex">Back to the Homepage</Link>
            <Link to="/signup" className="tp-btn-ghost inline-flex">Register as an Admin</Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

// Gate: only Company Admin accounts ever reach the workspace tools (the server enforces this too).
export default function CompanyAdmin() {
  const fromToken = getAccountTypeFromToken();
  const [accountType, setAccountType] = useState(fromToken);

  useEffect(() => {
    if (fromToken) return undefined;
    // Token issued before account types existed: ask the server once.
    let active = true;
    fetchAccountType()
      .then((type) => { if (active) setAccountType(type); })
      .catch(() => { if (active) setAccountType("user"); });
    return () => { active = false; };
  }, [fromToken]);

  if (accountType === "user") return <AdminOnlyNotice />;
  if (accountType === null) {
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className={`${cardClass} text-sm text-[var(--text-soft)]`} role="status">Checking your access…</div>
        </div>
      </AppShell>
    );
  }
  return <CompanyAdminWorkspace onDenied={() => setAccountType("user")} />;
}

function CompanyAdminWorkspace({ onDenied }) {
  // Seed from the cache so the page paints with real content on the first frame.
  const cachedList = peekAdmin("/workspaces");
  const [workspaces, setWorkspaces] = useState(() => cachedList || []);
  const [workspaceId, setWorkspaceId] = useState(() => (cachedList ? savedWorkspaceId(cachedList) : ""));
  const [workspace, setWorkspace] = useState(() => {
    const id = cachedList ? savedWorkspaceId(cachedList) : "";
    return id ? peekAdmin(`/workspaces/${id}`) || null : null;
  });
  const [workspaceName, setWorkspaceName] = useState("");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("creator");
  const [sourceForm, setSourceForm] = useState(emptySource);
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState("");
  const [selectedSource, setSelectedSource] = useState(null);
  const [retentionDays, setRetentionDays] = useState(365);
  const [loading, setLoading] = useState(() => !workspace);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [tab, setTab] = useState("overview");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("all");
  const [sourceSearch, setSourceSearch] = useState("");
  const [sourceKindFilter, setSourceKindFilter] = useState("all");
  const [sourceConfFilter, setSourceConfFilter] = useState("all");
  const [sourceStatusFilter, setSourceStatusFilter] = useState("all");
  const [sourceSort, setSourceSort] = useState("title");
  const [activitySearch, setActivitySearch] = useState("");

  const handleLoadError = useCallback((loadError) => {
    if (loadError.code === "ADMIN_ONLY") onDenied();
    else setError(loadError.message);
  }, [onDenied]);

  const refreshWorkspace = useCallback(async (id) => {
    const data = await fetchAdmin(`/workspaces/${id}`);
    setWorkspace(data);
    setWorkspaceName(data.name);
    setRetentionDays(data.auditRetentionDays);
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    const data = await fetchAdmin("/workspaces");
    setWorkspaces(data);
    setWorkspaceId((currentId) => {
      if (data.some((item) => item._id === currentId)) return currentId;
      return data[0]?._id || "";
    });
    return data;
  }, []);

  useEffect(() => {
    let active = true;
    fetchAdmin("/workspaces")
      .then((data) => {
        if (!active) return;
        setWorkspaces(data);
        // Keep the selection the page already started with when it is still valid.
        setWorkspaceId((current) => (data.some((item) => item._id === current) ? current : savedWorkspaceId(data)));
        setError("");
        if (data.length === 0) setLoading(false);
      })
      .catch((loadError) => {
        if (!active) return;
        handleLoadError(loadError);
        setLoading(false);
      });
    return () => { active = false; };
  }, [handleLoadError]);

  useEffect(() => {
    if (!workspaceId) {
      setWorkspace(null);
      return;
    }
    let active = true;
    setSelectedSource(null);
    setEditingSourceId("");
    setShowSourceForm(false);

    // Show what we already know right away, then refresh quietly in the background.
    const cached = peekAdmin(`/workspaces/${workspaceId}`);
    if (cached) {
      setWorkspace(cached);
      setWorkspaceName(cached.name);
      setRetentionDays(cached.auditRetentionDays);
      setLoading(false);
    } else {
      setLoading(true);
    }

    fetchAdmin(`/workspaces/${workspaceId}`)
      .then((data) => {
        if (!active) return;
        setWorkspace(data);
        setWorkspaceName(data.name);
        setRetentionDays(data.auditRetentionDays);
        setError("");
      })
      .catch((loadError) => {
        if (active) handleLoadError(loadError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [workspaceId, handleLoadError]);

  // Success message disappears by itself after 4 seconds
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function runAction(action, successMessage) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
    } catch (actionError) {
      if (actionError.code === "ADMIN_ONLY") onDenied();
      else setError(actionError.message);
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
      setWorkspaceId(created._id);
      setNewWorkspaceName("");
      setShowNewWorkspace(false);
      setTab("overview");
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
      setShowSourceForm(false);
    }, editingSourceId ? "New source version saved." : "Approved source added.");
  }

  async function viewSource(sourceId) {
    if (!workspace) return;
    await runAction(async () => {
      setSelectedSource(await adminRequest(`/workspaces/${workspace._id}/sources/${sourceId}`));
    }, "");
  }

  function openSource(sourceId) {
    setTab("sources");
    viewSource(sourceId);
  }

  function editSource(source) {
    setEditingSourceId(source._id);
    setShowSourceForm(true);
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

  function cancelSourceForm() {
    setEditingSourceId("");
    setShowSourceForm(false);
    setSourceForm(emptySource());
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

  const members = useMemo(() => workspace?.members || [], [workspace]);
  const sources = useMemo(() => workspace?.sources || [], [workspace]);
  const activity = useMemo(() => workspace?.activity || [], [workspace]);

  // ---------- Overview numbers ----------
  const overview = useMemo(() => {
    const roleCounts = ["owner", "admin", "reviewer", "creator"].map((role) => ({
      label: role,
      value: members.filter((member) => member.role === role).length,
    }));
    const kindCounts = SOURCE_KINDS
      .map(([kind, label]) => ({ label, value: sources.filter((source) => source.kind === kind).length }))
      .filter((item) => item.value > 0);
    const confCounts = ["public", "internal", "confidential"].map((level) => ({
      label: level,
      value: sources.filter((source) => source.confidentiality === level).length,
    }));
    const statuses = sources.map((source) => ({ source, status: reviewStatus(source) }));
    const needsAttention = statuses
      .filter((item) => item.status.key === "overdue" || item.status.key === "soon")
      .sort((a, b) => new Date(a.source.reviewDate) - new Date(b.source.reviewDate));
    const overdueCount = statuses.filter((item) => item.status.key === "overdue").length;
    const healthy = statuses.filter((item) => item.status.key === "ok" || item.status.key === "soon").length;
    const health = sources.length ? Math.round((healthy / sources.length) * 100) : 100;
    return { roleCounts, kindCounts, confCounts, needsAttention, overdueCount, health };
  }, [members, sources]);

  // ---------- Filtered lists ----------
  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    return members.filter((member) => {
      if (memberRoleFilter !== "all" && member.role !== memberRoleFilter) return false;
      if (!query) return true;
      return `${member.name} ${member.email}`.toLowerCase().includes(query);
    });
  }, [members, memberSearch, memberRoleFilter]);

  const filteredSources = useMemo(() => {
    const query = sourceSearch.trim().toLowerCase();
    const list = sources.filter((source) => {
      if (sourceKindFilter !== "all" && source.kind !== sourceKindFilter) return false;
      if (sourceConfFilter !== "all" && source.confidentiality !== sourceConfFilter) return false;
      if (sourceStatusFilter !== "all" && reviewStatus(source).key !== sourceStatusFilter) return false;
      if (!query) return true;
      return `${source.title} ${source.owner}`.toLowerCase().includes(query);
    });
    return [...list].sort((a, b) => {
      if (sourceSort === "review") {
        const aTime = a.reviewDate ? new Date(a.reviewDate).getTime() : Infinity;
        const bTime = b.reviewDate ? new Date(b.reviewDate).getTime() : Infinity;
        return aTime - bTime;
      }
      if (sourceSort === "version") return (b.currentVersion || 0) - (a.currentVersion || 0);
      return a.title.localeCompare(b.title);
    });
  }, [sources, sourceSearch, sourceKindFilter, sourceConfFilter, sourceStatusFilter, sourceSort]);

  const groupedActivity = useMemo(() => {
    const query = activitySearch.trim().toLowerCase();
    const list = activity.filter((event) => !query || `${event.summary} ${event.actor}`.toLowerCase().includes(query));
    const groups = [];
    list.forEach((event) => {
      const day = displayDate(event.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.day === day) last.items.push(event);
      else groups.push({ day, items: [event] });
    });
    return { groups, total: list.length };
  }, [activity, activitySearch]);

  // ---------- Exports ----------
  function exportMembers() {
    downloadCsv(`${workspace.name}-members.csv`, [
      ["Name", "Email", "Role", "Joined"],
      ...filteredMembers.map((member) => [member.name, member.email, member.role, dateInputValue(member.joinedAt)]),
    ]);
  }

  function exportSources() {
    downloadCsv(`${workspace.name}-sources.csv`, [
      ["Title", "Type", "Owner", "Version", "Confidentiality", "Effective", "Review", "Status"],
      ...filteredSources.map((source) => [
        source.title,
        kindLabel(source.kind),
        source.owner,
        source.currentVersion,
        source.confidentiality,
        dateInputValue(source.effectiveDate),
        dateInputValue(source.reviewDate),
        reviewStatus(source).label,
      ]),
    ]);
  }

  function exportActivity() {
    downloadCsv(`${workspace.name}-activity.csv`, [
      ["Date", "Actor", "Summary"],
      ...activity.map((event) => [dateInputValue(event.createdAt), event.actor, event.summary]),
    ]);
  }

  const tabCounts = { members: members.length, sources: sources.length, activity: activity.length };

  return (
    <AppShell>
      <div className="stagger mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {/* ---------------- Header ---------------- */}
        <PageHero
          icon="building"
          eyebrow="Company administration"
          title={workspace ? workspace.name : "Workspace governance"}
          text="Manage who can participate, which sources are approved, and how long administrative activity is retained."
        >
          <div className="flex flex-wrap items-end gap-3">
            {workspaces.length > 1 && (
              <label className="text-xs font-medium text-[var(--text-soft)]">
                Workspace
                <select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} className={inputClass}>
                  {workspaces.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
              </label>
            )}
            {workspace && (
              <button type="button" onClick={() => setShowNewWorkspace((show) => !show)} className={ghostBtn}>
                {showNewWorkspace ? "Close" : "+ New workspace"}
              </button>
            )}
          </div>
        </PageHero>

        {showNewWorkspace && workspace && (
          <form onSubmit={createWorkspace} className={`${cardClass} mt-5 flex flex-wrap items-end gap-3`}>
            <label className="min-w-60 flex-1 text-xs font-medium text-[var(--text-soft)]">
              New workspace name
              <input required maxLength={120} value={newWorkspaceName} onChange={(event) => setNewWorkspaceName(event.target.value)} className={inputClass} placeholder="Acme Communications" />
            </label>
            <button disabled={saving} className={primaryBtn}>Create workspace</button>
          </form>
        )}

        <div className="mt-5 space-y-3">
          <AdminError message={error} />
          {notice && <p role="status" className="rounded-lg border tp-tone-ok">{notice}</p>}
        </div>

        {loading ? (
          <div className={`${cardClass} mt-7 text-sm text-[var(--text-soft)]`} role="status">Loading workspace administration…</div>
        ) : !workspace ? (
          <section className={`${cardClass} mt-7 max-w-2xl`}>
            {error.includes("Sign in") || error.includes("session is invalid") ? (
              <>
                <h2 className="text-lg font-semibold text-[var(--text)]">Sign in to continue</h2>
                <p className="mt-2 text-sm text-[var(--text-soft)]">Workspace settings are available to signed-in members.</p>
                <Link to="/login" className="tp-btn mt-4 inline-flex">Go to sign in</Link>
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
                  <button disabled={saving} className={primaryBtn}>Create workspace</button>
                </form>
              </>
            )}
          </section>
        ) : (
          <>
            {/* ---------------- Tabs ---------------- */}
            <nav className="tp-tabs mt-6" aria-label="Admin sections">
              {TABS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  aria-current={tab === key ? "page" : undefined}
                  className={`tp-tab ${tab === key ? "is-active" : ""}`}
                >
                  {label}
                  {tabCounts[key] !== undefined && <span className="tp-tab__count">{tabCounts[key]}</span>}
                </button>
              ))}
            </nav>

            {/* ================= OVERVIEW ================= */}
            {tab === "overview" && (
              <div className="mt-6 space-y-5">
                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={<TpIcon name="users" size={22} />} label="Workspace members" value={members.length} hint={`${overview.roleCounts.find((r) => r.label === "admin")?.value || 0} admin(s)`} />
                  <StatCard tone="alt" icon={<TpIcon name="file" size={22} />} label="Approved sources" value={sources.length} hint={overview.overdueCount ? `${overview.overdueCount} overdue for review` : "None overdue"} />
                  <StatCard icon={<TpIcon name="activity" size={22} />} label="Recent events" value={activity.length} />
                  <StatCard tone="alt" icon={<TpIcon name="key" size={22} />} label="Your access" value={workspace.role} />
                </section>

                <div className="grid gap-5 lg:grid-cols-3">
                  <section className={cardClass}>
                    <SectionHead title="Governance health" text="Sources that are not overdue for review." />
                    <p className="mt-4 text-4xl font-semibold text-[var(--text)]">{overview.health}%</p>
                    <div className="tp-track mt-3 h-2">
                      <div
                        className={`tp-fill ${overview.health >= 80 ? "tp-fill--ok" : overview.health >= 50 ? "tp-fill--warn" : "tp-fill--danger"}`}
                        style={{ width: `${overview.health}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-[var(--text-soft)]">
                      {sources.length === 0 ? "Add your first approved source to start tracking." : `${overview.needsAttention.length} source(s) need attention.`}
                    </p>
                  </section>

                  <section className={cardClass}>
                    <SectionHead title="Members by role" />
                    <div className="mt-4"><Bars items={overview.roleCounts} /></div>
                  </section>

                  <section className={cardClass}>
                    <SectionHead title="Sources by confidentiality" />
                    <div className="mt-4"><Bars items={overview.confCounts} /></div>
                  </section>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className={cardClass}>
                    <SectionHead title="Needs attention" text="Sources overdue or due for review within 30 days." />
                    {overview.needsAttention.length === 0 ? (
                      <p className="mt-4 tp-empty p-4 text-sm text-[var(--text-soft)]">Everything is up to date. 🎉</p>
                    ) : (
                      <ul className="mt-4 space-y-2">
                        {overview.needsAttention.slice(0, 6).map(({ source, status }) => (
                          <li key={source._id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] p-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[var(--text)]">{source.title}</p>
                              <p className="text-[11px] text-[var(--text-soft)]">{kindLabel(source.kind)} · {source.owner}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                              <Badge tone={status.tone}>{status.label}</Badge>
                              <button type="button" onClick={() => openSource(source._id)} className="text-xs font-medium text-[var(--accent-solid)] hover:underline">Open</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className={cardClass}>
                    <SectionHead
                      title="Latest activity"
                      right={<button type="button" onClick={() => setTab("activity")} className="text-xs font-medium text-[var(--accent-solid)] hover:underline">View all</button>}
                    />
                    {activity.length === 0 ? (
                      <p className="mt-4 text-sm text-[var(--text-soft)]">No activity recorded yet.</p>
                    ) : (
                      <ol className="mt-4 space-y-4">
                        {activity.slice(0, 5).map((event) => (
                          <li key={event.id} className="border-l-2 border-[var(--border)] pl-3">
                            <p className="text-xs font-medium text-[var(--text)]">{event.summary}</p>
                            <p className="mt-1 text-[11px] text-[var(--text-soft)]">{event.actor} · {displayDate(event.createdAt)}</p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>
                </div>

                {overview.kindCounts.length > 0 && (
                  <section className={cardClass}>
                    <SectionHead title="Sources by type" />
                    <div className="mt-4"><Bars items={overview.kindCounts} /></div>
                  </section>
                )}

                {canManage && (
                  <section className={`${cardClass} flex flex-wrap items-center gap-3`}>
                    <p className="mr-auto text-sm font-medium text-[var(--text)]">Quick actions</p>
                    <button type="button" onClick={() => setTab("members")} className={ghostBtn}>Add member</button>
                    <button type="button" onClick={() => { setTab("sources"); setShowSourceForm(true); }} className={ghostBtn}>Add source</button>
                    <button type="button" onClick={() => setTab("settings")} className={ghostBtn}>Retention settings</button>
                  </section>
                )}
              </div>
            )}

            {/* ================= MEMBERS ================= */}
            {tab === "members" && (
              <section className={`${cardClass} mt-6`}>
                <SectionHead
                  title="Workspace members"
                  text="Assign the minimum access each teammate needs. Members must already have an Inkloom account."
                  right={<button type="button" onClick={exportMembers} className="text-xs font-medium text-[var(--accent-solid)] hover:underline">Export CSV</button>}
                />

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
                  <input
                    value={memberSearch}
                    onChange={(event) => setMemberSearch(event.target.value)}
                    placeholder="Search by name or email…"
                    className={inputClass.replace("mt-1.5 ", "")}
                  />
                  <select value={memberRoleFilter} onChange={(event) => setMemberRoleFilter(event.target.value)} className={inputClass.replace("mt-1.5 ", "")}>
                    <option value="all">All roles</option>
                    <option value="owner">Owner</option>
                    {MEMBER_ROLES.map(([role, label]) => <option key={role} value={role}>{label}</option>)}
                  </select>
                </div>

                <div className="mt-4 divide-y divide-[var(--border)]">
                  {filteredMembers.length === 0 && (
                    <p className="tp-empty p-4 text-sm text-[var(--text-soft)]">No members match your filters.</p>
                  )}
                  {filteredMembers.map((member) => (
                    <div key={member.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-semibold text-[var(--accent-solid)]">{member.name?.[0]?.toUpperCase() || "?"}</div>
                      <div className="min-w-40 flex-1">
                        <p className="text-sm font-medium text-[var(--text)]">{member.name}</p>
                        <p className="text-xs text-[var(--text-soft)]">{member.email} · joined {displayDate(member.joinedAt)}</p>
                      </div>
                      {member.role === "owner" ? (
                        <Badge tone="accent">Owner</Badge>
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
                            <button type="button" onClick={() => removeMember(member)} className="text-xs font-medium tp-text-danger hover:underline">Remove</button>
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
                    <button disabled={saving} className={ghostBtn}>Add member</button>
                  </form>
                )}

                <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4 text-xs leading-5 text-[var(--text-soft)]">
                  <p className="font-semibold text-[var(--text)]">Role guide</p>
                  <p className="mt-1"><b>Owner</b>: full control, can assign admins. <b>Admin</b>: manages members and sources. <b>Reviewer</b>: reviews content against sources. <b>Creator</b>: drafts content.</p>
                </div>
              </section>
            )}

            {/* ================= SOURCES ================= */}
            {tab === "sources" && (
              <section className={`${cardClass} mt-6`}>
                <SectionHead
                  title="Approved sources"
                  text="Keep approved guidance attributable and versioned. Source text is stored in the workspace database."
                  right={
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={exportSources} className="text-xs font-medium text-[var(--accent-solid)] hover:underline">Export CSV</button>
                      {canManage && !showSourceForm && (
                        <button type="button" onClick={() => setShowSourceForm(true)} className={primaryBtn}>+ Add source</button>
                      )}
                    </div>
                  }
                />

                {canManage && showSourceForm && (
                  <form onSubmit={saveSource} className="mt-5 grid gap-3 rounded-xl border border-[var(--accent-solid)]/30 bg-[var(--bg)] p-4 sm:grid-cols-2">
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
                    <label className="text-xs font-medium text-[var(--text-soft)] sm:col-span-2">
                      Source content <span className="float-right text-[11px]">{sourceForm.content.length}/50000</span>
                      <textarea required maxLength={50000} rows={6} value={sourceForm.content} onChange={(event) => setSourceForm((current) => ({ ...current, content: event.target.value }))} className={inputClass} placeholder="Paste approved guidance or facts and cite the authoritative source." />
                    </label>
                    {editingSourceId && <label className="text-xs font-medium text-[var(--text-soft)] sm:col-span-2">Change note<input maxLength={500} value={sourceForm.changeNote} onChange={(event) => setSourceForm((current) => ({ ...current, changeNote: event.target.value }))} className={inputClass} placeholder="Why is this source being updated?" /></label>}
                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                      <button disabled={saving} className={primaryBtn}>{editingSourceId ? "Save new version" : "Add source"}</button>
                      <button type="button" onClick={cancelSourceForm} className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-soft)]">Cancel</button>
                    </div>
                  </form>
                )}

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <input value={sourceSearch} onChange={(event) => setSourceSearch(event.target.value)} placeholder="Search title or owner…" className={`${inputClass.replace("mt-1.5 ", "")} lg:col-span-2`} />
                  <select value={sourceKindFilter} onChange={(event) => setSourceKindFilter(event.target.value)} className={inputClass.replace("mt-1.5 ", "")}>
                    <option value="all">All types</option>
                    {SOURCE_KINDS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <select value={sourceConfFilter} onChange={(event) => setSourceConfFilter(event.target.value)} className={inputClass.replace("mt-1.5 ", "")}>
                    <option value="all">All confidentiality</option>
                    <option value="public">Public</option>
                    <option value="internal">Internal</option>
                    <option value="confidential">Confidential</option>
                  </select>
                  <select value={sourceStatusFilter} onChange={(event) => setSourceStatusFilter(event.target.value)} className={inputClass.replace("mt-1.5 ", "")}>
                    <option value="all">Any review status</option>
                    <option value="overdue">Overdue</option>
                    <option value="soon">Due soon</option>
                    <option value="ok">On track</option>
                    <option value="none">No review date</option>
                  </select>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-soft)]">
                  <span>Showing {filteredSources.length} of {sources.length}</span>
                  <label className="flex items-center gap-2">
                    Sort by
                    <select value={sourceSort} onChange={(event) => setSourceSort(event.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--text)]">
                      <option value="title">Title</option>
                      <option value="review">Review date</option>
                      <option value="version">Latest version</option>
                    </select>
                  </label>
                </div>

                {sources.length === 0 ? (
                  <p className="mt-4 tp-empty p-4 text-sm text-[var(--text-soft)]">No approved sources have been added.</p>
                ) : filteredSources.length === 0 ? (
                  <p className="mt-4 tp-empty p-4 text-sm text-[var(--text-soft)]">No sources match your filters.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {filteredSources.map((source) => {
                      const status = reviewStatus(source);
                      return (
                        <article key={source._id} className="rounded-xl border border-[var(--border)] p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-[var(--text)]">{source.title}</p>
                                <Badge tone={status.tone}>{status.label}</Badge>
                              </div>
                              <p className="mt-1 text-xs text-[var(--text-soft)]">{kindLabel(source.kind)} · v{source.currentVersion} · <span className="capitalize">{source.confidentiality}</span></p>
                              <p className="mt-1 text-xs text-[var(--text-soft)]">Owner: {source.owner} · Effective {displayDate(source.effectiveDate)} · Review {displayDate(source.reviewDate)}</p>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <button type="button" onClick={() => viewSource(source._id)} className="font-medium text-[var(--accent-solid)] hover:underline">View details & versions</button>
                              {canManage && <button type="button" onClick={() => deleteSource(source)} className="font-medium tp-text-danger hover:underline">Delete</button>}
                            </div>
                          </div>
                        </article>
                      );
                    })}
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
                        <button type="button" onClick={() => navigator.clipboard?.writeText(selectedSource.content).then(() => setNotice("Source content copied."))} className="text-xs font-semibold text-[var(--accent-solid)]">Copy content</button>
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
              </section>
            )}

            {/* ================= ACTIVITY ================= */}
            {tab === "activity" && (
              <section className={`${cardClass} mt-6`}>
                <SectionHead
                  title="Activity log"
                  text="Administrative changes in this workspace."
                  right={<button type="button" onClick={exportActivity} className="text-xs font-medium text-[var(--accent-solid)] hover:underline">Export CSV</button>}
                />
                <input
                  value={activitySearch}
                  onChange={(event) => setActivitySearch(event.target.value)}
                  placeholder="Search activity or person…"
                  className={`${inputClass} sm:max-w-sm`}
                />
                {groupedActivity.total === 0 ? (
                  <p className="mt-4 text-sm text-[var(--text-soft)]">{activity.length === 0 ? "No activity recorded yet." : "No activity matches your search."}</p>
                ) : (
                  <div className="mt-5 space-y-6">
                    {groupedActivity.groups.map((group) => (
                      <div key={group.day}>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)]">{group.day}</p>
                        <ol className="mt-3 space-y-4">
                          {group.items.map((event) => (
                            <li key={event.id} className="border-l-2 border-[var(--accent-solid)]/40 pl-3">
                              <p className="text-sm font-medium text-[var(--text)]">{event.summary}</p>
                              <p className="mt-1 text-[11px] text-[var(--text-soft)]">{event.actor}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ================= SETTINGS ================= */}
            {tab === "settings" && (
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <form onSubmit={saveWorkspace} className={cardClass}>
                  <h2 className="text-base font-semibold text-[var(--text)]">Workspace details</h2>
                  <label className="mt-4 block text-xs font-medium text-[var(--text-soft)]">Company name<input disabled={!canManage} required maxLength={120} value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} className={inputClass} /></label>
                  {canManage && <button disabled={saving} className={`${ghostBtn} mt-3 !px-4 !py-2 text-xs`}>Save details</button>}
                  <p className="mt-3 text-xs text-[var(--text-soft)]">Created {displayDate(workspace.createdAt)}</p>
                </form>

                <form onSubmit={saveRetention} className={cardClass}>
                  <h2 className="text-base font-semibold text-[var(--text)]">Audit-log retention</h2>
                  <p className="mt-1.5 text-xs leading-5 text-[var(--text-soft)]">Expired administrative activity is automatically purged daily. This setting applies to audit events, not review drafts or source documents.</p>
                  <label className="mt-4 block text-xs font-medium text-[var(--text-soft)]">Keep activity for (30–3650 days)<input disabled={!canManage} required type="number" min={30} max={3650} step={1} value={retentionDays} onChange={(event) => setRetentionDays(event.target.value)} className={inputClass} /></label>
                  {canManage && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {RETENTION_PRESETS.map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setRetentionDays(days)}
                          className={`rounded-full border px-3 py-1 text-xs ${Number(retentionDays) === days ? "border-[var(--accent-solid)] text-[var(--accent-solid)]" : "border-[var(--border)] text-[var(--text-soft)]"}`}
                        >
                          {days} days
                        </button>
                      ))}
                    </div>
                  )}
                  {canManage && <button disabled={saving} className={`${ghostBtn} mt-3 !px-4 !py-2 text-xs`}>Save retention</button>}
                </form>

                <section className={`${cardClass} lg:col-span-2`}>
                  <h2 className="text-base font-semibold text-[var(--text)]">Your access</h2>
                  <p className="mt-2 text-sm text-[var(--text-soft)]">
                    You are signed in as <Badge tone="accent">{workspace.role}</Badge>.{" "}
                    {isOwner && "You can manage everything, including admin access."}
                    {workspace.role === "admin" && "You can manage members (except admins) and approved sources."}
                    {!canManage && "You have read-only access to workspace administration."}
                  </p>
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}