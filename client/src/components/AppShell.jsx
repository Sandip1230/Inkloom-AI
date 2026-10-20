import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[var(--bg)] p-3 text-[var(--text)] sm:p-4">
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
          className="fixed left-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-sm md:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      )}

      {/* Backdrop behind the mobile drawer — tapping it closes the sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 flex min-h-[calc(100vh-1.5rem)] gap-4 sm:min-h-[calc(100vh-2rem)]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="app-glow relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 shadow-sm backdrop-blur-sm">
          <Topbar />
          <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}