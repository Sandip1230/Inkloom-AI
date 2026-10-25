import { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import "../styles/Dashboard.css";

export default function AppShell({ children, showTopbarProfile = true }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="page-bg">
        <span className="streak" style={{ top: "22%", left: "-5%", transform: "rotate(-8deg)" }} />
        <span className="streak" style={{ top: "34%", left: "-2%", transform: "rotate(-4deg)" }} />
      </div>

      {/* Mobile-only hamburger — opens the sidebar as a drawer. Hidden once the drawer is open (Sidebar has its own close button). */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="scale-in fixed left-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-sm md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      )}

      {/* Backdrop behind the mobile drawer — tapping it closes the sidebar */}
      {sidebarOpen && (
        <div
          className="fade-in fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="relative flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="app-glow relative flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden border-l border-[var(--border)]">
          <Topbar showProfile={showTopbarProfile} />
          <main key={location.pathname} className="page-enter min-h-0 flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}