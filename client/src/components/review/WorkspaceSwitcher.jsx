import { Link } from "react-router-dom";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";

export default function WorkspaceSwitcher() {
  const { ready, workspaces, workspaceId, setWorkspaceId, role } = useWorkspace();
  if (!ready) return null;

  if (!workspaces.length) {
    return (
      <p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3 text-xs text-[var(--text-soft)]">
        Reviews are saved only in this browser.{" "}
        <Link to="/company-admin" className="font-semibold text-[var(--accent-solid)]">
          Sign in and create or join a workspace
        </Link>{" "}
        to share drafts with your team.
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
      <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-soft)]">
        Save reviews to
        <select
          value={workspaceId}
          onChange={(event) => setWorkspaceId(event.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-xs text-[var(--text)]"
        >
          <option value="">Personal (this browser only)</option>
          {workspaces.map((item) => (
            <option key={item._id} value={item._id}>{item.name}</option>
          ))}
        </select>
      </label>
      <p className="text-[11px] text-[var(--text-soft)]">
        {workspaceId
          ? `Shared with this workspace · your role: ${role || "…"}`
          : "Only you can see these reviews."}
      </p>
    </div>
  );
}