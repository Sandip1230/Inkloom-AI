import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import ThemeToggle from "./ThemeToggle.jsx";
import ProfileAvatar from "./ProfileAvatar.jsx";
import ProfilePhotoPicker from "./ProfilePhotoPicker.jsx";
import AccountDeletionAction from "./AccountDeletionAction.jsx";
import { useAvatarStyle } from "../lib/profileStore.js";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "grid", to: "/workflow" },
  { label: "Review history", icon: "folder", to: "/projects" },
  { label: "Guidelines", icon: "sparkle", to: "/brand-kits" },
  { label: "Insights", icon: "layout", to: "/community" },
  { label: "Brand Drift Time Machine", icon: "layout", to: "/drift" },
  { label: "Company Admin", icon: "users", to: "/company-admin" },
];

function NavIcon({ name }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "folder":
      return (
        <svg {...common}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
        </svg>
      );
    case "layout":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
          <circle cx="17" cy="8" r="2.5" />
          <path d="M22 20c0-2.6-2-4.8-5-5.6" />
        </svg>
      );
    default:
      return null;
  }
}

// Decodes the JWT payload (server/src/routes/auth.routes.js signs
// { id, name, email }) without needing a library or a /me API call.
function readUserFromToken() {
  const token = localStorage.getItem("inkloom-token") || localStorage.getItem("brandloom-token");
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return { id: decoded.id || "", name: decoded.name || "Guest", email: decoded.email || "" };
  } catch {
    return null;
  }
}

export default function Sidebar({ open = false, onClose = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(() => readUserFromToken());
  const [photoOpen, setPhotoOpen] = useState(false);
  const [avatarStyle, setAvatarStyle] = useAvatarStyle(user?.email || user?.name);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close the mobile drawer whenever the route changes (e.g. after tapping a nav link)
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  function handleLogout() {
    localStorage.removeItem("inkloom-token");
    localStorage.removeItem("brandloom-token");
    setUser(null);
    setMenuOpen(false);
    onClose();
    navigate("/login", { replace: true });
  }

  const displayName = user?.name || "Guest";

  function openPhotoPicker() {
    setMenuOpen(false);
    setPhotoOpen(true);
  }

  return (
    <aside
      className={
        "fixed inset-y-0 left-0 z-40 flex h-full w-72 max-w-[85vw] shrink-0 flex-col overflow-y-auto rounded-r-2xl border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] px-4 py-4 text-[var(--sidebar-text)] shadow-2xl transition-transform duration-300 ease-in-out md:rounded-none md:border-y-0 md:border-l-0 " +
        (open ? "translate-x-0" : "-translate-x-[110%]") +
        " md:sticky md:top-0 md:z-auto md:h-screen md:w-60 md:max-w-none md:translate-x-0 md:shadow-sm"
      }
    >
      <div className="flex items-center gap-2 px-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] text-sm font-bold text-white">
          I
        </span>
        <span className="text-lg font-semibold text-white">Inkloom AI</span>

        {/* Mobile-only close button for the drawer */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sidebar-text-soft)] transition-colors hover:bg-white/5 hover:text-white md:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <Link
        to="/workflow"
        onClick={onClose}
        style={{ backgroundImage: "var(--btn-gradient)" }}
        className="mt-5 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-[0_6px_18px_-6px_rgba(124,58,237,0.6)] transition-opacity hover:opacity-90"
      >
        + New Review
      </Link>

      <nav className="mt-5 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.to === "/workflow"
              ? location.pathname.startsWith("/workflow")
              : location.pathname === item.to;
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onClose}
              className={
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors " +
                (isActive
                  ? "bg-white/10 text-white before:absolute before:left-0 before:top-1/2 before:h-7 before:w-0.5 before:-translate-y-1/2 before:rounded-r before:bg-[var(--accent-solid)]"
                  : "text-[var(--sidebar-text-soft)] hover:bg-white/5 hover:text-white")
              }
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />


      <div ref={menuRef} className="relative mt-3 shrink-0 border-t border-[var(--sidebar-border)] pt-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-white/5"
          >
            <ProfileAvatar name={displayName} styleId={avatarStyle} size={36} />
            <div>
              <p className="text-sm font-medium leading-tight text-white">{displayName}</p>
              <p className="text-xs leading-tight text-[var(--sidebar-text-soft)]">Free Plan</p>
            </div>
          </button>
          <ThemeToggle />
        </div>

        {menuOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-full rounded-lg border border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] p-1.5 shadow-lg">
            {user?.email && (
              <p className="truncate px-2 py-1.5 text-xs text-[var(--sidebar-text-soft)]">
                {user.email}
              </p>
            )}
            <button
              type="button"
              onClick={openPhotoPicker}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-[var(--sidebar-text)] transition-colors hover:bg-white/5"
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

      <ProfilePhotoPicker
        open={photoOpen}
        name={displayName}
        currentStyle={avatarStyle}
        onSave={setAvatarStyle}
        onClose={() => setPhotoOpen(false)}
      />
    </aside>
  );
}