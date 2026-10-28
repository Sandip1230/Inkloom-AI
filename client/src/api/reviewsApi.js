const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getToken() {
  return localStorage.getItem("inkloom-token") || localStorage.getItem("brandloom-token");
}

async function request(workspaceId, path = "", { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}/reviews${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error("Could not reach the review service. Check your connection and try again.");
  }

  if (!response.ok) {
    let message = `Shared review request failed (${response.status}).`;
    let code;
    try {
      const data = await response.json();
      if (data.error) message = data.error;
      code = data.code;
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
    const failure = new Error(message);
    failure.status = response.status;
    failure.code = code;
    throw failure;
  }

  if (response.status === 204) return null;
  return response.json();
}

function toPayload({ content, contentType, findings, guidelineSnapshot }) {
  return { content, contentType, findings, guidelineSnapshot };
}

export const getReviewMeta = (workspaceId) => request(workspaceId, "/meta");
export const listSharedReviews = (workspaceId) => request(workspaceId);
export const getSharedReview = (workspaceId, id) => request(workspaceId, `/${id}`);

export const createSharedReview = (workspaceId, review) =>
  request(workspaceId, "", { method: "POST", body: toPayload(review) });

export const updateSharedReview = (workspaceId, id, review, expectedRev) =>
  request(workspaceId, `/${id}`, { method: "PUT", body: { ...toPayload(review), expectedRev } });

export const setReviewAssignees = (workspaceId, id, userIds) =>
  request(workspaceId, `/${id}/assignees`, { method: "PUT", body: { userIds } });

export const addReviewComment = (workspaceId, id, text) =>
  request(workspaceId, `/${id}/comments`, { method: "POST", body: { text } });

export const decideReview = (workspaceId, id, status, note) =>
  request(workspaceId, `/${id}/decision`, { method: "POST", body: { status, note } });

export const getReviewActivity = (workspaceId, id) => request(workspaceId, `/${id}/activity`);
export const deleteSharedReview = (workspaceId, id) => request(workspaceId, `/${id}`, { method: "DELETE" });