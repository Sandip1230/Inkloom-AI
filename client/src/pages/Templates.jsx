import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell.jsx";
import { TEMPLATES } from "../lib/templates.js";
import { setDraftBrief } from "../lib/draftBrief.js";
import { createProjectId } from "../lib/projectsStore.js";

export default function Templates() {
  const navigate = useNavigate();

  function useTemplate(brief) {
    setDraftBrief(brief);
    navigate(`/workflow/${createProjectId()}`);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Templates</h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Starter ideas — pick one to prefill the Discover step, then edit it to match your real idea.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {TEMPLATES.map((template) => (
            <div key={template.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <span className="text-xs font-medium uppercase tracking-wide text-[var(--accent-solid)]">
                {template.tag}
              </span>
              <p className="mt-2 text-sm font-medium text-[var(--text)]">{template.title}</p>
              <p className="mt-1 text-sm text-[var(--text-soft)]">{template.brief}</p>
              <button
                type="button"
                onClick={() => useTemplate(template.brief)}
                className="mt-4 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-soft)] transition-colors hover:border-[var(--accent-solid)] hover:text-[var(--text)]"
              >
                Use this template →
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}