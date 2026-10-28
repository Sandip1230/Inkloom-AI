import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { adminRequest } from "../api/adminApi.js";
import ClaimsPanel from "../components/claimreview/ClaimsPanel.jsx";
import DocumentsPanel from "../components/claimreview/DocumentsPanel.jsx";
import ProcessGuide from "../components/claimreview/ProcessGuide.jsx";
import SignInGuide from "../components/claimreview/SignInGuide.jsx";
import SampleScenario from "../components/claimreview/SampleScenario.jsx";
import TutorialWindow, { hasCompletedTutorial, markTutorialCompleted } from "../components/claimreview/TutorialWindow.jsx";
import { Badge, ErrorNote, Icon, cardClass, inputClass, primaryBtn } from "../components/claimreview/shared.jsx";
import { PageHero } from "../components/ThemeIcons.jsx";
import "../styles/ThemePages.css";
import "../styles/ClaimReview.css";

const TABS = [
  ["claims", "Claim review", "search"],
  ["documents", "Reference documents", "file"],
];
const WORKSPACE_KEY = "inkloom-claim-review-workspace";
const GUIDE_KEY = "inkloom-claim-review-guide-seen";
// Messages the server sends with a 401 (see requireAuth).
const AUTH_ERROR = /sign in|session is invalid|has expired|cannot access workspace/i;

const ROLE_NOTE = {
  owner: "You can manage sources, submit claims and record final decisions.",
  admin: "You can manage sources, submit claims and record final decisions.",
  reviewer: "You can submit claims and record final decisions.",
  creator: "You can submit claims. A reviewer records the final decision.",
};

function readStored(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function hasToken() {
  try {
    return Boolean(localStorage.getItem("inkloom-token") || localStorage.getItem("brandloom-token"));
  } catch {
    return false;
  }
}

export default function ClaimReview() {
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [tab, setTab] = useState("claims");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authIssue, setAuthIssue] = useState(() => (hasToken() ? "" : "missing"));
  const [attempt, setAttempt] = useState(0);
  // Opens by itself the first time someone enters Claim Review; never again after "Finish".
  const [tutorialOpen, setTutorialOpen] = useState(() => !hasCompletedTutorial());

  useEffect(() => {
    let active = true;
    if (!hasToken()) {
      setAuthIssue("missing");
      setLoading(false);
      return undefined;
    }
    setAuthIssue("");
    setError("");
    setLoading(true);
    adminRequest("/workspaces")
      .then((data) => {
        if (!active) return;
        setWorkspaces(data);
        const stored = readStored(WORKSPACE_KEY);
        setWorkspaceId(data.some((item) => item._id === stored) ? stored : data[0]?._id || "");
      })
      .catch((loadError) => {
        if (!active) return;
        if (AUTH_ERROR.test(loadError.message || "")) setAuthIssue("expired");
        else setError(loadError.message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  function finishTutorial() {
    markTutorialCompleted();
    setTutorialOpen(false);
  }

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
  // Which step of the process guide the person is on right now.
  const currentStep = !workspace ? 1 : tab === "documents" ? 2 : 3;
  const firstVisit = !readStored(GUIDE_KEY);

  useEffect(() => {
    if (!workspace) return;
    try {
      localStorage.setItem(GUIDE_KEY, "1");
    } catch {
      // ignore - the guide just opens again next time
    }
  }, [workspace]);

  return (
    <AppShell>
      {tutorialOpen && <TutorialWindow onFinish={finishTutorial} />}
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <PageHero
          icon="shield"
          eyebrow="Human-in-the-loop verification"
          title="Source-grounded claim review"
          text="Check statements against approved reference documents. The system suggests Supported, Contradicted, or Unverified and shows its evidence; a human reviewer decides."
          notice={workspace ? (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-soft)]">
              <Badge tone="accent">Your role: {role}</Badge>
              <span>{ROLE_NOTE[role]}</span>
            </p>
          ) : null}
        >
            <div className="flex flex-wrap items-end gap-3">
              <button type="button" onClick={() => setTutorialOpen(true)} className="tp-btn-ghost tp-btn-sm self-end">
                <Icon name="help" size={14} /> Tutorial
              </button>
              {!authIssue && workspaces.length > 0 && (
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
        </PageHero>

        {authIssue ? (
          <SignInGuide reason={authIssue} hasToken={hasToken()} onRetry={() => setAttempt((value) => value + 1)} />
        ) : (
          <>
            <div className="mt-4"><ErrorNote message={error} /></div>

            {loading ? (
              <div className="mt-8 space-y-3" aria-busy="true" aria-live="polite">
                <div className="tp-card h-24 animate-pulse" />
                <div className="tp-card h-40 animate-pulse" />
                <span className="sr-only">Loading workspaces...</span>
              </div>
            ) : !workspace ? (
              !error && (
                <div className="mt-6 space-y-6">
                  <section className={`${cardClass} cr-rise`}>
                    <h2 className="text-base font-semibold text-[var(--text)]">Create or join a workspace first</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                      Reference documents and claim reviews belong to a workspace so roles and audit history apply.
                      You are signed in, but you are not a member of any workspace yet.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link to="/company-admin" className={`${primaryBtn} inline-flex items-center gap-2`}>
                        <Icon name="building" size={16} /> Open Company Admin
                      </Link>
                      <span className="text-xs text-[var(--text-soft)]">Create a workspace, or ask an owner to invite you.</span>
                    </div>
                  </section>
                  <ProcessGuide current={1} />
                  <SampleScenario />
                </div>
              )
            ) : (
              <>
                <div className="mt-6">
                  <ProcessGuide current={currentStep} defaultOpen={firstVisit} />
                </div>

                <nav className="tp-tabs mt-6" aria-label="Claim review sections">
                  {TABS.map(([key, label, icon]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      aria-current={tab === key ? "page" : undefined}
                      className={`tp-tab ${tab === key ? "is-active" : ""}`}
                    >
                      <Icon name={icon} size={16} />
                      {label}
                    </button>
                  ))}
                </nav>
                {tab === "claims"
                  ? <ClaimsPanel key={workspaceId} workspaceId={workspaceId} canReview={canReview} />
                  : <DocumentsPanel key={workspaceId} workspaceId={workspaceId} canManage={canManage} />}
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}