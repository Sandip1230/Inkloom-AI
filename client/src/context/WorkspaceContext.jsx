import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchAdmin, peekAdmin, prefetchAdmin } from "../api/adminApi.js";
import { getReviewMeta } from "../api/reviewsApi.js";
import { getAccountTypeFromToken } from "../lib/account.js";

const ACTIVE_KEY = "inkloom-active-workspace";

const EMPTY = {
  ready: true,
  workspaces: [],
  workspaceId: "",
  setWorkspaceId: () => {},
  role: "",
  userId: "",
  members: [],
  error: "",
};

const WorkspaceContext = createContext(EMPTY);

function hasToken() {
  return Boolean(localStorage.getItem("inkloom-token") || localStorage.getItem("brandloom-token"));
}

export function WorkspaceProvider({ children }) {
  const { pathname } = useLocation();
  const signedIn = hasToken();
  // Start from the cached list (if any) so pages never wait on a blank state.
  const [workspaces, setWorkspaces] = useState(() => (hasToken() ? peekAdmin("/workspaces") || [] : []));
  const [workspaceId, setWorkspaceIdState] = useState("");
  const [meta, setMeta] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  // Reload the workspace list on sign-in and on route change (cheap, keeps new workspaces fresh).
  useEffect(() => {
    if (!signedIn) {
      setWorkspaces([]);
      setWorkspaceIdState("");
      setMeta(null);
      setReady(true);
      return undefined;
    }
    let active = true;
    fetchAdmin("/workspaces")
      .then((data) => {
        if (!active) return;
        setWorkspaces(data);
        const saved = localStorage.getItem(ACTIVE_KEY);
        let next = "";
        if (saved === "personal") next = "";
        else if (saved && data.some((item) => item._id === saved)) next = saved;
        else next = data[0]?._id || "";
        setWorkspaceIdState(next);
        setError("");
        // Warm the Company Admin page for admins so it opens instantly.
        const adminTarget = next || data[0]?._id;
        if (adminTarget && getAccountTypeFromToken() === "admin") {
          prefetchAdmin(`/workspaces/${adminTarget}`);
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => { active = false; };
  }, [signedIn, pathname]);

  useEffect(() => {
    if (!workspaceId) {
      setMeta(null);
      return undefined;
    }
    let active = true;
    getReviewMeta(workspaceId)
      .then((data) => { if (active) setMeta(data); })
      .catch((metaError) => { if (active) setError(metaError.message); });
    return () => { active = false; };
  }, [workspaceId]);

  const setWorkspaceId = useCallback((id) => {
    localStorage.setItem(ACTIVE_KEY, id || "personal");
    setWorkspaceIdState(id || "");
  }, []);

  const value = useMemo(() => ({
    ready,
    workspaces,
    workspaceId,
    setWorkspaceId,
    role: meta?.role || "",
    userId: meta?.userId || "",
    members: meta?.members || [],
    error,
  }), [ready, workspaces, workspaceId, setWorkspaceId, meta, error]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}