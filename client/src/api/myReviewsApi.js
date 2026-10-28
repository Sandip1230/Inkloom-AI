const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getToken() {
  return localStorage.getItem("inkloom-token") || localStorage.getItem("brandloom-token");
}

async function request(path = "", { method = "GET", body } = {}) {
  const token = getToken();
  if (!token) throw new Error("Sign in to sync reviews.");

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/my-reviews${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error("Could not reach the review service.");
  }

  if (!response.ok) {
    let message = `Review sync failed (${response.status}).`;
    try {
      const data = await response.json();
      if (data.error) message = data.error;
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
    throw new Error(message);
  }

  return response.json();
}

export const fetchMyReviews = () => request("");
export const syncMyReviews = (reviews) => request("/sync", { method: "POST", body: { reviews } });
export const pushMyReview = (review) => request(`/${review.id}`, { method: "PUT", body: review });