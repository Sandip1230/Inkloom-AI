// Account type helpers. The account type ("admin" or "user") is chosen on the Sign-up page,
// stored on the server, and embedded in the login token.

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getToken() {
  return localStorage.getItem("inkloom-token") || localStorage.getItem("brandloom-token");
}

/** "admin" | "user" | null (null = token has no account type, e.g. issued before this feature). */
export function getAccountTypeFromToken() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.accountType === "admin" || decoded.accountType === "user" ? decoded.accountType : null;
  } catch {
    return null;
  }
}

/** Asks the server for the authoritative account type. Used only when the token doesn't carry one. */
export async function fetchAccountType() {
  const token = getToken();
  if (!token) return "user";
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Could not verify your account type.");
  const data = await response.json();
  return data.user?.accountType === "admin" ? "admin" : "user";
}