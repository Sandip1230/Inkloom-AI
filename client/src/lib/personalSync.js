import { fetchMyReviews, pushMyReview, syncMyReviews } from "../api/myReviewsApi.js";
import { listReviews, replaceReviews } from "./reviewStore.js";

const OWNER_KEY = "inkloom-reviews-owner";
const CHUNK_SIZE = 25;
let inFlight = null;

function currentUserId() {
  const token = localStorage.getItem("inkloom-token") || localStorage.getItem("brandloom-token");
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.id ? String(payload.id) : "";
  } catch {
    return "";
  }
}

function readLocal() {
  try {
    const list = listReviews();
    return Array.isArray(list) ? list.filter((item) => item && item.id) : [];
  } catch {
    return [];
  }
}

async function run() {
  const userId = currentUserId();
  if (!userId) return null;

  // If a different account used this browser before, do not upload its reviews to this account.
  let owner = "";
  try { owner = localStorage.getItem(OWNER_KEY) || ""; } catch { /* ignore */ }
  const mine = !owner || owner === userId;

  const local = mine ? readLocal() : [];
  const remote = await fetchMyReviews();
  const remoteById = new Map(remote.map((item) => [item.id, item]));

  // Upload only what the server is missing or has an older copy of.
  const pending = local.filter((item) => {
    const onServer = remoteById.get(item.id);
    return !onServer || (item.updatedAt || 0) > (onServer.updatedAt || 0);
  });

  let latest = remote;
  for (let index = 0; index < pending.length; index += CHUNK_SIZE) {
    latest = await syncMyReviews(pending.slice(index, index + CHUNK_SIZE));
  }

  // Merge again with a fresh read, so a review saved while syncing is never lost.
  const merged = new Map(latest.map((item) => [item.id, item]));
  for (const item of mine ? readLocal() : []) {
    const current = merged.get(item.id);
    if (!current || (item.updatedAt || 0) > (current.updatedAt || 0)) merged.set(item.id, item);
  }

  const result = [...merged.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  try {
    replaceReviews(result);
    localStorage.setItem(OWNER_KEY, userId);
  } catch { /* storage full or blocked: the server copy is still safe */ }
  return result;
}

// Pulls this account's reviews from the server and uploads any this browser has that the server lacks.
export function syncPersonalReviews() {
  if (!inFlight) inFlight = run().finally(() => { inFlight = null; });
  return inFlight;
}

// Fire-and-forget upload after a save. If it fails, the next sync uploads it.
export function pushPersonalReview(review) {
  if (!currentUserId()) return;
  pushMyReview(review).catch(() => {});
}