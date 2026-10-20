import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { listProjects, deleteProject } from "../lib/projectsStore.js";
import { STAGE_KEYS } from "../lib/stages.js";

export default function Projects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    setProjects(listProjects());
  }, []);

  function handleDelete(id) {
    deleteProject(id);
    setProjects(listProjects());
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">Your projects</h1>
            <p className="mt-1 text-sm text-[var(--text-soft)]">
              Saved in this browser — resume any project right where you left off.
            </p>
          </div>
          <Link
            to="/workflow"
            className="rounded-lg bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            + New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
            <p className="text-sm text-[var(--text-soft)]">
              No projects yet. Start one from the Discover step and it'll show up here.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {projects.map((project) => {
              const completed = Object.keys(project.stageOutputs || {}).length;
              const isDone = completed >= STAGE_KEYS.length;
              return (
                <div
                  key={project.id}
                  className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
                >
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
                      {isDone ? "Complete" : `Step ${completed + 1} of ${STAGE_KEYS.length}`}
                    </span>
                    <p className="mt-2 line-clamp-3 text-sm text-[var(--text)]">{project.brief}</p>
                    <p className="mt-2 text-xs text-[var(--text-soft)]">
                      Updated {new Date(project.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      to={`/workflow/${project.id}`}
                      className="text-sm font-medium text-[var(--accent-solid)] hover:opacity-80"
                    >
                      {isDone ? "View →" : "Resume →"}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(project.id)}
                      className="text-xs text-[var(--text-soft)] transition-colors hover:text-rose-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}