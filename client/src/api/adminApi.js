const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function adminRequest(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("inkloom-token") || localStorage.getItem("brandloom-token");
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
