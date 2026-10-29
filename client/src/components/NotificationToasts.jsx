import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestOpenNotifications } from "../lib/notificationStore.js";
import "../styles/NotificationToasts.css";

const VISIBLE_MS = 5000; // how long a popup stays on screen
const EXIT_MS = 350; // must match the slide-out animation time in NotificationToasts.css

export default function NotificationToasts() {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    timers.current.delete(`${id}:remove`);
  }, []);

  // Starts the slide-out animation, then removes the popup once it has finished.
  const dismissToast = useCallback(
    (id) => {
      const autoTimer = timers.current.get(`${id}:auto`);
      if (autoTimer) {
        clearTimeout(autoTimer);
        timers.current.delete(`${id}:auto`);
      }
      if (timers.current.has(`${id}:remove`)) return; // already leaving

      setToasts((current) =>
        current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)),
      );
      timers.current.set(`${id}:remove`, setTimeout(() => removeToast(id), EXIT_MS));
    },
    [removeToast],
  );

  useEffect(() => {
    function handleAdded(event) {
      const note = event.detail;
      if (!note || !note.id) return;

      setToasts((current) => {
        if (current.some((toast) => toast.id === note.id)) return current;
        return [...current, { id: note.id, message: note.message, leaving: false }];
      });
      timers.current.set(`${note.id}:auto`, setTimeout(() => dismissToast(note.id), VISIBLE_MS));
    }

    window.addEventListener("inkloom-notification-added", handleAdded);
    return () => window.removeEventListener("inkloom-notification-added", handleAdded);
  }, [dismissToast]);

  // Clear every timer if this component is ever removed from the page.
  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  function openNotificationBox(id) {
    dismissToast(id);
    requestOpenNotifications();
    // Pages without a top bar (login, loading, ...) have no bell, so go to the dashboard first.
    // The top bar opens the box by itself as soon as it appears.
    if (!document.querySelector('[aria-label="Notifications"]')) {
      navigate("/projects");
    }
  }

  if (toasts.length === 0) return null;

  return (
    <div className="ink-toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`ink-toast ${toast.leaving ? "ink-toast--leaving" : ""}`}
          role="status"
          tabIndex={0}
          onClick={() => openNotificationBox(toast.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openNotificationBox(toast.id);
            }
          }}
        >
          <p className="ink-toast__message">{toast.message}</p>
          <button
            type="button"
            className="ink-toast__close"
            aria-label="Close notification"
            title="Close"
            onClick={(event) => {
              event.stopPropagation(); // closing must not also open the notification box
              dismissToast(toast.id);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}