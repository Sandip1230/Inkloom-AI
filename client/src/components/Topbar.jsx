import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from './ProfileAvatar.jsx';
import ProfilePhotoPicker from './ProfilePhotoPicker.jsx';
import AccountDeletionAction from './AccountDeletionAction.jsx';
import { useAvatarStyle } from '../lib/profileStore.js';
import { getNotifications, markAllRead, removeNotification } from '../lib/notificationStore.js';

// Decodes the JWT payload (server/src/routes/auth.routes.js signs
// { id, name, email }) without needing a library or a /me API call.
function readUserFromToken() {
  const token = localStorage.getItem('inkloom-token') || localStorage.getItem('brandloom-token');
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return { id: decoded.id || '', name: decoded.name || 'Guest', email: decoded.email || '' };
  } catch {
    return null;
  }
}

export default function Topbar({ showProfile = true }) {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(() => readUserFromToken());
  const [photoOpen, setPhotoOpen] = useState(false);
  const [avatarStyle, setAvatarStyle] = useAvatarStyle(user?.email || user?.name);
  const [notifications, setNotifications] = useState(() => getNotifications());
  const unreadCount = notifications.filter((note) => !note.read).length;

  const refreshNotifications = useCallback(() => setNotifications(getNotifications()), []);

  useEffect(() => {
    window.addEventListener('inkloom-notifications-changed', refreshNotifications);
    // Re-check every minute so notifications older than 24 hours disappear while the page is open.
    const expiryTimer = setInterval(refreshNotifications, 60 * 1000);
    return () => {
      window.removeEventListener('inkloom-notifications-changed', refreshNotifications);
      clearInterval(expiryTimer);
    };
  }, [refreshNotifications]);
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
    localStorage.removeItem('inkloom-token');
    localStorage.removeItem('brandloom-token');
    setUser(null);
    setMenuOpen(false);
    navigate('/login', { replace: true });
  }

  const displayName = user?.name || 'Guest';

  function openPhotoPicker() {
    setMenuOpen(false);
    setPhotoOpen(true);
  }

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)]/95 py-3 pl-16 pr-4 backdrop-blur-md md:pl-7 sm:pr-7">
      {/* Back to the homepage — always goes straight to "/" no matter how many sections were visited */}
      <div className="group relative shrink-0">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Back to the Homepage"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-soft)] transition-colors hover:border-[var(--accent-solid)] hover:text-[var(--text)] focus-visible:border-[var(--accent-solid)] focus-visible:outline-none"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute left-0 top-full z-30 mt-2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text)] opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          Back to the Homepage
        </span>
      </div>

      <div className="relative max-w-xl flex-1">
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
          placeholder="Search reviews, guidelines…"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] py-2 pl-10 pr-14 text-xs text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent-solid)] focus:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div ref={notifRef} className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => {
              if (!notifOpen) markAllRead();
              setNotifOpen((prev) => !prev);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-soft)] transition-colors hover:border-[var(--accent-solid)] hover:text-[var(--text)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9a6 6 0 0 1 12 0c0 3.4.8 5.2 1.6 6.2H4.4C5.2 14.2 6 12.4 6 9Z" />
              <path d="M10 19a2 2 0 0 0 4 0" />
            </svg>
            {unreadCount > 0 && (
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
                      <p>{note.message}</p>
                      <div className="mt-0.5 flex items-end justify-between gap-2">
                        <p className="text-xs text-[var(--text-soft)]">
                          {new Date(note.createdAt).toLocaleString()}
                        </p>
                        <button
                          type="button"
                          aria-label="Delete notification"
                          title="Delete notification"
                          onClick={() => removeNotification(note.id)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--text-soft)] transition-colors hover:bg-rose-500/15 hover:text-rose-500"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {showProfile && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Open profile menu"
              className="flex h-9 w-9 items-center justify-center rounded-full"
            >
              <ProfileAvatar name={displayName} styleId={avatarStyle} size={36} />
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
                  onClick={openPhotoPicker}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-[var(--text)] transition-colors hover:bg-[var(--border)]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 8a2 2 0 0 1 2-2h1.5l1.2-2h6.6l1.2 2H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
                    <circle cx="12" cy="13" r="3.4" />
                  </svg>
                  Change profile photo
                </button>
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
                {user && (
                  <AccountDeletionAction
                    userKey={user.email || user.name}
                    onDeleted={() => {
                      setUser(null);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ProfilePhotoPicker
        open={photoOpen}
        name={displayName}
        currentStyle={avatarStyle}
        onSave={setAvatarStyle}
        onClose={() => setPhotoOpen(false)}
      />
    </header>
  );
}