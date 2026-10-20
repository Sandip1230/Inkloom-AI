import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Decodes the JWT payload (server/src/routes/auth.routes.js signs
// { id, name, email }) without needing a library or a /me API call.
function readUserFromToken() {
  const token = localStorage.getItem('brandloom-token');
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return { name: decoded.name || 'Guest', email: decoded.email || '' };
  } catch {
    return null;
  }
}

export default function Topbar() {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(() => readUserFromToken());
  const notifications = []; // no notification system wired up yet — always empty for now
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.removeItem('brandloom-token');
    setUser(null);
    setMenuOpen(false);
    navigate('/login', { replace: true });
  }

  const displayName = user?.name || 'Guest';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="flex items-center gap-4 px-6 pt-6 sm:px-10">
      <div className="relative flex-1 max-w-md">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
        <input
          type="search"
          placeholder="Search projects, templates…"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-10 pr-14 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent-solid)] focus:outline-none"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-soft)]">
          Ctrl K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div ref={notifRef} className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setNotifOpen((prev) => !prev)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-soft)] transition-colors hover:border-[var(--accent-solid)] hover:text-[var(--text)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9a6 6 0 0 1 12 0c0 3.4.8 5.2 1.6 6.2H4.4C5.2 14.2 6 12.4 6 9Z" />
              <path d="M10 19a2 2 0 0 0 4 0" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-rose-500" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg">
              <div className="px-2 py-1.5 text-sm font-semibold text-[var(--text)]">Notifications</div>
              {notifications.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-[var(--text-soft)]">No notifications</div>
              ) : (
                <ul className="max-h-72 overflow-y-auto">
                  {notifications.map((note) => (
                    <li key={note.id} className="rounded-md px-2 py-2 text-sm text-[var(--text)] hover:bg-[var(--border)]">
                      {note.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] text-sm font-semibold text-white"
          >
            {initial}
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-[var(--text)]">{displayName}</p>
                {user?.email && <p className="truncate text-xs text-[var(--text-soft)]">{user.email}</p>}
              </div>
              <div className="my-1 h-px bg-[var(--border)]" />
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-rose-400 transition-colors hover:bg-rose-500/10"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}