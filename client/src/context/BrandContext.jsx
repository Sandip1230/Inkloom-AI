import { createContext, useContext, useEffect, useState } from "react";
import { runStage as callStageApi } from "../api/brandApi.js";
import { STAGE_KEYS, nextStageKey, previousStageKey } from "../lib/stages.js";
import { getProject, saveProject } from "../lib/projectsStore.js";

const BrandContext = createContext(null);

function firstIncompleteStage(stageOutputs) {
  for (const key of STAGE_KEYS) {
    if (!stageOutputs[key]) return key;
  }
  return STAGE_KEYS[STAGE_KEYS.length - 1];
}

export function BrandProvider({ children, projectId }) {
  const [brand, setBrand] = useState(() => {
    const existing = getProject(projectId);
    if (existing) {
      return {
        id: existing.id,
        brief: existing.brief || "",
        stageOutputs: existing.stageOutputs || {},
        selectedName: existing.selectedName || "",
        createdAt: existing.createdAt || Date.now(),
      };
    }
    return { id: projectId, brief: "", stageOutputs: {}, selectedName: "", createdAt: Date.now() };
  });
  const [activeStage, setActiveStage] = useState(() => {
    const existing = getProject(projectId);
    return existing ? firstIncompleteStage(existing.stageOutputs || {}) : STAGE_KEYS[0];
  });
  const [pendingStage, setPendingStage] = useState(null);
  const [stageErrors, setStageErrors] = useState({});

  // Persist to localStorage whenever the brief or a stage output changes,
  // so "Projects" can list it and it's resumable after a refresh. Only
  // saves once there's an actual brief - an untouched project never
  // clutters the projects list.
  useEffect(() => {
    if (!brand.id || !brand.brief) return;
    saveProject(brand);
  }, [brand]);

  async function submitBrief(brief) {
    setPendingStage("understand");
    setStageErrors((current) => ({ ...current, understand: null }));
    try {
      const result = await callStageApi("understand", { brief });
      setBrand((current) => ({
        ...current,
        brief,
        stageOutputs: { ...current.stageOutputs, understand: result },
      }));
      return result;
    } catch (error) {
      setStageErrors((current) => ({ ...current, understand: describeError(error) }));
      throw error;
    } finally {
      setPendingStage(null);
    }
  }

  async function runStage(stageKey) {
    setPendingStage(stageKey);
    setStageErrors((current) => ({ ...current, [stageKey]: null }));
    try {
      const result = await callStageApi(stageKey, {
        brief: brand.brief,
        // Pass the user's chosen brand name alongside the accumulated stage
        // context so Challenge/Deliver stop treating "no committed name" as
        // an open issue once the user has actually picked one.
        context: { ...brand.stageOutputs, selectedName: brand.selectedName || undefined },
      });
      setBrand((current) => ({
        ...current,
        stageOutputs: { ...current.stageOutputs, [stageKey]: result },
      }));
      return result;
    } catch (error) {
      setStageErrors((current) => ({ ...current, [stageKey]: describeError(error) }));
      throw error;
    } finally {
      setPendingStage(null);
    }
  }

  // Client-side only - the user is picking from AI-suggested naming
  // directions, not generating a new one, so this doesn't need an API call.
  function selectName(name) {
    setBrand((current) => ({ ...current, selectedName: name }));
  }

  function goToStage(stageKey) {
    setActiveStage(stageKey);
  }

  function advance(fromStageKey) {
    const next = nextStageKey(fromStageKey);
    if (next) setActiveStage(next);
  }

  function goBack(fromStageKey) {
    const previous = previousStageKey(fromStageKey);
    if (previous) setActiveStage(previous);
  }

  return (
    <BrandContext.Provider
      value={{
        brand,
        activeStage,
        pendingStage,
        stageErrors,
        submitBrief,
        runStage,
        selectName,
        goToStage,
        advance,
        goBack,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

function describeError(error) {
  if (error?.code === "ECONNABORTED" || error?.message?.includes("timeout")) {
    return "The server took too long to respond. Check your connection and try again.";
  }
  if (!error?.response) {
    return "Can't reach the server. Make sure the backend is running and VITE_API_URL points to it.";
  }
  if (error.response.status === 501) {
    return "This stage isn't wired up on the server yet.";
  }
  if (error.response.data?.error) return error.response.data.error;
  return "Something went wrong reaching the server. Check that it's running and try again.";
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) throw new Error("useBrand must be used inside BrandProvider");
  return context;
}