import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function readError(response, data) {
  return data?.error || `Account deletion failed (${response.status}).`;
}

export default function AccountDeletionAction({ userKey, onDeleted, className = "" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function deleteAccount() {
    const confirmed = window.confirm(
      "Permanently delete this account and its local review history from this browser? Shared workspace data will be preserved. You cannot undo this action.",
    );
    if (!confirmed) return;

    const token = localStorage.getItem("inkloom-token") || localStorage.getItem("brandloom-token");
    if (!token) {
      setError("Sign in again before deleting this account.");
      return;
    }

    setBusy(true);
    setError("");
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/api/auth/account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setBusy(false);
      setError("Could not reach the server. Your account was not deleted; check your connection and try again.");
      return;
    }

    let data = {};
    try {
      data = await response.json();
    } catch (parseError) {
      if (!(parseError instanceof SyntaxError)) {
        setBusy(false);
        setError("The server response could not be read. Verify account status before retrying.");
        return;
      }
    }
    if (!response.ok) {
      setBusy(false);
      setError(readError(response, data));
      return;
    }

    let cleanupWarning = "";
    try {
      localStorage.removeItem("inkloom-token");
      localStorage.removeItem("brandloom-token");
      [
        "inkloom-reviews",
        "brandloom-reviews",
        "inkloom-guidelines",
        "brandloom-guidelines",
        "inkloom-projects",
        "brandloom-projects",
        `inkloom-avatar-style:${String(userKey || "").trim().toLowerCase()}`,
      ].forEach((key) => localStorage.removeItem(key));
    } catch {
      cleanupWarning = " The account is deleted, but some local browser data could not be cleared; clear this site’s storage manually.";
    }
    onDeleted?.();
    setBusy(false);
    navigate("/login", { replace: true });
    if (cleanupWarning) window.alert(`Account deleted.${cleanupWarning}`);
  }

  return (
    <>
      {error && <p role="alert" className="px-2 py-2 text-xs leading-5 text-rose-500">{error}</p>}
      <button
        type="button"
        onClick={deleteAccount}
        disabled={busy}
        className={className}
      >
        {busy ? "Deleting account…" : "Delete account"}
      </button>
    </>
  );
}
