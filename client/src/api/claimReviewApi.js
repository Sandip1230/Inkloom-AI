const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Thin wrapper for /api/claim-review. Uses the same JWT as the admin API.
export async function claimReviewRequest(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("inkloom-token") || localStorage.getItem("brandloom-token");
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/claim-review${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    let message = `Claim review request failed (${response.status}).`;
    try {
      const data = await response.json();
      if (data.error) message = data.error;
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const documentsApi = {
  list: (workspaceId) => claimReviewRequest(`/workspaces/${workspaceId}/documents`),
  create: (workspaceId, body) => claimReviewRequest(`/workspaces/${workspaceId}/documents`, { method: "POST", body }),
  update: (workspaceId, documentId, body) => claimReviewRequest(`/workspaces/${workspaceId}/documents/${documentId}`, { method: "PATCH", body }),
  addVersion: (workspaceId, documentId, body) => claimReviewRequest(`/workspaces/${workspaceId}/documents/${documentId}/versions`, { method: "POST", body }),
  getVersion: (workspaceId, documentId, version) => claimReviewRequest(`/workspaces/${workspaceId}/documents/${documentId}/versions/${version}`),
  decide: (workspaceId, documentId, version, decision) => claimReviewRequest(`/workspaces/${workspaceId}/documents/${documentId}/versions/${version}/decision`, { method: "POST", body: { decision } }),
};

export const claimsApi = {
  list: (workspaceId) => claimReviewRequest(`/workspaces/${workspaceId}/claims`),
  get: (workspaceId, claimId) => claimReviewRequest(`/workspaces/${workspaceId}/claims/${claimId}`),
  submit: (workspaceId, claim) => claimReviewRequest(`/workspaces/${workspaceId}/claims`, { method: "POST", body: { claim } }),
  review: (workspaceId, claimId, body) => claimReviewRequest(`/workspaces/${workspaceId}/claims/${claimId}/review`, { method: "POST", body }),
};