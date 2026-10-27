import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { adminRequest } from "../api/adminApi.js";
import ClaimsPanel from "../components/claimreview/ClaimsPanel.jsx";
import DocumentsPanel from "../components/claimreview/DocumentsPanel.jsx";
import { ErrorNote, cardClass, inputClass } from "../components/claimreview/shared.jsx";

const TABS = [
  ["claims", "Claim review"],
  ["documents", "Reference documents"],
];
const WORKSPACE_KEY = "inkloom-claim-review-workspace";

function readStoredWorkspace() {
  try {
    return localStorage.getItem(WORKSPACE_KEY) || "";
  } catch {
    return "";
  }
}

export default function ClaimReview() {
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [tab, setTab] = useState("claims");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminRequest("/workspaces")
      .then((data) => {
        if (!active) return;
        setWorkspaces(data);
        const stored = readStoredWorkspace();
        setWorkspaceId(data.some((item) => item._id === stored) ? stored : data[0]?._id || "");
      })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function chooseWorkspace(id) {
    setWorkspaceId(id);
    try {
      localStorage.setItem(WORKSPACE_KEY, id);
    } catch {
      // storage unavailable - selection just is not remembered
    }
  }

  const workspace = workspaces.find((item) => item._id === workspaceId);
  const role = workspace?.role || "creator";
  const canManage = role === "owner" || role === "admin";
  const canReview = canManage || role === "reviewer";

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">Source-grounded claim review</h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--text-soft)]">
              Check statements against approved reference documents. The system suggests Supported, Contradicted, or Unverified and shows its evidence; a human reviewer decides.
            </p>
          </div>
          {workspaces.length > 0 && (
            <label className="text-xs font-medium text-[var(--text-soft)]">
              Workspace
              <select value={workspaceId} onChange={(event) => chooseWorkspace(event.target.value)} className={`${inputClass} min-w-52`}>
                {workspaces.map((item) => (
                  <option key={item._id} value={item._id}>{item.name} ({item.role})</option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="mt-4"><ErrorNote message={error} /></div>

        {loading ? (
          <p className="mt-8 text-sm text-[var(--text-soft)]">Loading workspaces...</p>
        ) : !workspace ? (
          !error && (
            <section className={`${cardClass} mt-8`}>
              <h2 className="text-base font-semibold text-[var(--text)]">Create or join a workspace first</h2>
              <p className="mt-2 text-sm text-[var(--text-soft)]">
                Reference documents and claim reviews belong to a workspace so roles and audit history apply.
                Sign in, then create a workspace in <Link to="/company-admin" className="font-medium text-[var(--accent-solid)] hover:underline">Company Admin</Link>.
              </p>
            </section>
          )
        ) : (
          <>
            <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-[var(--border)]" aria-label="Claim review sections">
              {TABS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  aria-current={tab === key ? "page" : undefined}
                  className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition ${tab === key ? "border-[var(--accent-solid)] text-[var(--accent-solid)]" : "border-transparent text-[var(--text-soft)] hover:text-[var(--text)]"}`}
                >
                  {label}
                </button>
              ))}
            </nav>
            {tab === "claims"
              ? <ClaimsPanel key={workspaceId} workspaceId={workspaceId} canReview={canReview} />
              : <DocumentsPanel key={workspaceId} workspaceId={workspaceId} canManage={canManage} />}
          </>
        )}
      </div>
    </AppShell>
  );
}