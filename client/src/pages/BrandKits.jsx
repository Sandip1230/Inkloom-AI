import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import BrandKitExport from "../components/stages/BrandKitExport.jsx";
import { listProjects } from "../lib/projectsStore.js";

export default function BrandKits() {
  const [kits, setKits] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    setKits(listProjects().filter((project) => project.stageOutputs?.deliver));
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Brand kits</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Every project that finished the Deliver stage lands here.
        </p>

        {kits.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
            <p className="text-sm text-[var(--text-soft)]">
              No finished brand kits yet.{" "}
              <Link to="/projects" className="text-[var(--accent-solid)] hover:opacity-80">
                Finish a project
              </Link>{" "}
              to see it here.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {kits.map((project) => {
              const isOpen = openId === project.id;
              return (
                <div key={project.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : project.id)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">{project.brief}</p>
                      <p className="mt-1 text-xs text-[var(--text-soft)]">
                        Delivered {new Date(project.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-sm text-[var(--text-soft)]">{isOpen ? "Hide ↑" : "View ↓"}</span>
                  </button>
                  {isOpen && (
                    <div className="mt-5 border-t border-[var(--border)] pt-5">
                      <BrandKitExport brandKit={project.stageOutputs.deliver} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}