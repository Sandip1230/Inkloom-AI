const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function currentToken() {
  return localStorage.getItem("inkloom-token") || localStorage.getItem("brandloom-token");
}

export async function adminRequest(path, { method = "GET", body } = {}) {
  const token = currentToken();
  const response = await fetch(`${API_BASE_URL}/api/admin${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    let message = `Workspace administration failed (${response.status}).`;
    let code;
    try {
      const data = await response.json();
      if (data.error) message = data.error;
      code = data.code;
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
    const requestError = new Error(message);
    requestError.status = response.status;
    requestError.code = code;
    throw requestError;
  }

  if (response.status === 204) return null;
  return response.json();
}

/* Small in-memory cache so the Company Admin page paints instantly
 * (show what we already have, refresh quietly in the background).
 * Dropped automatically when a different user signs in. */
const cache = new Map();
const inflight = new Map();
let cacheOwner = null;

function syncCacheOwner() {
  const token = currentToken();
  if (token !== cacheOwner) {
    cache.clear();
    inflight.clear();
    cacheOwner = token;
  }
}

/** Last known response for a GET path, or undefined. Never hits the network. */
export function peekAdmin(path) {
  syncCacheOwner();
  return cache.get(path);
}

/** GET with caching + de-duplication of simultaneous calls. Always fetches fresh data and updates the cache. */
export function fetchAdmin(path) {
  syncCacheOwner();
  if (inflight.has(path)) return inflight.get(path);
  const owner = cacheOwner;
  const request = adminRequest(path)
    .then((data) => {
      if (owner === cacheOwner) cache.set(path, data);
      return data;
    })
    .finally(() => inflight.delete(path));
  inflight.set(path, request);
  return request;
}

/** Fire-and-forget warm-up. Errors are ignored. */
export function prefetchAdmin(path) {
  fetchAdmin(path).catch(() => {});
}

export function clearAdminCache() {
  cache.clear();
  inflight.clear();
}