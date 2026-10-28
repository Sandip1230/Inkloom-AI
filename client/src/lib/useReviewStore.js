import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import * as api from "../api/reviewsApi.js";
import {
  createReviewId,
  listReviews as listLocalReviews,
  saveReview as saveLocalReview,
} from "./reviewStore.js";
import { pushPersonalReview, syncPersonalReviews } from "./personalSync.js";

const POLL_MS = 20000;
const SERVER_ID = /^[a-f\d]{24}$/i;

// One hook for every page: team workspace selected -> server workspace,
// otherwise -> personal reviews (this browser, synced to your account when signed in).
export function useReviewStore() {
  const { ready, workspaceId } = useWorkspace();
  const shared = Boolean(workspaceId);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reviewsRef = useRef([]);
  const ticketRef = useRef(0);

  const commit = useCallback((next) => {
    reviewsRef.current = next;
    setReviews(next);
  }, []);

  const refresh = useCallback(async () => {
    if (!ready) return;
    const ticket = ++ticketRef.current;
    try {
      let next;
      if (shared) {
        next = await api.listSharedReviews(workspaceId);
      } else {
        // Show this browser's copy immediately, then merge in the account's copy.
        next = listLocalReviews();
        if (ticket === ticketRef.current) {
          commit(next);
          setLoading(false);
        }
        try {
          const synced = await syncPersonalReviews();
          if (synced) next = synced;
        } catch {
          // Offline or server asleep: keep working with the local copy.
        }
      }
      if (ticket !== ticketRef.current) return; // a newer request (or workspace switch) won
      commit(next);
      setError("");
    } catch (loadError) {
      if (ticket === ticketRef.current) setError(loadError.message);
    } finally {
      if (ticket === ticketRef.current) setLoading(false);
    }
  }, [ready, shared, workspaceId, commit]);

  useEffect(() => {
    setLoading(true);
    commit([]);
    refresh();
  }, [refresh, commit]);

  // Team workspace: poll for teammates' changes.
  useEffect(() => {
    if (!shared) return undefined;
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [shared, refresh]);

  // Personal mode: pick up changes made on another device when this tab comes back into view.
  useEffect(() => {
    if (shared) return undefined;
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [shared, refresh]);

  const upsert = useCallback((review) => {
    const current = reviewsRef.current;
    const index = current.findIndex((item) => item.id === review.id);
    commit(index === -1 ? [review, ...current] : current.map((item, i) => (i === index ? review : item)));
    return review;
  }, [commit]);

  const save = useCallback(async (draft) => {
    if (!shared) {
      const saved = saveLocalReview({ ...draft, id: draft.id || createReviewId() });
      pushPersonalReview(saved);
      return upsert(saved);
    }
    try {
      if (draft.id && SERVER_ID.test(draft.id)) {
        const expectedRev = draft.contentRev ?? (await api.getSharedReview(workspaceId, draft.id)).contentRev;
        return upsert(await api.updateSharedReview(workspaceId, draft.id, draft, expectedRev));
      }
      return upsert(await api.createSharedReview(workspaceId, draft));
    } catch (saveError) {
      if (saveError.code === "REV_CONFLICT") refresh();
      throw saveError;
    }
  }, [shared, workspaceId, upsert, refresh]);

  const decide = useCallback(async (draft, status, note = "") => {
    if (!shared) {
      const saved = saveLocalReview({ ...draft, id: draft.id || createReviewId(), status });
      pushPersonalReview(saved);
      return upsert(saved);
    }
    if (!draft.id || !SERVER_ID.test(draft.id)) {
      throw new Error("Run the review first so it is saved to the workspace.");
    }
    try {
      return upsert(await api.decideReview(workspaceId, draft.id, status, note));
    } catch (decideError) {
      if (decideError.status === 409) refresh();
      throw decideError;
    }
  }, [shared, workspaceId, upsert, refresh]);

  const assign = useCallback(
    async (id, userIds) => upsert(await api.setReviewAssignees(workspaceId, id, userIds)),
    [workspaceId, upsert],
  );

  const addComment = useCallback(
    async (id, text) => upsert(await api.addReviewComment(workspaceId, id, text)),
    [workspaceId, upsert],
  );

  const remove = useCallback(async (id) => {
    await api.deleteSharedReview(workspaceId, id);
    commit(reviewsRef.current.filter((item) => item.id !== id));
  }, [workspaceId, commit]);

  return { reviews, loading, error, shared, workspaceId, refresh, save, decide, assign, addComment, remove };
}